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

function mountLauncher() {
  return mount(ScenarioLauncher, {
    global: {
      plugins: [createI18n({
        legacy: false,
        locale: 'en',
        fallbackLocale: 'en',
        messages: { en: {}, fr: {} },
        missingWarn: false,
        fallbackWarn: false,
      })],
      stubs: {
        AdminBadge: true,
        ScenarioProvisioningOverlay: true,
        'router-link': { props: ['to'], template: '<a><slot /></a>' },
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
