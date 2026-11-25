/**
 * Starting a class on a lab that runs in the learners' browsers: nothing can be
 * built ahead there, so ocf-core leaves those learners to launch it themselves,
 * and the trainer is told so. (Harness from GroupScenariosTab-servers.test.ts.)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

const getGroupAssignments = vi.fn()
const bulkStartScenario = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getGroupAssignments: (...a: any[]) => getGroupAssignments(...a),
    getAssignmentsProgress: vi.fn().mockResolvedValue([]),
    listGroupAvailableScenarios: vi.fn().mockResolvedValue([]),
    bulkStartScenario: (...a: any[]) => bulkStartScenario(...a),
  },
}))

let releaseBackends: (servers: unknown[]) => void = () => {}
const getBackends = vi.fn(() => new Promise(resolve => { releaseBackends = resolve }))
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: { getBackends: (...a: unknown[]) => getBackends(...a) },
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showError: vi.fn(), showSuccess: vi.fn(), showConfirm: vi.fn(), showInfo: vi.fn(), showWarning: vi.fn() }),
}))

import GroupScenariosTab from '../../src/components/Groups/GroupScenariosTab.vue'
import { useTerminalBackendsStore } from '../../src/stores/terminalBackends'

const servers = [
  { id: 'main', name: 'Main', connected: true, is_default: true },
  { id: 'spare', name: 'Spare', connected: true, is_default: false },
]

const ASSIGNMENT = {
  id: 'a1', scenario_id: 'scn-1', group_id: 'g1', scope: 'group', is_active: true, backend: 'spare',
  scenario: { id: 'scn-1', name: 'lab', title: 'Lab', difficulty: 'beginner' },
}

async function mountTab(org: { organizationId?: string } = { organizationId: 'org-1' }, stubs: Record<string, boolean> = {}) {
  const wrapper = mount(GroupScenariosTab, {
    props: { groupId: 'g1', canEditGroup: true, ...org },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        ScenarioImportModal: true, AssignScenarioModal: true,
        BulkStartScenarioModal: true, ScenarioAssignmentResultModal: true, RemoveAssignmentConfirmModal: true,
        ResetAssignmentModal: true, SessionDetailModal: true, ...stubs,
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('GroupScenariosTab — class start on local machines', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getGroupAssignments.mockResolvedValue([{ ...ASSIGNMENT }])
  })

  it('tells the trainer which learners start the lab themselves', async () => {
    bulkStartScenario.mockResolvedValue({
      created: 1, skipped: 2,
      skipped_users: [{ user_id: 'u1', reason: 'local_machine' }, { user_id: 'u2', reason: 'exam_already_submitted' }],
    })
    const wrapper = await mountTab({})
    wrapper.findComponent({ name: 'AssignmentCard' }).vm.$emit('bulk-start')
    await flushPromises()
    wrapper.findComponent({ name: 'BulkStartScenarioModal' }).vm.$emit('confirm')
    await flushPromises()

    const message = wrapper.findComponent({ name: 'ScenarioAssignmentResultModal' }).props('message') as string
    expect(message).toContain('1 learners start this lab themselves')
  })

  it('says nothing more when every learner was started', async () => {
    bulkStartScenario.mockResolvedValue({ created: 2, skipped: 0 })
    const wrapper = await mountTab({})
    wrapper.findComponent({ name: 'AssignmentCard' }).vm.$emit('bulk-start')
    await flushPromises()
    wrapper.findComponent({ name: 'BulkStartScenarioModal' }).vm.$emit('confirm')
    await flushPromises()

    const message = wrapper.findComponent({ name: 'ScenarioAssignmentResultModal' }).props('message') as string
    expect(message).not.toContain('themselves')
  })
})
