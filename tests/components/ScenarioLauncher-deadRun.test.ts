/**
 * A past run must never leave the card with no way forward.
 *
 * A learner came back the day after playing a scenario. His container had
 * expired overnight, but the session row still read `status: 'active'` — the
 * backend only notices when something looks — and the launcher re-derived
 * "in progress" from that status. The card offered a single button, Resume,
 * into a container deleted 21 hours earlier, and no way to start again.
 *
 * The launcher now reads the backend's `resumable` verdict instead of the raw
 * status, and the relaunch button is disabled rather than removed when
 * something blocks it, so the card always says what it can do.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const routerPushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPushMock }),
}))

const showErrorMock = vi.fn()
const showConfirmMock = vi.fn().mockResolvedValue(true)
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: (...args: any[]) => showErrorMock(...args),
    showConfirm: (...args: any[]) => showConfirmMock(...args),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn(),
  })
}))

const listScenariosMock = vi.fn()
const getMySessionsMock = vi.fn()
const launchScenarioMock = vi.fn()
const abandonSessionMock = vi.fn().mockResolvedValue(undefined)
const resumeSessionMock = vi.fn()
const pollProvisioningStatusMock = vi.fn().mockResolvedValue(undefined)
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    listScenarios: (...args: any[]) => listScenariosMock(...args),
    getMyScenarioSessions: (...args: any[]) => getMySessionsMock(...args),
    launchScenario: (...args: any[]) => launchScenarioMock(...args),
    abandonSession: (...args: any[]) => abandonSessionMock(...args),
    resumeSession: (...args: any[]) => resumeSessionMock(...args),
  },
  pollProvisioningStatus: (...args: any[]) => pollProvisioningStatusMock(...args),
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

function mountLauncher(locale: 'en' | 'fr' = 'en') {
  return mount(ScenarioLauncher, {
    global: {
      plugins: [createI18n({
        legacy: false,
        locale,
        fallbackLocale: 'en',
        messages: { en: {}, fr: {} },
        missingWarn: false,
        fallbackWarn: false,
      })],
      stubs: {
        AdminBadge: true,
        ScenarioProvisioningOverlay: true,
        // Expose the target so the tests can check where Resume leads.
        'router-link': { props: ['to'], template: '<a :data-to="JSON.stringify(to)"><slot /></a>' },
      }
    }
  })
}

const SCENARIO = { id: 'sc1', name: 'GameShell', title: 'GameShell', launchable: true }

// The session the backend still calls "active" because nothing has looked at
// its terminal yet — but which it reports as not resumable.
const DEAD_RUN = {
  id: 'sess-1',
  scenario_id: 'sc1',
  scenario_title: 'GameShell',
  status: 'active',
  resumable: false,
  terminal_session_id: 'term-gone',
  current_step: 4,
  total_steps: 36,
  completed_steps: 4,
  started_at: new Date().toISOString(),
}

describe('ScenarioLauncher — a run whose terminal is gone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listScenariosMock.mockResolvedValue([SCENARIO])
  })

  it('offers a relaunch instead of a resume', async () => {
    getMySessionsMock.mockResolvedValue([DEAD_RUN])

    const wrapper = mountLauncher()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-resume-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="scenario-relaunch-btn"]').exists()).toBe(true)
  })

  it('still offers a resume for a run that is genuinely live', async () => {
    getMySessionsMock.mockResolvedValue([{ ...DEAD_RUN, resumable: true }])

    const wrapper = mountLauncher()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-resume-btn"]').exists()).toBe(true)
  })

  it('keeps the relaunch button on the card when a launch is blocked, disabled', async () => {
    getMySessionsMock.mockResolvedValue([DEAD_RUN])
    listScenariosMock.mockResolvedValue([
      { ...SCENARIO, launchable: false, block_reason: 'size_over_plan' }
    ])

    const wrapper = mountLauncher()
    await flushPromises()

    const relaunch = wrapper.find('[data-testid="scenario-relaunch-btn"]')
    expect(relaunch.exists()).toBe(true)
    expect(relaunch.attributes('disabled')).toBeDefined()
  })
})

/**
 * A paused run must read as paused, not as "in progress".
 *
 * When the platform stops a persistent scenario terminal (the learner's Stop,
 * or an idle/TTL auto-stop), ocf-core keeps the run open and resumable: the
 * container's disk is preserved and the run goes on at the same step once the
 * terminal is started again. GET /scenario-sessions/available reports that as
 * `active_session_resume_mode: "paused"` next to the active-session fields.
 *
 * The card must say so — "Paused", with the step the learner will be back at —
 * while Resume still opens the session view, where the paused banner restarts
 * the terminal. A live run keeps today's rendering.
 */

