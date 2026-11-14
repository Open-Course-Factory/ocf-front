/**
 * The session page in supervisor mode (#385).
 *
 * A class manager opens a learner's session page from the class:
 * `/terminal-session/:sessionId?group=<classId>`. Every read the learner's page
 * makes is self-scoped (its own session list, its own console, its own run), so
 * for a manager it used to answer "Session not found". With `group` in the
 * query the page reads the class instead, through endpoints that are already
 * manager+ of that class:
 *   - the session row:  GET /terminals/user-sessions?group_id=<classId>
 *   - the screen:       SupervisionViewer (watch / take the hand, audited),
 *                       not the learner's console
 *   - the progress:     GET /teacher/groups/<classId>/sessions/<runId>/detail,
 *                       not /scenario-sessions/by-terminal (learner-only)
 * and it names the learner, without any of the learner's own actions.
 *
 * A caller the class refuses (an outsider, another learner) gets the normal
 * not-found state, and the page falls back on nothing else.
 *
 * Without `group` the page is the learner's page, unchanged.
 *
 * Only axios is mocked, by URL, so the contract is the HTTP calls and what
 * ends up on screen, whichever service or composable makes them.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

const mockAxiosGet = vi.fn()
const mockAxiosPost = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: (...args: any[]) => mockAxiosGet(...args),
    post: (...args: any[]) => mockAxiosPost(...args),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
  }
}))

const routeQuery: Record<string, string> = {}
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: routeQuery, path: '/terminal-session/sess-test' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: vi.fn(), showSuccess: vi.fn(), showInfo: vi.fn(),
    showWarning: vi.fn(), showMessage: vi.fn(), showAlert: vi.fn(), showPrompt: vi.fn()
  })
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
    userId: 'u-trainer', userName: 'marc', userDisplayName: 'Marc Trainer',
    userEmail: 'marc@example.com', userRoles: ['Member'], secretToken: 'tok'
  })
}))

import TerminalSessionView from '../../src/components/Pages/TerminalSessionView.vue'

// ---- Fixture: class g1, learner Karim, his terminal sess-test ----

const GROUP = 'g1'
const LEARNER_ID = 'u-karim'
const LEARNER_NAME = 'Karim Learner'

const futureExpiry = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()

function terminalRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'term-row-1',
    session_id: 'sess-test',
    user_id: LEARNER_ID,
    name: 'Karim terminal',
    state: 'running',
    persistence_mode: 'persistent',
    expires_at: futureExpiry(),
    ...overrides
  }
}

/** Another learner of the class, so a page reading the whole list must pick its row. */
const otherLearnerRow = {
  id: 'term-row-2', session_id: 'sess-other-learner', user_id: 'u-lea',
  name: 'Lea terminal', state: 'running', persistence_mode: 'persistent', expires_at: futureExpiry()
}

/** The trainer's own terminals: what the self-scoped listing answers. */
const trainerOwnRows = [{
  id: 'term-row-9', session_id: 'sess-mine', user_id: 'u-trainer',
  name: 'My terminal', state: 'running', persistence_mode: 'persistent', expires_at: futureExpiry()
}]

/** Karim's run on this terminal, as the teacher endpoint describes it. */
function runDetail(overrides: Record<string, unknown> = {}) {
  return {
    session_id: 'ss-1',
    user_id: LEARNER_ID,
    user_name: LEARNER_NAME,
    scenario_id: 'sc-docker',
    scenario_title: 'Docker basics',
    status: 'active',
    correct_count: 1,
    total_correct_possible: 3,
    started_at: '2026-11-14T09:00:00Z',
    terminal_session_id: 'sess-test',
    steps: [
      { step_order: 0, step_title: 'Pull an image', step_type: 'terminal', status: 'completed', verify_attempts: 1, hints_revealed: 0, time_spent_seconds: 120 },
      { step_order: 1, step_title: 'Run a container', step_type: 'terminal', status: 'active', verify_attempts: 0, hints_revealed: 1, time_spent_seconds: 60 },
      { step_order: 2, step_title: 'Clean up', step_type: 'terminal', status: 'locked', verify_attempts: 0, hints_revealed: 0, time_spent_seconds: 0 }
    ],
    ...overrides
  }
}

