/**
 * The machine that runs in the learner's browser (unkernel: Linux compiled to
 * WebAssembly). The only module that knows unkernel; it is loaded on the first
 * local console, so a page that never opens one downloads none of it.
 */
import type { NetSpec } from 'unkernel'
import { LocalConsoleSocket, type ConsolePty } from './localConsoleSocket'

export interface LocalMachineOptions {
  /** The distro image (erofs), served with Range support. */
  distroUrl: string
  /** Run the kernel in a Web Worker instead of the page's thread. */
  worker: boolean
  /** The guest's network. None by default: the guest has no eth0. */
  net?: NetSpec
}

interface Machine {
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
  return new LocalConsoleSocket(
    async () => (await getMachine(opts)).spawn(undefined, undefined, { cols, rows }),
    outputDrained
  )
}
