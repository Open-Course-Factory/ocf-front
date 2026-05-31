/**
 * Tests for SessionDetailModal — the session-detail BaseModal extracted from
 * GroupScenariosTab.vue (commit c6 of #244).
 *
 * Decision: the modal uses useSessionDetail INTERNALLY and loads on open (keeps
 * the parent thinnest — parent just passes visible + result + groupId). It owns
 * exportCommandsCsv (it has the commands data). Emits `close`.
 *
 * Source markup (parent lines 1074–1500): a header info block, a steps/commands
 * tablist, the steps table (one row per step, QuizAnswerReview for quiz steps),
 * the commands tab (all/per-step modes, pagination), the export-commands button.
 *
 * Harness: real createI18n; QuizAnswerReview STUBBED; teacherService mocked so
 * the modal loads its own data on open.
 *
 * i18n note: empty test messages → assert on DOM structure + emits, not text.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const mockGetSessionDetail = vi.fn()
const mockGetSessionCommands = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getSessionDetail: (...a: any[]) => mockGetSessionDetail(...a),
    getSessionCommands: (...a: any[]) => mockGetSessionCommands(...a),
  },
}))

// Avoid pulling in element-plus etc. via the notification composable.
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showError: vi.fn(), showSuccess: vi.fn(), showConfirm: vi.fn() }),
}))

import SessionDetailModal from '../../src/components/Groups/SessionDetailModal.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function makeResult(sessionId = 'sess-1') {
  return { session_id: sessionId, user_id: 'u1', user_name: 'Alice', status: 'completed' }
}

function makeDetail(steps: any[]) {
  return {
    session_id: 'sess-1',
    user_id: 'u1',
    user_name: 'Alice',
    status: 'completed',
    started_at: '2026-05-10T10:00:00.000Z',
    steps,
  }
}

function terminalStep(order: number, title: string) {
  return {
    step_order: order,
    step_title: title,
    step_type: 'terminal',
    status: 'completed',
    verify_attempts: 1,
    hints_revealed: 0,
    time_spent_seconds: 10,
  }
}

function mountModal(props: Record<string, unknown> = {}) {
  return mount(SessionDetailModal, {
    props: {
      visible: true,
      result: makeResult('sess-1'),
      groupId: 'g1',
      ...props,
    },
    global: {
      plugins: [createTestI18n()],
      stubs: { QuizAnswerReview: true },
    },
  })
}

describe('SessionDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSessionDetail.mockResolvedValue(makeDetail([terminalStep(0, 'First step'), terminalStep(1, 'Second step')]))
    mockGetSessionCommands.mockResolvedValue({
      commands: [
        { session_uuid: 's', sequence_num: 1, command_text: 'ls -la', executed_at: 1_700_000_000 },
      ],
      total: 1,
      limit: 100,
      offset: 0,
    })
  })

  it('renders no overlay when visible is false', () => {
    const wrapper = mountModal({ visible: false })
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)
  })

  it('loads the detail on open and renders one steps-table row per step', async () => {
    const wrapper = mountModal({ visible: true })
    await flushPromises()

    expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)
    expect(mockGetSessionDetail).toHaveBeenCalledWith('g1', 'sess-1')

    const rows = wrapper.findAll('.steps-table tbody tr')
    expect(rows.length).toBeGreaterThanOrEqual(2)
    const text = wrapper.text()
    expect(text).toContain('First step')
    expect(text).toContain('Second step')
  })

  it('switches to the commands tab and renders the commands table', async () => {
    const wrapper = mountModal({ visible: true })
    await flushPromises()

    // Click the commands tab (second tab button).
    const tabs = wrapper.findAll('.detail-tab-btn')
    expect(tabs.length).toBe(2)
    await tabs[1].trigger('click')
    await flushPromises()

    expect(mockGetSessionCommands).toHaveBeenCalledWith('g1', 'sess-1', 100, 0)
    const cmdRows = wrapper.findAll('.commands-table tbody tr')
    expect(cmdRows.length).toBe(1)
    expect(cmdRows[0].text()).toContain('ls -la')
  })

  it('disables prev at the first page and enables next when more pages exist', async () => {
    mockGetSessionCommands.mockResolvedValue({
      commands: Array.from({ length: 100 }, (_, i) => ({
        session_uuid: 's', sequence_num: i + 1, command_text: `c${i}`, executed_at: 1_700_000_000 + i,
      })),
      total: 250, limit: 100, offset: 0,
    })
    const wrapper = mountModal({ visible: true })
    await flushPromises()
    await wrapper.findAll('.detail-tab-btn')[1].trigger('click')
    await flushPromises()

    const pageButtons = wrapper.findAll('.commands-page-buttons button')
    expect(pageButtons.length).toBe(2)
    // prev disabled at page 0, next enabled.
    expect(pageButtons[0].attributes('disabled')).toBeDefined()
    expect(pageButtons[1].attributes('disabled')).toBeUndefined()

    // Advancing fetches the next page (offset 100).
    await pageButtons[1].trigger('click')
    await flushPromises()
    expect(mockGetSessionCommands).toHaveBeenLastCalledWith('g1', 'sess-1', 100, 100)
  })

  it('emits close when the BaseModal close button is clicked', async () => {
    const wrapper = mountModal({ visible: true })
    await flushPromises()
    await wrapper.find('.base-modal-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