/** An older run of Karim's, on a terminal that is not this one. */
const olderRunDetail = runDetail({
  session_id: 'ss-done', scenario_id: 'sc-git', scenario_title: 'Git basics',
  status: 'completed', terminal_session_id: 'sess-old',
  steps: [{ step_order: 0, step_title: 'Init a repository', step_type: 'terminal', status: 'completed', verify_attempts: 1, hints_revealed: 0, time_spent_seconds: 30 }]
})

function liveProgressRow(assignments: unknown[]) {
  return {
    user_id: LEARNER_ID, user_name: LEARNER_NAME, connected: true, idle: false,
    terminal_session_id: 'sess-test', assignments
  }
}

const runningAssignments = [
  {
    assignment_id: 'a-git', scenario_id: 'sc-git', scenario_title: 'Git basics', session_id: 'ss-done',
    status: 'completed', session_status: 'completed', current_step: 1, total_steps: 1, hints_used: 0
  },
  {
    assignment_id: 'a-docker', scenario_id: 'sc-docker', scenario_title: 'Docker basics', session_id: 'ss-1',
    status: 'in_progress', session_status: 'active', current_step: 1, current_step_title: 'Run a container',
    total_steps: 3, hints_used: 1
  }
]

interface Backend {
  /** What the self-scoped GET /terminals/user-sessions answers: the caller's own terminals. */
  ownRows?: unknown[]
  /** What GET /terminals/user-sessions?group_id=g1 answers: rows, or an error status. */
  groupRows?: unknown[] | { status: number }
  liveProgress?: unknown[]
  details?: Record<string, unknown>
}

/** Path and query of an axios call, whether the query is in the URL or in config.params. */
function callOf(args: any[]): { path: string; params: Record<string, string> } {
  const [url, config] = args
  const [path, search = ''] = String(url).split('?')
  const params: Record<string, string> = Object.fromEntries(new URLSearchParams(search))
  for (const [key, value] of Object.entries(config?.params ?? {})) params[key] = String(value)
  return { path, params }
}

function getCalls() {
  return mockAxiosGet.mock.calls.map(callOf)
}

function calledGroupList(): boolean {
  return getCalls().some(c => c.path === '/terminals/user-sessions' && c.params.group_id === GROUP)
}

function calledSelfScopedList(): boolean {
  return getCalls().some(c => c.path === '/terminals/user-sessions' && !c.params.group_id)
}

function calledLearnerRunLookups(): boolean {
  return getCalls().some(c => c.path.startsWith('/scenario-sessions/'))
}

function rejection(status: number, message = 'refused') {
  return Promise.reject({ response: { status, data: { error_message: message } } })
}

function serve(backend: Backend) {
  const ownRows = backend.ownRows ?? trainerOwnRows
  const groupRows = backend.groupRows ?? [otherLearnerRow, terminalRow()]
  const liveProgress = backend.liveProgress ?? [liveProgressRow(runningAssignments)]
  const details = backend.details ?? { 'ss-1': runDetail(), 'ss-done': olderRunDetail }

  mockAxiosGet.mockImplementation((...args: any[]) => {
    const { path, params } = callOf(args)

    if (path === '/terminals/user-sessions') {
      if (!params.group_id) return Promise.resolve({ data: ownRows })
      if (params.group_id !== GROUP) return rejection(403, 'You are not a manager of this group')
      if (!Array.isArray(groupRows)) return rejection(groupRows.status, 'You are not a manager of this group')
      return Promise.resolve({ data: groupRows })
    }
    if (path === `/teacher/groups/${GROUP}/live-progress`) return Promise.resolve({ data: liveProgress })
    const detailMatch = path.match(new RegExp(`^/teacher/groups/${GROUP}/sessions/([^/]+)/detail$`))
    if (detailMatch) {
      const detail = details[detailMatch[1]]
      return detail ? Promise.resolve({ data: detail }) : rejection(404, 'session not found')
    }
    if (path === '/group-members' && params.group_id === GROUP) {
      return Promise.resolve({
        data: { data: [{ id: 'gm-1', user_id: LEARNER_ID, role: 'member', user: { id: LEARNER_ID, email: 'karim@example.com', display_name: LEARNER_NAME } }] }
      })
    }
    if (path === `/class-groups/${GROUP}/terminal-sessions`) {
      return Promise.resolve({ data: [{ session_id: 'sess-test', user_id: LEARNER_ID, user_name: LEARNER_NAME }] })
    }
    // The learner-only reads: a manager is refused them.
    if (path.startsWith('/scenario-sessions/')) return rejection(403, 'Access denied')
    return rejection(404, 'not found')
  })

  mockAxiosPost.mockImplementation((url: string, body: any) => {
    if (url === `/teacher/groups/${GROUP}/sessions/details`) {
      const items = (body?.session_ids ?? []).map((id: string) => details[id]).filter(Boolean)
      return Promise.resolve({ data: { items } })
    }
    return Promise.resolve({ data: {} })
  })
}

