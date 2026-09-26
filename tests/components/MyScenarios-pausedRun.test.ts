/**
 * Scenario history: a paused run reads as paused, and only a resumable run
 * offers Resume.
 *
 * GET /scenario-sessions/my carries `resumable` and `resume_mode` ("live" |
 * "paused", absent when the run cannot be resumed). The page used to offer
 * Resume on `status === 'active'` alone — the same re-derivation that sent the
 * launcher into a container deleted the day before (see
 * ScenarioLauncher-deadRun.test.ts). It must follow the backend's verdict, and
 * show a paused run distinctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const routerPushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPushMock }),
}))

const getMySessionsMock = vi.fn()
const abandonSessionMock = vi.fn().mockResolvedValue(undefined)
const launchScenarioMock = vi.fn()
const resumeSessionMock = vi.fn()
const pollProvisioningStatusMock = vi.fn().mockResolvedValue(undefined)
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getMyScenarioSessions: (...args: any[]) => getMySessionsMock(...args),
    abandonSession: (...args: any[]) => abandonSessionMock(...args),
    launchScenario: (...args: any[]) => launchScenarioMock(...args),
    resumeSession: (...args: any[]) => resumeSessionMock(...args),
  },
  pollProvisioningStatus: (...args: any[]) => pollProvisioningStatusMock(...args),
}))

// Start over and Abandon ask first — whichever way the page asks, the learner
// says yes here.
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

import MyScenarios from '../../src/components/Pages/MyScenarios.vue'

function mountPage(locale: 'en' | 'fr' = 'en') {
  return mount(MyScenarios, {
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
        ProgressBar: true,
        'router-link': { props: ['to'], template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>' },
      }
    }
  })
}

const BASE_RUN = {
  id: 'sess-1',
  scenario_id: 'sc1',
  scenario_title: 'GameShell',
  status: 'active',
  terminal_session_id: 'term-1',
  current_step: 4,
  total_steps: 36,
  completed_steps: 3,
  started_at: new Date().toISOString(),
}

function resumeLinks(wrapper: ReturnType<typeof mountPage>) {
  return wrapper.findAll('.router-link-stub').filter(a => /Resume|Reprendre/.test(a.text()))
}

describe('MyScenarios — paused and non-resumable runs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a paused run as paused', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage()
    await flushPromises()

    const badge = wrapper.find('[data-testid="scenario-paused-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toMatch(/Paused/)
  })

  it('shows the paused state in French', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage('fr')
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-paused-badge"]').text()).toMatch(/En pause/)
  })

  it('still offers Resume on a paused run, into its session view', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage()
    await flushPromises()

    const links = resumeLinks(wrapper)
    expect(links).toHaveLength(1)
    expect(links[0].attributes('data-to')).toContain('term-1')
  })

  it('shows no paused badge on a live run', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'live' }])

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-paused-badge"]').exists()).toBe(false)
    expect(resumeLinks(wrapper)).toHaveLength(1)
  })

  it('offers no Resume on a completed run', async () => {
    getMySessionsMock.mockResolvedValue([
      { ...BASE_RUN, status: 'completed', resumable: false, completed_at: new Date().toISOString(), grade: 100 }
    ])

    const wrapper = mountPage()
    await flushPromises()

    expect(resumeLinks(wrapper)).toHaveLength(0)
    expect(wrapper.find('[data-testid="scenario-paused-badge"]').exists()).toBe(false)
  })

  it('offers no Resume on an "active" run the backend reports as not resumable', async () => {
    // The row still reads active because nothing has looked at its terminal,
    // which is gone. Resume would lead into a dead container.
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: false }])

    const wrapper = mountPage()
    await flushPromises()

    expect(resumeLinks(wrapper)).toHaveLength(0)
  })
})

/**
 * A run the backend reports as not resumable is over, whatever its row says:
 * `status` stays 'active' until something looks at the terminal, which is
 * gone. The card must say so — in the launcher's words ("Previous run ended" /
 * "Session précédente terminée") — and the "Active" filter must not count it,
 * or the learner is sent looking for a run they cannot open.
 */
