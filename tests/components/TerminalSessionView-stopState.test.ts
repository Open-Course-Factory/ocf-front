/**
 * Tests for TerminalSessionView's session-end state propagation.
 *
 * Bug being fixed: loadSession() rebuilt sessionInfo from a narrow allow-list
 * (session_id, expires_at, status, name, instance_type, machine_size), silently
 * dropping the new `state` field that ocf-core now returns. As a consequence,
 * getEffectiveSessionState() never saw the canonical state and fell back to the
 * legacy `status` branch, which maps 'stopped' → 'deleted' → 'expired' banner.
 * The user saw "Session expirée" instead of the existing stopped banner with
 * the Resume + Delete buttons.
 *
 * These tests exercise the loader seam (axios mock → component mount → assert
 * sessionInfo.value reflects the new fields) AND the user-visible behavior
 * (the resume-session-cta is rendered for state='stopped').
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

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: {} }),
  useRouter: () => ({ push: mockRouterPush }),
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

// Scenario service: no linked scenario unless a test links one
const mockGetSessionByTerminal = vi.fn().mockResolvedValue(null)
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

// currentUser store transitively imports the router; mock it so the
// component graph (TerminalViewer → currentUser → router) doesn't blow up
// when TerminalSessionView pulls in TerminalSessionPanel imports.
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

// The console, stubbed where it is mounted: inside the real
// TerminalSessionPanel, so what the page does to the console can be told apart
// from what it does to the panel's history and flags. It records the Stop gate
// the page hands down through the panel.
const TerminalViewerStub = {
  name: 'TerminalViewer',
  props: ['showStopButton', 'canStop'],
  emits: ['stop', 'destroy', 'session-warning', 'session-expired', 'session-stopped'],
  template: '<div class="tv-stub" :data-show-stop-button="String(showStopButton)" :data-can-stop="String(canStop)"></div>'
}

const CommandHistoryStub = {
  name: 'CommandHistory',
  props: ['sessionId', 'isActive'],
  template: '<div class="ch-stub"><button class="ch-stub-entry">ls</button></div>'
}

const ValidatedFlagsStub = {
  name: 'ValidatedFlags',
  props: ['scenarioSessionId', 'isActive'],
  template: '<div class="vf-stub"></div>',
  methods: { refresh() {} }
}

const ScenarioPanelStub = {
  name: 'ScenarioPanel',
  emits: ['scenario-info-loaded', 'session-status', 'collapsed', 'flag-validated'],
  template: '<div class="sp-stub"></div>'
}

// `realPanel` mounts the real TerminalSessionPanel around a stubbed console;
// the stop-state tests only need the panel stubbed out.
function mountView(options: { attachTo?: HTMLElement; realPanel?: boolean } = {}) {
  setActivePinia(createPinia())
  return mount(TerminalSessionView, {
    attachTo: options.attachTo,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        TerminalSessionPanel: options.realPanel ? false : true,
        TerminalViewer: TerminalViewerStub,
        ValidatedFlags: ValidatedFlagsStub,
        ScenarioPanel: ScenarioPanelStub,
        CommandHistory: CommandHistoryStub,
        BaseModal: true,
        'router-link': {
          props: ['to'],
          template: '<a class="router-link-stub"><slot /></a>'
        }
      }
    }
  })
}

describe('TerminalSessionView — stop state propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSessionByTerminal.mockResolvedValue(null)
  })

  it('preserves the `state` field returned by the backend on sessionInfo (loader does not drop it)', async () => {
    // Future expiry so getEffectiveSessionState honors `state` rather than the
    // expires_at invariant that forces 'deleted'.
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'stopped',
          state: 'stopped',
          expires_at: futureExpiry,
          persistence_mode: 'persistent',
          idle_until: futureExpiry,
          name: 'My stopped session',
          instance_type: 'ubuntu',
          machine_size: 'xs'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    // The loader writes the explicit field set into sessionInfo; the `state`
    // field is the SSOT this MR restores.
    const vm = wrapper.vm as any
    expect(vm.sessionInfo).toBeTruthy()
    expect(vm.sessionInfo.state).toBe('stopped')
    expect(vm.sessionInfo.persistence_mode).toBe('persistent')
    // idle_until is included because future API additions read it from session
    // info (and the SSOT principle says we don't strip data the loader received).
    expect(vm.sessionInfo.idle_until).toBe(futureExpiry)
  })

  it('renders the stopped banner (resume-session-cta) when backend reports state=stopped', async () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'stopped',
          state: 'stopped',
          expires_at: futureExpiry,
          // persistence_mode is required for the resume banner to render —
          // only persistent sessions can legitimately reach state='stopped'.
          // See TerminalSessionView-persistenceMode.test.ts for the gate.
          persistence_mode: 'persistent',
          name: 'My stopped session'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    // The "stopped" branch of the template renders Resume + Delete CTAs.
    // The "expired" branch (the bug) renders a navigation-only banner without
    // these CTAs.
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="delete-session-cta"]').exists()).toBe(true)
  })

  it('does NOT render the resume CTA when backend reports state=deleted (true expiry)', async () => {
    // Sanity check: the fix should not turn every end-state into "stopped".
    const pastExpiry = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'expired',
          state: 'deleted',
          expires_at: pastExpiry
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
  })
})

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

function mountScenarioView(options: { attachTo?: HTMLElement } = {}) {
  return mountView({ ...options, realPanel: true })
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

    const wrapper = mountScenarioView()
    await flushPromises()

    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('words the paused banner for a scenario, not a bare terminal', async () => {
    userSessionsReturn('stopped')
    mockGetSessionByTerminal.mockResolvedValue(null)
    const plain = mountScenarioView()
    await flushPromises()
    const plainText = plain.find('.session-paused-banner').text()
    plain.unmount()

    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))
    const scenario = mountScenarioView()
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

    const wrapper = mountScenarioView()
    await flushPromises()
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
    const before = userSessionsCalls()

    // The console closed with 4300: the terminal is now stopped server-side.
    userSessionsReturn('stopped')
    wrapper.findComponent({ name: 'TerminalViewer' }).vm.$emit('session-stopped')
    await flushPromises()

    expect(userSessionsCalls()).toBeGreaterThan(before)
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('disables Stop while the scenario run is provisioning', async () => {
    userSessionsReturn('running')
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('provisioning'))

    const wrapper = mountScenarioView()
    await flushPromises()

    const panel = wrapper.find('.tv-stub')
    expect(panel.attributes('data-show-stop-button')).toBe('true')
    expect(panel.attributes('data-can-stop')).toBe('false')

    // And a stray stop (a race with the prop update) does not reach the API.
    wrapper.findComponent({ name: 'TerminalViewer' }).vm.$emit('stop')
    await flushPromises()
    expect(mockAxiosPost).not.toHaveBeenCalledWith('/terminals/sess-test/stop')
    wrapper.unmount()
  })

  it('keeps Stop enabled once the scenario run is active', async () => {
    userSessionsReturn('running')
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))

    const wrapper = mountScenarioView()
    await flushPromises()

    expect(wrapper.find('.tv-stub').attributes('data-can-stop')).not.toBe('false')
    wrapper.unmount()
  })

  it('reloads the scenario session after a successful resume', async () => {
    userSessionsReturn('stopped')
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))

    const wrapper = mountScenarioView()
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

    const wrapper = mountScenarioView()
    await flushPromises()
    mockShowWarning.mockClear()
    mockShowError.mockClear()

    backendConfirmsStopAfter(2, expiresAt)
    wrapper.findComponent({ name: 'TerminalViewer' }).vm.$emit('session-stopped')
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

    const wrapper = mountScenarioView()
    await flushPromises()

    mockAxiosGet.mockRejectedValueOnce(new Error('network'))
    mockAxiosGet.mockResolvedValue({ data: [terminalRow('stopped', expiresAt)] })
    wrapper.findComponent({ name: 'TerminalViewer' }).vm.$emit('session-stopped')
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
    return wrapper.find('.tv-stub').element.closest('[inert]') !== null
  }

  it('makes the covered console inert while a paused run is shown', async () => {
    userSessionsReturn('stopped')

    const wrapper = mountScenarioView()
    await flushPromises()

    const cta = wrapper.find('[data-testid="resume-session-cta"]')
    expect(cta.exists()).toBe(true)
    expect(consoleIsInert(wrapper)).toBe(true)
    // The overlay itself stays reachable.
    expect(cta.element.closest('[inert]')).toBeNull()
    wrapper.unmount()
  })

  it('keeps the history and flags reachable: only the console goes inert', async () => {
    userSessionsReturn('stopped')

    const wrapper = mountScenarioView()
    await flushPromises()
    // A scenario with flags: the panel lists the validated flags too.
    wrapper.findComponent({ name: 'ScenarioPanel' }).vm.$emit('scenario-info-loaded', {
      id: 'sc1', name: 'GameShell', title: 'GameShell', flags_enabled: true
    })
    await flushPromises()

    expect(consoleIsInert(wrapper)).toBe(true)

    // One history and one flags list — the panel's own, not copies laid over
    // the console — and both still usable while the run is paused.
    expect(wrapper.findAllComponents({ name: 'CommandHistory' })).toHaveLength(1)
    const history = wrapper.find('.ch-stub')
    expect(history.element.closest('[inert]')).toBeNull()
    const flags = wrapper.findAll('.vf-stub')
    expect(flags).toHaveLength(1)
    expect(flags[0].element.closest('[inert]')).toBeNull()
    wrapper.unmount()
  })

  it('leaves the console alone while the run is live', async () => {
    userSessionsReturn('running')

    const wrapper = mountScenarioView()
    await flushPromises()

    expect(consoleIsInert(wrapper)).toBe(false)
    wrapper.unmount()
  })

  it('moves focus to Resume when the console reports a platform stop', async () => {
    userSessionsReturn('running')
    const host = document.createElement('div')
    document.body.appendChild(host)

    const wrapper = mountScenarioView({ attachTo: host })
    await flushPromises()

    userSessionsReturn('stopped')
    wrapper.findComponent({ name: 'TerminalViewer' }).vm.$emit('session-stopped')
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

/**
 * A run can be linked to its terminal after the page has loaded: the page's
 * periodic scenario sync finds it. When that run is still being set up, Stop
 * stays disabled — and the page must keep looking until the setup is over,
 * exactly as it does for a run found on load. Today the sync path records the
 * status once and never looks again, so Stop stays disabled for good.
 */
describe('TerminalSessionView — a run found by the scenario sync mid-setup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockGetSessionByTerminal.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('re-checks the run until Stop can be offered', async () => {
    userSessionsReturn('running')

    const wrapper = mountScenarioView()
    await flushPromises()

    // The sync finds the run while its setup is still running.
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('provisioning'))
    await vi.advanceTimersByTimeAsync(10_000)
    await flushPromises()
    expect(wrapper.find('.tv-stub').attributes('data-can-stop')).toBe('false')
    const found = mockGetSessionByTerminal.mock.calls.length

    // The setup finishes; the next look must see it.
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))
    await vi.advanceTimersByTimeAsync(6_000)
    await flushPromises()

    expect(mockGetSessionByTerminal.mock.calls.length).toBeGreaterThan(found)
    expect(wrapper.find('.tv-stub').attributes('data-can-stop')).not.toBe('false')
    wrapper.unmount()
  })
})