/** Records the props the page hands the supervision viewer. */
const SupervisionViewerStub = {
  name: 'SupervisionViewer',
  props: ['sessionId', 'learnerName', 'compact', 'autoConnect'],
  template: '<div data-testid="supervision-viewer-stub" :data-session-id="sessionId" :data-learner-name="learnerName" :data-compact="String(!!compact)"></div>'
}

const TerminalSessionPanelStub = {
  name: 'TerminalSessionPanel',
  template: '<div data-testid="learner-console-stub"></div>'
}

const ScenarioPanelStub = {
  name: 'ScenarioPanel',
  template: '<div data-testid="learner-scenario-panel-stub"></div>'
}

async function mountView(query: Record<string, string>) {
  for (const key of Object.keys(routeQuery)) delete routeQuery[key]
  Object.assign(routeQuery, query)
  setActivePinia(createPinia())
  const wrapper = mount(TerminalSessionView, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        SupervisionViewer: SupervisionViewerStub,
        TerminalSessionPanel: TerminalSessionPanelStub,
        ScenarioPanel: ScenarioPanelStub,
        CommandHistory: true,
        BaseModal: true,
        'router-link': RouterLinkStub
      }
    }
  })
  await flushPromises()
  await flushPromises()
  return wrapper
}

const viewer = (wrapper: Awaited<ReturnType<typeof mountView>>) => wrapper.find('[data-testid="supervision-viewer-stub"]')

