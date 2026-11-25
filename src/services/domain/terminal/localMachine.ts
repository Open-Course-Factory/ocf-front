/**
 * The machine that runs in the learner's browser (unkernel: Linux compiled to
 * WebAssembly), and its agent. The only module that knows unkernel; it is
 * loaded when a local run first needs its machine, so a page that never opens
 * one downloads none of it.
 */
import type { NetSpec } from 'unkernel'
import { LocalConsoleSocket, type ConsolePty } from './localConsoleSocket'
import { apiWebSocketUrl, webSocketAuthProtocols } from '../../../utils/webSocketAuth'

/** A terminal session whose machine runs in the browser, as ocf-core names it. */
export const LOCAL_SESSION_PREFIX = 'local-'

export function isLocalSessionId(sessionId: string | null | undefined): boolean {
  return !!sessionId && sessionId.startsWith(LOCAL_SESSION_PREFIX)
}

export interface LocalMachineOptions {
  /** The distro image (erofs), served with Range support. */
  distroUrl: string
  /** Run the kernel in a Web Worker instead of the page's thread. */
  worker: boolean
  /** The guest's network. None by default: the guest has no eth0. */
  net?: NetSpec
}

interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number | null
  signal: number | null
}

/** What the agent needs of the machine. */
export interface AgentMachine {
  exec(file: string, args: readonly string[], opts: {
    user: string
    env?: Record<string, string>
    signal: AbortSignal
    maxBuffer: number
  }): Promise<ExecResult>
}

interface Machine extends AgentMachine {
  spawn(file?: string, args?: readonly string[], opts?: { cols?: number; rows?: number }): Promise<ConsolePty>
}

// In a worker, the kernel leaves the page's thread alone: on the page's own
// thread a busy guest made every click wait about 250 ms. Worker mode needs no
// cross-origin isolation; isolation would only add CPUs (SMP).
function defaultOptions(): LocalMachineOptions {
  return {
    distroUrl: import.meta.env.VITE_LOCAL_MACHINE_DISTRO_URL || '/local-machine/debian.erofs',
    worker: true
  }
}

// One machine per page: a reconnect opens a new shell on it.
let machine: Promise<Machine> | null = null

async function boot(opts: LocalMachineOptions): Promise<Machine> {
  const { checkSupport, createKernel } = await import('unkernel')
  const support = await checkSupport()
  if (!support.ok) throw new Error(support.problems.join('; '))
  return createKernel({ distro: opts.distroUrl, worker: opts.worker, net: opts.net })
}

function getMachine(opts: LocalMachineOptions): Promise<Machine> {
  if (!machine) {
    machine = boot(opts)
    // A failed boot is retried by the next console, not cached.
    machine.catch(() => { machine = null })
  }
  return machine
}

/**
 * A console on the local machine, booting it first if needed.
 * @param outputDrained resolves once the terminal has shown what it was given:
 *   the next chunk is read only then, so a runaway program waits for the
 *   screen instead of queueing output that Ctrl-C can no longer stop.
 */
export function openLocalConsole(
  cols: number,
  rows: number,
  outputDrained?: () => Promise<void>,
  opts: LocalMachineOptions = defaultOptions()
): LocalConsoleSocket {
  return new LocalConsoleSocket(async () => {
    const pty = await (await getMachine(opts)).spawn(undefined, undefined, { cols, rows })
    consolePty = pty
    reportConsoleOpened()
    const forget = () => { if (consolePty === pty) consolePty = null }
    pty.ended.then(forget, forget)
    return pty
  }, outputDrained)
}

// The learner's open shell, where a foreground script is typed.
let consolePty: Pick<ConsolePty, 'write'> | null = null

// The connected agent socket, to which the shell's opening is reported.
let agentSocket: WebSocket | null = null

// A foreground script the build staged while the console was held is typed
// once the shell opens: ocf-core learns it from this, as it learns it from
// tt-backend for a container.
function reportConsoleOpened() {
  if (consolePty && agentSocket?.readyState === WebSocket.OPEN) {
    agentSocket.send(JSON.stringify({ event: 'console_attached' }))
  }
}

/** A request of ocf-core's engine, as src/scenarios/services/localAgents.go sends it. */
export interface AgentRequest {
  id: number
  op: string
  command?: string[]
  env?: Record<string, string>
  timeout?: number
  data?: string
}

// tt-backend's exec bounds a command too; the server keeps 64 KiB of each stream.
const DEFAULT_EXEC_TIMEOUT_SECONDS = 60
const EXEC_MAX_BUFFER = 1 << 20

/**
 * The answer to one request: run a command as root in the machine (setup and
 * check scripts), or type a line into the learner's shell (a foreground script).
 */
export async function answerAgentRequest(
  machine: AgentMachine,
  shell: Pick<ConsolePty, 'write'> | null,
  req: AgentRequest
): Promise<Record<string, unknown>> {
  switch (req.op) {
    case 'exec': {
      const [file, ...args] = req.command ?? []
      if (!file) return { id: req.id, error: 'exec needs a command' }
      try {
        const result = await machine.exec(file, args, {
          user: 'root',
          env: req.env,
          signal: AbortSignal.timeout((req.timeout || DEFAULT_EXEC_TIMEOUT_SECONDS) * 1000),
          maxBuffer: EXEC_MAX_BUFFER
        })
        const exitCode = result.exitCode ?? 128 + (result.signal ?? 0)
        return { id: req.id, exit_code: exitCode, stdout: result.stdout, stderr: result.stderr }
      } catch (err) {
        return { id: req.id, error: err instanceof Error ? err.message : String(err) }
      }
    }
    case 'console':
      if (!shell) return { id: req.id, error: 'no_console' }
      try {
        await shell.write(req.data ?? '')
      } catch (err) {
        return { id: req.id, error: err instanceof Error ? err.message : String(err) }
      }
      return { id: req.id }
  }
  return { id: req.id, error: `unknown request ${req.op}` }
}

const AGENT_RETRY_MS = 3000

/**
 * Connects this tab as the agent of the run's machine, booting the machine if
 * needed, and reconnects until stop(). ocf-core runs the run's setup and checks
 * through it, so it must be up before the console is opened: the run is built
 * while the learner waits. A machine that cannot boot is not retried: the
 * console says why, and ocf-core fails the build instead of waiting forever.
 */
export function startLocalAgent(runId: string, token: string | null | undefined, opts: LocalMachineOptions = defaultOptions()): { stop(): void } {
  let stopped = false
  let socket: WebSocket | null = null
  let retry: ReturnType<typeof setTimeout> | null = null

  const connect = async () => {
    let vm: Machine
    try {
      vm = await getMachine(opts)
    } catch (err) {
      console.error('local machine failed to boot:', err)
      return
    }
    if (stopped) return
    const opened = new WebSocket(apiWebSocketUrl(`/scenario-sessions/${runId}/agent`), webSocketAuthProtocols(token))
    socket = opened
    opened.onopen = () => {
      agentSocket = opened
      reportConsoleOpened()
    }
    opened.onmessage = async (event) => {
      let req: AgentRequest
      try {
        req = JSON.parse(String(event.data))
      } catch {
        return
      }
      const reply = await answerAgentRequest(vm, consolePty, req)
      if (opened.readyState === WebSocket.OPEN) opened.send(JSON.stringify(reply))
    }
    opened.onclose = () => {
      if (agentSocket === opened) agentSocket = null
      socket = null
      if (!stopped) retry = setTimeout(connect, AGENT_RETRY_MS)
    }
  }
  connect()

  return {
    stop() {
      stopped = true
      if (retry) clearTimeout(retry)
      socket?.close()
    }
  }
}
