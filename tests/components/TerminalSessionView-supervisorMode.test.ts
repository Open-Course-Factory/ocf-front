/**
 * The session page in supervisor mode (#385).
 *
 * A class manager opens a learner's session page from the class:
 * `/terminal-session/:sessionId?group=<classId>`. Every read the learner's page
 * makes is self-scoped (its own session list, its own console, its own run), so
 * for a manager it used to answer "Session not found". With `group` in the
 * query the page reads the class instead, in as few calls as it takes:
 *   - ONE bulk read of the class, GET /class-groups/<classId>/participant-controls
 *     (ocf-core #580): the participant whose `sessions[]` holds this terminal
 *     gives the learner's name, the terminal's state and, when a scenario run
 *     lives on it, that run's id;
 *   - when there is a run, ONE call for its progress,
 *     GET /teacher/groups/<classId>/sessions/<runId>/detail — never a loop over
 *     the learner's assignments, never /scenario-sessions/* (learner-only);
 *   - the screen is the SupervisionViewer (watch / take the hand, audited), not
 *     the learner's console;
 *   - none of the learner's own actions, and "Back to class" leads to the
 *     class's live wall.
 *
 * The bulk read carries everything the supervisor view uses, so the page does
 * not also read GET /terminals/user-sessions: that row's extra fields (expiry,
 * persistence mode, size) only feed the learner's countdown, Stop and Resume.
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
const PARTICIPANT_CONTROLS = `/class-groups/${GROUP}/participant-controls`

const futureExpiry = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()

/** One of a participant's terminals, as the class bulk read lists it. */
function controlSession(overrides: Record<string, unknown> = {}) {
  return {
    session_id: 'sess-test',
    state: 'running',
    network_feature: false,
    network_disabled: false,
    scenario_session_id: 'ss-1',
    scenario_title: 'Docker basics',
    ...overrides
  }
}

/** Karim's older terminal, which carries an older run: never this page's. */
const olderTerminal = controlSession({
  session_id: 'sess-old', state: 'stopped', scenario_session_id: 'ss-done', scenario_title: 'Git basics'
})

function karim(sessions: unknown[]) {
  return {
    user_id: LEARNER_ID,
    user_name: LEARNER_NAME,
    class_block: null,
    org_block: null,
    global_block: null,
    sessions
  }
}

/** Another learner of the class, so the page must pick the right participant. */
const lea = {
  user_id: 'u-lea', user_name: 'Lea Other', class_block: null, org_block: null, global_block: null,
  sessions: [controlSession({ session_id: 'sess-lea', scenario_session_id: 'ss-lea', scenario_title: 'Lea run' })]
}

/** The trainer's own terminals: what the self-scoped listing answers. */
const trainerOwnRows = [{
  id: 'term-row-9', session_id: 'sess-mine', user_id: 'u-trainer',
  name: 'My terminal', state: 'running', persistence_mode: 'persistent', expires_at: futureExpiry()
}]

/** A run's progress, as the teacher endpoint describes it. */
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

const allDetails: Record<string, unknown> = {
  'ss-1': runDetail(),
  'ss-done': runDetail({
    session_id: 'ss-done', scenario_id: 'sc-git', scenario_title: 'Git basics', status: 'completed',
    terminal_session_id: 'sess-old',
    steps: [{ step_order: 0, step_title: 'Init a repository', step_type: 'terminal', status: 'completed', verify_attempts: 1, hints_revealed: 0, time_spent_seconds: 30 }]
  }),
  'ss-lea': runDetail({ session_id: 'ss-lea', user_id: 'u-lea', user_name: 'Lea Other', scenario_title: 'Lea run', terminal_session_id: 'sess-lea' })
}

