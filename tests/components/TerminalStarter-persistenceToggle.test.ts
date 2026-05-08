/**
 * Tests for the persistence-mode toggle on TerminalStarter.
 *
 * Covers MR-I scope:
 *   - Toggle hidden when plan.data_persistence_enabled !== true (free tier).
 *   - Toggle disabled and persistenceMode forced to 'ephemeral' when the active
 *     scenario has crash_traps=true.
 *   - Submitted payload contains persistence_mode for paid tiers; omits it for
 *     free tier.
 *   - Last choice persisted to localStorage and restored on mount.
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

// Stub the heavy stores so we can drive plan tier from each test.
const subscriptionsStub = {
  currentSubscription: { subscription_plan: { data_persistence_enabled: false } } as any,
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

function mountStarter(props: Record<string, unknown> = {}) {
  setActivePinia(createPinia())
  return mount(TerminalStarter, {
    props,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        // The composer pulls in network calls and a lot of UI; stub it here
        // and expose the bits the parent reads via composerRef.
        SessionComposer: {
          name: 'SessionComposer',
          template: '<div data-testid="session-composer-stub" />',
          setup(_props, { expose }) {
            expose({
              isReady: true,
              selectedDistribution: { name: 'ubuntu', prefix: 'u' },
              selectedSize: { key: 'xs' },
              enabledFeatures: {},
              loadingOptions: false,
              loadDistributions: vi.fn(),
              saveLastConfig: vi.fn()
            })
            return {}
          }
        },
        TerminalAdvancedOptions: true,
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

function setPaidPlan(enabled: boolean) {
  subscriptionsStub.currentSubscription = enabled
    ? { subscription_plan: { data_persistence_enabled: true } }
    : { subscription_plan: { data_persistence_enabled: false } }
}

describe('TerminalStarter — persistence toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Default to free tier — most tests opt into paid via setPaidPlan.
    setPaidPlan(false)
  })

  describe('plan-tier visibility', () => {
    it('hides the toggle entirely on the free tier (data_persistence_enabled = false)', async () => {
      setPaidPlan(false)
      const wrapper = mountStarter()
      await flushPromises()

      expect(wrapper.find('[data-testid="persistence-toggle"]').exists()).toBe(false)
    })

    it('hides the toggle when subscription / plan is unknown', async () => {
      subscriptionsStub.currentSubscription = null
      const wrapper = mountStarter()
      await flushPromises()

      expect(wrapper.find('[data-testid="persistence-toggle"]').exists()).toBe(false)
    })

    it('renders the toggle for paid tiers (data_persistence_enabled = true)', async () => {
      setPaidPlan(true)
      const wrapper = mountStarter()
      await flushPromises()

      expect(wrapper.find('[data-testid="persistence-toggle"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="persistence-ephemeral"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="persistence-persistent"]').exists()).toBe(true)
    })
  })

  describe('crash_traps locks the toggle', () => {
    it('disables both radios and shows the lock hint when activeScenario.crash_traps is true', async () => {
      setPaidPlan(true)
      const wrapper = mountStarter({ activeScenario: { crash_traps: true } })
      await flushPromises()

      const ephemeral = wrapper.find('[data-testid="persistence-ephemeral"]')
      const persistent = wrapper.find('[data-testid="persistence-persistent"]')

      expect(ephemeral.attributes('disabled')).toBeDefined()
      expect(persistent.attributes('disabled')).toBeDefined()
      expect(wrapper.find('[data-testid="persistence-locked-hint"]').exists()).toBe(true)
    })

    it('forces persistence_mode to ephemeral in the payload even if localStorage previously stored persistent', async () => {
      localStorage.setItem(
        'ocf-last-session-config',
        JSON.stringify({ persistence_mode: 'persistent' })
      )
      setPaidPlan(true)

      const wrapper = mountStarter({ activeScenario: { crash_traps: true } })
      await flushPromises()

      // Trigger the launch button → submits payload via terminalService.
      await launchSession(wrapper)

      expect(mockStartComposed).toHaveBeenCalledTimes(1)
      const payload = mockStartComposed.mock.calls[0][0]
      expect(payload.persistence_mode).toBe('ephemeral')
    })
  })

  describe('payload construction', () => {
    it('includes persistence_mode = ephemeral by default for paid tiers', async () => {
      setPaidPlan(true)
      const wrapper = mountStarter()
      await flushPromises()

      await launchSession(wrapper)

      expect(mockStartComposed).toHaveBeenCalledTimes(1)
      const payload = mockStartComposed.mock.calls[0][0]
      expect(payload.persistence_mode).toBe('ephemeral')
    })

    it('includes persistence_mode = persistent after the user selects it', async () => {
      setPaidPlan(true)
      const wrapper = mountStarter()
      await flushPromises()

      // Click the persistent radio (mark it checked, fire change).
      const persistent = wrapper.find('[data-testid="persistence-persistent"]')
      await persistent.setValue(true)
      await persistent.trigger('change')

      await launchSession(wrapper)

      const payload = mockStartComposed.mock.calls[0][0]
      expect(payload.persistence_mode).toBe('persistent')
    })

    it('omits persistence_mode entirely on the free tier (backend default applies)', async () => {
      setPaidPlan(false)
      const wrapper = mountStarter()
      await flushPromises()

      await launchSession(wrapper)

      const payload = mockStartComposed.mock.calls[0][0]
      expect(payload.persistence_mode).toBeUndefined()
    })
  })

  describe('localStorage persistence', () => {
    it('writes the chosen persistence_mode to ocf-last-session-config on change', async () => {
      setPaidPlan(true)
      const wrapper = mountStarter()
      await flushPromises()

      const persistent = wrapper.find('[data-testid="persistence-persistent"]')
      await persistent.setValue(true)
      await persistent.trigger('change')

      const stored = JSON.parse(localStorage.getItem('ocf-last-session-config') || '{}')
      expect(stored.persistence_mode).toBe('persistent')
    })

    it('restores the last-saved persistence_mode on mount', async () => {
      localStorage.setItem(
        'ocf-last-session-config',
        JSON.stringify({ persistence_mode: 'persistent' })
      )
      setPaidPlan(true)
      const wrapper = mountStarter()
      await flushPromises()

      // The persistent radio should be checked after mount.
      const persistent = wrapper.find<HTMLInputElement>('[data-testid="persistence-persistent"]')
      expect(persistent.element.checked).toBe(true)
    })

    it('falls back to ephemeral if the stored value is invalid JSON', async () => {
      localStorage.setItem('ocf-last-session-config', '{not valid json')
      setPaidPlan(true)
      const wrapper = mountStarter()
      await flushPromises()

      const ephemeral = wrapper.find<HTMLInputElement>('[data-testid="persistence-ephemeral"]')
      expect(ephemeral.element.checked).toBe(true)
    })
  })
})

// ---- Helpers ----

async function launchSession(wrapper: VueWrapper) {
  const launchBtn = wrapper.find('[data-testid="launch-btn"]')
  expect(launchBtn.exists()).toBe(true)
  await launchBtn.trigger('click')
  await flushPromises()
}
