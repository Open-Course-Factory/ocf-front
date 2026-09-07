import { flushPromises } from '@vue/test-utils'

/**
 * Wait for `condition` to hold, yielding microtasks and macrotasks in
 * between, until a wall-clock deadline expires.
 *
 * Bounding the wait by elapsed time rather than by a number of yields is
 * the point: a loop of N `setTimeout(0)` turns burns its budget just as
 * fast on a loaded CI runner, where the dynamic imports and observers a
 * component awaits take longer, which is the one case that needs more
 * waiting (#328). The failure names what never happened instead of
 * surfacing later as an assertion on `undefined`.
 */
export async function waitUntil(
  condition: () => boolean,
  { timeoutMs = 5000, label = 'condition' }: { timeoutMs?: number; label?: string } = {}
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error(`${label} did not happen within ${timeoutMs}ms`)
    }
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}
