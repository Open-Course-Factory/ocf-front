/**
 * A run on a machine in the learner's browser: the page starts the machine's
 * agent as soon as it knows the run, before the console opens (the run is
 * built through it while the console is held), and stops it on leaving.
 *
 * (Harness copied from TerminalSessionView-persistenceMode.test.ts.)
 *
 *
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mocks (must come before component import) ----

const mockAxiosGet = vi.fn()
const mockAxiosPost = vi.fn().mockResolvedValue({ data: {} })

vi.mock('axios', () => ({
  default: {
    get: (...args: any[]) => mockAxiosGet(...args),
    post: (...args: any[]) => mockAxiosPost(...args),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

const mockRouterPush = vi.fn()
const route = vi.hoisted(() => ({ sessionId: 'local-abc' }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: route.sessionId }, query: {} }),
  useRouter: () => ({ push: mockRouterPush }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
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

vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getSessionByTerminal: vi.fn().mockResolvedValue({ id: 'run-1', status: 'active', terminal_session_id: 'local-abc' }),
    abandonSession: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    startSession: vi.fn().mockResolvedValue({}),
    stopSession: vi.fn().mockResolvedValue({}),
    deleteSession: vi.fn().mockResolvedValue({}),
    syncSession: vi.fn().mockResolvedValue({})
  }
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    userId: 'u-test',
    userName: 'test',
    userDisplayName: 'Test',
    userEmail: 'test@example.com',
    userRoles: ['Member'],
    secretToken: 'tok'
  })
}))

const agent = vi.hoisted(() => ({ stop: vi.fn(), start: vi.fn() }))
vi.mock('../../src/services/domain/terminal/localMachine', () => ({
  isLocalSessionId: (id: string) => id.startsWith('local-'),
  startLocalAgent: (...args: unknown[]) => { agent.start(...args); return { stop: agent.stop } }
}))

import TerminalSessionView from '../../src/components/Pages/TerminalSessionView.vue'

const PanelStub = {
  name: 'TerminalSessionPanel',
  props: ['sessionInfo', 'machine', 'showExposedPorts'],
  template: '<div class="tsp-stub" :data-machine="machine" :data-exposed="String(showExposedPorts)"></div>'
}

function mountView() {
  setActivePinia(createPinia())
  return mount(TerminalSessionView, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: { TerminalSessionPanel: PanelStub, ScenarioPanel: true, CommandHistory: true, BaseModal: true,
        'router-link': { props: ['to'], template: '<a><slot /></a>' } }
    }
  })
}

describe('TerminalSessionView on a local machine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAxiosGet.mockImplementation(async (url: string) => url === '/terminals/user-sessions'
      ? { data: [{ session_id: route.sessionId, state: 'running', expires_at: new Date(Date.now() + 3_600_000).toISOString() }] }
      : { data: {} })
  })

  it('starts the agent of the run with the learner token, and stops it on leaving', async () => {
    route.sessionId = 'local-abc'
    const wrapper = mountView()
    await flushPromises()

    expect(agent.start).toHaveBeenCalledWith('run-1', 'tok')
    const panel = wrapper.find('.tsp-stub')
    expect(panel.attributes('data-machine')).toBe('local')
    expect(panel.attributes('data-exposed')).toBe('false')

    wrapper.unmount()
    expect(agent.stop).toHaveBeenCalled()
  })

  it('starts no agent for a container', async () => {
    route.sessionId = 'sess-incus'
    const wrapper = mountView()
    await flushPromises()

    expect(agent.start).not.toHaveBeenCalled()
    expect(wrapper.find('.tsp-stub').attributes('data-machine')).toBe('incus')
  })
})
