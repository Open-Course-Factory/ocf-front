/**
 * A blocked learner is told why (#384).
 *
 * Starting, resuming or launching while blocked is refused by ocf-core with
 * 403 { error_message: "session_start_blocked", scope: "group"|"org"|"global",
 * reason }. The learner sees one error naming the scope and the trainer's
 * reason, in their language — not the raw code, not the generic limit copy.
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

const SCENARIO = { id: 'sc1', name: 'Intro', launchable: true }

describe('ScenarioLauncher — a blocked learner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('names the scope and gives the reason when the launch is refused', async () => {
    launchScenarioMock.mockRejectedValue({
      response: {
        status: 403,
        data: { error_message: 'session_start_blocked', scope: 'org', reason: 'Unpaid invoice' }
      }
    })

    const wrapper = mountLauncher()
    await flushPromises()

    await (wrapper.vm as any).handleLaunchScenario(SCENARIO)
    await flushPromises()

    expect(showErrorSpy).toHaveBeenCalledTimes(1)
    const shown = showErrorSpy.mock.calls[0].map(String).join(' ')
    expect(shown).toContain('Unpaid invoice')
    expect(shown).toMatch(/organi[sz]ation/i)
    expect(shown).not.toContain('session_start_blocked')
  })
})
