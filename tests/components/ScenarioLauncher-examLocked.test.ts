/**
 * An exam takes one attempt per learner. Once it is handed in, the scenario
 * card carries exam_locked: the Relaunch / Start over / Launch slot shows
 * "Exam already submitted" instead of a button, so nothing shifts. A stale
 * page that still launches gets 409 exam_already_submitted, which reads the
 * same.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useRoute: () => ({ query: {} }),
}))

const showErrorSpy = vi.fn()
const showConfirmSpy = vi.fn().mockResolvedValue(true)
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: showErrorSpy,
    showConfirm: showConfirmSpy,
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn(),
  })
}))

const launchScenarioMock = vi.fn()
const listScenariosMock = vi.fn()
const getMySessionsMock = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    listScenarios: (...args: any[]) => listScenariosMock(...args),
    getMyScenarioSessions: (...args: any[]) => getMySessionsMock(...args),
    launchScenario: (...args: any[]) => launchScenarioMock(...args),
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

// The catalogue's authoring controls (Import, the access rule behind them)
// pull in the router and the membership stores; a learner's view is tested here.
vi.mock('../../src/composables/useScenarioEditorAccess', async () => {
  const { ref } = await import('vue')
  return { useScenarioEditorAccess: () => ({ canAccessScenarioEditor: ref(false) }) }
})
vi.mock('../../src/components/ScenarioEditor/ScenarioImportButton.vue', () => ({
  default: { template: '<button />' }
}))

import ScenarioLauncher from '../../src/components/Pages/ScenarioLauncher.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountLauncher() {
  return mount(ScenarioLauncher, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        AdminBadge: true,
        ScenarioProvisioningOverlay: true,
        'router-link': { props: ['to'], template: '<a><slot /></a>' },
      }
    }
  })
}

const LOCKED = { id: 'sc1', name: 'exam', title: 'Linux exam', launchable: true, exam_locked: true }
const PAST_RUN = {
  id: 'run-1',
  scenario_id: 'sc1',
  scenario_title: 'Linux exam',
  status: 'completed',
  terminal_session_id: 'term-1',
  current_step: 2,
  total_steps: 2,
  completed_steps: 2,
  started_at: new Date().toISOString(),
}

describe('ScenarioLauncher — exam already submitted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMySessionsMock.mockResolvedValue([])
  })

  it('replaces Relaunch with the locked note on a past run', async () => {
    listScenariosMock.mockResolvedValue([LOCKED])
    getMySessionsMock.mockResolvedValue([PAST_RUN])
    const wrapper = mountLauncher()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-relaunch-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="exam-locked-note"]').text()).toBe('Exam already submitted')
  })

  it('still offers Relaunch when the exam is not locked', async () => {
    listScenariosMock.mockResolvedValue([{ ...LOCKED, exam_locked: false }])
    getMySessionsMock.mockResolvedValue([PAST_RUN])
    const wrapper = mountLauncher()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-relaunch-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="exam-locked-note"]').exists()).toBe(false)
  })

  it('shows the note instead of Launch when no run is listed', async () => {
    listScenariosMock.mockResolvedValue([LOCKED])
    const wrapper = mountLauncher()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-launch-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="exam-locked-note"]').exists()).toBe(true)
  })

  it('reads a 409 exam_already_submitted as "Exam already submitted"', async () => {
    listScenariosMock.mockResolvedValue([])
    launchScenarioMock.mockRejectedValue({
      response: { status: 409, data: { reason: 'exam_already_submitted', error_message: 'raw' } },
    })
    const wrapper = mountLauncher()
    await flushPromises()

    await (wrapper.vm as any).handleLaunchScenario({ ...LOCKED, exam_locked: false })
    await flushPromises()

    expect(showErrorSpy).toHaveBeenCalledWith('Exam already submitted')
  })
})
