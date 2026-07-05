/**
 * RED — dunning (past-due) rejection UX on the composed-start flow
 * (issue #255 / MR !243).
 *
 * Backend contract (ocf-core !274): when a past_due subscription exceeds its
 * grace period, POST /terminals/start-composed-session rejects with HTTP 402,
 * body shaped like the budget rejections but with a STRING error_code:
 *   { error_code: 'subscription_past_due', error_message, source: 'dunning' }
 *
 * Desired behavior (pinned loosely, mirroring the budget-rejection tests): the
 * launcher must render a DEDICATED dunning treatment — a confirm dialog offering
 * the subscription dashboard, NOT the generic launch-error toast — and, on
 * confirm, navigate to /subscription-dashboard so the user can settle the
 * overdue invoice. (We pin the route target + that it's distinguishable from the
 * generic error, not the exact copy — the fix adds new i18n keys.)
 *
 * EXPECTED STATE against current code: RED — a 402 falls through every branch of
 * the launch catch to the generic `else`, which shows a plain error toast (level
 * 'error', title = terminalStarter.errorStarting) and never routes anywhere.
 *
 * The #guard test pins that 403 source=budget STILL renders the existing budget
 * confirm dialog unchanged (GREEN today, must stay green once dunning is added).
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

// Capture every toast / confirm the component renders so we can assert on the
// visible level + copy, not just "the spy was called". confirmReturn decides
// whether the user clicks Confirm.
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
  usageMetrics: [] as any[],
  getCurrentSubscription: vi.fn().mockResolvedValue(undefined),
  getUsageMetrics: vi.fn().mockResolvedValue([]),
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

describe('TerminalStarter — dunning (past-due) rejection handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderedToasts.length = 0
    confirmReturn = false
    routerPushMock.mockResolvedValue(undefined)
    mockGetSessionOptions.mockClear()
  })

  it('renders a dedicated dunning dialog (not the generic launch error) and routes to the dashboard on confirm', async () => {
    // Backend rejects the composed start with the 402 dunning contract.
    mockStartComposed.mockRejectedValueOnce({
      response: {
        status: 402,
        data: {
          error_code: 'subscription_past_due', // STRING, unlike numeric budget codes
          error_message: 'Subscription payment is past due',
          source: 'dunning'
        }
      }
    })
    confirmReturn = true

    const wrapper = mountStarter()
    await flushPromises()
    await launchSession(wrapper)

    // Distinguishable from the generic launch-error toast: it's a confirm
    // dialog (the dunning treatment offers the dashboard), mirroring how a
    // budget rejection surfaces — NOT a plain error toast.
    expect(renderedToasts.length).toBe(1)
    expect(renderedToasts[0].level).toBe('confirm')

    // The dialog's action target is the subscription dashboard, where the user
    // settles the overdue invoice. (Route target, not styling.)
    expect(routerPushMock).toHaveBeenCalledWith('/subscription-dashboard')
  })

  it('[guard] a 403 source=budget rejection still renders the existing budget dialog unchanged', async () => {
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

    const wrapper = mountStarter()
    await flushPromises()
    await launchSession(wrapper)

    expect(renderedToasts.length).toBe(1)
    const toast = renderedToasts[0]
    expect(toast.level).toBe('confirm')
    // Budget copy is unchanged — adding dunning must not hijack the budget path.
    expect(toast.title).toBe("You've reached your plan's session limit")
  })
})
