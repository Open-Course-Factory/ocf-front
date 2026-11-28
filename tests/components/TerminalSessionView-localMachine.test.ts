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
const mockRouterReplace = vi.fn()
const route = vi.hoisted(() => ({ sessionId: 'local-abc' }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: route.sessionId }, query: {} }),
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
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
    getSessionByTerminal: vi.fn().mockResolvedValue({ id: 'run-1', status: 'active', terminal_session_id: 'local-abc', session_user: 1000 }),
    abandonSession: vi.fn().mockResolvedValue(undefined),
    resumeSession: vi.fn().mockResolvedValue({ terminal_session_id: 'local-rebuilt' })
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

const agent = vi.hoisted(() => ({
  stop: vi.fn(), start: vi.fn(), consoleUser: vi.fn(), relay: vi.fn(), stopRelay: vi.fn(), run: vi.fn(),
  // What the machine booted as (null: a console), when it booted before this read of the run.
  booted: undefined as string[] | null | undefined
}))
vi.mock('../../src/services/domain/terminal/localMachine', () => ({
  startLocalAgent: (...args: unknown[]) => { agent.start(...args); return { stop: agent.stop } },
  setConsoleUser: (...args: unknown[]) => agent.consoleUser(...args),
  setMachineRun: async (terminal: string, run: { apps: string[] | null }) => { agent.run(terminal, run); return agent.booted === undefined ? run : { apps: agent.booted } },
  pasteOnDesktop: vi.fn(),
  serveConsoleRelay: (...args: unknown[]) => { agent.relay(...args); return agent.stopRelay }
}))

import TerminalSessionView from '../../src/components/Pages/TerminalSessionView.vue'
import { scenarioSessionService } from '../../src/services/domain/scenario'