describe('MyScenarios — an "active" run that cannot be resumed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const DEAD_RUN = { ...BASE_RUN, resumable: false }

  function activeTab(wrapper: ReturnType<typeof mountPage>) {
    return wrapper.findAll('.filter-tab').find(tab => /Active|Actifs/.test(tab.text()))!
  }

  it('reads as ended, not active', async () => {
    getMySessionsMock.mockResolvedValue([DEAD_RUN])

    const wrapper = mountPage()
    await flushPromises()

    const badge = wrapper.find('.status-badge')
    expect(badge.text()).toMatch(/ended/i)
    expect(badge.text()).not.toMatch(/Active/)
  })

  it('reads as ended in French', async () => {
    getMySessionsMock.mockResolvedValue([DEAD_RUN])

    const wrapper = mountPage('fr')
    await flushPromises()

    const badge = wrapper.find('.status-badge')
    expect(badge.text()).toMatch(/terminée/i)
    expect(badge.text()).not.toMatch(/Actif/)
  })

  it('is not counted or listed under Active', async () => {
    getMySessionsMock.mockResolvedValue([DEAD_RUN, { ...BASE_RUN, id: 'sess-2', resumable: true, resume_mode: 'live' }])

    const wrapper = mountPage()
    await flushPromises()

    const tab = activeTab(wrapper)
    expect(tab.find('.tab-count').text()).toBe('1')

    await tab.trigger('click')
    expect(wrapper.findAll('.scenario-card')).toHaveLength(1)
    expect(wrapper.find('.status-badge').text()).not.toMatch(/ended/i)
  })

  it('reads a non-resumable provisioning run as ended too, as the launcher does', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, status: 'provisioning', resumable: false }])

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('.status-badge').text()).toMatch(/ended/i)
  })

  it('leaves completed runs as they were', async () => {
    getMySessionsMock.mockResolvedValue([
      { ...BASE_RUN, status: 'completed', resumable: false, completed_at: new Date().toISOString(), grade: 100 }
    ])

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('.status-badge').text()).toMatch(/Completed/)
    expect(wrapper.find('.status-badge').text()).not.toMatch(/ended/i)
    const completedTab = wrapper.findAll('.filter-tab').find(tab => /Completed/.test(tab.text()))!
    expect(completedTab.find('.tab-count').text()).toBe('1')
  })
})

/**
 * The paused badge names the step to resume at from `completed_steps`. When
 * that field is missing or not a number the badge must fall back to a plain
 * "Paused" — never "resume at step NaN".
 */
describe('MyScenarios — paused badge without a usable step count', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['missing', undefined],
    ['not a number', 'three']
  ])('shows a plain Paused badge when completed_steps is %s', async (_label, completedSteps) => {
    getMySessionsMock.mockResolvedValue([
      { ...BASE_RUN, completed_steps: completedSteps, resumable: true, resume_mode: 'paused' }
    ])

    const wrapper = mountPage()
    await flushPromises()

    const badge = wrapper.find('[data-testid="scenario-paused-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toMatch(/Paused/)
    expect(badge.text()).not.toMatch(/NaN/)
    expect(badge.text()).not.toMatch(/step/i)
  })

  it('still names the step when completed_steps is a number', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, completed_steps: 3, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-paused-badge"]').text()).toMatch(/step 4/)
  })
})

/**
 * A run whose container is gone but which is not over (`resume_mode:
 * 'rebuild'`): the history offers the same ways forward as the launcher card —
 * Rebuild and resume, which builds a new machine at the learner's step and
 * opens it at once (the session view shows the replay), and Start over, which
 * abandons the run and launches a fresh one. Abandon stays. Nothing leads into
 * the terminal that is gone: no Resume link, and the card itself is not a
 * control.
 */
