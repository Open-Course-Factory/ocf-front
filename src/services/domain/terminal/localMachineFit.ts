/**
 * Whether a learner's computer can hold the machine a lab runs in their
 * browser. The machine takes its memory (ocf-core: the lab's size) out of the
 * computer, which also needs room for its system and the browser: twice the
 * machine's memory. Only Chrome and Edge say how much the computer has
 * (navigator.deviceMemory, rounded and capped at 8 GiB); elsewhere the card
 * only warns.
 */

/** Up to this, a lab needs nothing special of the computer. */
export const LOCAL_MACHINE_PLAIN_MIB = 2048

/** The RAM, in GiB, a computer needs for a machine of memoryMiB. */
export function computerGiBNeeded(memoryMiB: number): number {
  return Math.ceil(memoryMiB / 1024) * 2
}

/** The most navigator.deviceMemory ever says, whatever the computer has. */
const DEVICE_MEMORY_CAP_GIB = 8

/**
 * True when the browser says the computer has less RAM than the machine
 * needs; false when it fits or the browser does not say. A computer the
 * browser rounds to its cap may have far more, so it counts as enough.
 */
export function computerTooSmall(
  memoryMiB: number | undefined,
  deviceMemoryGiB: number | undefined = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
): boolean {
  if (!memoryMiB || memoryMiB <= LOCAL_MACHINE_PLAIN_MIB || !deviceMemoryGiB) return false
  if (deviceMemoryGiB >= DEVICE_MEMORY_CAP_GIB) return false
  return deviceMemoryGiB < computerGiBNeeded(memoryMiB)
}

/**
 * Why this browser cannot run a lab's machine, in the words ocf-core's launch
 * takes (local_machine_unavailable: services.LocalMachineUnavailableReasons).
 */
export type LocalMachineUnavailable = 'browser' | 'memory' | 'device'

// iPadOS Safari calls itself a Mac: a Mac with a touch screen is a tablet.
function isPhoneOrTablet(): boolean {
  return /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent)
    || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
}

// unkernel's own test, in each CPU's thread: JSPI (Chrome and Edge 137,
// Firefox 153 and later).
function hasJspi(): boolean {
  const wasm = WebAssembly as unknown as { promising?: unknown, Suspending?: unknown }
  return typeof wasm.promising === 'function' && typeof wasm.Suspending === 'function'
}

/**
 * Why this browser cannot run a machine of memoryMiB, or undefined when it
 * can. Without memoryMiB, only the browser and the device are judged.
 */
export function localMachineUnavailable(memoryMiB?: number): LocalMachineUnavailable | undefined {
  if (isPhoneOrTablet()) return 'device'
  if (!hasJspi()) return 'browser'
  if (computerTooSmall(memoryMiB)) return 'memory'
  return undefined
}