interface Backend {
  /** What the self-scoped GET /terminals/user-sessions answers: the caller's own terminals. */
  ownRows?: unknown[]
  /** What the class bulk read answers: participants, or an error status. */
  participants?: unknown[] | { status: number }
  /** Run id → progress; an error status makes that detail call fail. */
  details?: Record<string, unknown>
  detailStatus?: number
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

function callsTo(path: string) {
  return getCalls().filter(c => c.path === path)
}

function detailCalls() {
  return getCalls().filter(c => /^\/teacher\/groups\/[^/]+\/sessions\/[^/]+\/detail$/.test(c.path))
}

function calledSessionLists(): boolean {
  return getCalls().some(c => c.path === '/terminals/user-sessions')
}

function calledLearnerRunLookups(): boolean {
  return getCalls().some(c => c.path.startsWith('/scenario-sessions/'))
}

function calledOtherClassReads(): boolean {
  return getCalls().some(c =>
    c.path.endsWith('/live-progress') ||
    c.path === '/group-members' ||
    c.path.endsWith('/terminal-sessions') ||
    c.path.endsWith('/sessions/details')
  )
}

function rejection(status: number, message = 'refused') {
  return Promise.reject({ response: { status, data: { error_message: message } } })
}

function serve(backend: Backend = {}) {
  const ownRows = backend.ownRows ?? trainerOwnRows
  const participants = backend.participants ?? [lea, karim([olderTerminal, controlSession()])]
  const details = backend.details ?? allDetails

  mockAxiosGet.mockImplementation((...args: any[]) => {
    const { path, params } = callOf(args)

    if (path === PARTICIPANT_CONTROLS) {
      if (!Array.isArray(participants)) return rejection(participants.status, 'You are not a manager of this group')
      return Promise.resolve({ data: participants })
    }
    if (path.startsWith('/class-groups/') && path.endsWith('/participant-controls')) {
      return rejection(403, 'You are not a manager of this group')
    }
    const detailMatch = path.match(new RegExp(`^/teacher/groups/${GROUP}/sessions/([^/]+)/detail$`))
    if (detailMatch) {
      if (backend.detailStatus) return rejection(backend.detailStatus, 'scenario is not assigned to this group')
      const detail = details[detailMatch[1]]
      return detail ? Promise.resolve({ data: detail }) : rejection(404, 'session not found')
    }
    if (path === '/terminals/user-sessions' && !params.group_id) return Promise.resolve({ data: ownRows })
    // The learner-only reads: a manager is refused them.
    if (path.startsWith('/scenario-sessions/')) return rejection(403, 'Access denied')
    return rejection(404, 'not found')
  })

  mockAxiosPost.mockResolvedValue({ data: {} })
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

async function mountView(query: Record<string, string>, locale: 'en' | 'fr' = 'en') {
  for (const key of Object.keys(routeQuery)) delete routeQuery[key]
  Object.assign(routeQuery, query)
  setActivePinia(createPinia())
  const wrapper = mount(TerminalSessionView, {
    global: {
      plugins: [createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
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

type View = Awaited<ReturnType<typeof mountView>>

const viewer = (wrapper: View) => wrapper.find('[data-testid="supervision-viewer-stub"]')
const learnerName = (wrapper: View) => wrapper.find('[data-testid="supervisor-learner-name"]')

/** A router-link target as a path, whether it was given as a string or as { path, query }. */
function targetOf(to: unknown): string {
  if (typeof to === 'string') return to
  const { path, query } = (to ?? {}) as { path?: string; query?: Record<string, string> }
  const search = new URLSearchParams(query ?? {}).toString()
  return `${path ?? ''}${search ? `?${search}` : ''}`
}

describe('TerminalSessionView — supervisor mode (?group=<classId>)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('reads the class once, through the participant bulk read, and no session list', async () => {
    serve()
    await mountView({ group: GROUP })

    expect(callsTo(PARTICIPANT_CONTROLS), `GET ${PARTICIPANT_CONTROLS} is called once`).toHaveLength(1)
    expect(calledSessionLists(), 'GET /terminals/user-sessions (self- or group-scoped) was called').toBe(false)
    expect(calledOtherClassReads(), 'another class read (live-progress, roster, wall) was called').toBe(false)
  })

  it("shows the learner's screen in the supervision viewer, in place of the learner console", async () => {
    serve()
    const wrapper = await mountView({ group: GROUP })

    expect(viewer(wrapper).exists(), 'SupervisionViewer is rendered').toBe(true)
    expect(viewer(wrapper).attributes('data-session-id')).toBe('sess-test')
    expect(viewer(wrapper).attributes('data-learner-name')).toBe(LEARNER_NAME)
    expect(viewer(wrapper).attributes('data-compact')).toBe('false')
    expect(wrapper.find('[data-testid="learner-console-stub"]').exists()).toBe(false)
  })

  it('names the learner in the page header, from the participant holding this terminal', async () => {
    serve()
    const wrapper = await mountView({ group: GROUP })

    expect(learnerName(wrapper).exists(), '[data-testid="supervisor-learner-name"] is rendered').toBe(true)
    expect(learnerName(wrapper).text()).toContain(LEARNER_NAME)
    expect(learnerName(wrapper).text()).not.toContain('Lea Other')
  })

  it("shows this terminal's run progress with exactly one detail call, not the learner's scenario panel", async () => {
    serve()
    const wrapper = await mountView({ group: GROUP })

    expect(
      detailCalls().map(c => c.path),
      'exactly one GET /teacher/groups/g1/sessions/<run>/detail, for the run on this terminal'
    ).toEqual([`/teacher/groups/${GROUP}/sessions/ss-1/detail`])
    expect(calledOtherClassReads(), 'another class read (live-progress, roster, wall) was called').toBe(false)
    expect(calledLearnerRunLookups(), 'a learner-only /scenario-sessions/* read was called').toBe(false)

    const progress = wrapper.find('[data-testid="supervisor-progress"]')
    expect(progress.exists(), '[data-testid="supervisor-progress"] is rendered').toBe(true)
    expect(progress.text()).toContain('Docker basics')
    expect(progress.text()).toContain('Run a container')
    // Karim's older run lives on another terminal: it is not this page's.
    expect(progress.text()).not.toContain('Git basics')
    expect(wrapper.find('[data-testid="learner-scenario-panel-stub"]').exists()).toBe(false)
  })

  it('shows the screen and the name of a terminal that carries no run, without any detail call', async () => {
    // This terminal is a plain one; Karim's run is on another terminal.
    serve({
      participants: [lea, karim([
        { session_id: 'sess-test', state: 'running', network_feature: false, network_disabled: false },
        controlSession({ session_id: 'sess-elsewhere' })
      ])]
    })
    const wrapper = await mountView({ group: GROUP })

    expect(viewer(wrapper).exists(), 'SupervisionViewer is rendered').toBe(true)
    expect(learnerName(wrapper).exists(), '[data-testid="supervisor-learner-name"] is rendered').toBe(true)
    expect(learnerName(wrapper).text()).toContain(LEARNER_NAME)
    expect(wrapper.find('[data-testid="supervisor-progress"]').exists()).toBe(false)
    expect(detailCalls(), 'no run lives on this terminal: no detail call').toHaveLength(0)
    expect(calledOtherClassReads(), 'another class read (live-progress, roster, wall) was called').toBe(false)
    expect(calledLearnerRunLookups(), 'a learner-only /scenario-sessions/* read was called').toBe(false)
  })

  it('keeps the screen and the name when the progress read fails: only the progress is lost', async () => {
    serve({ detailStatus: 403 })
    const wrapper = await mountView({ group: GROUP })

    expect(wrapper.find('.error-section').exists(), 'the page fell into its error state').toBe(false)
    expect(viewer(wrapper).exists(), 'SupervisionViewer is rendered').toBe(true)
    expect(learnerName(wrapper).exists(), '[data-testid="supervisor-learner-name"] is rendered').toBe(true)
    expect(wrapper.find('[data-testid="supervisor-progress"]').exists()).toBe(false)
  })

  it('offers none of the learner actions: console toolbar, abandon, briefing', async () => {
    serve()
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
    serve({ participants: [lea, karim([controlSession({ state: 'stopped' })])] })
    const wrapper = await mountView({ group: GROUP })

    // The page did load the learner's session in supervisor mode…
    expect(learnerName(wrapper).exists(), '[data-testid="supervisor-learner-name"] is rendered').toBe(true)
    expect(learnerName(wrapper).text()).toContain(LEARNER_NAME)
    // …and the paused-terminal banner it would show the learner is not offered.
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="delete-session-cta"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="learner-console-stub"]').exists()).toBe(false)
  })

  it.each([
    ['en', 'Back to class'],
    ['fr', 'Retour à la classe']
  ] as const)('leads back to the class live wall (%s)', async (locale, label) => {
    serve()
    const wrapper = await mountView({ group: GROUP }, locale)

    const back = wrapper.findAllComponents(RouterLinkStub).find(link => link.text().includes(label))
    expect(back, `a router-link labelled "${label}"`).toBeDefined()
    expect(targetOf(back!.props('to'))).toBe(`/classes/${GROUP}/live?view=wall`)
    // The learner's way back is not offered to the trainer.
    expect(wrapper.text()).not.toContain(locale === 'en' ? 'Back to My Sessions' : 'Retour aux sessions')
  })

  describe('a caller the class refuses gets the normal not-found state', () => {
    it('when the class bulk read answers 403 (an outsider, another learner)', async () => {
      serve({ participants: { status: 403 } })
      const wrapper = await mountView({ group: GROUP })

      expect(callsTo(PARTICIPANT_CONTROLS), `GET ${PARTICIPANT_CONTROLS} is called once`).toHaveLength(1)
      const errorSection = wrapper.find('.error-section')
      expect(errorSection.exists(), 'the not-found state is rendered').toBe(true)
      expect(errorSection.text()).toContain('Session not found.')
      // Indistinguishable from any other miss: the refusal's wording is not shown.
      expect(errorSection.text()).not.toContain('not a manager')
      expect(viewer(wrapper).exists()).toBe(false)
      expect(learnerName(wrapper).exists()).toBe(false)
      // Nothing else is tried in its place.
      expect(calledSessionLists(), 'GET /terminals/user-sessions was called').toBe(false)
      expect(detailCalls(), 'a detail call was made').toHaveLength(0)
      expect(calledLearnerRunLookups(), 'a learner-only /scenario-sessions/* read was called').toBe(false)
    })

    it('when no participant of the class holds the session', async () => {
      serve({ participants: [lea, karim([olderTerminal])] })
      const wrapper = await mountView({ group: GROUP })

      expect(callsTo(PARTICIPANT_CONTROLS), `GET ${PARTICIPANT_CONTROLS} is called once`).toHaveLength(1)
      const errorSection = wrapper.find('.error-section')
      expect(errorSection.exists(), 'the not-found state is rendered').toBe(true)
      expect(errorSection.text()).toContain('Session not found.')
      expect(viewer(wrapper).exists()).toBe(false)
      expect(learnerName(wrapper).exists()).toBe(false)
      expect(calledSessionLists(), 'GET /terminals/user-sessions was called').toBe(false)
      expect(detailCalls(), 'a detail call was made').toHaveLength(0)
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
    serve({
      ownRows: [{
        id: 'term-row-1', session_id: 'sess-test', user_id: 'u-trainer', name: 'My terminal',
        state: 'running', persistence_mode: 'persistent', expires_at: futureExpiry()
      }]
    })
    const wrapper = await mountView({})

    expect(getCalls().some(c => c.path === '/terminals/user-sessions' && !c.params.group_id)).toBe(true)
    expect(callsTo(PARTICIPANT_CONTROLS)).toHaveLength(0)
    expect(getCalls().some(c => c.path.startsWith('/teacher/'))).toBe(false)
    expect(wrapper.find('[data-testid="learner-console-stub"]').exists()).toBe(true)
    expect(viewer(wrapper).exists()).toBe(false)
    expect(learnerName(wrapper).exists()).toBe(false)
    const back = wrapper.findAllComponents(RouterLinkStub).find(link => link.text().includes('Back to My Sessions'))
    expect(back, 'the learner keeps "Back to My Sessions"').toBeDefined()
  })
})
