/**
 * Tests for budget-mode 403 error handling in TerminalStarter (MR-FRONT-A).
 *
 * The previous version of this file asserted only that the notification
 * composable was called. That allowed a wrong i18n key (or a missing
 * translation) to slip through unnoticed: the spy fires either way. This
 * version captures the actual message + title that the component renders, so
 * tests fail when the wrong copy is shown.
 *
 * Covers:
 *   - When the launch request rejects with 403 + source='budget', the
 *     starter shows the size-count-agnostic budget confirm dialog (not the
 *     generic error toast) and refreshes session-options to refresh the
 *     per-size badges.
 *   - When `reason === 'plan_restriction'`, the starter shows the "size not
 *     in plan" copy and does NOT call getSessionOptions a second time.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
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
  session_id: 'unused',
  console_url: '',
  expires_at: '',
  status: 'active'
})
const mockGetSessionOptions = vi.fn().mockResolvedValue({
  distribution: { name: 'ubuntu', prefix: 'u', description: '', is_global: true },
  allowed_sizes: [
    { key: 'xs', name: 'XS', cpu: 1, cpu_allowance: '100%', memory: '1GiB', disk: '4GiB', processes: 100, sort_order: 0, allowed: true, remaining_count: 4 },
    { key: 'l', name: 'L', cpu: 4, cpu_allowance: '100%', memory: '4GiB', disk: '16GiB', processes: 200, sort_order: 0, allowed: true, remaining_count: 0 }
  ],
  allowed_features: [],
  quota: { max_cpu: 4, max_memory_mb: 4096, used_cpu: 4, used_memory_mb: 4096, remaining_cpu: 0, remaining_memory_mb: 0, scope: 'user' }
})
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    startComposedSession: (...args: any[]) => mockStartComposed(...args),
    getDistributions: vi.fn().mockResolvedValue([]),
    getSessionOptions: (...args: any[]) => mockGetSessionOptions(...args),
    checkCapacity: vi.fn().mockResolvedValue({ status: 'ok', reason: '' }),
    startSession: vi.fn(),
    stopSession: vi.fn(),
    deleteSession: vi.fn(),
  }
}))

/**
 * Captures every toast / confirm dialog the component renders so tests can
 * assert on the visible message + title (not just "the spy was called"). The
 * `confirmReturn` mailbox lets a test decide whether the user clicks
 * Confirm or Cancel.
 */
interface RenderedToast {
  level: 'confirm' | 'error' | 'success' | 'info' | 'warning' | 'message' | 'alert'
  message: string
  title?: string
}
const renderedToasts: RenderedToast[] = []
let confirmReturn = false

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: async (message: string, title?: string) => {
      renderedToasts.push({ level: 'confirm', message, title })
      return confirmReturn
    },
    showError: (message: string, title?: string) => {
      renderedToasts.push({ level: 'error', message, title })
    },
    showSuccess: (message: string, title?: string) => {
      renderedToasts.push({ level: 'success', message, title })
    },
    showInfo: (message: string, title?: string) => {
      renderedToasts.push({ level: 'info', message, title })
    },
    showWarning: (message: string, title?: string) => {
      renderedToasts.push({ level: 'warning', message, title })
    },
    showMessage: (message: string) => {
      renderedToasts.push({ level: 'message', message })
    },
    showAlert: async (message: string, title?: string) => {
      renderedToasts.push({ level: 'alert', message, title })
    },
    showPrompt: async () => null,
  })
}))

const subscriptionsStub = {
  currentSubscription: { subscription_plan: { data_persistence_enabled: false } } as any,
  usageMetrics: [
    { metric_type: 'concurrent_terminals', current_value: 0, limit_value: 5 }
  ] as any[],
  getCurrentSubscription: vi.fn().mockResolvedValue(undefined),
  getUsageMetrics: vi.fn().mockResolvedValue([
    { metric_type: 'concurrent_terminals', current_value: 0, limit_value: 5 }
  ]),
  checkUsageLimit: vi.fn().mockResolvedValue({ allowed: true })
}
vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => subscriptionsStub
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    currentOrganization: null,
    currentOrganizationId: null,
    loadOrganizations: vi.fn().mockResolvedValue(undefined),
  })
}))

vi.mock('../../src/stores/terminalBackends', () => ({
  useTerminalBackendsStore: () => ({
    backends: [],
    selectedBackendId: '',
    selectedBackend: null,
    hasMultipleBackends: false,
    selectBackend: vi.fn(),
    fetchBackends: vi.fn().mockResolvedValue(undefined),
  })
}))

vi.mock('../../src/stores/userSettings', () => ({
  useUserSettingsStore: () => ({
    settings: { recording_acknowledged_at: '2026-01-01T00:00:00Z' },
    loadSettings: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  })
}))

const routerPushMock = vi.fn().mockResolvedValue(undefined)
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushMock,
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
    fallbackWarn: false,
  })
}

function mountStarter(props: Record<string, unknown> = {}) {
  setActivePinia(createPinia())
  return mount(TerminalStarter, {
    props,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        // Stub composer with a ready-to-launch state pointing at ubuntu / l
        SessionComposer: {
          name: 'SessionComposer',
          template: '<div data-testid="session-composer-stub" />',
          setup(_props, { expose }) {
            expose({
              isReady: true,
              selectedDistribution: { name: 'ubuntu', prefix: 'u' },
              selectedSize: { key: 'l' },
              enabledFeatures: {},
              loadingOptions: false,
              loadDistributions: vi.fn(),
              saveLastConfig: vi.fn(),
            })
            return {}
          }
        },
        TerminalAdvancedOptions: true,
        TerminalUsagePanel: true,
        SettingsCard: { template: '<div><slot name="headerActions" /><slot /></div>' },
        Button: {
          inheritAttrs: false,
          template: '<button data-testid="launch-btn" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>'
        },
        BaseModal: true,
        'router-link': { template: '<a><slot /></a>' }
      }
    }
  })
}

