/**
 * The machine that runs in the learner's browser (unkernel: Linux compiled to
 * WebAssembly), and its agent. The only module that knows unkernel; it is
 * loaded when a local run first needs its machine, so a page that never opens
 * one downloads none of it.
 */
import type { NetSpec } from 'unkernel'
import { LocalConsoleSocket, type ConsolePty } from './localConsoleSocket'
import { relayedPty, serveRelay } from './localConsoleRelay'
import { SharedShell } from './sharedShell'
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
  spawn(file?: string, args?: readonly string[], opts?: { cols?: number; rows?: number; user?: string | number }): Promise<ConsolePty>
  stop(): Promise<unknown>
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

// A scenario that offers apps (its machine_apps) shows unkernel's desktop page
// instead of the console: an iframe of this origin laid over the console's
// place (DesktopSlot.vue), whose window.KW.ready() hands out the machine, which
// the agent drives as it drives a console one. setMachineApps() tells which.
const machineApps = new Map<string, { apps: Promise<string[]>; resolve(apps: string[]): void }>()

function machineAppsEntry(terminal: string) {
  let entry = machineApps.get(terminal)
  if (!entry) {
    let resolve!: (apps: string[]) => void
    const apps = new Promise<string[]>(r => { resolve = r })
    entry = { apps, resolve }
    machineApps.set(terminal, entry)
  }
  return entry
}

/** The apps terminal's run offers: with any, its machine is the desktop. */
export function setMachineApps(terminal: string, apps: string[]) {
  machineAppsEntry(terminal).resolve(apps)
}

/** The desktop's iframe of terminal's run, once it boots one. */
export const desktopFrames = new Map<string, HTMLIFrameElement>()
const desktopFrameListeners = new Set<() => void>()
export function onDesktopFrames(listener: () => void): () => void {
  desktopFrameListeners.add(listener)
  return () => desktopFrameListeners.delete(listener)
}

type DesktopWindow = Window & { KW?: { ready?: () => Promise<Machine> } }

// The desktop page's URL (ocf-desktop.patch in local-machine-image says what
// each setting does): the run's apps, the platform's image and Debian mirror,
// and the same Wisp server that answers nothing, so the machine reaches no
// other host. No saved disk or session: the run's machine is new on each boot,
// as a console one. No prompt of its own on leaving: the run page asks.
export function desktopPageUrl(apps: string[], opts: LocalMachineOptions): string {
  const backend = opts.net?.backend as { servers?: string, routes?: Record<string, string> } | undefined
  const query = new URLSearchParams({
    data: '0', askleave: '0', autosuspend: '0',
    apps: apps.join(','),
    image: new URL(opts.distroUrl, window.location.origin).href
  })
  if (backend?.servers) query.set('wisp', backend.servers)
  const mirror = backend?.routes?.['deb.debian.org']
  if (mirror) query.set('debmirror', mirror)
  else query.set('net', '0')
  return `/unkernel-desktop/index.html?${query}`
}

async function bootDesktop(terminal: string, apps: string[], opts: LocalMachineOptions): Promise<Machine> {
  const frame = document.createElement('iframe')
  frame.src = desktopPageUrl(apps, opts)
  frame.title = 'Linux'
  frame.className = 'ocf-desktop-frame'
  frame.style.cssText = 'position:fixed;border:0;visibility:hidden;left:0;top:0;width:800px;height:600px;'
  document.body.appendChild(frame)
  desktopFrames.set(terminal, frame)
  desktopFrameListeners.forEach(l => l())
  const page = await new Promise<DesktopWindow>((resolve, reject) => {
    const started = Date.now()
    const poll = () => {
      const w = frame.contentWindow as DesktopWindow | null
      if (w?.KW?.ready) resolve(w)
      else if (Date.now() - started > 60_000) reject(new Error('the desktop page did not start'))
      else setTimeout(poll, 200)
    }
    poll()
  })
  const vm = await page.KW!.ready!()
  const stop = vm.stop.bind(vm)
  return Object.assign(vm, {
    async stop() {
      try { await stop() } finally {
        frame.remove()
        if (desktopFrames.get(terminal) === frame) desktopFrames.delete(terminal)
        desktopFrameListeners.forEach(l => l())
      }
    }
  })
}

async function boot(terminal: string, opts: LocalMachineOptions): Promise<Machine> {
  const apps = await machineAppsEntry(terminal).apps
  const machine = apps.length ? await bootDesktop(terminal, apps, opts) : await bootConsole(opts)
  await machine.exec('sh', ['-c', LOCK_DOWN_SUDO], {
    user: 'root',
    signal: AbortSignal.timeout(DEFAULT_EXEC_TIMEOUT_SECONDS * 1000),
    maxBuffer: EXEC_MAX_BUFFER
  })
  return machine
}

async function bootConsole(opts: LocalMachineOptions): Promise<Machine> {
  const { checkSupport, createKernel } = await import('unkernel')
  const support = await checkSupport()
  if (!support.ok) throw new Error(support.problems.join('; '))
  return await createKernel({ distro: opts.distroUrl, worker: opts.worker, net: opts.net })
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
export function debianMirrorNet(terminal: string, key: string): NetSpec {
  const origin = window.location.origin
  return {
    kind: 'net',
    backend: {
      kind: 'wisp',
      servers: `${origin.replace(/^http/, 'ws')}/local-machine/no-wisp/`,
      routes: { 'deb.debian.org': `${origin}/local-machine/apt/${terminal}/${key}` }
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

/** Why ocf-core let the agent go for good. */
export type AgentEnd = 'ended' | 'other_tab' | 'lost'

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
 * the run is built while the learner waits. A machine that cannot boot is not
 * retried: the console says why, and ocf-core fails the build instead of
 * waiting forever.
 */
export function startLocalAgent(
  runId: string,
  terminal: string,
  token: string | null | undefined,
  onEnd: (why: AgentEnd) => void,
  opts: LocalMachineOptions = defaultOptions()
): { stop(): void } {
  let stopped = false
  let socket: WebSocket | null = null
  let retry: ReturnType<typeof setTimeout> | null = null
  // A reloaded tab may reach ocf-core before it has seen the old tab's
  // connection close, and be told the run is open in another tab: believed
  // when said that many times in a row.
  let otherTabAnswers = 0

  const connect = async () => {
    const { boot, machine, mirrorKey } = machineOf(terminal, opts)
    let vm: Machine
    try {
      vm = await machine
    } catch (err) {
      console.error('local machine failed to boot:', err)
      return
    }
    if (stopped) return
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
      if (opened.readyState === WebSocket.OPEN) opened.send(JSON.stringify(reply))
    }
    opened.onclose = (event) => {
      if (agentSocket === opened) agentSocket = null
      socket = null
      if (stopped) return
      const end = AGENT_ENDS[event.code]
      // ocf-core refuses after the upgrade, so a refused connection opens
      // too: only a connection that ends otherwise has served.
      otherTabAnswers = end === 'other_tab' ? otherTabAnswers + 1 : 0
      const believed = end !== 'other_tab' || otherTabAnswers >= OTHER_TAB_BELIEVED_AFTER
      if (!end || !believed) {
        retry = setTimeout(connect, AGENT_RETRY_MS)
        return
      }
      stopped = true
      stopMachineOf(terminal)
      onEnd(end)
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
