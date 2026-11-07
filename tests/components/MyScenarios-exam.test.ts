/**
 * Scenario history: while the teacher has not published a class's results,
 * GET /scenario-sessions/my sends `grade: null` + `grade_withheld: true`. The
 * card says so in the grade row, and the run never counts as a best grade.
 * A handed-in exam (exam_locked) offers no Start over.
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

// The quota-full resume message names the machines that use the quota.
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    getMyUsage: vi.fn().mockResolvedValue({
      active_sessions: [
        { session_id: 't-run', name: 'lab-web', size_key: 'm', counts_toward_quota: true },
        { session_id: 't-paused', name: 'lab-db', size_key: 's', counts_toward_quota: false },
      ],
    }),
  }
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

const COMPLETED = { ...BASE_RUN, status: 'completed', completed_steps: 36, completed_at: new Date().toISOString() }

describe('MyScenarios — grade withheld until the teacher publishes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('says the results are not published instead of a grade', async () => {
    getMySessionsMock.mockResolvedValue([{ ...COMPLETED, grade: null, grade_withheld: true }])
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-testid="grade-withheld"]').text()).toBe('Results not published yet')
    expect(wrapper.find('.grade-value').exists()).toBe(false)
    expect(wrapper.find('.best-grade').exists()).toBe(false)
  })

  it('says it in French', async () => {
    getMySessionsMock.mockResolvedValue([{ ...COMPLETED, grade: null, grade_withheld: true }])
    const wrapper = mountPage('fr')
    await flushPromises()

    expect(wrapper.find('[data-testid="grade-withheld"]').text()).toBe('Résultats pas encore publiés')
  })

  it('leaves a withheld run out of the best grade', async () => {
    getMySessionsMock.mockResolvedValue([
      { ...COMPLETED, id: 's-withheld', grade: 95, grade_withheld: true },
      { ...COMPLETED, id: 's-published', grade: 60 },
    ])
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('.best-grade').text()).toContain('60%')
    expect(wrapper.find('.best-grade').text()).not.toContain('95')
  })

  it('still shows a published grade', async () => {
    getMySessionsMock.mockResolvedValue([{ ...COMPLETED, grade: 80 }])
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('.grade-value').text()).toBe('80%')
    expect(wrapper.find('[data-testid="grade-withheld"]').exists()).toBe(false)
  })
})

describe('MyScenarios — exam already submitted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the locked note instead of Start over on a paused exam run', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused', exam_locked: true }])
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-start-over-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="exam-locked-note"]').text()).toBe('Exam already submitted')
  })

  it('keeps Start over when the exam is not locked', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-start-over-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="exam-locked-note"]').exists()).toBe(false)
  })
})
