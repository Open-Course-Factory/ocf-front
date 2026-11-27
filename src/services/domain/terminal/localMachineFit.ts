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

/**
 * True when the browser says the computer has less RAM than the machine
 * needs; false when it fits or the browser does not say.
 */
export function computerTooSmall(
  memoryMiB: number | undefined,
  deviceMemoryGiB: number | undefined = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
): boolean {
  if (!memoryMiB || memoryMiB <= LOCAL_MACHINE_PLAIN_MIB || !deviceMemoryGiB) return false
  return deviceMemoryGiB < computerGiBNeeded(memoryMiB)
}
