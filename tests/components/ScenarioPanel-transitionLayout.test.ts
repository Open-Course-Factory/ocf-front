/**
 * Between two steps, and while the first one loads, the page lays out the step
 * that is coming. Falling back to the terminal layout showed a console between
 * two quizzes, and resized it — so the shell redrew — at every step.
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
const mockVerifyStep = vi.fn()
const mockSubmitQuiz = vi.fn()

vi.mock('../../src/services/domain/scenario', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/services/domain/scenario')>()
  return {
    quizResultAwaitsReview: actual.quizResultAwaitsReview,
    scenarioSessionService: {
      getCurrentStep: (...a: any[]) => mockGetCurrentStep(...a),
      getSessionInfo: vi.fn().mockResolvedValue({ status: 'active' }),
      getScenario: vi.fn().mockResolvedValue(null),
      getStepByOrder: vi.fn(),
      revealHint: vi.fn(),
      verifyStep: (...a: any[]) => mockVerifyStep(...a),
      reprovisionStep: vi.fn(),
      submitFlag: vi.fn(),
      submitQuiz: (...a: any[]) => mockSubmitQuiz(...a),
      abandonSession: vi.fn()
    }
  }
})

import ScenarioPanel from '../../src/components/Terminal/ScenarioPanel.vue'

const STEP = {
  step_order: 1,
  position: 1,
  step_orders: [1, 2, 3],
  step_types: ['quiz', 'quiz', 'terminal'],
  title: 'Step two',
  text: 'Answer.',
  step_type: 'terminal',
  status: 'active',
  total_steps: 3,
  hints_total_count: 0,
  hints_revealed: 0,
  show_immediate_feedback: false
}

const QUESTIONS = [{ id: 'q1', order: 0, question_text: 'Any comment?', question_type: 'free_text' }]

function mountPanel(locale: 'en' | 'fr' = 'en') {
  return mount(ScenarioPanel, {
    props: { scenarioSessionId: 'scen-1', isActive: true, sessionStatus: 'active' },
    global: {
      plugins: [createI18n({
        legacy: false, locale, fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false
      })],
      stubs: {
        ScenarioElapsedTimer: true,
        ScenarioQuizPanel: {
          name: 'ScenarioQuizPanel',
          props: ['isActive'],
          emits: ['submit'],
          template: '<button class="quiz-stub" @click="$emit(\'submit\', { q1: \'ok\' })"></button>'
        },
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


function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

const QUIZ = { ...STEP, step_type: 'quiz', questions: QUESTIONS }
const skeletonType = (w: ReturnType<typeof mountPanel>) =>
  w.find('[data-testid="scenario-step-skeleton"]').attributes('data-step-type')

describe('ScenarioPanel — layout of the step coming', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the quiz layout from one quiz to the next, with a quiz skeleton', async () => {
    const next = deferred<any>()
    mockGetCurrentStep.mockResolvedValueOnce(QUIZ).mockReturnValueOnce(next.promise)
    mockSubmitQuiz.mockResolvedValue({ total: 1, next_step: 2 })
    const wrapper = mountPanel('en')
    await flushPromises()
    expect((wrapper.vm as any).isQuizStep).toBe(true)

    await wrapper.find('.quiz-stub').trigger('click')
    await flushPromises()
    expect((wrapper.vm as any).isQuizStep).toBe(true)

    await vi.advanceTimersByTimeAsync(2000)
    expect(skeletonType(wrapper)).toBe('questions')
    expect((wrapper.vm as any).isQuizStep).toBe(true)

    next.resolve({ ...QUIZ, step_order: 2, position: 2 })
    await flushPromises()
    expect((wrapper.vm as any).isQuizStep).toBe(true)
    wrapper.unmount()
  })

  it('takes the terminal layout as soon as a quiz moves on to a terminal step', async () => {
    const next = deferred<any>()
    mockGetCurrentStep.mockResolvedValueOnce({ ...QUIZ, step_order: 2, position: 2 }).mockReturnValueOnce(next.promise)
    mockSubmitQuiz.mockResolvedValue({ total: 1, next_step: 3 })
    const wrapper = mountPanel('en')
    await flushPromises()

    await wrapper.find('.quiz-stub').trigger('click')
    await flushPromises()
    expect((wrapper.vm as any).isQuizStep).toBe(false)

    await vi.advanceTimersByTimeAsync(2000)
    expect(skeletonType(wrapper)).toBe('terminal')
    wrapper.unmount()
  })

  it('opens on the quiz layout while the environment of a quiz is set up', async () => {
    mockGetCurrentStep.mockResolvedValue({
      step_order: 1, title: 'Setting up environment...', status: 'provisioning', step_type: 'quiz',
      total_steps: 3, hints_total_count: 0, hints_revealed: 0
    })
    const wrapper = mountPanel('en')
    await flushPromises()

    expect(skeletonType(wrapper)).toBe('questions')
    expect((wrapper.vm as any).isQuizStep).toBe(true)
    wrapper.unmount()
  })

  it('shows a neutral skeleton while the first step is fetched', async () => {
    mockGetCurrentStep.mockReturnValue(new Promise(() => {}))
    const wrapper = mountPanel('en')
    await flushPromises()

    expect(skeletonType(wrapper)).toBe('text')
    expect((wrapper.vm as any).isQuizStep).toBe(false)
    wrapper.unmount()
  })
})