// The card as GET /scenario-sessions/available returns it for a scenario the
// learner already has a run of: blocked with session_exists, naming the run.
function cardWithRun(resumeMode: 'live' | 'paused' | 'rebuild') {
  return {
    id: 'sc1',
    name: 'GameShell',
    title: 'GameShell',
    launchable: false,
    block_reason: 'session_exists',
    active_session_id: 'sess-1',
    active_terminal_session_id: 'term-1',
    active_session_resume_mode: resumeMode,
  }
}

// The same run as GET /scenario-sessions/my lists it. The availability card
// carries no step, so this is where "resume at step N" comes from. With three
// steps done, the learner is back at step 4 — current_step 4 agrees whether
// step orders are 0- or 1-based here.
function myRun(resumeMode: 'live' | 'paused' | 'rebuild') {
  return {
    id: 'sess-1',
    scenario_id: 'sc1',
    scenario_title: 'GameShell',
    status: 'active',
    resumable: true,
    resume_mode: resumeMode,
    terminal_session_id: 'term-1',
    current_step: 4,
    total_steps: 36,
    completed_steps: 3,
    started_at: new Date().toISOString(),
  }
}

describe('paused run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a paused state on the card', async () => {
    listScenariosMock.mockResolvedValue([cardWithRun('paused')])
    getMySessionsMock.mockResolvedValue([myRun('paused')])

    const wrapper = mountLauncher()
    await flushPromises()

    const badge = wrapper.find('[data-testid="scenario-paused-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toMatch(/Paused/)
  })

  it('says which step the run resumes at', async () => {
    listScenariosMock.mockResolvedValue([cardWithRun('paused')])
    getMySessionsMock.mockResolvedValue([myRun('paused')])

    const wrapper = mountLauncher()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-card"]').text()).toMatch(/step 4\b/i)
  })

  it('shows the paused state in French', async () => {
    listScenariosMock.mockResolvedValue([cardWithRun('paused')])
    getMySessionsMock.mockResolvedValue([myRun('paused')])

    const wrapper = mountLauncher('fr')
    await flushPromises()

    const badge = wrapper.find('[data-testid="scenario-paused-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toMatch(/En pause/)
  })

  it('still resumes into the session view of that run', async () => {
    listScenariosMock.mockResolvedValue([cardWithRun('paused')])
    getMySessionsMock.mockResolvedValue([myRun('paused')])

    const wrapper = mountLauncher()
    await flushPromises()

    const resume = wrapper.find('[data-testid="scenario-resume-btn"]')
    expect(resume.exists()).toBe(true)
    const to = JSON.parse(resume.attributes('data-to') as string)
    expect(to).toEqual({ name: 'TerminalSessionView', params: { sessionId: 'term-1' } })
    // A paused run is not a past run: no relaunch offered in its place.
    expect(wrapper.find('[data-testid="scenario-relaunch-btn"]').exists()).toBe(false)
  })

  it('keeps today\'s rendering for a live run — no paused badge', async () => {
    listScenariosMock.mockResolvedValue([cardWithRun('live')])
    getMySessionsMock.mockResolvedValue([myRun('live')])

    const wrapper = mountLauncher()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-paused-badge"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="scenario-resume-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="scenario-card"]').text()).toContain('Scenario in progress')
  })
})

