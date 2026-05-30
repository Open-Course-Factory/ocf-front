/**
 * Tests for useAssignmentResults — the results-panel state/lifecycle extracted
 * from GroupScenariosTab.vue (commit c5 of #244).
 *
 * Owns: the open assignment, the results list, the loading flag, the 30s
 * auto-refresh interval, and the multi-select state. The inline results VIEW
 * (presentational) and the export/detail orchestration stay in the parent.
 *
 * Source behavior pinned (parent lines 410–421, 547–586):
 *   - handleViewResults(assignment): set showResultsForAssignment, loading=true,
 *     clear scenarioResults + selection, fetch getScenarioResults(groupId,
 *     assignment.scenario_id), set results, loading=false; then CLEAR any
 *     existing interval and start a 30000ms setInterval that silently re-fetches
 *     (errors swallowed, last-good data kept).
 *   - closeResults(): clear interval + reset showResultsForAssignment/
 *     scenarioResults/selectedResults.
 *   - allSelected is a WRITABLE computed: get = every row selected; set(true)
 *     selects all, set(false) clears.
 *   - onUnmounted clears the interval.
 *
 * Harness: dummy-mount setup() (the established pattern), real-ish timers faked
 * via vi.useFakeTimers, teacherService mocked. groupId is passed as a getter.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

const mockGetScenarioResults = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getScenarioResults: (...a: any[]) => mockGetScenarioResults(...a),
  },
}))

import { useAssignmentResults } from '../../src/composables/useAssignmentResults'

type Results = ReturnType<typeof useAssignmentResults>

function makeAssignment(scenarioId = 'scn-1') {
  return { id: 'a1', scenario_id: scenarioId, group_id: 'g1', scope: 'group', is_active: true }
}

function makeResult(sessionId: string, name = sessionId) {
  return { session_id: sessionId, user_id: name, user_name: name, status: 'completed' }
}

function setupResults(
  groupId = 'g1',
  onError?: () => void,
): { results: Results; unmount: () => void } {
  let captured!: Results
  const Dummy = defineComponent({
    setup() {
      captured = useAssignmentResults(() => groupId, onError)
      return () => h('div')
    },
  })
  const wrapper = mount(Dummy)
  return { results: captured, unmount: () => wrapper.unmount() }
}

describe('useAssignmentResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('handleViewResults', () => {
    it('sets the assignment, populates results, and toggles loading', async () => {
      mockGetScenarioResults.mockResolvedValue([makeResult('s1'), makeResult('s2')])
      const { results } = setupResults('g1')

      const p = results.handleViewResults(makeAssignment('scn-1') as any)
      expect(results.loadingResults.value).toBe(true)
      expect(results.showResultsForAssignment.value).not.toBeNull()

      await p
      await flushPromises()

      expect(results.loadingResults.value).toBe(false)
      expect(mockGetScenarioResults).toHaveBeenCalledWith('g1', 'scn-1')
      expect(results.scenarioResults.value.map((r: any) => r.session_id)).toEqual(['s1', 's2'])
    })

    it('re-fetches after 30s and updates the results ref', async () => {
      mockGetScenarioResults.mockResolvedValueOnce([makeResult('s1')])
      const { results } = setupResults('g1')
      await results.handleViewResults(makeAssignment('scn-1') as any)
      await flushPromises()
      expect(results.scenarioResults.value.length).toBe(1)

      // The 30s tick fires a 2nd fetch with fresh data.
      mockGetScenarioResults.mockResolvedValueOnce([makeResult('s1'), makeResult('s2'), makeResult('s3')])
      await vi.advanceTimersByTimeAsync(30000)
      await flushPromises()

      expect(mockGetScenarioResults).toHaveBeenCalledTimes(2)
      expect(results.scenarioResults.value.map((r: any) => r.session_id)).toEqual(['s1', 's2', 's3'])
    })

    it('keeps the previous results when a background refresh rejects (silent)', async () => {
      mockGetScenarioResults.mockResolvedValueOnce([makeResult('s1'), makeResult('s2')])
      const { results } = setupResults('g1')
      await results.handleViewResults(makeAssignment('scn-1') as any)
      await flushPromises()

      // The refresh tick rejects — must not throw, must keep last-good data.
      mockGetScenarioResults.mockRejectedValueOnce(new Error('flaky'))
      await vi.advanceTimersByTimeAsync(30000)
      await flushPromises()

      expect(results.scenarioResults.value.map((r: any) => r.session_id)).toEqual(['s1', 's2'])
    })

    it('calls onError once when the INITIAL fetch rejects (and only the initial load surfaces it)', async () => {
      // Frozen behavior: the parent showed a toast on the initial load failure
      // (notifyError(t('groupScenarios.loadError'))). The composable surfaces
      // that via the optional onError callback. Refresh-tick failures stay
      // silent and must NOT call onError.
      const onError = vi.fn()

      // Initial load rejects.
      mockGetScenarioResults.mockRejectedValueOnce(new Error('initial boom'))
      const { results } = setupResults('g1', onError)

      await results.handleViewResults(makeAssignment('scn-1') as any)
      await flushPromises()

      // onError fired exactly once; loading ended; the assignment stays open.
      expect(onError).toHaveBeenCalledTimes(1)
      expect(results.loadingResults.value).toBe(false)
      expect(results.showResultsForAssignment.value).not.toBeNull()

      // A refresh-tick rejection must NOT call onError again (refresh is silent).
      mockGetScenarioResults.mockRejectedValueOnce(new Error('refresh boom'))
      await vi.advanceTimersByTimeAsync(30000)
      await flushPromises()

      expect(onError).toHaveBeenCalledTimes(1)
    })

    it('does not stack intervals when reopened (one refresh per 30s tick)', async () => {
      mockGetScenarioResults.mockResolvedValue([makeResult('s1')])
      const { results } = setupResults('g1')

      await results.handleViewResults(makeAssignment('scn-1') as any)
      await flushPromises()
      // Reopen (e.g. different assignment) — must clear the old interval first.
      await results.handleViewResults(makeAssignment('scn-2') as any)
      await flushPromises()

      const callsAfterOpen = mockGetScenarioResults.mock.calls.length // 2 initial loads

      // A single 30s tick should add EXACTLY one refresh, not two.
      await vi.advanceTimersByTimeAsync(30000)
      await flushPromises()

      expect(mockGetScenarioResults.mock.calls.length).toBe(callsAfterOpen + 1)
    })
  })

  describe('closeResults', () => {
    it('clears state and stops further refresh ticks', async () => {
      mockGetScenarioResults.mockResolvedValue([makeResult('s1')])
      const { results } = setupResults('g1')
      await results.handleViewResults(makeAssignment('scn-1') as any)
      await flushPromises()

      results.closeResults()
      expect(results.showResultsForAssignment.value).toBeNull()
      expect(results.scenarioResults.value).toEqual([])
      expect(results.selectedResults.value.size).toBe(0)

      const callsAfterClose = mockGetScenarioResults.mock.calls.length
      await vi.advanceTimersByTimeAsync(60000)
      await flushPromises()
      // No more fetches after close.
      expect(mockGetScenarioResults.mock.calls.length).toBe(callsAfterClose)
    })
  })

  describe('unmount', () => {
    it('stops the refresh interval on unmount', async () => {
      mockGetScenarioResults.mockResolvedValue([makeResult('s1')])
      const { results, unmount } = setupResults('g1')
      await results.handleViewResults(makeAssignment('scn-1') as any)
      await flushPromises()

      const callsAfterOpen = mockGetScenarioResults.mock.calls.length
      unmount()
      await vi.advanceTimersByTimeAsync(60000)
      await flushPromises()

      expect(mockGetScenarioResults.mock.calls.length).toBe(callsAfterOpen)
    })
  })

  describe('selection', () => {
    it('toggleResult adds then removes a session id', async () => {
      mockGetScenarioResults.mockResolvedValue([makeResult('s1'), makeResult('s2')])
      const { results } = setupResults('g1')
      await results.handleViewResults(makeAssignment() as any)
      await flushPromises()

      results.toggleResult('s1')
      expect(results.selectedResults.value.has('s1')).toBe(true)
      results.toggleResult('s1')
      expect(results.selectedResults.value.has('s1')).toBe(false)
    })

    it('toggleSelectAll / allSelected select-all then clear', async () => {
      mockGetScenarioResults.mockResolvedValue([makeResult('s1'), makeResult('s2'), makeResult('s3')])
      const { results } = setupResults('g1')
      await results.handleViewResults(makeAssignment() as any)
      await flushPromises()

      expect(results.allSelected.value).toBe(false)

      results.toggleSelectAll()
      await nextTick()
      expect(results.selectedResults.value.size).toBe(3)
      expect(results.allSelected.value).toBe(true)

      results.toggleSelectAll()
      await nextTick()
      expect(results.selectedResults.value.size).toBe(0)
      expect(results.allSelected.value).toBe(false)
    })

    it('allSelected is true only when every row is selected', async () => {
      mockGetScenarioResults.mockResolvedValue([makeResult('s1'), makeResult('s2')])
      const { results } = setupResults('g1')
      await results.handleViewResults(makeAssignment() as any)
      await flushPromises()

      results.toggleResult('s1')
      expect(results.allSelected.value).toBe(false) // only one of two
      results.toggleResult('s2')
      expect(results.allSelected.value).toBe(true)  // both selected
    })
  })
})
