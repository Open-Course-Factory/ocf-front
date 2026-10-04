/**
 * Import and export from the scenario catalogue.
 *
 * A teacher browsing Scenarios found no way to bring a KillerCoda lab in or
 * take one out. Whoever may author scenarios — the same rule as the editor's
 * menu entry — now gets an Import button in the page header, and a card the
 * user manages (the backend's `can_manage`) gets an Export menu. A learner's
 * catalogue is unchanged.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'

const routeQuery: Record<string, string> = {}
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ query: routeQuery }) }))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: vi.fn(), showConfirm: vi.fn(), showSuccess: vi.fn(), showInfo: vi.fn(),
    showWarning: vi.fn(), showMessage: vi.fn(), showAlert: vi.fn(), showPrompt: vi.fn(),
  })
}))

const canAccessScenarioEditor = ref(false)
vi.mock('../../src/composables/useScenarioEditorAccess', () => ({
  useScenarioEditorAccess: () => ({ canAccessScenarioEditor })
}))

const listScenariosMock = vi.fn()
const exportJSONMock = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    listScenarios: (...args: any[]) => listScenariosMock(...args),
    getMyScenarioSessions: vi.fn().mockResolvedValue([]),
  },
  teacherService: {
    exportScenarioJSON: (...args: any[]) => exportJSONMock(...args),
    exportScenarioArchive: vi.fn(),
  },
  pollProvisioningStatus: vi.fn(),
}))

const downloadJSONMock = vi.fn()
vi.mock('../../src/utils/download', () => ({
  downloadJSON: (...args: any[]) => downloadJSONMock(...args),
  downloadBlob: vi.fn(),
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({ currentOrganization: null })
}))
vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({ currentSubscription: null })
}))

// Its own spec covers it; here only its presence matters.
vi.mock('../../src/components/ScenarioEditor/ScenarioImportButton.vue', () => ({
  default: { template: '<button data-testid="scenario-import-btn">Import</button>' }
}))

import ScenarioLauncher from '../../src/components/Pages/ScenarioLauncher.vue'

function mountLauncher() {
  return mount(ScenarioLauncher, {
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false,
      })],
      stubs: {
        AdminBadge: true,
        ScenarioProvisioningOverlay: true,
        'router-link': { template: '<a><slot /></a>' },
      }
    }
  })
}

const MINE = { id: 'sc-mine', name: 'my-lab', title: 'My lab', launchable: true, can_manage: true }
const PUBLIC = { id: 'sc-public', name: 'public-lab', title: 'Public lab', launchable: true, can_manage: false }

function card(wrapper: ReturnType<typeof mountLauncher>, name: string) {
  return wrapper.find(`[data-testid="scenario-card"][data-scenario-name="${name}"]`)
}

describe('ScenarioLauncher — import and export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listScenariosMock.mockResolvedValue([MINE, PUBLIC])
  })

  it('offers Import to someone who may author scenarios', async () => {
    canAccessScenarioEditor.value = true
    const wrapper = mountLauncher()
    await flushPromises()
    expect(wrapper.find('[data-testid="scenario-import-btn"]').exists()).toBe(true)
  })

  it('shows a learner neither Import nor Export', async () => {
    canAccessScenarioEditor.value = false
    listScenariosMock.mockResolvedValue([{ ...PUBLIC }])
    const wrapper = mountLauncher()
    await flushPromises()
    expect(wrapper.find('[data-testid="scenario-import-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="scenario-export-btn"]').exists()).toBe(false)
  })

  it('offers Export only on the cards the user manages', async () => {
    canAccessScenarioEditor.value = true
    const wrapper = mountLauncher()
    await flushPromises()
    expect(card(wrapper, 'my-lab').find('[data-testid="scenario-export-btn"]').exists()).toBe(true)
    expect(card(wrapper, 'public-lab').find('[data-testid="scenario-export-btn"]').exists()).toBe(false)
  })

  it('downloads the managed scenario as JSON named after it', async () => {
    canAccessScenarioEditor.value = true
    exportJSONMock.mockResolvedValue({ title: 'My lab', steps: [] })
    const wrapper = mountLauncher()
    await flushPromises()

    const mine = card(wrapper, 'my-lab')
    await mine.find('[data-testid="scenario-export-btn"]').trigger('click')
    await mine.find('[data-testid="scenario-export-json"]').trigger('click')
    await flushPromises()

    expect(exportJSONMock).toHaveBeenCalledWith('sc-mine')
    expect(downloadJSONMock).toHaveBeenCalledWith({ title: 'My lab', steps: [] }, 'my-lab.json')
  })
})

// The editor's Play, on a scenario its author may launch but not preview, brings
// them to its card here: ?scenario=<id> picks it out.
describe('ScenarioLauncher — a card asked for in the URL', () => {
  it('marks the card the editor sent the author to', async () => {
    routeQuery.scenario = MINE.id
    listScenariosMock.mockResolvedValue([MINE])
    const wrapper = mountLauncher()
    await flushPromises()
    expect(wrapper.get(`[data-scenario-id="${MINE.id}"]`).classes()).toContain('scenario-card--focused')
    delete routeQuery.scenario
  })
})

