/**
 * The machine that runs in the learner's browser (unkernel: Linux compiled to
 * WebAssembly), and its agent. The only module that knows unkernel; it is
 * loaded when a local run first needs its machine, so a page that never opens
 * one downloads none of it.
 */
import type { NetSpec } from 'unkernel'
import type { MachineBoot } from '../scenario/scenarioSessionService'
import { LocalConsoleSocket, type ConsolePty } from './localConsoleSocket'
import { relayedPty, serveRelay } from './localConsoleRelay'
import { SharedShell } from './sharedShell'
import { bootDesktop, desktopFrames, desktopKW, desktopShell } from './localMachineDesktop'
import { apiWebSocketUrl, webSocketAuthProtocols } from '../../../utils/webSocketAuth'

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

export interface Machine extends AgentMachine {
  spawn(file?: string, args?: readonly string[], opts?: { cols?: number; rows?: number; user?: string | number }): Promise<ConsolePty>
  stop(): Promise<unknown>
  /** Settles when the kernel exits: `stopped` when this tab stopped it. */
  exited?: Promise<{ kind: string; reason: string }>
}

// In a worker, the kernel leaves the page's thread alone: on the page's own
// thread a busy guest made every click wait about 250 ms. Worker mode needs no
// cross-origin isolation; isolation (the front's COOP/COEP headers) adds CPUs (SMP).
function defaultOptions(): LocalMachineOptions {
  return {
    distroUrl: import.meta.env.VITE_LOCAL_MACHINE_DISTRO_URL || '/local-machine/debian.erofs',
    worker: true
  }
}

// The machine of one run's terminal, for the page's life: leaving the run's
// page and coming back finds it as it was, its learner's shell included.
// `boot` names it to ocf-core, which tells a reload from a reconnect by it.
// `mirrorKey` is what it asks the Debian mirror with (debianMirrorNet).
interface HeldMachine {
  terminal: string
  boot: string
  mirrorKey: string
  machine: Promise<Machine>
  shell: SharedShell
}
let held: HeldMachine | null = null

// The images give their default user, `user`, sudo without a password: a
// learner who is not root could read every root-only file of a lab, or skip
// its permission missions with `sudo chmod`. Taken away before anything runs:
// sudo loses its setuid bit, so it refuses at once (a refused sudo otherwise
// hangs for good in this kernel, out of the learner's reach), and the
// password-less rules go. A lab that teaches sudo sets the bit back in its
// setup, with its own rules.
const LOCK_DOWN_SUDO = [
  'chmod u-s /usr/bin/sudo 2>/dev/null',
  "sed -i '/NOPASSWD/d' /etc/sudoers",
  'for f in /etc/sudoers.d/*; do grep -qs NOPASSWD "$f" && rm -f "$f"; done',
  'true'
].join('; ')

// A scenario set to a desktop (its machine_display) shows unkernel's desktop
// page instead of the console: an iframe of this origin laid over the
// console's place (DesktopSlot.vue), whose window.KW.ready() hands out the
// machine, which the agent drives as it drives a console one. Its launcher
// offers the scenario's apps. setMachineRun() tells which, and the machine's
// memory, CPUs and boot settings; the machine boots once it is told, and
// keeps what it booted as.
export interface MachineRun {
  /** A desktop's apps; null: a console. */
  apps: string[] | null
  /** The machine's memory (ocf-core: the scenario's size); absent, unkernel's default. */
  memoryMiB?: number
  /** Its CPUs (the scenario's size); absent, unkernel's default. */
  cpus?: number
  /** How it boots (the platform's defaults, the scenario's overrides); absent, unkernel's defaults. */
  boot?: MachineBoot
}
const machineRuns = new Map<string, { run: Promise<MachineRun>; resolve(run: MachineRun): void }>()

function machineRunEntry(terminal: string) {
  let entry = machineRuns.get(terminal)
  if (!entry) {
    let resolve!: (run: MachineRun) => void
    const run = new Promise<MachineRun>(r => { resolve = r })
    entry = { run, resolve }
    machineRuns.set(terminal, entry)
  }
  return entry
}

