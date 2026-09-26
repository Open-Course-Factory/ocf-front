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
 * so the card must offer the two ways forward: Rebuild & resume — POST
 * /scenario-sessions/:id/resume builds a new machine at the learner's step,
 * which can take longer than a launch, so the wait follows the deadline the
 * backend returns — and Start over, which abandons the run and launches a
 * fresh one. Paused runs get Start over too: their Resume is kept.
 *
 * A resume the backend refuses is explained in the learner's words — each
 * refusal says what to do next — never a generic failure.
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

  it('says the environment is lost and names the step it resumes at', async () => {
    const wrapper = mountLauncher()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-card"]').text())
      .toContain('Environment lost — rebuild and resume at step 4')
  })

  it('offers Rebuild & resume and Start over, not a Resume into the gone terminal', async () => {
    const wrapper = mountLauncher()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-rebuild-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="scenario-start-over-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="scenario-resume-btn"]').exists()).toBe(false)
  })

  it('rebuilds, waits within the returned deadline, then opens the new terminal', async () => {
    resumeSessionMock.mockResolvedValue(REBUILDING)

    await mountAndClick('scenario-rebuild-btn')

    expect(resumeSessionMock).toHaveBeenCalledWith('sess-1')
    expect(pollProvisioningStatusMock).toHaveBeenCalledWith(
      'sess-1',
      expect.any(Function),
      expect.anything(),
      expect.objectContaining({ deadlineSeconds: 900 })
    )
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

  it.each([
    ['the run is over', refusal(409, { reason: 'run_over', error_message: 'This run is over and cannot be resumed.' }),
      [/this run is over/i, /start over/i]],
    ['a resume could not be settled', refusal(503, { reason: 'resume_retry', error_message: 'Your environment could not be resumed right now. Please try again.' }),
      [/try again/i]],
    ['the plan no longer allows the machine', refusal(403, { reason: 'not_in_plan', error_message: 'Your plan does not cover the machine this scenario needs.' }),
      [/plan no longer allows this machine/i, /start over or ask your trainer/i]],
    ['the scenario was archived', refusal(409, { error_message: 'scenario is archived' }),
      [/can.t be rebuilt/i, /start over or abandon/i]],
    ['the learner lost access', refusal(403, { error_message: 'No access to this scenario' }),
      [/can.t be rebuilt/i, /start over or abandon/i]],
  ])('explains a refusal when %s', async (_label, err, expected) => {
    resumeSessionMock.mockRejectedValue(err)

    await mountAndClick('scenario-rebuild-btn')

    expect(showErrorMock).toHaveBeenCalledTimes(1)
    const message = String(showErrorMock.mock.calls[0][0])
    for (const pattern of expected as RegExp[]) expect(message).toMatch(pattern)
    // Nothing is opened on a refusal.
    expect(routerPushMock).not.toHaveBeenCalled()
  })

  it.each([
    ['run_over', refusal(409, { reason: 'run_over', error_message: 'This run is over and cannot be resumed.' })],
    ['resume_retry', refusal(503, { reason: 'resume_retry', error_message: 'Your environment could not be resumed right now. Please try again.' })],
    ['not_in_plan', refusal(403, { reason: 'not_in_plan', error_message: 'Your plan does not cover the machine this scenario needs.' })],
    ['archived', refusal(409, { error_message: 'scenario is archived' })],
    ['no access', refusal(403, { error_message: 'No access to this scenario' })],
  ])('explains the %s refusal in French, not in the backend\'s English', async (_label, err) => {
    resumeSessionMock.mockRejectedValue(err)

    await mountAndClick('scenario-rebuild-btn', 'en')
    const english = String(showErrorMock.mock.calls[0][0])
    showErrorMock.mockClear()

    await mountAndClick('scenario-rebuild-btn', 'fr')
    const french = String(showErrorMock.mock.calls[0][0])

    expect(french).not.toBe(english)
    expect(french).not.toBe((err as any).response.data.error_message)
  })

  it('reloads the card when another resume of the run is already under way', async () => {
    resumeSessionMock.mockRejectedValue(refusal(409, { reason: 'resume_in_progress', error_message: 'This run is already being resumed.' }))

    await mountAndClick('scenario-rebuild-btn')

    // A double click, or a second tab: not an error — the card catches up.
    expect(showErrorMock).not.toHaveBeenCalled()
    expect(listScenariosMock.mock.calls.length).toBeGreaterThan(1)
  })
})
