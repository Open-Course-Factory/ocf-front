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

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: vi.fn(),
    showConfirm: vi.fn().mockResolvedValue(true),
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
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    listScenarios: (...args: any[]) => listScenariosMock(...args),
    getMyScenarioSessions: (...args: any[]) => getMySessionsMock(...args),
    launchScenario: vi.fn(),
    abandonSession: vi.fn().mockResolvedValue(undefined),
  },
  pollProvisioningStatus: vi.fn().mockResolvedValue(undefined),
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
function cardWithRun(resumeMode: 'live' | 'paused') {
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
function myRun(resumeMode: 'live' | 'paused') {
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
