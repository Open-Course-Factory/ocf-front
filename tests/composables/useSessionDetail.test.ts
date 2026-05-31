/**
 * Tests for useSessionDetail — the session-detail subsystem state/logic
 * extracted from GroupScenariosTab.vue (commit c6 of #244).
 *
 * Owns: sessionDetail + loadingDetail + detailResult, the detail tab, the
 * paginated commands state, the per-step/per-quiz expansion sets, and the
 * commands fetchers. The modal VIEW and exportCommandsCsv orchestration live in
 * SessionDetailModal; the composable is the data engine.
 *
 * Source behavior pinned (parent lines 350–386, 513–632):
 *   - PAGE SIZE = 100 (commandsLimit).
 *   - loadDetail(result): loading=true, reset state, fetch
 *     getSessionDetail(groupId, result.session_id), set sessionDetail; on error
 *     → onError + don't open.
 *   - selectDetailTab('commands') lazy-loads via fetchSessionCommands ONLY the
 *     first time (!commandsLoaded && !commandsLoading).
 *   - fetchSessionCommands → getSessionCommands(groupId, sessionId, 100, offset);
 *     sets commandsList/commandsTotal/commandsLoaded; 404 → commandsNoTerminal.
 *   - pagination: hasPrev = offset>0; hasNext = offset+100 < total; next adds
 *     100 to offset + refetches; prev subtracts 100.
 *   - toggleStepRow/toggleQuizStep add/remove a step order from their Set.
 *
 * Harness: dummy-mount setup() (established pattern), teacherService mocked,
 * groupId passed as a getter.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

const mockGetSessionDetail = vi.fn()
const mockGetSessionCommands = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getSessionDetail: (...a: any[]) => mockGetSessionDetail(...a),
    getSessionCommands: (...a: any[]) => mockGetSessionCommands(...a),
  },
}))

import { useSessionDetail } from '../../src/composables/useSessionDetail'

type Detail = ReturnType<typeof useSessionDetail>

function makeResult(sessionId = 'sess-1') {
  return { session_id: sessionId, user_id: 'u1', user_name: 'Alice', status: 'completed' }
}

function makeDetail(overrides: Record<string, any> = {}) {
  return {
    session_id: 'sess-1',
    user_id: 'u1',
    user_name: 'Alice',
    status: 'completed',
    started_at: '2026-05-10T10:00:00.000Z',
    steps: [{ step_order: 0, step_title: 'A', step_type: 'terminal', status: 'completed', verify_attempts: 1, hints_revealed: 0, time_spent_seconds: 10 }],
    ...overrides,
  }
}

function makeCommandsPage(count: number, total: number, startSeq = 1) {
  const commands = Array.from({ length: count }, (_, i) => ({
    session_uuid: 's',
    sequence_num: startSeq + i,
    command_text: `cmd-${startSeq + i}`,
    executed_at: 1_700_000_000 + i,
  }))
  return { commands, total, limit: 100, offset: 0 }
}

function setupDetail(groupId = 'g1', onError?: () => void): Detail {
  let captured!: Detail
  const Dummy = defineComponent({
    setup() {
      captured = useSessionDetail(() => groupId, onError)
      return () => h('div')
    },
  })
  mount(Dummy)
  return captured
}

describe('useSessionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadDetail', () => {
    it('populates sessionDetail and toggles loading', async () => {
      mockGetSessionDetail.mockResolvedValue(makeDetail())
      const d = setupDetail('g1')

      const p = d.loadDetail(makeResult('sess-1') as any)
      expect(d.loadingDetail.value).toBe(true)

      await p
      await flushPromises()

      expect(d.loadingDetail.value).toBe(false)
      expect(mockGetSessionDetail).toHaveBeenCalledWith('g1', 'sess-1')
      expect(d.sessionDetail.value).not.toBeNull()
      expect(d.sessionDetail.value!.steps.length).toBe(1)
    })

    it('resets the tab to steps and clears commands state on each open', async () => {
      mockGetSessionDetail.mockResolvedValue(makeDetail())
      const d = setupDetail('g1')
      await d.loadDetail(makeResult() as any)
      await flushPromises()
      expect(d.detailActiveTab.value).toBe('steps')
      expect(d.commandsList.value).toEqual([])
    })

    it('calls onError when the detail fetch rejects', async () => {
      const onError = vi.fn()
      mockGetSessionDetail.mockRejectedValue(new Error('boom'))
      const d = setupDetail('g1', onError)

      await d.loadDetail(makeResult() as any)
      await flushPromises()

      expect(onError).toHaveBeenCalledTimes(1)
      expect(d.loadingDetail.value).toBe(false)
    })
  })

  describe('selectDetailTab (lazy commands load)', () => {
    it('lazy-loads commands the first time the commands tab is opened, once', async () => {
      mockGetSessionDetail.mockResolvedValue(makeDetail())
      mockGetSessionCommands.mockResolvedValue(makeCommandsPage(3, 3))
      const d = setupDetail('g1')
      await d.loadDetail(makeResult('sess-1') as any)
      await flushPromises()

      expect(mockGetSessionCommands).not.toHaveBeenCalled()

      d.selectDetailTab('commands')
      await flushPromises()
      expect(mockGetSessionCommands).toHaveBeenCalledTimes(1)
      expect(mockGetSessionCommands).toHaveBeenCalledWith('g1', 'sess-1', 100, 0)
      expect(d.commandsList.value.length).toBe(3)
      expect(d.commandsTotal.value).toBe(3)

      // Switching back to steps and again to commands must NOT refetch.
      d.selectDetailTab('steps')
      d.selectDetailTab('commands')
      await flushPromises()
      expect(mockGetSessionCommands).toHaveBeenCalledTimes(1)
    })

    it('marks commandsNoTerminal on a 404', async () => {
      mockGetSessionDetail.mockResolvedValue(makeDetail())
      mockGetSessionCommands.mockRejectedValue({ response: { status: 404 } })
      const d = setupDetail('g1')
      await d.loadDetail(makeResult() as any)
      await flushPromises()

      d.selectDetailTab('commands')
      await flushPromises()

      expect(d.commandsNoTerminal.value).toBe(true)
      expect(d.commandsList.value).toEqual([])
    })
  })

  describe('commands pagination (page size 100)', () => {
    it('hasPrev/hasNext reflect the offset and total bounds', async () => {
      mockGetSessionDetail.mockResolvedValue(makeDetail())
      mockGetSessionCommands.mockResolvedValue({ ...makeCommandsPage(100, 250), total: 250 })
      const d = setupDetail('g1')
      await d.loadDetail(makeResult('sess-1') as any)
      await flushPromises()
      d.selectDetailTab('commands')
      await flushPromises()

      // Page 0 of 250: prev disabled, next enabled.
      expect(d.commandsHasPrev.value).toBe(false)
      expect(d.commandsHasNext.value).toBe(true)
      expect(d.commandsPageStart.value).toBe(1)
      expect(d.commandsPageEnd.value).toBe(100)
    })

    it('next advances the offset by 100 and refetches the next page', async () => {
      mockGetSessionDetail.mockResolvedValue(makeDetail())
      mockGetSessionCommands.mockResolvedValueOnce({ ...makeCommandsPage(100, 250, 1), total: 250 })
      const d = setupDetail('g1')
      await d.loadDetail(makeResult('sess-1') as any)
      await flushPromises()
      d.selectDetailTab('commands')
      await flushPromises()

      mockGetSessionCommands.mockResolvedValueOnce({ ...makeCommandsPage(100, 250, 101), total: 250 })
      d.commandsNextPage()
      await flushPromises()

      expect(mockGetSessionCommands).toHaveBeenLastCalledWith('g1', 'sess-1', 100, 100)
      expect(d.commandsPageStart.value).toBe(101)
      expect(d.commandsPageEnd.value).toBe(200)
      expect(d.commandsHasPrev.value).toBe(true)
      expect(d.commandsHasNext.value).toBe(true)
    })

    it('next is a no-op on the last page (hasNext false)', async () => {
      mockGetSessionDetail.mockResolvedValue(makeDetail())
      // total 80 < one page → only one page, no next.
      mockGetSessionCommands.mockResolvedValue({ ...makeCommandsPage(80, 80), total: 80 })
      const d = setupDetail('g1')
      await d.loadDetail(makeResult() as any)
      await flushPromises()
      d.selectDetailTab('commands')
      await flushPromises()

      expect(d.commandsHasNext.value).toBe(false)
      const callsBefore = mockGetSessionCommands.mock.calls.length
      d.commandsNextPage()
      await flushPromises()
      // No additional fetch when there is no next page.
      expect(mockGetSessionCommands.mock.calls.length).toBe(callsBefore)
    })
  })

  describe('expansion sets', () => {
    it('toggleStepRow adds then removes a step order', () => {
      const d = setupDetail('g1')
      d.toggleStepRow(2)
      expect(d.isStepRowExpanded(2)).toBe(true)
      d.toggleStepRow(2)
      expect(d.isStepRowExpanded(2)).toBe(false)
    })

    it('toggleQuizStep adds then removes a step order', () => {
      const d = setupDetail('g1')
      d.toggleQuizStep(1)
      expect(d.isQuizStepExpanded(1)).toBe(true)
      d.toggleQuizStep(1)
      expect(d.isQuizStepExpanded(1)).toBe(false)
    })
  })
})