describe('MyScenarios — a run to rebuild', () => {
  // GET /scenario-sessions/my also names the run's organization — the one its
  // terminal was filed under, whose trainers supervise it — and the language
  // it is played in (ocf-core MR D).
  const REBUILD_RUN = { ...BASE_RUN, resumable: true, resume_mode: 'rebuild', organization_id: 'org-class', locale: 'fr' }

  const refusal = (status: number, data: Record<string, unknown>) => ({ response: { status, data } })
  const BUDGET = refusal(403, { source: 'budget', reason: 'budget_exhausted', error_code: 403, error_message: 'Resource budget exhausted' })
  const DUNNING = refusal(402, { error_code: 'subscription_past_due', source: 'dunning', error_message: 'Your subscription payment is overdue.' })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('confirm', vi.fn(() => true))
    getMySessionsMock.mockResolvedValue([REBUILD_RUN])
    abandonSessionMock.mockResolvedValue(undefined)
    pollProvisioningStatusMock.mockResolvedValue(undefined)
    showConfirmMock.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function mountAndClick(testid: string) {
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find(`[data-testid="${testid}"]`).trigger('click')
    await flushPromises()
    return wrapper
  }

  it('says the environment is lost, the progress kept, and at which step', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('.status-badge').text()).toContain('Environment lost — progress kept (step 4)')
  })

  it('is listed under Active: the run is not over', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const tab = wrapper.findAll('.filter-tab').find(t => /Active/.test(t.text()))!
    expect(tab.find('.tab-count').text()).toBe('1')
  })

  it('offers Rebuild and resume, Start over and Abandon — no Resume into the gone terminal', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const rebuild = wrapper.find('[data-testid="scenario-rebuild-btn"]')
    expect(rebuild.exists()).toBe(true)
    expect(rebuild.text()).toBe('Rebuild and resume')
    expect(wrapper.find('[data-testid="scenario-start-over-btn"]').exists()).toBe(true)
    expect(wrapper.find('.abandon-btn').exists()).toBe(true)
    expect(resumeLinks(wrapper)).toHaveLength(0)
  })

  it('does not open the gone terminal when the card is clicked', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('.scenario-card').trigger('click')
    await flushPromises()

    expect(routerPushMock).not.toHaveBeenCalledWith('/terminal-session/term-1')
    expect(routerPushMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ sessionId: 'term-1' }) })
    )
  })

  // A card that opens nothing must not present itself as a control: no
  // pointer cursor, no tab stop, no "button" announced to a screen reader.
  it('does not present the card of a run to rebuild as a control', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const card = wrapper.find('.scenario-card')
    expect(card.classes()).not.toContain('clickable')
    expect(card.attributes('tabindex')).toBeUndefined()
    expect(card.attributes('role')).toBeUndefined()
  })

  it('opens the new terminal as soon as the resume answers, without waiting for the replay', async () => {
    resumeSessionMock.mockResolvedValue({
      terminal_session_id: 'term-new',
      scenario_session_id: 'sess-1',
      status: 'provisioning',
      provisioning_phase: 'replay',
      provisioning_timeout_seconds: 900,
    })

    await mountAndClick('scenario-rebuild-btn')

    expect(resumeSessionMock).toHaveBeenCalledWith('sess-1')
    expect(pollProvisioningStatusMock).not.toHaveBeenCalled()
    expect(routerPushMock).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'term-new' } })
  })

  // The run's own organization and language, not whatever the page happens to
  // know: without the organization the new terminal is filed under none, and
  // the learner drops out of their trainer's live view; without the language a
  // French learner starts over in the scenario's source language.
  it('Start over abandons the run, then launches it again in the run\'s organization and language', async () => {
    launchScenarioMock.mockResolvedValue({ terminal_session_id: 'term-fresh', scenario_session_id: 'sess-2', status: 'active' })

    await mountAndClick('scenario-start-over-btn')

    expect(abandonSessionMock).toHaveBeenCalledWith('sess-1')
    expect(launchScenarioMock).toHaveBeenCalledWith('sc1', { organization_id: 'org-class', locale: 'fr' })
    expect(abandonSessionMock.mock.invocationCallOrder[0])
      .toBeLessThan(launchScenarioMock.mock.invocationCallOrder[0])
    expect(routerPushMock).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'term-fresh' } })
  })

  it('explains a budget refusal of the rebuild without sending the learner to destroy their progress', async () => {
    resumeSessionMock.mockRejectedValue(BUDGET)

    await mountAndClick('scenario-rebuild-btn')

    expect(showErrorMock).toHaveBeenCalledTimes(1)
    const message = String(showErrorMock.mock.calls[0][0])
    expect(message).toMatch(/machines are all in use right now/i)
    expect(message).toMatch(/progress is kept/i)
    expect(message).not.toMatch(/start over|abandon/i)
    expect(routerPushMock).not.toHaveBeenCalled()
  })

  it('offers the subscription dashboard when the rebuild is refused for an overdue payment', async () => {
    resumeSessionMock.mockRejectedValue(DUNNING)

    await mountAndClick('scenario-rebuild-btn')

    expect(showConfirmMock).toHaveBeenCalledWith(
      expect.stringMatching(/past due/i),
      expect.stringMatching(/Payment issue/i),
      expect.anything()
    )
    expect(showErrorMock).not.toHaveBeenCalled()
    expect(routerPushMock).toHaveBeenCalledWith('/subscription-dashboard')
  })

  it('explains a budget refusal of the new launch after Start over in launch words', async () => {
    launchScenarioMock.mockRejectedValue(BUDGET)

    await mountAndClick('scenario-start-over-btn')

    expect(abandonSessionMock).toHaveBeenCalledWith('sess-1')
    expect(showErrorMock).toHaveBeenCalledTimes(1)
    const message = String(showErrorMock.mock.calls[0][0])
    expect(message).toMatch(/budget|in use/i)
    // The run a resume message would name is already abandoned.
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

  // Start over has already abandoned the run when the launch is refused: a
  // cause that a retry cannot change is named — in launch words, since there
  // is no run left — never "try again".
  it.each([
    ['the plan no longer covers the machine',
      refusal(403, { reason: 'not_in_plan', error_message: 'Your plan does not cover the machine this scenario needs.' }),
      [/plan no longer covers this machine/i, /ask your trainer/i]],
    ['the learner is no longer a member of the organization',
      refusal(403, { error_message: 'You are not a member of the requested organization' }), [/ask your trainer/i]],
    ['the scenario was archived',
      refusal(409, { error_message: 'scenario is archived' }), [/ask your trainer/i]],
  ])('explains the launch after Start over refused because %s', async (_label, err, expected) => {
    launchScenarioMock.mockRejectedValue(err)

    await mountAndClick('scenario-start-over-btn')

    expect(abandonSessionMock).toHaveBeenCalledWith('sess-1')
    expect(showErrorMock).toHaveBeenCalledTimes(1)
    const message = String(showErrorMock.mock.calls[0][0])
    for (const pattern of expected as RegExp[]) expect(message).toMatch(pattern)
    expect(message).not.toMatch(/try again|abandon|rebuil/i)
    expect(message).not.toContain((err as any).response.data.error_message)
    expect(routerPushMock).not.toHaveBeenCalled()
  })

  it('offers Start over on a paused run too, beside its Resume', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-start-over-btn"]').exists()).toBe(true)
    expect(resumeLinks(wrapper)).toHaveLength(1)
    expect(wrapper.find('[data-testid="scenario-rebuild-btn"]').exists()).toBe(false)
  })

  // Enter on a button inside the card must act on that button only: it used
  // to bubble to the card, which opened the terminal as well.
  it('does not open the paused run\'s terminal when Enter is pressed on its Start over', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="scenario-start-over-btn"]').trigger('keydown', { key: 'Enter' })
    await wrapper.find('.abandon-btn').trigger('keydown', { key: ' ' })
    await flushPromises()

    expect(routerPushMock).not.toHaveBeenCalled()
  })

  it('still opens a paused run from its card with the keyboard', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage()
    await flushPromises()
    const card = wrapper.find('.scenario-card')
    expect(card.attributes('tabindex')).toBe('0')
    expect(card.attributes('role')).toBe('button')
    await card.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(routerPushMock).toHaveBeenCalledWith('/terminal-session/term-1')
  })
})