/**
 * What terminal's machine is: a desktop or a console, and its memory.
 * Resolves to what the machine was booted as, which a later call does not
 * change: the page shows a desktop when that is one.
 */
export function setMachineRun(terminal: string, run: MachineRun): Promise<MachineRun> {
  const entry = machineRunEntry(terminal)
  entry.resolve(run)
  return entry.run
}

// The learner's terminal on each desktop, once the run is built.
const learnerTerminals = new Map<string, Promise<number>>()

/**
 * The learner's terminal on terminal's desktop, opened once the run is built,
 * as the console's shell is: a login shell of the run's user (sudo -i, the
 * desktop's user has sudo), so it starts in the world the setup built. Opened
 * again if the learner closed it. The desktop's own console stays as the boot
 * log.
 */
export function desktopLearnerTerminal(terminal: string): Promise<number> {
  // Once the machine runs: the page's terminals exist from then on.
  const machine = held?.terminal === terminal ? held.machine : null
  const known = learnerTerminals.get(terminal)
  const n = (async () => {
    await machine
    const windows = desktopKW(terminal)?.windows
    if (!windows) throw new Error('no desktop')
    const was = await known?.catch(() => null)
    if (windows.list().some(t => t.n === was && t.state !== 'ended')) return was!
    const user = await consoleUserEntry(terminal).user
    const opened = (await windows.open({ name: 'lab', select: true, file: '/usr/bin/sudo', args: ['-i', '-u', typeof user === 'number' ? `#${user}` : user] })).n
    consolePty = desktopShell(windows, opened)
    reportConsoleOpened()
    return opened
  })()
  learnerTerminals.set(terminal, n)
  n.catch(() => { if (learnerTerminals.get(terminal) === n) learnerTerminals.delete(terminal) })
  return n
}

/** Put a command in the learner's terminal on terminal's desktop, without running it, and give it the focus. */
export async function pasteOnDesktop(terminal: string, command: string): Promise<void> {
  const frame = desktopFrames.get(terminal)
  const kw = desktopKW(terminal)
  if (!frame || !kw?.windows || !kw.term) return
  const n = await desktopLearnerTerminal(terminal)
  // Its window in front: an app's window (Neovim, Python) may cover it.
  const window = kw.windows.list().find(t => t.n === n)?.window
  if (window) kw.wm?.focus(window)
  kw.windows.select(n)
  // A paste, as the console's: a command of several lines waits for Enter
  // instead of running line by line.
  kw.term.paste(command)
  // After the desktop has drawn the window in front, which moves the focus.
  await new Promise(resolve => requestAnimationFrame(resolve))
  frame.focus()
  kw.term.focus()
}

async function boot(terminal: string, opts: LocalMachineOptions): Promise<Machine> {
  const run = await machineRunEntry(terminal).run
  const { apps } = run
  if (apps) {
    // On a desktop the user keeps its sudo: the launcher installs and starts
    // the offered apps with it, and the learner's shell is opened with it.
    // A lab that must keep the learner from root uses the console.
    return await bootDesktop(terminal, { ...run, apps }, opts)
  }
  const machine = await bootConsole(opts, run)
  await machine.exec('sh', ['-c', LOCK_DOWN_SUDO], {
    user: 'root',
    signal: AbortSignal.timeout(DEFAULT_EXEC_TIMEOUT_SECONDS * 1000),
    maxBuffer: EXEC_MAX_BUFFER
  })
  return machine
}

async function bootConsole(opts: LocalMachineOptions, run: MachineRun): Promise<Machine> {
  const { checkSupport, createKernel } = await import('unkernel')
  const support = await checkSupport()
  if (!support.ok) throw new Error(support.problems.join('; '))
  return await createKernel({ distro: opts.distroUrl, worker: opts.worker, net: opts.net, ...consoleKernelOptions(run) })
}

/**
 * The SDK's boot options for a console machine. The SDK has no verbose boot
 * (a console shows no kernel messages), and a console has no screen or
 * speaker to give the guest a display or a sound card for, nor a console to
 * hide: those settings are the desktop page's. `append` replaces the kernel's
 * command line, as the desktop page's ?append= does.
 */
