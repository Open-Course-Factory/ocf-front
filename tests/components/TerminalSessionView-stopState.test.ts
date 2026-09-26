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
const mockRouterReplace = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: {} }),
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

const mockShowWarning = vi.fn()
const mockShowError = vi.fn()
const mockShowConfirm = vi.fn().mockResolvedValue(true)
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: (...args: any[]) => mockShowConfirm(...args),
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
const mockResumeScenarioSession = vi.fn()
const mockGetSessionInfo = vi.fn()
const mockAbandonSession = vi.fn().mockResolvedValue(undefined)
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getSessionByTerminal: (...args: any[]) => mockGetSessionByTerminal(...args),
    getSessionInfo: (...args: any[]) => mockGetSessionInfo(...args),
    abandonSession: (...args: any[]) => mockAbandonSession(...args),
    resumeSession: (...args: any[]) => mockResumeScenarioSession(...args)
  }
}))

const mockStartSession = vi.fn().mockResolvedValue({})
const mockDeleteSession = vi.fn().mockResolvedValue({})
vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    startSession: (...args: any[]) => mockStartSession(...args),
    stopSession: vi.fn().mockResolvedValue({}),
    deleteSession: (...args: any[]) => mockDeleteSession(...args),
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

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
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
function mountView(options: {
  attachTo?: HTMLElement
  realPanel?: boolean
  locale?: 'en' | 'fr'
  stubs?: Record<string, any>
} = {}) {
  setActivePinia(createPinia())
  return mount(TerminalSessionView, {
    attachTo: options.attachTo,
    global: {
      plugins: [createTestI18n(options.locale)],
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
        },
        ...options.stubs
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

function mountScenarioView(options: { attachTo?: HTMLElement; locale?: 'en' | 'fr' } = {}) {
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

  it('follows the scenario panel into and out of a step setup', async () => {
    // A step's setup starts and ends while the page is open: the panel reports
    // it, and Stop follows.
    userSessionsReturn('running')
    mockGetSessionByTerminal.mockResolvedValue(scenarioRun('active'))

    const wrapper = mountScenarioView()
    await flushPromises()
    const scenarioPanel = wrapper.findComponent({ name: 'ScenarioPanel' })

    scenarioPanel.vm.$emit('session-status', 'provisioning')
    await flushPromises()
    expect(wrapper.find('.tv-stub').attributes('data-can-stop')).toBe('false')

    scenarioPanel.vm.$emit('session-status', 'active')
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

/**
 * A scenario run whose terminal is gone, but which is not over.
 *
 * ocf-core keeps a normal run open when its container disappears — the
 * terminal was deleted, or expired on a non-persistent plan — and reports it
 * with `resume_mode: 'rebuild'`. The session view must not settle on the
 * "session expired" end: it lays a rebuild banner over the dead console, in
 * the same slot as the paused banner, so nothing on the page moves. Its button
 * resumes the run — a new terminal is built at the learner's step — and the
 * page moves to that terminal with router.replace (the old one is gone, Back
 * must not lead to it), where the page's own pollers take over.
 */
describe('TerminalSessionView — a scenario run to rebuild', () => {
  const pastExpiry = () => new Date(Date.now() - 60 * 60 * 1000).toISOString()

  function terminalGone() {
    mockAxiosGet.mockResolvedValue({
      data: [{ session_id: 'sess-test', state: 'deleted', expires_at: pastExpiry(), name: 'GameShell run' }]
    })
  }

  const rebuildRun = { id: 'scen-1', status: 'active', resume_mode: 'rebuild' }

  beforeEach(() => {
    vi.clearAllMocks()
    terminalGone()
    mockGetSessionByTerminal.mockResolvedValue(rebuildRun)
  })

  it('lays the rebuild banner over the dead console, not in the page flow', async () => {
    const wrapper = mountScenarioView()
    await flushPromises()

    const cta = wrapper.find('[data-testid="rebuild-session-cta"]')
    expect(cta.exists()).toBe(true)
    // The console-overlay slot: absolutely positioned over the console, so
    // showing it shifts nothing.
    expect(cta.element.closest('.ocf-console-overlay')).not.toBeNull()
    // The dead console underneath leaves the tab order.
    expect(wrapper.find('.tv-stub').element.closest('[inert]')).not.toBeNull()
    // Not the paused banner: there is no terminal to start again.
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('rebuilds the run and moves to its new terminal', async () => {
    mockResumeScenarioSession.mockResolvedValue({
      terminal_session_id: 'term-new',
      scenario_session_id: 'scen-1',
      status: 'provisioning',
      provisioning_phase: 'replay',
      provisioning_timeout_seconds: 900
    })

    const wrapper = mountScenarioView()
    await flushPromises()
    await wrapper.find('[data-testid="rebuild-session-cta"]').trigger('click')
    await flushPromises()

    expect(mockResumeScenarioSession).toHaveBeenCalledWith('scen-1')
    expect(mockRouterReplace).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'term-new' } })
    expect(mockRouterPush).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('explains a refused rebuild instead of a generic failure', async () => {
    mockResumeScenarioSession.mockRejectedValue({
      response: { status: 409, data: { reason: 'run_over', error_message: 'This run is over and cannot be resumed.' } }
    })

    const wrapper = mountScenarioView()
    await flushPromises()
    await wrapper.find('[data-testid="rebuild-session-cta"]').trigger('click')
    await flushPromises()

    expect(mockShowError).toHaveBeenCalledTimes(1)
    expect(String(mockShowError.mock.calls[0][0])).toMatch(/start over/i)
    expect(mockRouterReplace).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('offers no rebuild for a run that cannot be resumed (crash traps, preview)', async () => {
    mockGetSessionByTerminal.mockResolvedValue({ id: 'scen-1', status: 'active' })

    const wrapper = mountScenarioView()
    await flushPromises()

    expect(wrapper.find('[data-testid="rebuild-session-cta"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('offers no rebuild while the terminal is still running', async () => {
    userSessionsReturn('running')

    const wrapper = mountScenarioView()
    await flushPromises()

    expect(wrapper.find('[data-testid="rebuild-session-cta"]').exists()).toBe(false)
    wrapper.unmount()
  })
})

/**
 * The rebuild banner says what the learner gets back: a fresh machine at the
 * step, their progress — but not files they made by hand, since only the
 * scenario's setup scripts are replayed. And it names its button the way the
 * launcher and the scenario history do.
 */
describe('TerminalSessionView — rebuild banner copy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAxiosGet.mockResolvedValue({
      data: [{ session_id: 'sess-test', state: 'deleted', expires_at: new Date(Date.now() - 3600_000).toISOString() }]
    })
    mockGetSessionByTerminal.mockResolvedValue({ id: 'scen-1', status: 'active', resume_mode: 'rebuild' })
  })

  it('says files the learner created are not restored', async () => {
    const wrapper = mountScenarioView()
    await flushPromises()

    const banner = wrapper.find('.ocf-console-overlay')
    expect(banner.text()).toMatch(/progress is kept/i)
    expect(banner.text()).toMatch(/files you created yourself are not restored/i)
    expect(wrapper.find('[data-testid="rebuild-session-cta"]').text()).toBe('Rebuild and resume')
    wrapper.unmount()
  })

  it('says so in French', async () => {
    const wrapper = mountScenarioView({ locale: 'fr' })
    await flushPromises()

    const banner = wrapper.find('.ocf-console-overlay')
    expect(banner.text()).toMatch(/progression est conservée/i)
    expect(banner.text()).toMatch(/les fichiers que vous aviez créés ne sont pas restaurés/i)
    expect(wrapper.find('[data-testid="rebuild-session-cta"]').text()).toBe('Reconstruire et reprendre')
    wrapper.unmount()
  })
})

/**
 * The replay, shown where the learner lands.
 *
 * Every entry point opens the new terminal as soon as the resume answers; the
 * run is then `provisioning` with phase `replay` while ocf-core runs the
 * scenario setup and each step's setup script up to the learner's step —
 * minutes, possibly. Until it is over the console is not the learner's to use
 * (verify and submit answer 409), so the page lays the replay's progress over
 * it, in the same `#console-overlay` slot as the paused and rebuild banners.
 * The same holds when the learner comes back through Resume mid-replay.
 *
 * A replay can fail: ocf-core then deletes the new terminal and puts the run
 * back, still rebuildable, on its old terminal id. The page must not settle on
 * a dead console: it finds the run again and offers the rebuild, saying the
 * attempt failed.
 */
describe('TerminalSessionView — a run being rebuilt', () => {
  const replaying = {
    id: 'scen-1',
    status: 'provisioning',
    provisioning_phase: 'replay',
    resume_mode: 'live',
    terminal_session_id: 'sess-test'
  }

  let terminalState: 'running' | 'deleted'

  beforeEach(() => {
    vi.clearAllMocks()
    // Timers only: a faked clock breaks vue-i18n's message compilation, and
    // these tests read the copy.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    terminalState = 'running'
    mockAxiosGet.mockImplementation(async (url: string) => {
      if (url !== '/terminals/user-sessions') return { data: {} }
      return { data: [{ session_id: 'sess-test', state: terminalState, expires_at: futureExpiry(), persistence_mode: 'persistent', name: 'GameShell run' }] }
    })
    mockGetSessionByTerminal.mockResolvedValue(replaying)
    mockGetSessionInfo.mockResolvedValue(replaying)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // What ocf-core leaves behind a failed replay: the new terminal deleted, the
  // run active again on its old terminal, and rebuildable.
  const restored = { id: 'scen-1', status: 'active', resume_mode: 'rebuild', terminal_session_id: 'term-old' }

  function replayFails(byTerminal: unknown) {
    terminalState = 'deleted'
    mockGetSessionByTerminal.mockResolvedValue(byTerminal)
    mockGetSessionInfo.mockResolvedValue(restored)
  }

  it('shows the replay over the console while it runs', async () => {
    const wrapper = mountScenarioView()
    await flushPromises()

    const overlay = wrapper.find('.ocf-console-overlay')
    expect(overlay.exists()).toBe(true)
    expect(overlay.text()).toMatch(/rebuil/i)
    // The console underneath is not the learner's yet.
    expect(wrapper.find('.tv-stub').element.closest('[inert]')).not.toBeNull()
    expect(wrapper.find('[data-testid="rebuild-session-cta"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
    wrapper.unmount()
  })

  // The replay's own words: the launch copy ("Creating terminal and preparing
  // scenario") describes a machine being made for the first time.
  it('titles the replay as a rebuild, not a launch', async () => {
    const wrapper = mountScenarioView()
    await flushPromises()

    const overlay = wrapper.find('.ocf-console-overlay')
    expect(overlay.find('h3').text()).toMatch(/rebuilding your environment/i)
    expect(overlay.find('.provisioning-detail').text()).toMatch(/fresh machine/i)
    expect(overlay.text()).not.toMatch(/Setting up your environment|Creating terminal and preparing scenario/)
    wrapper.unmount()
  })

  it('titles the replay as a rebuild in French too', async () => {
    const wrapper = mountScenarioView({ locale: 'fr' })
    await flushPromises()

    const overlay = wrapper.find('.ocf-console-overlay')
    expect(overlay.find('h3').text()).toMatch(/reconstruction de votre environnement/i)
    expect(overlay.find('.provisioning-detail').text()).toMatch(/nouvelle machine/i)
    expect(overlay.text()).not.toMatch(/Préparation de votre environnement|Création du terminal/)
    wrapper.unmount()
  })

  // The overlay makes the console inert: a single failed lookup must not leave
  // it there for good. The page keeps looking until the run is active.
  it.each([
    ['the run lookup by id', () => {
      mockGetSessionByTerminal.mockResolvedValue(null)
      mockGetSessionInfo.mockRejectedValueOnce(new Error('network'))
    }],
    ['the lookup by terminal', () => {
      mockGetSessionByTerminal.mockRejectedValueOnce(new Error('network'))
    }],
  ])('keeps checking the replay after %s fails once', async (_label, failOnce) => {
    const wrapper = mountScenarioView()
    await flushPromises()
    expect(wrapper.find('.ocf-console-overlay').exists()).toBe(true)

    failOnce()
    await vi.advanceTimersByTimeAsync(6_000)
    await flushPromises()

    const done = { ...replaying, status: 'active', provisioning_phase: '' }
    mockGetSessionByTerminal.mockResolvedValue(done)
    mockGetSessionInfo.mockResolvedValue(done)
    await vi.advanceTimersByTimeAsync(30_000)
    await flushPromises()

    expect(wrapper.find('.ocf-console-overlay').exists()).toBe(false)
    expect(wrapper.find('.tv-stub').element.closest('[inert]')).toBeNull()
    expect(mockShowError).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('hands the console back once the replay is over', async () => {
    const wrapper = mountScenarioView()
    await flushPromises()
    expect(wrapper.find('.ocf-console-overlay').exists()).toBe(true)

    const done = { ...replaying, status: 'active', provisioning_phase: '' }
    mockGetSessionByTerminal.mockResolvedValue(done)
    mockGetSessionInfo.mockResolvedValue(done)
    await vi.advanceTimersByTimeAsync(20_000)
    await flushPromises()

    expect(wrapper.find('.ocf-console-overlay').exists()).toBe(false)
    expect(wrapper.find('.tv-stub').element.closest('[inert]')).toBeNull()
    expect(mockShowError).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it.each([
    // The run points at its old terminal again: the new id finds nothing.
    ['the new terminal no longer finds the run', null],
    ['the run is active on another terminal', restored],
  ])('offers the rebuild again, and says it failed, when %s', async (_label, byTerminal) => {
    const wrapper = mountScenarioView()
    await flushPromises()

    replayFails(byTerminal)
    await vi.advanceTimersByTimeAsync(20_000)
    await flushPromises()

    const cta = wrapper.find('[data-testid="rebuild-session-cta"]')
    expect(cta.exists()).toBe(true)
    expect(cta.element.closest('.ocf-console-overlay')).not.toBeNull()
    expect(mockShowError).toHaveBeenCalledTimes(1)
    const message = String(mockShowError.mock.calls[0][0])
    expect(message).toMatch(/could not be rebuilt/i)
    expect(message).toMatch(/progress is kept/i)

    // And the rebuild can be tried again from there.
    mockResumeScenarioSession.mockResolvedValue({
      terminal_session_id: 'term-newer', scenario_session_id: 'scen-1', status: 'provisioning', provisioning_phase: 'replay'
    })
    await cta.trigger('click')
    await flushPromises()
    expect(mockResumeScenarioSession).toHaveBeenCalledWith('scen-1')
    expect(mockRouterReplace).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'term-newer' } })
    wrapper.unmount()
  })
})

/**
 * A terminal that expires while the page is open — the commonest way to meet
 * a lost environment. At the end of the countdown the page flips to "deleted"
 * on its own, seconds before ocf-core has caught up: asked then, the run still
 * reads `live`. The page must read the run again once the backend confirms the
 * terminal is gone, when it reads `rebuild`, and offer the rebuild.
 */
describe('TerminalSessionView — a terminal that expires while the page is open', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('offers the rebuild once the backend confirms the terminal is gone', async () => {
    const expiresAt = Date.now() + 5_000
    // ocf-core learns of the expiry a few seconds after the countdown ends.
    const backendDeletedAt = expiresAt + 4_000
    const backendDeleted = () => Date.now() >= backendDeletedAt
    mockAxiosGet.mockImplementation(async (url: string) => {
      if (url !== '/terminals/user-sessions') return { data: {} }
      return {
        data: [{
          session_id: 'sess-test',
          state: backendDeleted() ? 'deleted' : 'running',
          expires_at: new Date(expiresAt).toISOString(),
          name: 'GameShell run'
        }]
      }
    })
    mockGetSessionByTerminal.mockImplementation(async () => ({
      id: 'scen-1',
      status: 'active',
      resume_mode: backendDeleted() ? 'rebuild' : 'live',
      terminal_session_id: 'sess-test'
    }))

    const wrapper = mountScenarioView()
    await flushPromises()
    expect(wrapper.find('[data-testid="rebuild-session-cta"]').exists()).toBe(false)
    const readsOnLoad = mockGetSessionByTerminal.mock.calls.length

    await vi.advanceTimersByTimeAsync(40_000)
    await flushPromises()

    expect(wrapper.find('[data-testid="rebuild-session-cta"]').exists()).toBe(true)
    // Read again once, when the backend confirms — not at the optimistic flip
    // as well.
    expect(mockGetSessionByTerminal.mock.calls.length - readsOnLoad).toBe(1)
    wrapper.unmount()
  })
})

/**
 * The other way a terminal goes while the page is open: the page itself
 * reloads it and finds it deleted — after a Stop that deletes a non-persistent
 * terminal (F4), for one. That reload must read the run again too, through the
 * same path as a deletion the backend confirms after an expiry: one place that
 * turns "this terminal is gone" into "read the run's resume mode again".
 */
describe('TerminalSessionView — a terminal the page reloads as deleted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockAxiosPost.mockReset()
    mockAxiosPost.mockResolvedValue({ data: {} })
  })

  it('reads the run again and offers the rebuild', async () => {
    let deleted = false
    mockAxiosGet.mockImplementation(async (url: string) => {
      if (url !== '/terminals/user-sessions') return { data: {} }
      // Persistent, so Stop reloads at once; on a non-persistent run it asks
      // first (F4's own tests cover that path).
      return { data: [{ session_id: 'sess-test', state: deleted ? 'deleted' : 'running', expires_at: futureExpiry(), name: 'GameShell run', persistence_mode: 'persistent' }] }
    })
    mockGetSessionByTerminal.mockImplementation(async () => ({
      id: 'scen-1',
      status: 'active',
      resume_mode: deleted ? 'rebuild' : 'live',
      terminal_session_id: 'sess-test'
    }))
    // The terminal is gone once the page's own request has gone through.
    mockAxiosPost.mockImplementation(async () => {
      deleted = true
      return { data: {} }
    })

    const wrapper = mountScenarioView()
    await flushPromises()
    const readsOnLoad = mockGetSessionByTerminal.mock.calls.length

    wrapper.findComponent({ name: 'TerminalViewer' }).vm.$emit('stop')
    await flushPromises()

    expect(wrapper.find('[data-testid="rebuild-session-cta"]').exists()).toBe(true)
    expect(mockGetSessionByTerminal.mock.calls.length - readsOnLoad).toBe(1)
    wrapper.unmount()
  })
})

/**
 * Any environment build, not only a replay. Start over from the scenario
 * history opens the new terminal at once, while the launch is still running
 * its setup: the console is not ready, verify answers 409 and Stop is
 * disabled. The page lays the build's progress over the console whenever the
 * run is `provisioning` with a phase — the launch's own copy and phase list
 * for a launch — and hands the console back once the run is active.
 *
 * A step change made from the page is different: the panel shows its own
 * "preparing the next step" state and the console stays usable, so no overlay
 * — the phase the page read on load no longer applies once the panel reports.
 */
describe('TerminalSessionView — a run whose environment is being set up', () => {
  const settingUp = {
    id: 'scen-1',
    status: 'provisioning',
    provisioning_phase: 'setup_script',
    resume_mode: 'live',
    terminal_session_id: 'sess-test'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Timers only: a faked clock breaks vue-i18n's message compilation.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    userSessionsReturn('running')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the launch setup over the console, in the launch\'s words', async () => {
    mockGetSessionByTerminal.mockResolvedValue(settingUp)
    mockGetSessionInfo.mockResolvedValue(settingUp)

    const wrapper = mountScenarioView()
    await flushPromises()

    const overlay = wrapper.find('.ocf-console-overlay')
    expect(overlay.exists()).toBe(true)
    expect(overlay.find('h3').text()).toMatch(/Setting up your environment/)
    expect(wrapper.find('.tv-stub').element.closest('[inert]')).not.toBeNull()

    const done = { ...settingUp, status: 'active', provisioning_phase: '' }
    mockGetSessionByTerminal.mockResolvedValue(done)
    mockGetSessionInfo.mockResolvedValue(done)
    await vi.advanceTimersByTimeAsync(20_000)
    await flushPromises()

    expect(wrapper.find('.ocf-console-overlay').exists()).toBe(false)
    expect(mockShowError).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('shows no overlay for a step change the panel reports', async () => {
    const active = { ...settingUp, status: 'active', provisioning_phase: '' }
    mockGetSessionByTerminal.mockResolvedValue(active)
    mockGetSessionInfo.mockResolvedValue(active)

    const wrapper = mountScenarioView()
    await flushPromises()

    // The learner validated a step: the next one is being prepared, and the
    // backend reports it with a phase of its own.
    const stepSetup = { ...settingUp, provisioning_phase: 'step_setup' }
    mockGetSessionByTerminal.mockResolvedValue(stepSetup)
    mockGetSessionInfo.mockResolvedValue(stepSetup)
    wrapper.findComponent({ name: 'ScenarioPanel' }).vm.$emit('session-status', 'provisioning')
    await vi.advanceTimersByTimeAsync(20_000)
    await flushPromises()

    expect(wrapper.find('.ocf-console-overlay').exists()).toBe(false)
    // Stop still waits for the step setup, as before.
    expect(wrapper.find('.tv-stub').attributes('data-can-stop')).toBe('false')
    wrapper.unmount()
  })

  it('shows no overlay for a step change in progress once the panel has reported', async () => {
    // Opened while a step setup the learner started runs: the overlay may
    // show (the console is not ready for that step either) — but once the
    // panel takes over, its own indicator is the only one.
    const stepSetup = { ...settingUp, provisioning_phase: 'step_setup' }
    mockGetSessionByTerminal.mockResolvedValue(stepSetup)
    mockGetSessionInfo.mockResolvedValue(stepSetup)

    const wrapper = mountScenarioView()
    await flushPromises()
    wrapper.findComponent({ name: 'ScenarioPanel' }).vm.$emit('session-status', 'provisioning')
    await flushPromises()

    expect(wrapper.find('.ocf-console-overlay').exists()).toBe(false)
    wrapper.unmount()
  })
})

/**
 * What Stop and Delete say depends on how the run can come back.
 *
 * Deleting a scenario terminal no longer ends the run (ocf-core MR D): a
 * normal run keeps its progress and is rebuilt at its step on resume, so the
 * confirm must say so and point at Abandon to really end it. A crash-trap run
 * is its container: deleting it ends the run. A terminal with no scenario
 * keeps today's copy.
 *
 * On a persistent terminal Stop is today's pause: no confirm, straight to
 * /stop. A non-persistent terminal cannot pause — tt-backend's /stop keeps the
 * container and ocf-core's sync brings the row back as stopped (ocf-core #529)
 * — so on a scenario run Stop deletes the terminal, behind a confirm worded
 * like Delete's. The page stays: a normal run then offers the rebuild banner;
 * a crash-trap run is ended (abandoned before its terminal is deleted, as
 * ocf-core's EndCrashTrapRun does).
 */
describe('TerminalSessionView — stop and delete copy by persistence', () => {
  const DELETE_COPY_PLAIN = 'The container disk and command history will be permanently lost.'
  const DELETE_COPY_REBUILD =
    'Your environment will be deleted. Your progress is kept: your environment will be rebuilt at this step when you resume. To end the run, abandon it.'
  const DELETE_COPY_CRASH_TRAPS = 'Deleting ends this run. It cannot be resumed.'
  const STOP_COPY_REBUILD =
    'Your environment will be deleted. Your progress is kept: when you resume, your environment will be rebuilt at this step.'
  const STOP_COPY_CRASH_TRAPS = 'Stopping ends this run. It cannot be resumed.'

  // The delete confirm, rendered with its body when open.
  const BaseModalStub = {
    name: 'BaseModal',
    props: ['visible', 'title'],
    template: '<div v-if="visible" class="bm-stub"><slot /><slot name="footer" /></div>'
  }

  function ephemeralRow() {
    return { ...terminalRow('running'), persistence_mode: 'ephemeral' }
  }

  async function mountWith(options: { crashTraps?: boolean; scenario?: boolean; locale?: 'en' | 'fr'; row?: any } = {}) {
    mockAxiosGet.mockResolvedValue({ data: [options.row ?? terminalRow('running')] })
    mockGetSessionByTerminal.mockResolvedValue(options.scenario === false ? null : scenarioRun('active'))
    const wrapper = mountView({ realPanel: true, locale: options.locale, stubs: { BaseModal: BaseModalStub } })
    await flushPromises()
    if (options.scenario !== false) {
      wrapper.findComponent({ name: 'ScenarioPanel' }).vm.$emit('scenario-info-loaded', {
        id: 'sc1', name: 'GameShell', title: 'GameShell', crash_traps: options.crashTraps ?? false
      })
      await flushPromises()
    }
    return wrapper
  }

  async function deleteConfirmText(wrapper: ReturnType<typeof mountView>) {
    wrapper.findComponent({ name: 'TerminalViewer' }).vm.$emit('destroy')
    await flushPromises()
    const modal = wrapper.find('.bm-stub')
    expect(modal.exists()).toBe(true)
    return modal.text()
  }

  // Once the terminal is deleted, ocf-core reports it gone and the run as
  // `run` says.
  function deletingReports(run: any) {
    mockDeleteSession.mockImplementation(async () => {
      mockAxiosGet.mockResolvedValue({
        data: [{ ...ephemeralRow(), state: 'deleted', expires_at: new Date(Date.now() - 1000).toISOString() }]
      })
      mockGetSessionByTerminal.mockResolvedValue(run)
      return {}
    })
  }

  async function stopConfirmText(wrapper: ReturnType<typeof mountView>) {
    wrapper.findComponent({ name: 'TerminalViewer' }).vm.$emit('stop')
    await flushPromises()
    const modal = wrapper.find('.bm-stub')
    expect(modal.exists()).toBe(true)
    return modal.text()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockShowConfirm.mockResolvedValue(true)
    mockDeleteSession.mockReset().mockResolvedValue({})
    mockAbandonSession.mockReset().mockResolvedValue(undefined)
  })

  describe('delete confirm', () => {
    it('keeps the plain copy for a terminal with no scenario', async () => {
      const wrapper = await mountWith({ scenario: false })

      const text = await deleteConfirmText(wrapper)

      expect(text).toContain(DELETE_COPY_PLAIN)
      expect(text).not.toContain(DELETE_COPY_REBUILD)
      expect(text).not.toContain(DELETE_COPY_CRASH_TRAPS)
      wrapper.unmount()
    })

    it('says a normal run is rebuilt on resume and that Abandon ends it', async () => {
      const wrapper = await mountWith()

      const text = await deleteConfirmText(wrapper)

      expect(text).toContain(DELETE_COPY_REBUILD)
      expect(text).not.toContain(DELETE_COPY_PLAIN)
      wrapper.unmount()
    })

    it('says deleting ends a crash-trap run', async () => {
      const wrapper = await mountWith({ crashTraps: true })

      const text = await deleteConfirmText(wrapper)

      expect(text).toContain(DELETE_COPY_CRASH_TRAPS)
      expect(text).not.toContain(DELETE_COPY_REBUILD)
      expect(text).not.toContain(DELETE_COPY_PLAIN)
      wrapper.unmount()
    })

    it('has its own French copy for each case', async () => {
      const texts: string[] = []
      for (const options of [{ scenario: false }, {}, { crashTraps: true }]) {
        const wrapper = await mountWith({ ...options, locale: 'fr' })
        texts.push(await deleteConfirmText(wrapper))
        wrapper.unmount()
      }
      const [plain, rebuild, crashTraps] = texts

      expect(new Set(texts).size).toBe(3)
      for (const text of [rebuild, crashTraps]) {
        expect(text).not.toContain(DELETE_COPY_REBUILD)
        expect(text).not.toContain(DELETE_COPY_CRASH_TRAPS)
        expect(text).not.toContain(plain)
      }
    })

    it('still deletes the terminal once confirmed', async () => {
      const wrapper = await mountWith()
      await deleteConfirmText(wrapper)

      await wrapper.find('[data-testid="confirm-delete-cta"]').trigger('click')
      await flushPromises()

      expect(mockRouterPush).toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe('stop', () => {
    it('pauses a persistent scenario run at once, with no confirm', async () => {
      const wrapper = await mountWith()
      expect(wrapper.find('.tv-stub').attributes('data-show-stop-button')).toBe('true')

      wrapper.findComponent({ name: 'TerminalViewer' }).vm.$emit('stop')
      await flushPromises()

      expect(mockShowConfirm).not.toHaveBeenCalled()
      expect(wrapper.find('.bm-stub').exists()).toBe(false)
      expect(mockAxiosPost).toHaveBeenCalledWith('/terminals/sess-test/stop')
      wrapper.unmount()
    })

    it('offers Stop on a non-persistent scenario run', async () => {
      const wrapper = await mountWith({ row: ephemeralRow() })

      expect(wrapper.find('.tv-stub').attributes('data-show-stop-button')).toBe('true')
      wrapper.unmount()
    })

    it('asks first, saying a normal run is rebuilt at its step', async () => {
      const wrapper = await mountWith({ row: ephemeralRow() })

      const text = await stopConfirmText(wrapper)

      expect(text).toContain(STOP_COPY_REBUILD)
      expect(mockAxiosPost).not.toHaveBeenCalledWith('/terminals/sess-test/stop')
      expect(mockDeleteSession).not.toHaveBeenCalled()
      wrapper.unmount()
    })

    it('asks first, saying stopping ends a crash-trap run', async () => {
      const wrapper = await mountWith({ row: ephemeralRow(), crashTraps: true })

      const text = await stopConfirmText(wrapper)

      expect(text).toContain(STOP_COPY_CRASH_TRAPS)
      expect(text).not.toContain(STOP_COPY_REBUILD)
      expect(mockDeleteSession).not.toHaveBeenCalled()
      wrapper.unmount()
    })

    it('has its own French stop copy for each case', async () => {
      const texts: string[] = []
      for (const crashTraps of [false, true]) {
        const wrapper = await mountWith({ row: ephemeralRow(), crashTraps, locale: 'fr' })
        texts.push(await stopConfirmText(wrapper))
        wrapper.unmount()
      }

      expect(texts[0]).not.toBe(texts[1])
      for (const text of texts) {
        expect(text).not.toContain(STOP_COPY_REBUILD)
        expect(text).not.toContain(STOP_COPY_CRASH_TRAPS)
      }
    })

    it('deletes a normal run\'s terminal on confirm and offers the rebuild', async () => {
      const wrapper = await mountWith({ row: ephemeralRow() })
      deletingReports({ id: 'scen-1', status: 'active', resume_mode: 'rebuild' })
      await stopConfirmText(wrapper)

      await wrapper.find('[data-testid="confirm-delete-cta"]').trigger('click')
      await flushPromises()

      expect(mockDeleteSession).toHaveBeenCalledWith('sess-test')
      expect(mockAxiosPost).not.toHaveBeenCalledWith('/terminals/sess-test/stop')
      expect(mockAbandonSession).not.toHaveBeenCalled()
      // The page stays on the run: its rebuild banner is the way back.
      expect(mockRouterPush).not.toHaveBeenCalled()
      expect(wrapper.find('[data-testid="rebuild-session-cta"]').exists()).toBe(true)
      wrapper.unmount()
    })

    it('ends a crash-trap run on confirm, then deletes its terminal', async () => {
      const wrapper = await mountWith({ row: ephemeralRow(), crashTraps: true })
      const order: string[] = []
      mockAbandonSession.mockImplementation(async () => { order.push('abandon') })
      deletingReports({ id: 'scen-1', status: 'abandoned' })
      const deleteThenReport = mockDeleteSession.getMockImplementation()!
      mockDeleteSession.mockImplementation(async (...args: any[]) => {
        order.push('delete')
        return deleteThenReport(...args)
      })
      await stopConfirmText(wrapper)

      await wrapper.find('[data-testid="confirm-delete-cta"]').trigger('click')
      await flushPromises()

      expect(mockAbandonSession).toHaveBeenCalledWith('scen-1')
      expect(mockDeleteSession).toHaveBeenCalledWith('sess-test')
      expect(order).toEqual(['abandon', 'delete'])
      expect(mockAxiosPost).not.toHaveBeenCalledWith('/terminals/sess-test/stop')
      expect(wrapper.find('[data-testid="rebuild-session-cta"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
      wrapper.unmount()
    })

    it('does nothing when the stop is cancelled', async () => {
      const wrapper = await mountWith({ row: ephemeralRow() })
      await stopConfirmText(wrapper)

      await wrapper.find('[data-testid="cancel-delete-cta"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('.bm-stub').exists()).toBe(false)
      expect(mockDeleteSession).not.toHaveBeenCalled()
      expect(mockAbandonSession).not.toHaveBeenCalled()
      expect(mockAxiosPost).not.toHaveBeenCalledWith('/terminals/sess-test/stop')
      expect(mockRouterPush).not.toHaveBeenCalled()
      wrapper.unmount()
    })

    it('offers no Stop on a non-persistent terminal with no scenario', async () => {
      const wrapper = await mountWith({ scenario: false, row: ephemeralRow() })

      expect(wrapper.find('.tv-stub').attributes('data-show-stop-button')).toBe('false')
      wrapper.unmount()
    })
  })
})
