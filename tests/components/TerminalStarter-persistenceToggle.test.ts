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
// Form validity is now owned by the composer (isReady) — no usageMetrics gate.
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
        // TerminalAdvancedOptions now hosts the persistence-mode radio, so we
        // render the real component (not a stub) and rely on the v-show DOM
        // (radios are still in the DOM, just visually hidden, when the section
        // is collapsed — find() still works).
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

    it('forces persistence_mode to ephemeral in the payload regardless of stale localStorage', async () => {
      // localStorage is no longer consulted for persistence_mode, but old
      // installs may still hold a value. crash_traps must win regardless.
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
    it('defaults to persistence_mode = persistent for paid tiers (better UX out of the box)', async () => {
      setPaidPlan(true)
      const wrapper = mountStarter()
      await flushPromises()

      await launchSession(wrapper)

      expect(mockStartComposed).toHaveBeenCalledTimes(1)
      const payload = mockStartComposed.mock.calls[0][0]
      expect(payload.persistence_mode).toBe('persistent')
    })

    it('includes persistence_mode = ephemeral after the user selects it', async () => {
      setPaidPlan(true)
      const wrapper = mountStarter()
      await flushPromises()

      // Click the ephemeral radio (mark it checked, fire change).
      const ephemeral = wrapper.find('[data-testid="persistence-ephemeral"]')
      await ephemeral.setValue(true)
      await ephemeral.trigger('change')

      await launchSession(wrapper)

      const payload = mockStartComposed.mock.calls[0][0]
      expect(payload.persistence_mode).toBe('ephemeral')
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

  describe('persistence is never sticky (no localStorage round-trip)', () => {
    // We intentionally do NOT persist persistence_mode across launcher mounts.
    // Sticky behavior surprised users: picking 'ephemeral' for one run would
    // silently apply to the next launch. The plan-aware default ('persistent'
    // when the plan allows it) wins every mount.

    it('defaults to persistent on mount even when localStorage holds ephemeral from a previous session', async () => {
      // Reproduces the reported bug shape: the previous launcher run wrote
      // `persistence_mode: 'ephemeral'` to LAST_CONFIG_KEY. The next mount
      // must ignore that and start on 'persistent' because the plan allows it.
      localStorage.setItem(
        'ocf-last-session-config',
        JSON.stringify({ persistence_mode: 'ephemeral', distribution: 'ubuntu', size: 's' })
      )
      setPaidPlan(true)

      const wrapper = mountStarter()
      await flushPromises()

      const persistent = wrapper.find<HTMLInputElement>('[data-testid="persistence-persistent"]')
      const ephemeral = wrapper.find<HTMLInputElement>('[data-testid="persistence-ephemeral"]')
      expect(persistent.element.checked).toBe(true)
      expect(ephemeral.element.checked).toBe(false)
    })

    it('does not write persistence_mode to localStorage when the user toggles the radio', async () => {
      setPaidPlan(true)
      const wrapper = mountStarter()
      await flushPromises()

      // User flips to ephemeral for this run only.
      const ephemeral = wrapper.find('[data-testid="persistence-ephemeral"]')
      await ephemeral.setValue(true)
      await ephemeral.trigger('change')

      const stored = JSON.parse(localStorage.getItem('ocf-last-session-config') ?? '{}')
      expect(stored).not.toHaveProperty('persistence_mode')
    })
  })

  describe('form validity is owned by the composer + backend, not by usageMetrics', () => {
    it('keeps the launch button enabled regardless of usageMetrics contents (composer gate only)', async () => {
      // The CPU/RAM budget engine on the backend is the sole authoritative
      // cap; no front-end metric gates the form. The launch button must stay
      // enabled whenever the composer is ready and the launcher is not
      // already starting — even if usageMetrics is empty or stale.
      setPaidPlan(true)
      const wrapper = mountStarter()
      await flushPromises()

      const launchBtn = findLaunchButton(wrapper)
      expect(launchBtn.attributes('disabled')).toBeUndefined()
    })
  })
})

// ---- Helpers ----

/**
 * Find the actual launch button. The Button stub hardcodes data-testid for
 * every Button instance, and TerminalAdvancedOptions now renders a Reset
 * Button before the launch section — so we scope the lookup to the launch
 * section to avoid hitting the Reset button.
 */
function findLaunchButton(wrapper: VueWrapper) {
  return wrapper.find('.launch-section [data-testid="launch-btn"]')
}

async function launchSession(wrapper: VueWrapper) {
  const launchBtn = findLaunchButton(wrapper)
  expect(launchBtn.exists()).toBe(true)
  await launchBtn.trigger('click')
  await flushPromises()
}
