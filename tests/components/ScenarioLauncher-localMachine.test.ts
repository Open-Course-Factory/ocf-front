/**
 * A local run is built through its agent, which the run page starts: the
 * launcher waiting for the build before opening that page would wait forever.
 * (Harness from ScenarioLauncher-dunningLaunch.test.ts.)
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
const pollMock = vi.fn().mockResolvedValue(undefined)
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    listScenarios: vi.fn().mockResolvedValue([]),
    getMyScenarioSessions: vi.fn().mockResolvedValue([]),
    launchScenario: (...args: any[]) => launchScenarioMock(...args),
    abandonSession: vi.fn().mockResolvedValue(undefined),
  },
  pollProvisioningStatus: (...args: any[]) => pollMock(...args),
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

describe('ScenarioLauncher — a run on a machine in the browser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('opens the run page while the run is still being built: the build runs in that page', async () => {
    launchScenarioMock.mockResolvedValue({
      scenario_session_id: 'run-1', terminal_session_id: 'local-1', status: 'provisioning',
      provisioning_phase: 'setup_script', machine: 'local',
    })
    const wrapper = mountLauncher()
    await flushPromises()
    await (wrapper.vm as any).handleLaunchScenario(SCENARIO)
    await flushPromises()

    expect(pollMock).not.toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'local-1' } })
  })

  it('still waits for a container to be built before opening it', async () => {
    launchScenarioMock.mockResolvedValue({
      scenario_session_id: 'run-2', terminal_session_id: 'sess-2', status: 'provisioning',
      provisioning_phase: 'setup_script', machine: 'incus',
    })
    const wrapper = mountLauncher()
    await flushPromises()
    await (wrapper.vm as any).handleLaunchScenario(SCENARIO)
    await flushPromises()

    expect(pollMock).toHaveBeenCalledTimes(1)
  })
})