/**
 * A run whose container is gone but which is not over: rebuild and resume.
 *
 * ocf-core keeps a normal run open when its container disappears (TTL, a
 * deleted terminal, a non-persistent plan) and reports it as
 * `resume_mode: 'rebuild'`. Launching again is refused with session_exists,
 * so the card must offer the two ways forward: Rebuild and resume — POST
 * /scenario-sessions/:id/resume builds a new machine at the learner's step —
 * and Start over, which abandons the run and launches a fresh one. Paused runs
 * get Start over too: their Resume is kept.
 *
 * The card does not wait for the rebuild: it opens the new terminal as soon as
 * the resume answers, and the session view shows the replay (and reports a
 * replay that fails) in one place for every entry point.
 *
 * A resume the backend refuses is explained in the learner's words, by cause,
 * and never sends the learner to an action that would be refused too: Start
 * over only when a launch can succeed, and never Start over or Abandon for a
 * budget miss, which is transient — the org budget is shared by the class.
 */
describe('run to rebuild', () => {
  const REBUILDING = {
    terminal_session_id: 'term-new',
    scenario_session_id: 'sess-1',
    status: 'provisioning',
    provisioning_phase: 'replay',
    provisioning_timeout_seconds: 900,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    listScenariosMock.mockResolvedValue([cardWithRun('rebuild')])
    getMySessionsMock.mockResolvedValue([myRun('rebuild')])
    showConfirmMock.mockResolvedValue(true)
    abandonSessionMock.mockResolvedValue(undefined)
    pollProvisioningStatusMock.mockResolvedValue(undefined)
  })

  async function mountAndClick(testid: string, locale: 'en' | 'fr' = 'en') {
    const wrapper = mountLauncher(locale)
    await flushPromises()
    const button = wrapper.find(`[data-testid="${testid}"]`)
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    await flushPromises()
    return wrapper
  }

  it('says the environment is lost, the progress kept, and at which step', async () => {
    const wrapper = mountLauncher()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-card"]').text())
      .toContain('Environment lost — progress kept (step 4)')
  })

  it('offers Rebuild and resume and Start over, not a Resume into the gone terminal', async () => {
    const wrapper = mountLauncher()
    await flushPromises()

    const rebuild = wrapper.find('[data-testid="scenario-rebuild-btn"]')
    expect(rebuild.exists()).toBe(true)
    // One spelling everywhere, the session view's banner included.
    expect(rebuild.text()).toBe('Rebuild and resume')
    expect(wrapper.find('[data-testid="scenario-start-over-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="scenario-resume-btn"]').exists()).toBe(false)
  })

  it('names the button the same way in French', async () => {
    const wrapper = mountLauncher('fr')
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-rebuild-btn"]').text()).toBe('Reconstruire et reprendre')
  })

  it('opens the new terminal as soon as the resume answers, without waiting for the replay', async () => {
    resumeSessionMock.mockResolvedValue(REBUILDING)

    await mountAndClick('scenario-rebuild-btn')

    expect(resumeSessionMock).toHaveBeenCalledWith('sess-1')
    // The session view shows the replay and reports its failure.
    expect(pollProvisioningStatusMock).not.toHaveBeenCalled()
    expect(routerPushMock).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'term-new' } })
    expect(showErrorMock).not.toHaveBeenCalled()
  })

  it('goes straight to the terminal when the run turned out to be live', async () => {
    resumeSessionMock.mockResolvedValue({ terminal_session_id: 'term-1', scenario_session_id: 'sess-1', status: 'active' })

    await mountAndClick('scenario-rebuild-btn')

    expect(pollProvisioningStatusMock).not.toHaveBeenCalled()
    expect(routerPushMock).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'term-1' } })
  })

  it('Start over abandons the run, then launches a fresh one', async () => {
    launchScenarioMock.mockResolvedValue({ terminal_session_id: 'term-fresh', scenario_session_id: 'sess-2', status: 'active' })

    await mountAndClick('scenario-start-over-btn')

    expect(showConfirmMock).toHaveBeenCalled()
    expect(abandonSessionMock).toHaveBeenCalledWith('sess-1')
    expect(launchScenarioMock).toHaveBeenCalledWith('sc1', expect.anything())
    expect(abandonSessionMock.mock.invocationCallOrder[0])
      .toBeLessThan(launchScenarioMock.mock.invocationCallOrder[0])
    expect(routerPushMock).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'term-fresh' } })
  })

  it('Start over does nothing when the learner cancels', async () => {
    showConfirmMock.mockResolvedValue(false)

    await mountAndClick('scenario-start-over-btn')

    expect(abandonSessionMock).not.toHaveBeenCalled()
    expect(launchScenarioMock).not.toHaveBeenCalled()
  })

  it('offers Start over beside Resume on a paused run', async () => {
    listScenariosMock.mockResolvedValue([cardWithRun('paused')])
    getMySessionsMock.mockResolvedValue([myRun('paused')])
    launchScenarioMock.mockResolvedValue({ terminal_session_id: 'term-fresh', scenario_session_id: 'sess-2', status: 'active' })

    const wrapper = await mountAndClick('scenario-start-over-btn')

    expect(wrapper.find('[data-testid="scenario-resume-btn"]').exists()).toBe(true)
    expect(abandonSessionMock).toHaveBeenCalledWith('sess-1')
    expect(launchScenarioMock).toHaveBeenCalledWith('sc1', expect.anything())
  })

  // Refusals of POST /scenario-sessions/:id/resume, as ocf-core answers them
  // (scenarioLaunchController.ResumeScenario on feat/scenario-resume-by-rebuild).
  const refusal = (status: number, data: Record<string, unknown>) => ({ response: { status, data } })

  const RUN_OVER = refusal(409, { reason: 'run_over', error_message: 'This run is over and cannot be resumed.' })
  const RETRY = refusal(503, { reason: 'resume_retry', error_message: 'Your environment could not be resumed right now. Please try again.' })
  const NOT_IN_PLAN = refusal(403, { reason: 'not_in_plan', error_message: 'Your plan does not cover the machine this scenario needs.' })
  const ARCHIVED = refusal(409, { error_message: 'scenario is archived' })
  const NO_ACCESS = refusal(403, { error_message: 'No access to this scenario' })
  const NO_ENVIRONMENT = refusal(409, { error_message: 'No compatible environment available for this scenario' })
  // httperrors.WriteBudgetRejection: the org budget is shared by the class,
  // so this is the ordinary transient case.
  const BUDGET = refusal(403, { source: 'budget', reason: 'budget_exhausted', error_code: 403, error_message: 'Resource budget exhausted' })
  const DUNNING = refusal(402, { error_code: 'subscription_past_due', source: 'dunning', error_message: 'Your subscription payment is overdue.' })
  const CAPACITY = refusal(503, { error_message: 'Server at capacity. Please try again later.' })
  const SERVER_ERROR = refusal(500, { error_message: 'Failed to resume the scenario run' })

  it.each([
    ['the run is over', RUN_OVER, [/this run is over/i, /start over/i], []],
    ['a resume could not be settled', RETRY, [/try again/i], []],
    // Start over launches the same machine on the same plan: refused too.
    ['the plan no longer covers the machine', NOT_IN_PLAN,
      [/plan no longer covers this machine/i, /ask your trainer/i], [/start over/i]],
    // A launch is refused for these too: only Abandon clears the card.
    ['the scenario was archived', ARCHIVED, [/can no longer be resumed/i, /abandon it/i], [/start over/i]],
    ['the learner lost access', NO_ACCESS, [/can no longer be resumed/i, /abandon it/i], [/start over/i]],
    ['the catalogue has no environment for it any more', NO_ENVIRONMENT,
      [/can no longer be resumed/i, /abandon it/i], [/start over/i]],
    // Transient: never send the learner to destroy their progress.
    ['the plan\'s machines are all in use', BUDGET,
      [/machines are all in use right now/i, /progress is kept/i], [/start over/i, /abandon/i, /rebuil/i]],
    ['the terminal service is at capacity', CAPACITY, [/try again/i], [/Server at capacity/]],
    ['the server failed', SERVER_ERROR, [/try again/i], [/Failed to resume/]],
  ])('explains a refusal when %s', async (_label, err, expected, forbidden) => {
    resumeSessionMock.mockRejectedValue(err)

    await mountAndClick('scenario-rebuild-btn')

    expect(showErrorMock).toHaveBeenCalledTimes(1)
    const message = String(showErrorMock.mock.calls[0][0])
    for (const pattern of expected as RegExp[]) expect(message).toMatch(pattern)
    for (const pattern of forbidden as RegExp[]) expect(message).not.toMatch(pattern)
    // Nothing is opened on a refusal.
    expect(routerPushMock).not.toHaveBeenCalled()
  })

  it.each([
    ['run_over', RUN_OVER],
    ['resume_retry', RETRY],
    ['not_in_plan', NOT_IN_PLAN],
    ['archived', ARCHIVED],
    ['no access', NO_ACCESS],
    ['budget', BUDGET],
    ['capacity', CAPACITY],
    ['server error', SERVER_ERROR],
  ])('explains the %s refusal in French, not in the backend\'s English', async (_label, err) => {
    resumeSessionMock.mockRejectedValue(err)

    await mountAndClick('scenario-rebuild-btn', 'en')
    const english = String(showErrorMock.mock.calls[0][0])
    showErrorMock.mockClear()

    await mountAndClick('scenario-rebuild-btn', 'fr')
    const french = String(showErrorMock.mock.calls[0][0])

    expect(french).not.toBe(english)
    expect(french).not.toContain((err as any).response.data.error_message)
  })

  it('offers the subscription dashboard when a rebuild is refused for an overdue payment', async () => {
    resumeSessionMock.mockRejectedValue(DUNNING)

    await mountAndClick('scenario-rebuild-btn')

    // The dunning treatment the launch already gets (useDunningRejection).
    expect(showConfirmMock).toHaveBeenCalledWith(
      expect.stringMatching(/past due/i),
      expect.stringMatching(/Payment issue/i),
      expect.anything()
    )
    expect(showErrorMock).not.toHaveBeenCalled()
    expect(routerPushMock).toHaveBeenCalledWith('/subscription-dashboard')
  })

  it('explains a budget refusal of the new launch after Start over', async () => {
    launchScenarioMock.mockRejectedValue(BUDGET)

    await mountAndClick('scenario-start-over-btn')

    expect(abandonSessionMock).toHaveBeenCalledWith('sess-1')
    expect(showErrorMock).toHaveBeenCalledTimes(1)
    const message = String(showErrorMock.mock.calls[0][0])
    expect(message).toMatch(/budget|in use/i)
    // Launch words, not resume words: the run it would name is abandoned.
    expect(message).not.toMatch(/rebuil|abandon it/i)
    expect(routerPushMock).not.toHaveBeenCalled()
  })

  it('offers the subscription dashboard when the new launch after Start over is refused for an overdue payment', async () => {
    launchScenarioMock.mockRejectedValue(DUNNING)

    await mountAndClick('scenario-start-over-btn')

    expect(showConfirmMock).toHaveBeenCalledWith(
      expect.stringMatching(/past due/i),
      expect.stringMatching(/Payment issue/i),
      expect.anything()
    )
    expect(showErrorMock).not.toHaveBeenCalled()
    expect(routerPushMock).toHaveBeenCalledWith('/subscription-dashboard')
  })

  it('reloads the card when another resume of the run is already under way', async () => {
    resumeSessionMock.mockRejectedValue(refusal(409, { reason: 'resume_in_progress', error_message: 'This run is already being resumed.' }))

    await mountAndClick('scenario-rebuild-btn')

    // A double click, or a second tab: not an error — the card catches up.
    expect(showErrorMock).not.toHaveBeenCalled()
    expect(listScenariosMock.mock.calls.length).toBeGreaterThan(1)
  })
})
