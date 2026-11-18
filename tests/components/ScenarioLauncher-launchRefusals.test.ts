/**
 * What the learner sees when a scenario cannot be launched from ScenarioLauncher:
 * dunning (past due), blocked session, server not allowed, exam already
 * submitted. One describe per refusal; each keeps the notes of the file it came from.
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

// What every former file started from; a describe overrides what it needs.
beforeEach(() => {
  launchScenarioMock.mockReset()
  listScenariosMock.mockReset().mockResolvedValue([])
  getMySessionsMock.mockReset().mockResolvedValue([])
  showConfirmSpy.mockReset().mockResolvedValue(true)
})

const SCENARIO = { id: 'sc1', name: 'Intro', launchable: true }

/**
 * RED — dunning (past-due) rejection UX on the scenario-launch flow
 * (issue #255 / MR !243).
 *
 * A scenario launch calls StartComposedSession server-side, so the same 402
 * dunning contract { error_code: 'subscription_past_due', source: 'dunning' }
 * surfaces on POST /scenario-sessions/start. Today ScenarioLauncher's launch
 * catch just does `showError(error_message || launchError)` — the raw backend
 * text, with no route to fix billing. Desired: a DEDICATED dunning treatment
 * offering the subscription dashboard (same contract as the other two flows),
 * pinned loosely on the route target.
 *
 * EXPECTED STATE against current code: RED — the raw English message is toasted
 * and nothing routes to the dashboard.
 *
 * The #guard pins that a NON-dunning launch error still surfaces as a plain
 * error toast with no dashboard redirect.
 */
describe('ScenarioLauncher — dunning (past-due) launch handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    showConfirmSpy.mockResolvedValue(true)
  })

  it('offers the subscription dashboard (not a raw error toast) on a 402 dunning launch', async () => {
    launchScenarioMock.mockRejectedValue({
      response: {
        status: 402,
        data: {
          error_code: 'subscription_past_due',
          error_message: 'Subscription payment is past due',
          source: 'dunning'
        }
      }
    })

    const wrapper = mountLauncher()
    await flushPromises()

    await (wrapper.vm as any).handleLaunchScenario(SCENARIO)
    await flushPromises()

    // Dedicated dunning treatment routes to the dashboard to settle billing.
    expect(mockRouterPush).toHaveBeenCalledWith('/subscription-dashboard')

    // The raw English backend message must NOT be surfaced as a plain toast.
    const errorArgs = showErrorSpy.mock.calls.map((c) => String(c[0]))
    expect(errorArgs).not.toContain('Subscription payment is past due')
  })

  it('[guard] a non-dunning launch error still surfaces a plain error toast, no dashboard redirect', async () => {
    launchScenarioMock.mockRejectedValue({
      response: {
        status: 500,
        data: { error_code: 500, error_message: 'Internal error' }
      }
    })

    const wrapper = mountLauncher()
    await flushPromises()

    await (wrapper.vm as any).handleLaunchScenario(SCENARIO)
    await flushPromises()

    expect(showErrorSpy).toHaveBeenCalledTimes(1)
    expect(mockRouterPush).not.toHaveBeenCalledWith('/subscription-dashboard')
  })
})

/**
 * A blocked learner is told why (#384).
 *
 * Starting, resuming or launching while blocked is refused by ocf-core with
 * 403 { error_message: "session_start_blocked", scope: "group"|"org"|"global",
 * reason }. The learner sees one error naming the scope and the trainer's
 * reason, in their language — not the raw code, not the generic limit copy.
 */
describe('ScenarioLauncher — a blocked learner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('names the scope and gives the reason when the launch is refused', async () => {
    launchScenarioMock.mockRejectedValue({
      response: {
        status: 403,
        data: { error_message: 'session_start_blocked', scope: 'org', reason: 'Unpaid invoice' }
      }
    })

    const wrapper = mountLauncher()
    await flushPromises()

    await (wrapper.vm as any).handleLaunchScenario(SCENARIO)
    await flushPromises()

    expect(showErrorSpy).toHaveBeenCalledTimes(1)
    const shown = showErrorSpy.mock.calls[0].map(String).join(' ')
    expect(shown).toContain('Unpaid invoice')
    expect(shown).toMatch(/organi[sz]ation/i)
    expect(shown).not.toContain('session_start_blocked')
  })
})

/**
 * A card the backend cannot resolve says why. A server the trainer chose that
 * this learner may not use has its own words: it is neither an offline server
 * nor a scenario nothing fits.
 */
const BLOCKED = { id: 'sc-srv', name: 'lab', title: 'Lab', launchable: false, block_reason: 'server_not_allowed' }

describe('ScenarioLauncher — server not allowed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listScenariosMock.mockResolvedValue([BLOCKED])
    getMySessionsMock.mockResolvedValue([])
  })

  it('says the chosen server is not available to the learner', async () => {
    const wrapper = mountLauncher()
    await flushPromises()
    expect(wrapper.text()).toContain('The server chosen for this scenario is not available to you.')
    expect(wrapper.text()).toContain('Ask your trainer to choose another server, or Automatic.')
  })
})

/**
 * An exam takes one attempt per learner. Once it is handed in, the scenario
 * card carries exam_locked: the Relaunch / Start over / Launch slot shows
 * "Exam already submitted" instead of a button, so nothing shifts. A stale
 * page that still launches gets 409 exam_already_submitted, which reads the
 * same.
 */
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
