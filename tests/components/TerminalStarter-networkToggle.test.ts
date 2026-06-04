/**
 * Tests for the opt-in network (internet egress) toggle on TerminalStarter.
 *
 * Covers the payload contract for the composed-session request:
 *   - features.network always mirrors the toggle (false by default, true when on).
 *   - packages are omitted when network is off (input is cleared + gated).
 *   - packages are included when network is on and the user typed some.
 *
 * Mirrors the harness in TerminalStarter-persistenceToggle.test.ts. The only
 * difference is the SessionComposer stub exposes `networkAllowed: true` so the
 * network fieldset renders (TerminalStarter drives it via composerRef).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mocks (must come before component import) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

const mockStartComposed = vi.fn().mockResolvedValue({
  session_id: 'sess-test',
  console_url: '',
  expires_at: '',
  status: 'active'
})
const mockGetDistributions = vi.fn().mockResolvedValue([])
const mockGetSessionOptions = vi.fn().mockResolvedValue({
  distribution: { name: 'ubuntu', prefix: 'u', description: '', is_global: true },
  allowed_sizes: [],
  allowed_features: []
})
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    startComposedSession: (...args: any[]) => mockStartComposed(...args),
    getDistributions: (...args: any[]) => mockGetDistributions(...args),
    getSessionOptions: (...args: any[]) => mockGetSessionOptions(...args),
    startSession: vi.fn(),
    stopSession: vi.fn(),
    deleteSession: vi.fn()
  }
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn()
  })
}))

const subscriptionsStub = {
  currentSubscription: { subscription_plan: { data_persistence_enabled: false } } as any,
  usageMetrics: [] as any[],
  getCurrentSubscription: vi.fn().mockResolvedValue(undefined),
  getUsageMetrics: vi.fn().mockResolvedValue([]),
  checkUsageLimit: vi.fn().mockResolvedValue({ allowed: true })
}
vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => subscriptionsStub
}))

vi.mock('../../src/stores/terminalMetrics', () => ({
  useTerminalMetricsStore: () => ({
    metrics: null,
    refreshMetrics: vi.fn()
  })
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    currentOrganization: null,
    currentOrganizationId: null,
    loadOrganizations: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('../../src/stores/terminalBackends', () => ({
  useTerminalBackendsStore: () => ({
    backends: [],
    selectedBackendId: '',
    selectedBackend: null,
    hasMultipleBackends: false,
    selectBackend: vi.fn(),
    fetchBackends: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    getMaxConcurrentTerminals: 5
  })
}))

vi.mock('../../src/stores/userSettings', () => ({
  useUserSettingsStore: () => ({
    settings: { recording_acknowledged_at: '2026-01-01T00:00:00Z' },
    loadSettings: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn().mockResolvedValue(undefined)
  })
}))

import TerminalStarter from '../../src/components/Terminal/TerminalStarter.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

/**
 * Mount TerminalStarter with the SessionComposer stubbed. `networkAllowed`
 * controls whether the network fieldset renders in TerminalAdvancedOptions
 * (the parent passes it through as `network-plan-enabled`).
 */
function mountStarter(networkAllowed = true) {
  setActivePinia(createPinia())
  return mount(TerminalStarter, {
    props: {},
    global: {
      plugins: [createTestI18n()],
      stubs: {
        SessionComposer: {
          name: 'SessionComposer',
          template: '<div data-testid="session-composer-stub" />',
          setup(_props, { expose }) {
            expose({
              isReady: true,
              selectedDistribution: { name: 'ubuntu', prefix: 'u' },
              selectedSize: { key: 'xs' },
              enabledFeatures: {},
              networkAllowed,
              loadingOptions: false,
              loadDistributions: vi.fn(),
              saveLastConfig: vi.fn()
            })
            return {}
          }
        },
        TerminalUsagePanel: true,
        SettingsCard: { template: '<div><slot name="headerActions" /><slot /></div>' },
        Button: {
          inheritAttrs: false,
          template: '<button data-testid="launch-btn" v-bind="$attrs"><slot /></button>'
        },
        BaseModal: true,
        'router-link': { template: '<a><slot /></a>' }
      }
    }
  })
}

describe('TerminalStarter — network toggle payload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('sends features.network = false by default and omits packages', async () => {
    const wrapper = mountStarter()
    await flushPromises()

    await launchSession(wrapper)

    expect(mockStartComposed).toHaveBeenCalledTimes(1)
    const payload = mockStartComposed.mock.calls[0][0]
    expect(payload.features.network).toBe(false)
    expect(payload.packages).toBeUndefined()
  })

  it('sends features.network = true after the user turns internet on', async () => {
    const wrapper = mountStarter()
    await flushPromises()

    const networkOn = wrapper.find('[data-testid="network-on"]')
    expect(networkOn.exists()).toBe(true)
    await networkOn.trigger('change')

    await launchSession(wrapper)

    const payload = mockStartComposed.mock.calls[0][0]
    expect(payload.features.network).toBe(true)
  })

  it('includes packages only when network is on and packages were typed', async () => {
    const wrapper = mountStarter()
    await flushPromises()

    // Turn network on so the packages input is rendered + accepted.
    await wrapper.find('[data-testid="network-on"]').trigger('change')

    const packagesInput = wrapper.find('input#packages')
    expect(packagesInput.exists()).toBe(true)
    await packagesInput.setValue('git, curl')

    await launchSession(wrapper)

    const payload = mockStartComposed.mock.calls[0][0]
    expect(payload.features.network).toBe(true)
    expect(payload.packages).toEqual(['git', 'curl'])
  })

  it('clears typed packages and omits them when the user turns network back off', async () => {
    const wrapper = mountStarter()
    await flushPromises()

    // On → type packages → back off. Turning off clears the input, so the
    // packages must not leak into the payload.
    await wrapper.find('[data-testid="network-on"]').trigger('change')
    await wrapper.find('input#packages').setValue('git, curl')
    await wrapper.find('[data-testid="network-off"]').trigger('change')

    await launchSession(wrapper)

    const payload = mockStartComposed.mock.calls[0][0]
    expect(payload.features.network).toBe(false)
    expect(payload.packages).toBeUndefined()
  })

  it('does not render the network fieldset when the plan disallows network', async () => {
    const wrapper = mountStarter(false)
    await flushPromises()

    expect(wrapper.find('[data-testid="network-toggle"]').exists()).toBe(false)
  })
})

// ---- Helpers ----

function findLaunchButton(wrapper: VueWrapper) {
  return wrapper.find('.launch-section [data-testid="launch-btn"]')
}

async function launchSession(wrapper: VueWrapper) {
  const launchBtn = findLaunchButton(wrapper)
  expect(launchBtn.exists()).toBe(true)
  await launchBtn.trigger('click')
  await flushPromises()
}