export function consoleKernelOptions(run: Omit<MachineRun, 'apps'>): { memoryMiB?: number, cpus?: number, jit?: boolean, cmdline?: string } {
  const { memoryMiB, cpus, boot } = run
  return {
    memoryMiB,
    // The SDK starts as many CPU threads as asked: no more than the host has.
    cpus: cpus ? Math.min(cpus, navigator.hardwareConcurrency || 1) : undefined,
    jit: boot?.jit,
    cmdline: boot?.append || undefined
  }
}

// The uid each terminal's console runs as, once the page has read it from the
// run: the console waits for it rather than open as the wrong user.
const consoleUsers = new Map<string, { user: Promise<string | number>; resolve(user: string | number): void }>()

function consoleUserEntry(terminal: string) {
  let entry = consoleUsers.get(terminal)
  if (!entry) {
    let resolve!: (user: string | number) => void
    const user = new Promise<string | number>(r => { resolve = r })
    entry = { user, resolve }
    consoleUsers.set(terminal, entry)
  }
  return entry
}

/** The uid the run's console runs as, as ocf-core says (session_user); root without one. */
export function setConsoleUser(terminal: string, uid: number | undefined) {
  consoleUserEntry(terminal).resolve(uid ?? 'root')
}

// The machine's only network: plain HTTP to deb.debian.org, answered by the
// platform's Debian mirror through this tab (unkernel's fetch routes; nginx.conf
// /local-machine/apt), which ocf-core opens to this terminal's machine only,
// asked with `key`: the terminal id is no secret, the key only this tab and
// ocf-core know (the agent announces it). A worker takes routes on a Wisp
// backend alone, so it names one that answers nothing: the machine reaches no
// other host.
// In production the mirror has its own hostname (VITE_LOCAL_MACHINE_MIRROR_URL,
// nginx/local-machine-mirror.locations): unkernel appends the guest's path to
// the route as a string, so a `..` there must land on a host that serves
// nothing else, and that host gets none of the app's cookies. Empty: this
// origin (dev).
export function debianMirrorNet(terminal: string, key: string): NetSpec {
  const origin = window.location.origin
  const mirror = (import.meta.env.VITE_LOCAL_MACHINE_MIRROR_URL || origin).replace(/\/+$/, '')
  return {
    kind: 'net',
    backend: {
      kind: 'wisp',
      servers: `${origin.replace(/^http/, 'ws')}/local-machine/no-wisp/`,
      routes: { 'deb.debian.org': `${mirror}/local-machine/apt/${terminal}/${key}` }
    }
  }
}

// The terminal's machine, booted if needed. Another terminal's is stopped
// first: a machine is never handed from one run to another.
function machineOf(terminal: string, opts: LocalMachineOptions): HeldMachine {
  if (held?.terminal === terminal) return held
  stopMachineOf(held?.terminal)
  const mirrorKey = crypto.randomUUID()
  const machine = boot(terminal, { ...opts, net: opts.net ?? debianMirrorNet(terminal, mirrorKey) })
  const booting: HeldMachine = {
    terminal,
    boot: crypto.randomUUID(),
    mirrorKey,
    machine,
    shell: new SharedShell((cols, rows) => spawnShell(terminal, machine, cols, rows))
  }
  // A failed boot is retried by the next console, not cached.
  booting.machine.catch(() => { if (held === booting) held = null })
  held = booting
  return booting
}

function stopMachineOf(terminal: string | undefined) {
  if (!held || held.terminal !== terminal) return
  held.machine.then(m => m.stop()).catch(() => {})
  learnerTerminals.delete(held.terminal)
  held = null
  consolePty = null
}

/**
 * A console on the local machine, booting it first if needed.
 * @param outputDrained resolves once the terminal has shown what it was given:
 *   the next chunk is read only then, so a runaway program waits for the
 *   screen instead of queueing output that Ctrl-C can no longer stop.
 */
