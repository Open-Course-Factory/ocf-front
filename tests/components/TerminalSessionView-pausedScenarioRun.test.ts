/**
 * Pausing and resuming a scenario run from its session view.
 *
 * A persistent scenario terminal can be stopped — by the learner's Stop, or by
 * an idle/TTL auto-stop — and ocf-core keeps the run open: resuming starts the
 * terminal again and the learner is back at the same step. The view has to:
 *
 *   - offer the paused banner (Resume + Delete) for a scenario run too. Today
 *     the scenario layout wins whenever a scenario is linked, so a paused run
 *     shows a dead console and no way to resume it;
 *   - word that banner for a scenario, not a bare terminal;
 *   - learn about a platform stop from the console (close code 4300, surfaced
 *     by the viewer as `session-stopped`) instead of waiting for a reload;
 *   - refuse Stop while the run is still provisioning — stopping mid-setup
 *     fails the setup;
 *   - reload the scenario session after a resume, so the panel is rebuilt
 *     from the run's current state and stays on its step.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

const mockShowWarning = vi.fn()
const mockShowError = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: (...args: any[]) => mockShowError(...args),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: (...args: any[]) => mockShowWarning(...args),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn()
  })
}))

const mockGetSessionByTerminal = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getSessionByTerminal: (...args: any[]) => mockGetSessionByTerminal(...args),
    abandonSession: vi.fn().mockResolvedValue(undefined)
  }
}))

const mockStartSession = vi.fn().mockResolvedValue({})
vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    startSession: (...args: any[]) => mockStartSession(...args),
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

import TerminalSessionView from '../../src/components/Pages/TerminalSessionView.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

// Records the Stop gate the view hands the panel (can-stop is the existing
// seam: TerminalSessionPanel forwards it to the viewer's Stop button).
const TerminalSessionPanelStub = {
  name: 'TerminalSessionPanel',
  props: ['sessionInfo', 'isActive', 'isRecording', 'showStopButton', 'isStopping', 'canStop', 'scenarioSessionId', 'endReason', 'hasScenario'],
  emits: ['stop', 'destroy', 'session-stopped'],
  template: '<div class="tsp-stub" :data-show-stop-button="String(showStopButton)" :data-can-stop="String(canStop)"></div>'
}

function mountView(options: { attachTo?: HTMLElement } = {}) {
  setActivePinia(createPinia())
  return mount(TerminalSessionView, {
    ...options,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        TerminalSessionPanel: TerminalSessionPanelStub,
        ScenarioPanel: true,
        CommandHistory: true,
        BaseModal: true,
        'router-link': {
          props: ['to'],
          template: '<a class="router-link-stub"><slot /></a>'
        }
      }
    }
  })
}

const futureExpiry = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()

function terminalRow(state: 'running' | 'stopped', expiresAt = futureExpiry()) {
  return {
    session_id: 'sess-test',
    state,
    expires_at: expiresAt,
    persistence_mode: 'persistent',
    name: 'GameShell run'
  }
}

function userSessionsReturn(state: 'running' | 'stopped') {
  mockAxiosGet.mockResolvedValue({ data: [terminalRow(state)] })
}

function userSessionsCalls() {
  return mockAxiosGet.mock.calls.filter(([url]) => url === '/terminals/user-sessions').length
}

const scenarioRun = (status: string) => ({ id: 'scen-1', status })

describe('TerminalSessionView — paused scenario run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStartSession.mockResolvedValue({})
  })

  it('offers Resume for a paused scenario run', async () => {
    userSessionsReturn('stopped')
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('words the paused banner for a scenario, not a bare terminal', async () => {
    userSessionsReturn('stopped')
    mockGetSessionByTerminal.mockResolvedValue(null)
    const plain = mountView()
    await flushPromises()
    const plainText = plain.find('.session-paused-banner').text()
    plain.unmount()

    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))
    const scenario = mountView()
    await flushPromises()
    const banner = scenario.find('.session-paused-banner')

    expect(banner.exists()).toBe(true)
    expect(banner.text()).toMatch(/scenario/i)
    expect(banner.text()).not.toBe(plainText)
    scenario.unmount()
  })

  it('switches to the paused banner when the console reports a platform stop', async () => {
    userSessionsReturn('running')
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))

    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
    const before = userSessionsCalls()

    // The console closed with 4300: the terminal is now stopped server-side.
    userSessionsReturn('stopped')
    wrapper.findComponent({ name: 'TerminalSessionPanel' }).vm.$emit('session-stopped')
    await flushPromises()

    expect(userSessionsCalls()).toBeGreaterThan(before)
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('disables Stop while the scenario run is provisioning', async () => {
    userSessionsReturn('running')
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('provisioning'))

    const wrapper = mountView()
    await flushPromises()

    const panel = wrapper.find('.tsp-stub')
    expect(panel.attributes('data-show-stop-button')).toBe('true')
    expect(panel.attributes('data-can-stop')).toBe('false')

    // And a stray stop (a race with the prop update) does not reach the API.
    wrapper.findComponent({ name: 'TerminalSessionPanel' }).vm.$emit('stop')
    await flushPromises()
    expect(mockAxiosPost).not.toHaveBeenCalledWith('/terminals/sess-test/stop')
    wrapper.unmount()
  })

  it('keeps Stop enabled once the scenario run is active', async () => {
    userSessionsReturn('running')
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.tsp-stub').attributes('data-can-stop')).not.toBe('false')
    wrapper.unmount()
  })

  it('reloads the scenario session after a successful resume', async () => {
    userSessionsReturn('stopped')
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))

    const wrapper = mountView()
    await flushPromises()
    const before = mockGetSessionByTerminal.mock.calls.length

    userSessionsReturn('running')
    await wrapper.find('[data-testid="resume-session-cta"]').trigger('click')
    await flushPromises()

    expect(mockStartSession).toHaveBeenCalledWith('sess-test')
    expect(mockGetSessionByTerminal.mock.calls.length).toBeGreaterThan(before)
    expect(mockGetSessionByTerminal).toHaveBeenLastCalledWith('sess-test')
    wrapper.unmount()
  })
})

/**
 * What the page does once the console reports a platform stop (4300).
 *
 * ocf-core learns about the stop from tt-backend a few seconds after the
 * console closes, so the first read often still says `running`. Until the
 * backend catches up the page must neither keep counting down to an expiry
 * that is no longer coming (its 5-minute / 1-minute toasts, then its
 * optimistic "expired" flip), nor give up and settle on a dead console: it
 * keeps reading the terminal until it sees `stopped`, then offers Resume.
 */
