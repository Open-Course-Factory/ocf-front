/**
 * RED tests for useWallOrder — the composable frontend-dev extracts from
 * GroupLiveSessionsTab to own the per-group wall ordering (review Minor:
 * composable extraction).
 *
 * The wall's ordering logic (`applyStoredOrder`) is currently an un-exported
 * function inside the component. Its happy paths are already covered at the
 * component level by GroupLiveSessionsTab-wallReorder.test.ts (6 tests: stored
 * order honored, new sessions appended in server order, no-stored → server order,
 * drag reorders + persists, group switch, order survives a re-fetch). This file
 * does NOT re-test those; it pins only the PURE EDGE cases that the component tests
 * do not exercise, so the extraction can be verified in isolation.
 *
 * Production surface these tests define (to be implemented by frontend-dev):
 *   src/composables/useWallOrder.ts
 *     export function useWallOrder(groupId: Ref<string>): {
 *       orderedIds: ... ; applyStoredOrder(list, order): T[];
 *       persist(order: string[]): void; ...drag handlers...
 *     }
 *   applyStoredOrder is the pure ordering primitive: stored order first (deduped,
 *   skipping ids no longer live), then any remaining sessions in server order.
 *
 * Only `applyStoredOrder` is needed here; it is pure and independent of the ref.
 */

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useWallOrder } from '../../src/composables/useWallOrder'

interface Item { session_id: string }
function items(...ids: string[]): Item[] {
  return ids.map(id => ({ session_id: id }))
}
function ids(list: Item[]): string[] {
  return list.map(s => s.session_id)
}

function makeApplyStoredOrder() {
  const { applyStoredOrder } = useWallOrder(ref('grp-1'))
  return applyStoredOrder
}

describe('useWallOrder.applyStoredOrder — pure edge cases', () => {
  it('does not duplicate a session when its id appears more than once in the stored order', () => {
    const applyStoredOrder = makeApplyStoredOrder()

    const result = applyStoredOrder(items('s1', 's2', 's3'), ['s1', 's1', 's2'])

    // s1 rendered once (first hit), then s2, then s3 appended in server order.
    expect(ids(result)).toEqual(['s1', 's2', 's3'])
    expect(result).toHaveLength(3)
  })

  it('falls back to server order when every stored id has vanished from the live list', () => {
    const applyStoredOrder = makeApplyStoredOrder()

    const result = applyStoredOrder(items('s1', 's2', 's3'), ['gone-a', 'gone-b', 'gone-c'])

    expect(ids(result)).toEqual(['s1', 's2', 's3'])
  })

  it('returns an empty list for an empty session list regardless of stored order (zero input)', () => {
    const applyStoredOrder = makeApplyStoredOrder()

    expect(applyStoredOrder([], ['s1', 's2'])).toEqual([])
    expect(applyStoredOrder([], [])).toEqual([])
  })

  it('returns the live list in server order when the stored order is empty', () => {
    const applyStoredOrder = makeApplyStoredOrder()

    expect(ids(applyStoredOrder(items('s1', 's2', 's3'), []))).toEqual(['s1', 's2', 's3'])
  })
})
