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
const mockSubmitFlag = vi.fn()
const mockSubmitQuiz = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getCurrentStep: (...a: any[]) => mockGetCurrentStep(...a),
    getSessionInfo: (...a: any[]) => mockGetSessionInfo(...a),
    getScenario: vi.fn().mockResolvedValue(null),
    getStepByOrder: vi.fn(),
    revealHint: vi.fn(),
    verifyStep: (...a: any[]) => mockVerifyStep(...a),
    reprovisionStep: (...a: any[]) => mockReprovisionStep(...a),
    submitFlag: (...a: any[]) => mockSubmitFlag(...a),
    submitQuiz: (...a: any[]) => mockSubmitQuiz(...a),
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

function mountPanel(options: { props?: Record<string, unknown>; realVerify?: boolean } = {}) {
  return mount(ScenarioPanel, {
    props: { scenarioSessionId: 'scen-1', isActive: true, ...options.props },
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
        // Both expose what the panel lets them do, and can submit regardless —
        // as a click racing a prop update would.
        ScenarioFlagSubmit: {
          name: 'ScenarioFlagSubmit',
          props: ['isActive', 'modelValue'],
          emits: ['update:modelValue', 'submit'],
          template: '<button class="flag-stub" :data-active="String(isActive)" @click="$emit(\'update:modelValue\', \'FLAG{x}\'); $nextTick(() => $emit(\'submit\'))"></button>'
        },
        ScenarioQuizPanel: {
          name: 'ScenarioQuizPanel',
          props: ['isActive'],
          emits: ['submit'],
          template: '<button class="quiz-stub" :data-active="String(isActive)" @click="$emit(\'submit\', { q1: \'a\' })"></button>'
        },
        ScenarioHintPanel: true,
        ProvisioningPhaseList: true,
        ScenarioVerifyResult: options.realVerify ? false : {
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

/**
 * While the page reports the run `provisioning` — a launch still running its
 * setup, a rebuild replaying it — ocf-core refuses verify and submit with 409.
 * The panel must not offer a Verify, a flag or a quiz answer the backend will
 * refuse.
 */
describe('ScenarioPanel — while the run is being set up', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetCurrentStep.mockResolvedValue(STEP)
    mockGetSessionInfo.mockResolvedValue({ status: 'provisioning' })
  })

  // Verify is absent or disabled — either way, not offered.
  function verifyOffered(wrapper: ReturnType<typeof mountPanel>, testid: string) {
    const button = wrapper.find(`[data-testid="${testid}"]`)
    return button.exists() && button.attributes('disabled') === undefined
  }

  it('does not offer Verify on a terminal step', async () => {
    const wrapper = mountPanel({ props: { sessionStatus: 'provisioning' }, realVerify: true })
    await flushPromises()

    expect(verifyOffered(wrapper, 'scenario-verify-btn')).toBe(false)
    wrapper.unmount()
  })

  it('does not offer to acknowledge an info step', async () => {
    mockGetCurrentStep.mockResolvedValue({ ...STEP, step_type: 'info' })

    const wrapper = mountPanel({ props: { sessionStatus: 'provisioning' }, realVerify: true })
    await flushPromises()

    expect(verifyOffered(wrapper, 'scenario-info-ack')).toBe(false)
    wrapper.unmount()
  })

  // A flag or a quiz answer is refused the same way: neither is offered, and
  // one sent anyway (a click racing the status) never reaches the backend.
  it.each([
    ['a flag', { step_type: 'flag' }, '.flag-stub', mockSubmitFlag],
    ['a quiz answer', { step_type: 'quiz', questions: [{ id: 'q1', text: 'Q?', options: ['a', 'b'] }] }, '.quiz-stub', mockSubmitQuiz],
  ])('does not offer to submit %s', async (_label, step, selector, submit) => {
    mockGetCurrentStep.mockResolvedValue({ ...STEP, ...step })

    const wrapper = mountPanel({ props: { sessionStatus: 'provisioning' } })
    await flushPromises()

    const control = wrapper.find(selector)
    if (control.exists()) {
      expect(control.attributes('data-active')).toBe('false')
      await control.trigger('click')
      await flushPromises()
    }
    expect(submit).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it.each([
    ['a flag', { step_type: 'flag' }, '.flag-stub', mockSubmitFlag],
    ['a quiz answer', { step_type: 'quiz', questions: [{ id: 'q1', text: 'Q?', options: ['a', 'b'] }] }, '.quiz-stub', mockSubmitQuiz],
  ])('offers to submit %s again once the run is active', async (_label, step, selector, submit) => {
    mockGetCurrentStep.mockResolvedValue({ ...STEP, ...step })
    mockGetSessionInfo.mockResolvedValue({ status: 'active' })
    ;(submit as any).mockResolvedValue({ correct: false, passed: false })

    const wrapper = mountPanel({ props: { sessionStatus: 'active' } })
    await flushPromises()

    const control = wrapper.find(selector)
    expect(control.attributes('data-active')).toBe('true')
    await control.trigger('click')
    await flushPromises()
    expect(submit).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('offers Verify again once the run is active', async () => {
    mockGetSessionInfo.mockResolvedValue({ status: 'active' })

    const wrapper = mountPanel({ props: { sessionStatus: 'active' }, realVerify: true })
    await flushPromises()

    expect(verifyOffered(wrapper, 'scenario-verify-btn')).toBe(true)
    wrapper.unmount()
  })
})