describe('TerminalSessionView — waiting for the backend to confirm a platform stop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStartSession.mockResolvedValue({})
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // The backend answers `running` for the next `lag` reads, then `stopped`.
  function backendConfirmsStopAfter(lag: number, expiresAt: string) {
    let reads = 0
    mockAxiosGet.mockImplementation(async (url: string) => {
      if (url !== '/terminals/user-sessions') return { data: {} }
      reads++
      return { data: [terminalRow(reads <= lag ? 'running' : 'stopped', expiresAt)] }
    })
  }

  it('stops the expiry countdown while the backend still reports running', async () => {
    // Close enough to expiry that a live countdown warns on its next tick.
    const expiresAt = new Date(Date.now() + 90 * 1000).toISOString()
    mockAxiosGet.mockResolvedValue({ data: [terminalRow('running', expiresAt)] })

    const wrapper = mountView()
    await flushPromises()
    mockShowWarning.mockClear()
    mockShowError.mockClear()

    backendConfirmsStopAfter(2, expiresAt)
    wrapper.findComponent({ name: 'TerminalSessionPanel' }).vm.$emit('session-stopped')
    await flushPromises()

    await vi.advanceTimersByTimeAsync(12 * 1000)
    await flushPromises()

    expect(mockShowWarning).not.toHaveBeenCalled()
    expect(mockShowError).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('retries when the read fails instead of settling on an ended console', async () => {
    const expiresAt = futureExpiry()
    mockAxiosGet.mockResolvedValue({ data: [terminalRow('running', expiresAt)] })

    const wrapper = mountView()
    await flushPromises()

    mockAxiosGet.mockRejectedValueOnce(new Error('network'))
    mockAxiosGet.mockResolvedValue({ data: [terminalRow('stopped', expiresAt)] })
    wrapper.findComponent({ name: 'TerminalSessionPanel' }).vm.$emit('session-stopped')
    await flushPromises()
    const afterFailure = userSessionsCalls()

    await vi.advanceTimersByTimeAsync(15 * 1000)
    await flushPromises()

    expect(userSessionsCalls()).toBeGreaterThan(afterFailure)
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    wrapper.unmount()
  })
})

/**
 * The paused banner is laid over the dead console. Covered is not enough for
 * a keyboard or screen-reader user: the console underneath must leave the tab
 * order and the accessibility tree, and focus must land on Resume — otherwise
 * it stays in a terminal that no longer answers.
 */
describe('TerminalSessionView — paused overlay accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStartSession.mockResolvedValue({})
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))
  })

  function consoleIsInert(wrapper: ReturnType<typeof mountView>) {
    return wrapper.find('.tsp-stub').element.closest('[inert]') !== null
  }

  it('makes the covered console inert while a paused run is shown', async () => {
    userSessionsReturn('stopped')

    const wrapper = mountView()
    await flushPromises()

    const cta = wrapper.find('[data-testid="resume-session-cta"]')
    expect(cta.exists()).toBe(true)
    expect(consoleIsInert(wrapper)).toBe(true)
    // The overlay itself stays reachable.
    expect(cta.element.closest('[inert]')).toBeNull()
    wrapper.unmount()
  })

  it('leaves the console alone while the run is live', async () => {
    userSessionsReturn('running')

    const wrapper = mountView()
    await flushPromises()

    expect(consoleIsInert(wrapper)).toBe(false)
    wrapper.unmount()
  })

  it('moves focus to Resume when the console reports a platform stop', async () => {
    userSessionsReturn('running')
    const host = document.createElement('div')
    document.body.appendChild(host)

    const wrapper = mountView({ attachTo: host })
    await flushPromises()

    userSessionsReturn('stopped')
    wrapper.findComponent({ name: 'TerminalSessionPanel' }).vm.$emit('session-stopped')
    await flushPromises()
    await wrapper.vm.$nextTick()

    const cta = wrapper.find('[data-testid="resume-session-cta"]')
    expect(cta.exists()).toBe(true)
    expect(document.activeElement).toBe(cta.element)
    expect(consoleIsInert(wrapper)).toBe(true)
    wrapper.unmount()
    host.remove()
  })
})
