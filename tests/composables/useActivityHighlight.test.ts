/**
 * RED tests for useActivityHighlight — the composable frontend-dev extracts from
 * GroupLiveSessionsTab to own the "tile just produced output" highlight (review
 * Minor: composable extraction).
 *
 * This logic currently lives inline in the component (`markActivity` + a per-session
 * 2s timer clearing `activeTiles`) and has NO test coverage today (neither
 * wallReorder nor permissionRace touch it). Extracting it un-tested would be a
 * silent-regression risk, so this file adds a minimal unit safety net around the
 * pure/observable behaviour: a marked session is active, distinct sessions are
 * independent, a re-mark keeps it active past the original window, and it clears
 * after the highlight window elapses.
 *
 * Production surface these tests define (to be implemented by frontend-dev):
 *   src/composables/useActivityHighlight.ts
 *     export function useActivityHighlight(windowMs?: number): {
 *       activeTiles: Ref<Set<string>>   // or { isActive(id): boolean }
 *       markActivity(sessionId: string): void
 *       stop(): void                    // clears all pending timers (onUnmounted)
 *     }
 *
 * The default highlight window matches the component's current 2000ms.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useActivityHighlight } from '../../src/composables/useActivityHighlight'

describe('useActivityHighlight', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('marks a session active as soon as activity is reported', () => {
    const { activeTiles, markActivity } = useActivityHighlight()

    markActivity('s1')

    expect(activeTiles.value.has('s1')).toBe(true)
  })

  it('keeps distinct sessions independent', () => {
    const { activeTiles, markActivity } = useActivityHighlight()

    markActivity('s1')

    expect(activeTiles.value.has('s1')).toBe(true)
    expect(activeTiles.value.has('s2')).toBe(false)
  })

  it('clears the highlight once the window elapses with no further activity', () => {
    const { activeTiles, markActivity } = useActivityHighlight(2000)

    markActivity('s1')
    vi.advanceTimersByTime(2000)

    expect(activeTiles.value.has('s1')).toBe(false)
  })

  it('a re-mark before the window elapses keeps the tile active past the original deadline', () => {
    const { activeTiles, markActivity } = useActivityHighlight(2000)

    markActivity('s1')
    vi.advanceTimersByTime(1500)
    markActivity('s1') // resets the timer
    vi.advanceTimersByTime(1000) // 2500ms since first mark, 1000ms since second

    // Still active: the second mark pushed the deadline out.
    expect(activeTiles.value.has('s1')).toBe(true)
  })

  it('stop() cancels pending timers so no highlight state changes afterward', () => {
    const { activeTiles, markActivity, stop } = useActivityHighlight(2000)

    markActivity('s1')
    stop()
    // Snapshot after stop; advancing time must not mutate it via a leftover timer.
    const activeAfterStop = activeTiles.value.has('s1')
    vi.advanceTimersByTime(5000)

    expect(activeTiles.value.has('s1')).toBe(activeAfterStop)
  })
})
