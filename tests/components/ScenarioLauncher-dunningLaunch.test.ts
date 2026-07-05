/**
 * RED — dunning (past-due) rejection UX on the scenario-launch flow
 * (issue #255 / MR !243).
 *
 * A scenario launch calls StartComposedSession server-side, so the same 402
 * dunning contract { error_code: 'subscription_past_due', source: 'dunning' }
 * surfaces on POST /scenario-sessions/start. Today ScenarioLauncher's launch
 * catch just does `showError(error_message || launchError)` — the raw backend
 * text, with no route to fix billing. Desired: a DEDICATED dunning treatment
 * offering the subscription dashboard (same contract as the other two flows),
 * pinned loosely on the route target.
 *
 * EXPECTED STATE against current code: RED — the raw English message is toasted
 * and nothing routes to the dashboard.
 *
 * The #guard pins that a NON-dunning launch error still surfaces as a plain
 * error toast with no dashboard redirect.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
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
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    listScenarios: vi.fn().mockResolvedValue([]),
    getMyScenarioSessions: vi.fn().mockResolvedValue([]),
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

const SCENARIO = { id: 'sc1', name: 'Intro', launchable: true }

describe('ScenarioLauncher — dunning (past-due) launch handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    showConfirmSpy.mockResolvedValue(true)
  })

  it('offers the subscription dashboard (not a raw error toast) on a 402 dunning launch', async () => {
    launchScenarioMock.mockRejectedValue({
      response: {
        status: 402,
        data: {
          error_code: 'subscription_past_due',
          error_message: 'Subscription payment is past due',
          source: 'dunning'
        }
      }
    })

    const wrapper = mountLauncher()
    await flushPromises()

    await (wrapper.vm as any).handleLaunchScenario(SCENARIO)
    await flushPromises()

    // Dedicated dunning treatment routes to the dashboard to settle billing.
    expect(mockRouterPush).toHaveBeenCalledWith('/subscription-dashboard')

    // The raw English backend message must NOT be surfaced as a plain toast.
    const errorArgs = showErrorSpy.mock.calls.map((c) => String(c[0]))
    expect(errorArgs).not.toContain('Subscription payment is past due')
  })

  it('[guard] a non-dunning launch error still surfaces a plain error toast, no dashboard redirect', async () => {
    launchScenarioMock.mockRejectedValue({
      response: {
        status: 500,
        data: { error_code: 500, error_message: 'Internal error' }
      }
    })

    const wrapper = mountLauncher()
    await flushPromises()

    await (wrapper.vm as any).handleLaunchScenario(SCENARIO)
    await flushPromises()

    expect(showErrorSpy).toHaveBeenCalledTimes(1)
    expect(mockRouterPush).not.toHaveBeenCalledWith('/subscription-dashboard')
  })
})
