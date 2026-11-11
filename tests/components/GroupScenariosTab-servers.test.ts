/**
 * The class's scenario tab and the servers a run is built on:
 * - the assign dialog opens once the organization's servers are loaded, so the
 *   server choice is there from the start instead of pushing its buttons down;
 * - "start for the class" opens on the server the assignment names.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

const getGroupAssignments = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getGroupAssignments: (...a: any[]) => getGroupAssignments(...a),
    getAssignmentsProgress: vi.fn().mockResolvedValue([]),
    listGroupAvailableScenarios: vi.fn().mockResolvedValue([]),
  },
}))

let releaseBackends: (servers: unknown[]) => void = () => {}
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    getBackends: () => new Promise(resolve => { releaseBackends = resolve }),
  },
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

async function mountTab() {
  const wrapper = mount(GroupScenariosTab, {
    props: { groupId: 'g1', organizationId: 'org-1', canEditGroup: true },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        ScenarioUploadModal: true, ScenarioJSONImportModal: true, AssignScenarioModal: true,
        BulkStartScenarioModal: true, ScenarioAssignmentResultModal: true, RemoveAssignmentConfirmModal: true,
        ResetAssignmentModal: true, SessionDetailModal: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('GroupScenariosTab — servers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getGroupAssignments.mockResolvedValue([{ ...ASSIGNMENT }])
  })

  it('opens the assign dialog only once the servers are loaded', async () => {
    const wrapper = await mountTab()
    const dialog = () => wrapper.findComponent({ name: 'AssignScenarioModal' })

    await wrapper.findAll('button').find(b => b.text().includes('Assign'))!.trigger('click')
    await flushPromises()
    expect(dialog().props('visible')).toBe(false)

    releaseBackends(servers)
    await flushPromises()
    expect(dialog().props('visible')).toBe(true)
    expect(dialog().props('backends')).toHaveLength(2)
  })

  it('opens "start for the class" on the server the assignment names', async () => {
    const wrapper = await mountTab()
    wrapper.findComponent({ name: 'AssignmentCard' }).vm.$emit('bulk-start')
    releaseBackends(servers)
    await flushPromises()
    expect(useTerminalBackendsStore().selectedBackendId).toBe('spare')
  })
})