export function openLocalConsole(
  terminal: string,
  cols: number,
  rows: number,
  outputDrained?: () => Promise<void>,
  opts: LocalMachineOptions = defaultOptions()
): LocalConsoleSocket {
  return new LocalConsoleSocket(() => openShell(terminal, cols, rows, opts), outputDrained)
}

/**
 * A console, in a popped-out window, on the machine of the run page's tab
 * (localConsoleRelay): the window boots no machine of its own.
 */
export function openRelayedConsole(
  terminal: string,
  cols: number,
  rows: number,
  outputDrained?: () => Promise<void>
): LocalConsoleSocket {
  return new LocalConsoleSocket(() => relayedPty(terminal, cols, rows), outputDrained)
}

/**
 * Serves shells of terminal's machine to the run's popped-out window, while
 * this tab runs it: holds its machine, with the agent connected. Returns stop.
 */
export function serveConsoleRelay(terminal: string, opts: LocalMachineOptions = defaultOptions()): () => void {
  return serveRelay(terminal, (cols, rows) =>
    held?.terminal === terminal && agentSocket?.readyState === WebSocket.OPEN
      ? openShell(terminal, cols, rows, opts)
      : null)
}

// A console on the learner's shell of terminal's machine, here or in a
// popped-out window: the same shell for both (SharedShell).
function openShell(terminal: string, cols: number, rows: number, opts: LocalMachineOptions): Promise<ConsolePty> {
  return machineOf(terminal, opts).shell.attach(cols, rows) // boots while the page reads the run
}

