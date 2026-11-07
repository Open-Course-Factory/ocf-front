/**
 * Learners' grades stay withheld until the teacher publishes a class's
 * results. Publishing asks first (learners then see their grade); hiding them
 * again is immediate. The card shows the state either way, in the same slot.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

const publishResults = vi.fn()
const unpublishResults = vi.fn()
const getGroupAssignments = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getGroupAssignments: (...a: any[]) => getGroupAssignments(...a),
    getAssignmentsProgress: vi.fn().mockResolvedValue([]),
    listGroupAvailableScenarios: vi.fn().mockResolvedValue([]),
    publishResults: (...a: any[]) => publishResults(...a),
    unpublishResults: (...a: any[]) => unpublishResults(...a),
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
        AssignmentResultsView: true,
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