const PanelStub = {
  name: 'TerminalSessionPanel',
  props: ['sessionInfo', 'machine', 'showExposedPorts', 'desktop'],
  template: '<div class="tsp-stub" :data-machine="machine" :data-exposed="String(showExposedPorts)" :data-desktop="String(desktop)"><slot name="console-overlay" /></div>'
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

const BOOT = { jit: true, verbose: false, display: true, sound: true, append: '', console_hidden: false }

describe('TerminalSessionView on a local machine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    agent.booted = undefined
    localStorage.removeItem('ocf-local-machine-notice-dismissed')
    mockAxiosGet.mockImplementation(async (url: string) => url === '/terminals/user-sessions'
      ? { data: [{ session_id: route.sessionId, state: 'running', expires_at: new Date(Date.now() + 3_600_000).toISOString() }] }
      : { data: {} })
  })

  it('starts the agent of the run with the learner token, and stops it on leaving', async () => {
    route.sessionId = 'local-abc'
    const wrapper = mountView()
    await flushPromises()

    expect(agent.start).toHaveBeenCalledWith('run-1', 'local-abc', 'tok', expect.any(Function))
    expect(agent.consoleUser).toHaveBeenCalledWith('local-abc', 1000)
    // A popped-out terminal reaches this tab's machine through the page.
    expect(agent.relay).toHaveBeenCalledWith('local-abc')
    const panel = wrapper.find('.tsp-stub')
    expect(panel.attributes('data-machine')).toBe('local')
    expect(panel.attributes('data-exposed')).toBe('false')
    // A run set to nothing keeps the console, apps or not.
    expect(panel.attributes('data-desktop')).toBe('false')
    // tt-backend records commands; a machine in the browser has nobody recording them.
    expect(wrapper.text()).not.toContain('recorded')

    wrapper.unmount()
    expect(agent.stop).toHaveBeenCalled()
    expect(agent.stopRelay).toHaveBeenCalled()
  })

  it('shows the desktop for a run set to one', async () => {
    route.sessionId = 'local-abc'
    vi.mocked(scenarioSessionService.getSessionByTerminal).mockResolvedValueOnce(
      { id: 'run-1', status: 'active', terminal_session_id: 'local-abc', machine_display: 'desktop', machine_memory_mib: 1024, machine_cpus: 2, machine_boot: BOOT } as never)
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.find('.tsp-stub').attributes('data-desktop')).toBe('true')
    // The machine gets the memory, CPUs and boot settings ocf-core gives the run.
    expect(agent.run).toHaveBeenCalledWith('local-abc', { apps: [], memoryMiB: 1024, cpus: 2, boot: BOOT })
  })

  it('shows what the machine booted as, not what the scenario says since', async () => {
    route.sessionId = 'local-abc'
    agent.booted = null
    vi.mocked(scenarioSessionService.getSessionByTerminal).mockResolvedValueOnce(
      { id: 'run-1', status: 'active', terminal_session_id: 'local-abc', machine_display: 'desktop', machine_apps: ['python'] } as never)
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.find('.tsp-stub').attributes('data-desktop')).toBe('false')
  })

  it('starts no agent for a container', async () => {
    route.sessionId = 'sess-incus'
    const wrapper = mountView()
    await flushPromises()

    expect(agent.start).not.toHaveBeenCalled()
    expect(wrapper.find('.tsp-stub').attributes('data-machine')).toBe('incus')
    expect(wrapper.text()).toContain('recorded')
    expect(wrapper.find('.local-machine-notice').exists()).toBe(false)
  })

  // The agent's end, as startLocalAgent reports it.
  async function agentEnds(why: string, detail?: string) {
    const onEnd = agent.start.mock.calls[0][3] as (why: string, detail?: string) => void
    onEnd(why, detail)
    await flushPromises()
  }

  // Plan rule 7: the browser's reason at once, and the terminal given back so
  // the run's budget is free, not a build that times out a minute later.
  it('says why the machine could not start, and gives its terminal back', async () => {
    route.sessionId = 'local-abc'
    const wrapper = mountView()
    await flushPromises()

    await agentEnds('boot_failed', 'WebAssembly JSPI is not available')
    const banner = wrapper.find('[data-testid="local-machine-banner"]')
    expect(banner.text()).toContain('The machine could not start')
    expect(banner.text()).toContain('WebAssembly JSPI is not available')
    const { terminalService } = await import('../../src/services/domain/terminal/terminalService')
    expect(terminalService.deleteSession).toHaveBeenCalledWith('local-abc')
  })

  it('says the machine stopped for lack of memory when it dies', async () => {
    route.sessionId = 'local-abc'
    const wrapper = mountView()
    await flushPromises()

    await agentEnds('crashed', 'out of memory')
    expect(wrapper.find('[data-testid="local-machine-banner"]').text())
      .toContain('The machine stopped: not enough memory. Close other tabs and reload the page.')
  })

  it('rebuilds the run on a new machine when the tab booted a new one (a reload)', async () => {
    route.sessionId = 'local-abc'
    mountView()
    await flushPromises()

    await agentEnds('lost')
    const { scenarioSessionService } = await import('../../src/services/domain/scenario')
    expect(scenarioSessionService.resumeSession).toHaveBeenCalledWith('run-1')
    expect(mockRouterReplace).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'local-rebuilt' } })
  })

  it('says the run is open in another tab when it is', async () => {
    route.sessionId = 'local-abc'
    const wrapper = mountView()
    await flushPromises()

    await agentEnds('other_tab')
    expect(wrapper.find('.session-end-banner').text()).toContain('another tab')
  })

  it('reads the session again when the run ended on the server', async () => {
    route.sessionId = 'local-abc'
    mountView()
    await flushPromises()
    mockAxiosGet.mockClear()

    await agentEnds('ended')
    expect(mockAxiosGet).toHaveBeenCalledWith('/terminals/user-sessions')
  })

  it('lets the learner close the notice for good, for every run', async () => {
    route.sessionId = 'local-abc'
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.local-machine-notice').exists()).toBe(true)
    await wrapper.get('.local-machine-notice button').trigger('click')
    expect(wrapper.find('.local-machine-notice').exists()).toBe(false)
    wrapper.unmount()

    route.sessionId = 'local-other'
    const next = mountView()
    await flushPromises()
    expect(next.find('.local-machine-notice').exists()).toBe(false)
    next.unmount()
  })

  it('warns that a reload restarts the machine, and asks before leaving the page', async () => {
    route.sessionId = 'local-abc'
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.local-machine-notice').text()).toContain('reload')
    const leaving = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(leaving)
    expect(leaving.defaultPrevented).toBe(true)

    wrapper.unmount()
    const after = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(after)
    expect(after.defaultPrevented).toBe(false)
  })
})
