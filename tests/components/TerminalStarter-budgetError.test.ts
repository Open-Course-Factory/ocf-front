/**
 * Tests for budget-mode 403 error handling in TerminalStarter (MR-FRONT-A).
 *
 * Covers:
 *   - When the launch request rejects with 403 + source='budget', the
 *     starter shows a budget-specific confirm dialog (not the generic error
 *     toast) and refreshes session-options to refresh the per-size badges.
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

const showConfirmMock = vi.fn().mockResolvedValue(false)
const showErrorMock = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: showConfirmMock,
    showError: showErrorMock,
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
    showConfirmMock.mockResolvedValue(false)
    routerPushMock.mockResolvedValue(undefined)
    mockGetSessionOptions.mockClear()
  })

  it('shows a budget-specific confirm dialog on 403 with source=budget', async () => {
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

    // Should not have shown the generic error toast.
    expect(showErrorMock).not.toHaveBeenCalled()
    // Should have shown the budget-specific confirm dialog.
    expect(showConfirmMock).toHaveBeenCalledTimes(1)
    // Should have refreshed session-options to refresh per-size badges.
    expect(mockGetSessionOptions).toHaveBeenCalled()
  })

  it('navigates to /subscription-dashboard when the user confirms the dialog', async () => {
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
    showConfirmMock.mockResolvedValueOnce(true)

    const wrapper = mountStarter()
    await flushPromises()
    await launchSession(wrapper)

    expect(routerPushMock).toHaveBeenCalledWith('/subscription-dashboard')
  })

  it('shows the "plan restriction" error (no budget refresh) when reason=plan_restriction', async () => {
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

    // plan_restriction uses showError (size not in plan — informational), not
    // the confirm dialog with "View my usage".
    expect(showErrorMock).toHaveBeenCalledTimes(1)
    expect(showConfirmMock).not.toHaveBeenCalled()
    // No session-options refresh on plan_restriction (the budget didn't change).
    expect(mockGetSessionOptions).not.toHaveBeenCalled()
  })
})
