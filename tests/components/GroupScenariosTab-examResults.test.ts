/**
 * Learners' grades stay withheld until the teacher publishes a class's
 * results. Publishing asks first (learners then see their grade); hiding them
 * again is immediate. The card shows the state either way, in the same slot.
 *
 * An exam takes one attempt; from a learner's result row the teacher can allow
 * another one, after a confirmation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

const publishResults = vi.fn()
const unpublishResults = vi.fn()
const getGroupAssignments = vi.fn()
const getScenarioResults = vi.fn()
const allowRetake = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getGroupAssignments: (...a: any[]) => getGroupAssignments(...a),
    getAssignmentsProgress: vi.fn().mockResolvedValue([
      { scenario_id: 'scn-1', total_count: 1, completed_count: 1, avg_grade: 40, has_exam_quiz: true },
    ]),
    listGroupAvailableScenarios: vi.fn().mockResolvedValue([]),
    publishResults: (...a: any[]) => publishResults(...a),
    unpublishResults: (...a: any[]) => unpublishResults(...a),
    getScenarioResults: (...a: any[]) => getScenarioResults(...a),
    allowRetake: (...a: any[]) => allowRetake(...a),
  },
}))

const notifyError = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: notifyError,
    showSuccess: vi.fn(),
    showConfirm: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  }),
}))

import GroupScenariosTab from '../../src/components/Groups/GroupScenariosTab.vue'

const ASSIGNMENT = {
  id: 'a1',
  scenario_id: 'scn-1',
  group_id: 'g1',
  scope: 'group',
  is_active: true,
  results_published_at: null,
  scenario: { id: 'scn-1', name: 'exam', title: 'Linux exam', difficulty: 'beginner' },
}

async function mountTab() {
  const wrapper = mount(GroupScenariosTab, {
    props: { groupId: 'g1', canEditGroup: true },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        ScenarioUploadModal: true,
        ScenarioJSONImportModal: true,
        AssignScenarioModal: true,
        BulkStartScenarioModal: true,
        ScenarioAssignmentResultModal: true,
        RemoveAssignmentConfirmModal: true,
        ResetAssignmentModal: true,
        SessionDetailModal: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('GroupScenariosTab — publish results', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('publishes only after the confirmation, then shows the published state', async () => {
    getGroupAssignments.mockResolvedValue([{ ...ASSIGNMENT }])
    publishResults.mockResolvedValue('2026-11-07T10:00:00Z')
    const wrapper = await mountTab()

    expect(wrapper.find('[data-testid="results-published-badge"]').text()).toBe('Results not published')
    expect(wrapper.find('[data-testid="results-publish"]').classes()).not.toContain('ocf-slot-reserved')
    await wrapper.find('[data-testid="results-publish"]').trigger('click')
    expect(publishResults).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="results-publish-confirm"]').text()).toBe('Learners will see their grade.')

    await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
    await flushPromises()

    expect(publishResults).toHaveBeenCalledWith('g1', 'scn-1')
    expect(wrapper.find('[data-testid="results-publish-confirm"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="results-published-badge"]').text()).toContain('Results published')
    expect(wrapper.find('[data-testid="results-unpublish"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="results-publish"]').exists()).toBe(false)
  })

  it('publishes only where grades wait for it: hidden (slot kept) without an exam quiz', async () => {
    getGroupAssignments.mockResolvedValue([{ ...ASSIGNMENT, scenario_id: 'scn-2' }])
    const wrapper = await mountTab()

    expect(wrapper.find('[data-testid="results-publish"]').classes()).toContain('ocf-slot-reserved')
    expect(wrapper.find('[data-testid="results-published-badge"]').classes()).toContain('ocf-slot-reserved')
  })

  it('cancelling the confirmation publishes nothing', async () => {
    getGroupAssignments.mockResolvedValue([{ ...ASSIGNMENT }])
    const wrapper = await mountTab()

    await wrapper.find('[data-testid="results-publish"]').trigger('click')
    await wrapper.find('.base-modal-footer .btn-secondary').trigger('click')

    expect(publishResults).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="results-publish-confirm"]').exists()).toBe(false)
  })

  it('hides published results at once', async () => {
    getGroupAssignments.mockResolvedValue([{ ...ASSIGNMENT, results_published_at: '2026-11-07T10:00:00Z' }])
    unpublishResults.mockResolvedValue(null)
    const wrapper = await mountTab()

    await wrapper.find('[data-testid="results-unpublish"]').trigger('click')
    await flushPromises()

    expect(unpublishResults).toHaveBeenCalledWith('g1', 'scn-1')
    expect(wrapper.find('[data-testid="results-published-badge"]').text()).toBe('Results not published')
    expect(wrapper.find('[data-testid="results-publish"]').exists()).toBe(true)
  })

  it('keeps the state and reports the error when publishing fails', async () => {
    getGroupAssignments.mockResolvedValue([{ ...ASSIGNMENT }])
    publishResults.mockRejectedValue({ response: { data: { error_message: 'Forbidden' } } })
    const wrapper = await mountTab()

    await wrapper.find('[data-testid="results-publish"]').trigger('click')
    await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
    await flushPromises()

    expect(notifyError).toHaveBeenCalledWith('Forbidden')
    expect(wrapper.find('[data-testid="results-published-badge"]').text()).toBe('Results not published')
  })
})

const LOCKED_ROW = {
  session_id: 'sess-9',
  user_id: 'u9',
  user_name: 'Karim',
  status: 'completed',
  grade: 40,
  current_step: 1,
  total_steps: 1,
  completed_steps: 1,
  total_hints_used: 0,
  started_at: '2026-11-07T09:00:00Z',
  exam_locked: true,
  retake_allowed_at: null,
}

async function openResults(row: Record<string, unknown>) {
  getGroupAssignments.mockResolvedValue([{ ...ASSIGNMENT }])
  getScenarioResults.mockResolvedValue([{ ...row }])
  const wrapper = await mountTab()
  await wrapper.find('.btn-view-results').trigger('click')
  await flushPromises()
  return wrapper
}

describe('GroupScenariosTab — allow another exam attempt', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('allows a retake only after the confirmation, then says when', async () => {
    allowRetake.mockResolvedValue('2026-11-07T11:00:00Z')
    const wrapper = await openResults(LOCKED_ROW)

    await wrapper.find('[data-testid="retake-allow"]').trigger('click')
    expect(allowRetake).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="retake-confirm"]').text()).toBe(
      'The learner will be able to take the exam again. Their current attempt stays in the history.'
    )

    const confirmButton = wrapper.findAll('.base-modal-footer .btn-primary').at(-1)!
    await confirmButton.trigger('click')
    await flushPromises()

    expect(allowRetake).toHaveBeenCalledWith('g1', 'sess-9')
    expect(wrapper.find('[data-testid="retake-allow"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="retake-allowed-note"]').text()).toContain('Another attempt allowed on')
  })

  it('offers no retake on a row whose exam is not locked', async () => {
    const wrapper = await openResults({ ...LOCKED_ROW, exam_locked: false })
    expect(wrapper.find('[data-testid="retake-allow"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="retake-allowed-note"]').exists()).toBe(false)
  })

  it('keeps the button and reports the error when the retake is refused', async () => {
    allowRetake.mockRejectedValue({ response: { data: { error_message: 'Not locked' } } })
    const wrapper = await openResults(LOCKED_ROW)

    await wrapper.find('[data-testid="retake-allow"]').trigger('click')
    await wrapper.findAll('.base-modal-footer .btn-primary').at(-1)!.trigger('click')
    await flushPromises()

    expect(notifyError).toHaveBeenCalledWith('Not locked')
    expect(wrapper.find('[data-testid="retake-allow"]').exists()).toBe(true)
  })
})
