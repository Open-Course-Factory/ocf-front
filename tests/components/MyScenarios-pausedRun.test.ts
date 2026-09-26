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
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: (...args: any[]) => showErrorMock(...args),
    showConfirm: vi.fn().mockResolvedValue(true),
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
 * Rebuild & resume, which builds a new machine at the learner's step and opens
 * it, and Start over, which abandons the run and launches a fresh one. Abandon
 * stays. Nothing leads into the terminal that is gone: no Resume link, and the
 * card itself does not open it.
 */
describe('MyScenarios — a run to rebuild', () => {
  const REBUILD_RUN = { ...BASE_RUN, resumable: true, resume_mode: 'rebuild' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('confirm', vi.fn(() => true))
    getMySessionsMock.mockResolvedValue([REBUILD_RUN])
    abandonSessionMock.mockResolvedValue(undefined)
    pollProvisioningStatusMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('says the environment is lost and names the step it resumes at', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('.status-badge').text()).toContain('Environment lost — rebuild and resume at step 4')
  })

  it('is listed under Active: the run is not over', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const tab = wrapper.findAll('.filter-tab').find(t => /Active/.test(t.text()))!
    expect(tab.find('.tab-count').text()).toBe('1')
  })

  it('offers Rebuild & resume, Start over and Abandon — no Resume into the gone terminal', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-rebuild-btn"]').exists()).toBe(true)
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

  it('rebuilds, waits within the returned deadline, then opens the new terminal', async () => {
    resumeSessionMock.mockResolvedValue({
      terminal_session_id: 'term-new',
      scenario_session_id: 'sess-1',
      status: 'provisioning',
      provisioning_phase: 'replay',
      provisioning_timeout_seconds: 900,
    })

    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="scenario-rebuild-btn"]').trigger('click')
    await flushPromises()

    expect(resumeSessionMock).toHaveBeenCalledWith('sess-1')
    expect(pollProvisioningStatusMock).toHaveBeenCalledWith(
      'sess-1',
      expect.any(Function),
      expect.anything(),
      expect.objectContaining({ deadlineSeconds: 900 })
    )
    expect(routerPushMock).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'term-new' } })
  })

  it('Start over abandons the run, then launches the scenario again', async () => {
    launchScenarioMock.mockResolvedValue({ terminal_session_id: 'term-fresh', scenario_session_id: 'sess-2', status: 'active' })

    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="scenario-start-over-btn"]').trigger('click')
    await flushPromises()

    expect(abandonSessionMock).toHaveBeenCalledWith('sess-1')
    expect(launchScenarioMock).toHaveBeenCalledWith('sc1', expect.anything())
    expect(abandonSessionMock.mock.invocationCallOrder[0])
      .toBeLessThan(launchScenarioMock.mock.invocationCallOrder[0])
    expect(routerPushMock).toHaveBeenCalledWith({ name: 'TerminalSessionView', params: { sessionId: 'term-fresh' } })
  })

  it('offers Start over on a paused run too, beside its Resume', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-start-over-btn"]').exists()).toBe(true)
    expect(resumeLinks(wrapper)).toHaveLength(1)
    expect(wrapper.find('[data-testid="scenario-rebuild-btn"]').exists()).toBe(false)
  })
})
