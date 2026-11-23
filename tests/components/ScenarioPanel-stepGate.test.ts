/**
 * A teacher can hold the class before a step. A learner who finishes the step
 * before it does not move on: the panel says the step is done and waits, asks
 * the backend every 5 s (plus up to 3 s of jitter, so a class release does not
 * arrive in one burst) whether the gate still holds, and moves on exactly as
 * after a passed check once it no longer does.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const mockGetCurrentStep = vi.fn()
const mockVerifyStep = vi.fn()
const mockSubmitFlag = vi.fn()
const mockContinue = vi.fn()

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  })
}))

vi.mock('../../src/services/domain/scenario', () => ({
  quizResultAwaitsReview: () => false,
  scenarioSessionService: {
    getCurrentStep: (...a: any[]) => mockGetCurrentStep(...a),
    getSessionInfo: vi.fn().mockResolvedValue({ id: 'scen-1', scenario_id: 'sc-1', status: 'active' }),
    getScenario: vi.fn().mockResolvedValue({ id: 'sc-1', name: 'lab', title: 'Lab' }),
    getStepByOrder: vi.fn(),
    revealHint: vi.fn(),
    verifyStep: (...a: any[]) => mockVerifyStep(...a),
    continueAfterGate: (...a: any[]) => mockContinue(...a),
    reprovisionStep: vi.fn(),
    skipToStep: vi.fn(),
    submitFlag: (...a: any[]) => mockSubmitFlag(...a),
    submitQuiz: vi.fn(),
    abandonSession: vi.fn()
  }
}))

import ScenarioPanel from '../../src/components/Terminal/ScenarioPanel.vue'

const STEP = {
  step_order: 0,
  position: 1,
  step_orders: [0, 1, 2],
  title: 'First',
  text: 'Do it.',
  step_type: 'terminal',
  status: 'active',
  total_steps: 3,
  hints_total_count: 0,
  hints_revealed: 0
}

// Upper bound of one poll delay: 5 s plus the full 3 s of jitter.
const MAX_POLL_DELAY_MS = 8000

function mountPanel() {
  return mount(ScenarioPanel, {
    props: { scenarioSessionId: 'scen-1', isActive: true, sessionStatus: 'active' },
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false
      })],
      stubs: { ScenarioElapsedTimer: true }
    }
  })
}

const waiting = (wrapper: ReturnType<typeof mountPanel>) =>
  wrapper.find('[data-testid="scenario-waiting-at-gate"]')

async function mountWaitingAfterVerify() {
  mockVerifyStep.mockResolvedValue({ passed: true, next_step: 1, waiting_at_gate: true })
  const wrapper = mountPanel()
  await flushPromises()
  await wrapper.find('.verify-btn').trigger('click')
  await flushPromises()
  return wrapper
}

describe('ScenarioPanel — waiting at the teacher\'s gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockGetCurrentStep.mockResolvedValue(STEP)
    mockContinue.mockResolvedValue({ passed: true, waiting_at_gate: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the waiting state instead of moving on after a passed check', async () => {
    const wrapper = await mountWaitingAfterVerify()

    expect(waiting(wrapper).exists()).toBe(true)
    expect(waiting(wrapper).text()).toContain('Well done, this step is finished. The next one will open soon.')
    expect(wrapper.find('[data-testid="scenario-step-title"]').exists()).toBe(false)
  })

  it('shows the waiting state after a correct flag too', async () => {
    mockGetCurrentStep.mockResolvedValue({ ...STEP, step_type: 'flag', has_flag: true })
    mockSubmitFlag.mockResolvedValue({ correct: true, next_step: 1, waiting_at_gate: true })
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('input').setValue('FLAG{x}')
    await wrapper.find('input').trigger('keyup.enter')
    await flushPromises()

    expect(waiting(wrapper).exists()).toBe(true)
  })

  it('restores the waiting state when the page loads on a held learner', async () => {
    mockGetCurrentStep.mockResolvedValue({ ...STEP, waiting_at_gate: true })
    const wrapper = mountPanel()
    await flushPromises()

    expect(waiting(wrapper).exists()).toBe(true)
  })

  it('asks again every 5 to 8 seconds while the gate holds', async () => {
    await mountWaitingAfterVerify()

    await vi.advanceTimersByTimeAsync(4999)
    expect(mockContinue).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(MAX_POLL_DELAY_MS - 4999)
    expect(mockContinue).toHaveBeenCalledTimes(1)
    expect(mockContinue).toHaveBeenCalledWith('scen-1')

    await vi.advanceTimersByTimeAsync(MAX_POLL_DELAY_MS)
    expect(mockContinue).toHaveBeenCalledTimes(2)
  })

  it('moves on to the next step once the teacher releases the class', async () => {
    const wrapper = await mountWaitingAfterVerify()
    const loadsBefore = mockGetCurrentStep.mock.calls.length

    mockContinue.mockResolvedValue({ passed: true, next_step: 1, waiting_at_gate: false })
    mockGetCurrentStep.mockResolvedValue({ ...STEP, step_order: 1, position: 2, title: 'Second' })
    await vi.advanceTimersByTimeAsync(MAX_POLL_DELAY_MS)

    // Same path as a passed check: the validated hold, then the next step.
    expect(waiting(wrapper).exists()).toBe(false)
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    expect(mockGetCurrentStep.mock.calls.length).toBeGreaterThan(loadsBefore)
    expect(wrapper.find('[data-testid="scenario-step-title"]').text()).toBe('Second')

    // Released: no more polling.
    const calls = mockContinue.mock.calls.length
    await vi.advanceTimersByTimeAsync(MAX_POLL_DELAY_MS * 2)
    expect(mockContinue).toHaveBeenCalledTimes(calls)
  })

  it('does not ask while the page is hidden', async () => {
    await mountWaitingAfterVerify()
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)

    await vi.advanceTimersByTimeAsync(MAX_POLL_DELAY_MS * 2)
    expect(mockContinue).not.toHaveBeenCalled()

    hidden.mockRestore()
    await vi.advanceTimersByTimeAsync(MAX_POLL_DELAY_MS)
    expect(mockContinue).toHaveBeenCalledTimes(1)
  })

  it('stops asking once the panel is gone', async () => {
    const wrapper = await mountWaitingAfterVerify()

    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(MAX_POLL_DELAY_MS * 3)

    expect(mockContinue).not.toHaveBeenCalled()
  })
})
