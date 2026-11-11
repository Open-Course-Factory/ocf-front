/**
 * A card the backend cannot resolve says why. A server the trainer chose that
 * this learner may not use has its own words: it is neither an offline server
 * nor a scenario nothing fits.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useRoute: () => ({ query: {} }),
}))

const showErrorSpy = vi.fn()
const showConfirmSpy = vi.fn().mockResolvedValue(true)
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: showErrorSpy,
    showConfirm: showConfirmSpy,
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn(),
  })
}))

const launchScenarioMock = vi.fn()
const listScenariosMock = vi.fn()
const getMySessionsMock = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    listScenarios: (...args: any[]) => listScenariosMock(...args),
    getMyScenarioSessions: (...args: any[]) => getMySessionsMock(...args),
    launchScenario: (...args: any[]) => launchScenarioMock(...args),
    abandonSession: vi.fn().mockResolvedValue(undefined),
  },
  pollProvisioningStatus: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    getSessionOptions: vi.fn().mockResolvedValue({ allowed_sizes: [] }),
    getSizes: vi.fn().mockResolvedValue([]),
  }
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({ currentOrganization: null })
}))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({ currentSubscription: null })
}))

// The catalogue's authoring controls (Import, the access rule behind them)
// pull in the router and the membership stores; a learner's view is tested here.
vi.mock('../../src/composables/useScenarioEditorAccess', async () => {
  const { ref } = await import('vue')
  return { useScenarioEditorAccess: () => ({ canAccessScenarioEditor: ref(false) }) }
})
vi.mock('../../src/components/ScenarioEditor/ScenarioImportButton.vue', () => ({
  default: { template: '<button />' }
}))

import ScenarioLauncher from '../../src/components/Pages/ScenarioLauncher.vue'

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

function mountLauncher() {
  return mount(ScenarioLauncher, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        AdminBadge: true,
        ScenarioProvisioningOverlay: true,
        'router-link': { props: ['to'], template: '<a><slot /></a>' },
      }
    }
  })
}

const BLOCKED = { id: 'sc-srv', name: 'lab', title: 'Lab', launchable: false, block_reason: 'server_not_allowed' }

describe('ScenarioLauncher — server not allowed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listScenariosMock.mockResolvedValue([BLOCKED])
    getMySessionsMock.mockResolvedValue([])
  })

  it('says the chosen server is not available to the learner', async () => {
    const wrapper = mountLauncher()
    await flushPromises()
    expect(wrapper.text()).toContain('The server chosen for this scenario is not available to you.')
    expect(wrapper.text()).toContain('Ask your trainer to choose another server, or Automatic.')
  })
})
