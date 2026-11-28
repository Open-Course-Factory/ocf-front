/**
 * The desktop of a machine in the browser: unkernel's desktop page in an
 * iframe of this origin (DesktopSlot.vue lays it over the console's place),
 * which hands out the machine (window.KW.ready()) that localMachine.ts drives
 * as it drives a console one.
 */
import type { ConsolePty } from './localConsoleSocket'
import type { LocalMachineOptions, Machine, MachineRun } from './localMachine'

/** The desktop's iframe of terminal's run, once it boots one. */
export const desktopFrames = new Map<string, HTMLIFrameElement>()
/** The runs whose desktop did not start: their slot says so. */
export const desktopFailures = new Set<string>()
const desktopFrameListeners = new Set<() => void>()
export function onDesktopFrames(listener: () => void): () => void {
  desktopFrameListeners.add(listener)
  return () => desktopFrameListeners.delete(listener)
}

/** The desktop page's terminals (its KW.windows). */
export interface DesktopTerminals {
  list(): { n: number, state: string, window?: string }[]
  open(opts: { select?: boolean, name?: string, file?: string, args?: string[] }): Promise<{ n: number }>
  select(n: number): boolean
  send(n: number, data: string): void
}

type DesktopKW = {
  ready?: () => Promise<Machine>
  windows?: DesktopTerminals
  term?: { focus(): void, paste(text: string): void }
  wm?: { focus(id: string): void }
}
type DesktopWindow = Window & { KW?: DesktopKW }

export const desktopKW = (terminal: string): DesktopKW | undefined =>
  (desktopFrames.get(terminal)?.contentWindow as DesktopWindow | null)?.KW

/** The desktop's learner terminal n as the shell a foreground script is typed into. */
export function desktopShell(terminals: Pick<DesktopTerminals, 'send'>, n: number): Pick<ConsolePty, 'write'> {
  return { write: async (data: string) => terminals.send(n, data) }
}

// The desktop page's URL (ocf-desktop.patch in local-machine-image says what
// each setting does): the run's apps, the platform's image and Debian mirror,
// and the same Wisp server that answers nothing, so the machine reaches no
// other host; no network at all without that server. Its kernel runs in a
// worker when the console's would. No prompt of its own on leaving: the run
// page asks. Every boot setting is given, even a default one: the page takes
// a setting the URL leaves out from what its Settings saved in this browser
// (ocf-core sends every run its boot settings, defaults included).
// No guest GL or Vulkan: our build of the page has neither renderer.
// Always Debian on the overlay root: an empty root= overrides a Safe mode
// (root=initramfs) this browser once saved, which boots the plain image.
export function desktopPageUrl(apps: string[], opts: LocalMachineOptions, run: Omit<MachineRun, 'apps'> = {}): string {
  const { memoryMiB, cpus = 1, boot } = run
  const backend = opts.net?.backend as { servers?: string, routes?: Record<string, string> } | undefined
  const flag = (on: boolean) => (on ? '1' : '0')
  const query = new URLSearchParams({
    data: '0', askleave: '0', autosuspend: '0', gl: '0', vk: '0',
    distro: 'debian', root: '',
    worker: flag(opts.worker),
    apps: apps.join(','),
    image: new URL(opts.distroUrl, window.location.origin).href,
    // The page caps CPUs at the host's threads, and boots one where it is not isolated.
    cpus: String(cpus)
  })
  if (boot) {
    query.set('jit', flag(boot.jit))
    query.set('verbose', flag(boot.verbose))
    query.set('display', flag(boot.display))
    query.set('sound', flag(boot.sound))
    query.set('autohide', flag(boot.console_hidden))
    // Empty: the kernel's own command line, over any the page saved.
    query.set('append', boot.append)
  }
  if (memoryMiB) query.set('mem', String(memoryMiB))
  const mirror = backend?.routes?.['deb.debian.org']
  if (backend?.servers) {
    query.set('wisp', backend.servers)
    if (mirror) query.set('debmirror', mirror)
  } else {
    query.set('net', '0')
  }
  return `/unkernel-desktop/index.html?${query}`
}

const DESKTOP_START_TIMEOUT_MS = 120_000

function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${what} did not start`)), ms))
  ])
}

// The page, once its KW is there, and the machine it hands out.
async function startDesktop(frame: HTMLIFrameElement): Promise<{ vm: Machine }> {
  const page = await new Promise<DesktopWindow>(resolve => {
    const poll = () => {
      const w = frame.contentWindow as DesktopWindow | null
      if (w?.KW?.ready) resolve(w)
      else if (frame.isConnected) setTimeout(poll, 200)
    }
    poll()
  })
  return { vm: await page.KW!.ready!() }
}

function forgetDesktop(terminal: string, frame: HTMLIFrameElement) {
  frame.remove()
  if (desktopFrames.get(terminal) === frame) desktopFrames.delete(terminal)
  desktopFrameListeners.forEach(l => l())
}

export async function bootDesktop(terminal: string, run: MachineRun & { apps: string[] }, opts: LocalMachineOptions): Promise<Machine> {
  const frame = document.createElement('iframe')
  frame.src = desktopPageUrl(run.apps, opts, run)
  frame.title = 'Linux'
  frame.className = 'ocf-desktop-frame'
  // Its own full-screen control, and the slot's, need the iframe to allow it;
  // several CPUs need it isolated, as the front is (COOP/COEP headers).
  frame.allow = 'fullscreen; cross-origin-isolated'
  frame.style.cssText = 'position:fixed;border:0;visibility:hidden;left:0;top:0;width:800px;height:600px;'
  document.body.appendChild(frame)
  desktopFailures.delete(terminal)
  desktopFrames.set(terminal, frame)
  desktopFrameListeners.forEach(l => l())
  let started: { vm: Machine }
  try {
    // One deadline for the page and its machine: the page's own fallbacks
    // (a worker that fails reloads it) must not keep the run waiting for good.
    started = await withTimeout(startDesktop(frame), DESKTOP_START_TIMEOUT_MS, 'the desktop')
  } catch (err) {
    desktopFailures.add(terminal)
    forgetDesktop(terminal, frame)
    throw err
  }
  // The learner's terminal, where foreground scripts go, opens once the
  // run is built (desktopLearnerTerminal), as a console does.
  const { vm } = started
  const stop = vm.stop.bind(vm)
  return Object.assign(vm, {
    async stop() {
      try { await stop() } finally {
        forgetDesktop(terminal, frame)
      }
    }
  })
}