// The learner's shell, as the run's user: where foreground scripts are typed.
async function spawnShell(terminal: string, machine: Promise<Machine>, cols: number, rows: number): Promise<ConsolePty> {
  const user = await consoleUserEntry(terminal).user
  const pty = await (await machine).spawn(undefined, undefined, { cols, rows, user })
  consolePty = pty
  reportConsoleOpened()
  const forget = () => { if (consolePty === pty) consolePty = null }
  pty.ended.then(forget, forget)
  return pty
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

// ocf-core keeps the first MaxAgentOutput bytes of each stream, and ends a
// connection whose message passes MaxAgentMessage (localAgents.go).
const AGENT_OUTPUT_KEPT = 64 << 10
const AGENT_MESSAGE_MAX = 256 << 10
const utf8 = new TextEncoder()

function firstBytes(text: unknown, limit: number): unknown {
  if (typeof text !== 'string' || text.length <= limit / 3) return text
  return new TextDecoder().decode(utf8.encode(text).subarray(0, limit))
}

/**
 * An answer as ocf-core takes it: each stream cut to what it keeps, and less
 * when JSON escaping (control characters) would still pass its limit.
 */
export function encodeAgentReply(reply: Record<string, unknown>): string {
  for (let kept = AGENT_OUTPUT_KEPT; ; kept >>= 1) {
    const message = JSON.stringify({ ...reply, stdout: firstBytes(reply.stdout, kept), stderr: firstBytes(reply.stderr, kept) })
    if (kept === 0 || utf8.encode(message).length <= AGENT_MESSAGE_MAX) return message
  }
}

const AGENT_RETRY_MS = 3000
const OTHER_TAB_BELIEVED_AFTER = 3

/** Close codes ocf-core ends an agent with (src/scenarios/services/localAgents.go). */
export const AGENT_CLOSE = {
  /** The run's terminal has ended. */
  ended: 4000,
  /** The run's machine is open in another tab. */
  otherTab: 4409,
  /** This tab booted another machine than the run's (a reload): the run is to be rebuilt. */
  machineLost: 4410
} as const

/**
 * Why the agent ended for good: what ocf-core said (ended, other_tab, lost),
 * or what became of the machine (boot_failed, crashed, halted).
 */
export type AgentEnd = 'ended' | 'other_tab' | 'lost' | 'boot_failed' | 'crashed' | 'halted'

const AGENT_ENDS: Record<number, AgentEnd> = {
  [AGENT_CLOSE.ended]: 'ended',
  [AGENT_CLOSE.otherTab]: 'other_tab',
  [AGENT_CLOSE.machineLost]: 'lost'
}

/**
 * Connects this tab as the agent of the run's machine, booting the machine if
 * needed, and reconnects until stop() or until ocf-core lets it go for good:
 * then the machine is stopped and onEnd says why. ocf-core runs the run's
 * setup and checks through it, so it must be up before the console is opened:
 * the run is built while the learner waits. A machine that cannot boot, or
 * that dies, is not retried: onEnd says so at once, with the browser's
 * reason (plan rule 7), rather than leave a build to time out or a console
 * to go quiet.
 */
export function startLocalAgent(
  runId: string,
  terminal: string,
  token: string | null | undefined,
  onEnd: (why: AgentEnd, detail?: string) => void,
  opts: LocalMachineOptions = defaultOptions()
): { stop(): void } {
  let stopped = false
  let socket: WebSocket | null = null
  let retry: ReturnType<typeof setTimeout> | null = null
  // A reloaded tab may reach ocf-core before it has seen the old tab's
  // connection close, and be told the run is open in another tab: believed
  // when said that many times in a row.
  let otherTabAnswers = 0
  let watchingExit = false

  const end = (...why: Parameters<typeof onEnd>) => {
    stopped = true
    if (retry) clearTimeout(retry)
    socket?.close()
    stopMachineOf(terminal)
    onEnd(...why)
  }

  const connect = async () => {
    const { boot, machine, mirrorKey } = machineOf(terminal, opts)
    let vm: Machine
    try {
      vm = await machine
    } catch (err) {
      if (!stopped) end('boot_failed', err instanceof Error ? err.message : String(err))
      return
    }
    if (stopped) return
    if (!watchingExit) {
      watchingExit = true
      // A worker that runs out of memory, a kernel panic, or `poweroff`.
      vm.exited?.then(exit => {
        if (!stopped && exit.kind !== 'stopped') end(exit.kind === 'halt' ? 'halted' : 'crashed', exit.reason)
      }, () => {})
    }
    const url = apiWebSocketUrl(`/scenario-sessions/${runId}/agent?boot=${encodeURIComponent(boot)}`)
    const opened = new WebSocket(url, webSocketAuthProtocols(token))
    socket = opened
    opened.onopen = () => {
      opened.send(JSON.stringify({ event: 'mirror_key', key: mirrorKey }))
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
      if (opened.readyState === WebSocket.OPEN) opened.send(encodeAgentReply(reply))
    }
    opened.onclose = (event) => {
      if (agentSocket === opened) agentSocket = null
      socket = null
      if (stopped) return
      const why = AGENT_ENDS[event.code]
      // ocf-core refuses after the upgrade, so a refused connection opens
      // too: only a connection that ends otherwise has served.
      otherTabAnswers = why === 'other_tab' ? otherTabAnswers + 1 : 0
      const believed = why !== 'other_tab' || otherTabAnswers >= OTHER_TAB_BELIEVED_AFTER
      if (!why || !believed) {
        retry = setTimeout(connect, AGENT_RETRY_MS)
        return
      }
      end(why)
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

// Runs hosted by this tab outside their run page, with how many hold each.
const hostedRuns = new Map<string, { agent: { stop(): void }; holders: number }>()

/**
 * Runs the machine of a local run in this tab, for a page other than its run
 * page: the scenario editor testing a check on a preview. One agent per run
 * whoever holds it; it stops when the last holder lets go, or when ocf-core
 * ends it. Returns the release.
 */
export function hostLocalRun(runId: string, terminal: string, token: string | null | undefined): () => void {
  let hosted = hostedRuns.get(runId)
  if (!hosted) {
    // Nobody sees this machine: a console one, whatever apps the run offers.
    // (A run page open in this tab has already said; its word stays.)
    void setMachineRun(terminal, { apps: null })
    const agent = startLocalAgent(runId, terminal, token, () => hostedRuns.delete(runId))
    hosted = { agent, holders: 0 }
    hostedRuns.set(runId, hosted)
  }
  hosted.holders++
  let released = false
  return () => {
    if (released) return
    released = true
    const current = hostedRuns.get(runId)
    if (current && --current.holders === 0) {
      current.agent.stop()
      hostedRuns.delete(runId)
    }
  }
}
