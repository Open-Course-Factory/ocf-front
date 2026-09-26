/**
 * The panel's "Restart preparation" retry has to tell the page when it worked.
 *
 * The page reads the run's status from the panel's `session-status` events: a
 * failed step setup arrives as 'setup_failed', and the page lays its "Setup
 * failed" end state over the console. reprovision-step can run inline and
 * answer with the run already back to 'active' — the panel then reloads the
 * step, but never said so, so the page kept the failure overlay over a console
 * that was ready to use.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  })
}))

const mockGetCurrentStep = vi.fn()
const mockGetSessionInfo = vi.fn()
const mockVerifyStep = vi.fn()
const mockReprovisionStep = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getCurrentStep: (...a: any[]) => mockGetCurrentStep(...a),
    getSessionInfo: (...a: any[]) => mockGetSessionInfo(...a),
    getScenario: vi.fn().mockResolvedValue(null),
    getStepByOrder: vi.fn(),
    revealHint: vi.fn(),
    verifyStep: (...a: any[]) => mockVerifyStep(...a),
    reprovisionStep: (...a: any[]) => mockReprovisionStep(...a),
    abandonSession: vi.fn()
  }
}))

import ScenarioPanel from '../../src/components/Terminal/ScenarioPanel.vue'

const STEP = {
  step_order: 1,
  title: 'Find the key',
  text: 'Look around.',
  step_type: 'terminal',
  status: 'active',
  total_steps: 3,
  hints_total_count: 0,
  hints_revealed: 0
}

function mountPanel() {
  return mount(ScenarioPanel, {
    props: { scenarioSessionId: 'scen-1', isActive: true },
    global: {
      plugins: [createI18n({
        legacy: false,
        locale: 'en',
        fallbackLocale: 'en',
        messages: { en: {}, fr: {} },
        missingWarn: false,
        fallbackWarn: false
      })],
      stubs: {
        ScenarioElapsedTimer: true,
        ScenarioFlagSubmit: true,
        ScenarioQuizPanel: true,
        ScenarioHintPanel: true,
        ProvisioningPhaseList: true,
        ScenarioVerifyResult: {
          name: 'ScenarioVerifyResult',
          emits: ['verify'],
          template: '<button class="verify-stub" @click="$emit(\'verify\')"></button>'
        }
      }
    }
  })
}

// Validate the step, leave the next step's setup to the background, and let
// the poll report it failed — the panel's "preparation failed" state, with the
// page told 'setup_failed'.
async function reachSetupFailed(wrapper: ReturnType<typeof mountPanel>) {
  mockVerifyStep.mockResolvedValue({
    passed: true,
    next_step: { step_order: 2 },
    next_step_provisioning: true
  })
  mockGetSessionInfo.mockResolvedValue({ status: 'setup_failed' })

  await wrapper.find('.verify-stub').trigger('click')
  await flushPromises()
  await vi.advanceTimersByTimeAsync(2000) // validated hold
  await vi.advanceTimersByTimeAsync(2000) // first provisioning poll
  await flushPromises()

  expect(wrapper.find('[data-testid="scenario-step-preparing-error"]').exists()).toBe(true)
  expect(wrapper.emitted('session-status')?.at(-1)).toEqual(['setup_failed'])
}

describe('ScenarioPanel — retrying a failed step setup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockGetCurrentStep.mockResolvedValue(STEP)
    mockGetSessionInfo.mockResolvedValue({ status: 'active' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('tells the page the run is active again when the retry ran inline and succeeded', async () => {
    const wrapper = mountPanel()
    await flushPromises()
    await reachSetupFailed(wrapper)

    mockReprovisionStep.mockResolvedValue({ status: 'active' })
    await wrapper.find('[data-testid="scenario-step-preparing-retry"]').trigger('click')
    await flushPromises()

    expect(mockReprovisionStep).toHaveBeenCalledWith('scen-1')
    expect(wrapper.find('[data-testid="scenario-step-preparing-error"]').exists()).toBe(false)
    expect(wrapper.emitted('session-status')?.at(-1)).toEqual(['active'])
    wrapper.unmount()
  })

  it('still reports provisioning when the retry was left to the background', async () => {
    const wrapper = mountPanel()
    await flushPromises()
    await reachSetupFailed(wrapper)

    mockReprovisionStep.mockResolvedValue({ status: 'provisioning' })
    await wrapper.find('[data-testid="scenario-step-preparing-retry"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('session-status')?.at(-1)).toEqual(['provisioning'])
    wrapper.unmount()
  })
})