async function launchSession(wrapper: VueWrapper<any>) {
  const btn = wrapper.find('[data-testid="launch-btn"]')
  await btn.trigger('click')
  await flushPromises()
  await flushPromises()
}

describe('TerminalStarter — budget error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderedToasts.length = 0
    confirmReturn = false
    routerPushMock.mockResolvedValue(undefined)
    mockGetSessionOptions.mockClear()
  })

  it('renders the budget confirm dialog (not the generic error toast) on 403 source=budget', async () => {
    mockStartComposed.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          error_code: 403,
          error_message: 'Budget exhausted',
          source: 'budget',
          reason: 'budget_cpu_exceeded',
          remaining: { cpu: 0, memory_mb: 0 }
        }
      }
    })

    const wrapper = mountStarter()
    await flushPromises()
    await launchSession(wrapper)

    // Exactly one toast, and it's a confirm — no generic error toast slipped through.
    expect(renderedToasts.length).toBe(1)
    const toast = renderedToasts[0]
    expect(toast.level).toBe('confirm')
    // The title carries the size-count-agnostic budget-exhausted headline.
    // We assert on the resolved English copy so a missing translation or a
    // renamed i18n key fails the test (the previous spy-call assertion would
    // have passed regardless).
    expect(toast.title).toBe("You've reached your plan's session limit")
    // The message carries the size-count-agnostic hint. We accept either
    // variant (summary vs. all-exhausted) because the session-options refresh
    // result decides which one renders.
    expect(toast.message).toMatch(/stop a (session|running session) to free capacity/i)
    // Session-options must be refreshed so the per-size badges reflect the
    // budget that just got exhausted.
    expect(mockGetSessionOptions).toHaveBeenCalled()
  })

  it('renders the "{summary} more sessions" hint when the refresh returns remaining capacity', async () => {
    // The post-rejection refresh returns an XS slot still available — the
    // hint must point the user at it ("You can still spawn: 4 XS …") instead
    // of the all-exhausted copy.
    mockStartComposed.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          error_code: 403,
          error_message: 'Budget exhausted',
          source: 'budget',
          reason: 'budget_memory_exceeded',
        }
      }
    })

    const wrapper = mountStarter()
    await flushPromises()
    await launchSession(wrapper)

    expect(renderedToasts.length).toBe(1)
    const toast = renderedToasts[0]
    expect(toast.level).toBe('confirm')
    // Default mock returns 4 XS available — the hint must include it.
    expect(toast.message).toContain('4 XS')
    expect(toast.message).toContain('launch')
    expect(toast.message.toLowerCase()).toContain('free capacity')
  })

  it('navigates to /subscription-dashboard when the user confirms the budget dialog', async () => {
    mockStartComposed.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          error_code: 403,
          error_message: 'Budget exhausted',
          source: 'budget',
          reason: 'budget_cpu_exceeded',
        }
      }
    })
    confirmReturn = true

    const wrapper = mountStarter()
    await flushPromises()
    await launchSession(wrapper)

    expect(routerPushMock).toHaveBeenCalledWith('/subscription-dashboard')
  })

  it('renders the plan-restriction error toast (no budget refresh) when reason=plan_restriction', async () => {
    mockStartComposed.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          error_code: 403,
          error_message: 'Plan restriction',
          source: 'budget',
          reason: 'plan_restriction'
        }
      }
    })

    const wrapper = mountStarter()
    await flushPromises()
    await launchSession(wrapper)

    // plan_restriction is a permission issue, not a live-budget issue: it must
    // render as an error toast (not the confirm dialog with "View my usage").
    expect(renderedToasts.length).toBe(1)
    const toast = renderedToasts[0]
    expect(toast.level).toBe('error')
    expect(toast.title).toBe('Size not in plan')
    expect(toast.message).toBe("This size isn't included in your plan")
    // No session-options refresh on plan_restriction (the live budget didn't
    // change — refreshing would mask the real cause).
    expect(mockGetSessionOptions).not.toHaveBeenCalled()
  })

  it('budget_cpu_exceeded and budget_memory_exceeded surface the same UX (collapsed reasons)', async () => {
    // First call: cpu reason
    mockStartComposed.mockRejectedValueOnce({
      response: { status: 403, data: { source: 'budget', reason: 'budget_cpu_exceeded' } }
    })
    let wrapper = mountStarter()
    await flushPromises()
    await launchSession(wrapper)
    const cpuToast = renderedToasts[renderedToasts.length - 1]
    expect(cpuToast.level).toBe('confirm')
    const cpuMessage = cpuToast.message
    const cpuTitle = cpuToast.title

    // Reset and repeat with memory reason
    renderedToasts.length = 0
    mockGetSessionOptions.mockClear()
    mockStartComposed.mockRejectedValueOnce({
      response: { status: 403, data: { source: 'budget', reason: 'budget_memory_exceeded' } }
    })
    wrapper = mountStarter()
    await flushPromises()
    await launchSession(wrapper)
    const memToast = renderedToasts[renderedToasts.length - 1]
    expect(memToast.level).toBe('confirm')

    // Both granular reasons must collapse to the same customer-facing copy —
    // the user shouldn't see "CPU" vs "memory" wording leak into the UI.
    expect(memToast.title).toBe(cpuTitle)
    expect(memToast.message).toBe(cpuMessage)
  })
})