describe('TerminalSessionView — supervisor mode (?group=<classId>)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('reads the session from the class listing, never from the self-scoped one', async () => {
    serve({})
    await mountView({ group: GROUP })

    expect(calledGroupList(), 'GET /terminals/user-sessions?group_id=g1 was called').toBe(true)
    expect(calledSelfScopedList(), 'the self-scoped GET /terminals/user-sessions was called').toBe(false)
  })

  it("shows the learner's screen in the supervision viewer, in place of the learner console", async () => {
    serve({})
    const wrapper = await mountView({ group: GROUP })

    expect(viewer(wrapper).exists(), 'SupervisionViewer is rendered').toBe(true)
    expect(viewer(wrapper).attributes('data-session-id')).toBe('sess-test')
    expect(viewer(wrapper).attributes('data-learner-name')).toBe(LEARNER_NAME)
    expect(viewer(wrapper).attributes('data-compact')).toBe('false')
    expect(wrapper.find('[data-testid="learner-console-stub"]').exists()).toBe(false)
  })

  it("names the learner in the page header", async () => {
    serve({})
    const wrapper = await mountView({ group: GROUP })

    const name = wrapper.find('[data-testid="supervisor-learner-name"]')
    expect(name.exists(), '[data-testid="supervisor-learner-name"] is rendered').toBe(true)
    expect(name.text()).toContain(LEARNER_NAME)
  })

  it("shows the run's progress from the teacher endpoint, not the learner's scenario panel", async () => {
    serve({})
    const wrapper = await mountView({ group: GROUP })

    expect(
      getCalls().some(c => c.path === `/teacher/groups/${GROUP}/sessions/ss-1/detail`),
      'GET /teacher/groups/g1/sessions/ss-1/detail was called'
    ).toBe(true)
    expect(calledLearnerRunLookups(), 'a learner-only /scenario-sessions/* read was called').toBe(false)

    const progress = wrapper.find('[data-testid="supervisor-progress"]')
    expect(progress.exists(), '[data-testid="supervisor-progress"] is rendered').toBe(true)
    expect(progress.text()).toContain('Docker basics')
    expect(progress.text()).toContain('Run a container')
    // The learner's older run lives on another terminal: it is not this page's.
    expect(progress.text()).not.toContain('Git basics')
    expect(wrapper.find('[data-testid="learner-scenario-panel-stub"]').exists()).toBe(false)
  })

  it('offers none of the learner actions: console toolbar, abandon, briefing', async () => {
    serve({})
    const wrapper = await mountView({ group: GROUP })

    // Supervisor mode is on screen…
    expect(viewer(wrapper).exists(), 'SupervisionViewer is rendered').toBe(true)
    // …and the learner's own controls are not: stop / delete / extend / sharing /
    // exposed ports all live in the learner console's toolbar.
    expect(wrapper.find('[data-testid="learner-console-stub"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="scenario-abandon-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="briefing-toggle"]').exists()).toBe(false)
  })

  it("offers neither Resume nor Delete on a learner's stopped terminal", async () => {
    serve({ groupRows: [terminalRow({ state: 'stopped' })] })
    const wrapper = await mountView({ group: GROUP })

    // The page did load the learner's session in supervisor mode…
    const name = wrapper.find('[data-testid="supervisor-learner-name"]')
    expect(name.exists(), '[data-testid="supervisor-learner-name"] is rendered').toBe(true)
    expect(name.text()).toContain(LEARNER_NAME)
    // …and the paused-terminal banner it would show the learner is not offered.
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="delete-session-cta"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="learner-console-stub"]').exists()).toBe(false)
  })

  it('shows the screen and the name of a terminal that carries no run, and no progress', async () => {
    // Karim's in-progress run is on another terminal: this one is a plain terminal.
    serve({ details: { 'ss-1': runDetail({ terminal_session_id: 'sess-elsewhere' }), 'ss-done': olderRunDetail } })
    const wrapper = await mountView({ group: GROUP })

    expect(viewer(wrapper).exists(), 'SupervisionViewer is rendered').toBe(true)
    const name = wrapper.find('[data-testid="supervisor-learner-name"]')
    expect(name.exists(), '[data-testid="supervisor-learner-name"] is rendered').toBe(true)
    expect(name.text()).toContain(LEARNER_NAME)
    expect(wrapper.find('[data-testid="supervisor-progress"]').exists()).toBe(false)
    expect(calledLearnerRunLookups()).toBe(false)
  })

  describe('a caller the class refuses gets the normal not-found state', () => {
    it('when the class listing answers 403 (an outsider, another learner)', async () => {
      serve({ groupRows: { status: 403 } })
      const wrapper = await mountView({ group: GROUP })

      expect(calledGroupList(), 'GET /terminals/user-sessions?group_id=g1 was called').toBe(true)
      const errorSection = wrapper.find('.error-section')
      expect(errorSection.exists()).toBe(true)
      expect(errorSection.text()).toContain('Session not found.')
      // Indistinguishable from any other miss: the refusal's wording is not shown.
      expect(errorSection.text()).not.toContain('not a manager')
      expect(viewer(wrapper).exists()).toBe(false)
      // Nothing else is tried in its place.
      expect(calledSelfScopedList(), 'the self-scoped GET /terminals/user-sessions was called').toBe(false)
      expect(calledLearnerRunLookups(), 'a learner-only /scenario-sessions/* read was called').toBe(false)
    })

    it("when the class listing does not hold the session", async () => {
      serve({ groupRows: [otherLearnerRow] })
      const wrapper = await mountView({ group: GROUP })

      expect(calledGroupList(), 'GET /terminals/user-sessions?group_id=g1 was called').toBe(true)
      expect(wrapper.find('.error-section').text()).toContain('Session not found.')
      expect(viewer(wrapper).exists()).toBe(false)
      expect(wrapper.find('[data-testid="supervisor-learner-name"]').exists()).toBe(false)
      expect(calledSelfScopedList(), 'the self-scoped GET /terminals/user-sessions was called').toBe(false)
      expect(calledLearnerRunLookups(), 'a learner-only /scenario-sessions/* read was called').toBe(false)
    })
  })
})

describe('TerminalSessionView — without ?group the page stays the learner page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('reads the self-scoped list and shows the learner console, never the supervision viewer', async () => {
    // The caller's own terminal, opened from My Sessions.
    serve({ ownRows: [terminalRow({ user_id: 'u-trainer' })] })
    const wrapper = await mountView({})

    expect(calledSelfScopedList()).toBe(true)
    expect(calledGroupList()).toBe(false)
    expect(getCalls().some(c => c.path.startsWith('/teacher/'))).toBe(false)
    expect(wrapper.find('[data-testid="learner-console-stub"]').exists()).toBe(true)
    expect(viewer(wrapper).exists()).toBe(false)
    expect(wrapper.find('[data-testid="supervisor-learner-name"]').exists()).toBe(false)
  })
})
