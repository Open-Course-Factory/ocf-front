/**
 * A blocked learner is told why (#384).
 *
 * Starting, resuming or launching while blocked is refused by ocf-core with
 * 403 { error_message: "session_start_blocked", scope: "group"|"org"|"global",
 * reason }. The learner sees one error naming the scope and the trainer's
 * reason, in their language — not the raw code, not the generic limit copy.
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

// Shaped like a real Pinia store (refs inside a reactive): storeToRefs reads
// every raw property, so a plain object holding null crashes it.
vi.mock('../../src/stores/organizations', async () => {
  const { reactive, ref } = await import('vue')
  return {
    useOrganizationsStore: () => reactive({
      currentOrganization: ref(null),
      currentOrganizationId: ref(null),
      loadOrganizations: vi.fn().mockResolvedValue(undefined),
    })
  }
})

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

const BLOCKED = {
  response: {
    status: 403,
    data: { error_message: 'session_start_blocked', scope: 'group', reason: 'Exam in progress' }
  }
}

describe('TerminalStarter — a blocked learner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderedToasts.length = 0
    confirmReturn = false
  })

  it('names the class and gives the reason', async () => {
    mockStartComposed.mockRejectedValueOnce(BLOCKED)

    const wrapper = mountStarter()
    await flushPromises()
    await launchSession(wrapper)

    expect(renderedToasts).toHaveLength(1)
    const shown = `${renderedToasts[0].title ?? ''} ${renderedToasts[0].message}`
    expect(renderedToasts[0].level).toBe('error')
    expect(shown).toContain('Exam in progress')
    expect(shown).toMatch(/class/i)
    expect(shown).not.toContain('session_start_blocked')
  })
})
