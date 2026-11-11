/**
 * The capacity indicator asks about the server the launch would use: the one
 * the user chose, in the organization they work in. Without them, ocf-core
 * would answer for the default server, which a launch may never touch.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }), delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

const checkCapacity = vi.fn().mockResolvedValue({ status: 'ok', reason: '' })
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    startComposedSession: vi.fn(), getDistributions: vi.fn().mockResolvedValue([]),
    getSessionOptions: vi.fn().mockResolvedValue({ allowed_sizes: [], allowed_features: [] }),
    checkCapacity: (...args: unknown[]) => checkCapacity(...args),
    startSession: vi.fn(), stopSession: vi.fn(), deleteSession: vi.fn(),
  },
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn(), showError: vi.fn(), showSuccess: vi.fn(), showInfo: vi.fn(),
    showWarning: vi.fn(), showMessage: vi.fn(), showAlert: vi.fn(), showPrompt: vi.fn(),
  }),
}))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    currentSubscription: { subscription_plan: { data_persistence_enabled: false } },
    usageMetrics: [], getCurrentSubscription: vi.fn().mockResolvedValue(undefined),
    getUsageMetrics: vi.fn().mockResolvedValue([]), checkUsageLimit: vi.fn().mockResolvedValue({ allowed: true }),
  }),
}))

vi.mock('../../src/stores/organizations', async () => {
  const { reactive, ref } = await import('vue')
  return {
    useOrganizationsStore: () => reactive({
      currentOrganization: ref({ id: 'org-1' }),
      currentOrganizationId: ref('org-1'),
      loadOrganizations: vi.fn().mockResolvedValue(undefined),
    }),
  }
})

vi.mock('../../src/stores/terminalBackends', () => ({
  useTerminalBackendsStore: () => ({
    backends: [], selectedBackendId: 'spare', selectedBackend: null, hasMultipleBackends: true,
    selectBackend: vi.fn(), fetchBackends: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../src/stores/userSettings', () => ({
  useUserSettingsStore: () => ({
    settings: { recording_acknowledged_at: '2026-01-01T00:00:00Z' },
    loadSettings: vi.fn().mockResolvedValue(undefined), updateSettings: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import TerminalStarter from '../../src/components/Terminal/TerminalStarter.vue'

describe('TerminalStarter — capacity indicator target', () => {
  afterEach(() => vi.useRealTimers())

  it('asks about the chosen server in the current organization', async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    mount(TerminalStarter, {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
        stubs: {
          SessionComposer: {
            name: 'SessionComposer',
            template: '<div />',
            setup(_props, { expose }) {
              expose({
                isReady: true, selectedDistribution: { name: 'ubuntu', prefix: 'u' }, selectedSize: { key: 'l' },
                enabledFeatures: {}, loadingOptions: false, loadDistributions: vi.fn(), saveLastConfig: vi.fn(),
              })
              return {}
            },
          },
          TerminalAdvancedOptions: true, TerminalUsagePanel: true, BaseModal: true,
          SettingsCard: { template: '<div><slot name="headerActions" /><slot /></div>' },
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()
    await vi.advanceTimersByTimeAsync(350)
    await flushPromises()

    expect(checkCapacity).toHaveBeenCalledWith('ubuntu', 'l', 'spare', 'org-1')
  })
})
