/**
 * A survey that is not the last step moves on by itself, through the same
 * transition hold as any validated step. A survey is not "validated" — the
 * hold thanks the learner instead. Quiz and terminal steps keep "Step validated".
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

// Submit, then stop inside the 2 s hold before the next step loads.
async function submitAndHold(wrapper: ReturnType<typeof mountPanel>, selector: string) {
  await wrapper.find(selector).trigger('click')
  await flushPromises()
  await vi.advanceTimersByTimeAsync(500)
  const panel = wrapper.find('.panel-transitioning')
  expect(panel.exists()).toBe(true)
  return panel.text()
}

describe('ScenarioPanel — transition after a step that is not the last', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockSubmitQuiz.mockResolvedValue({ total: 1, next_step: 2 })
    mockVerifyStep.mockResolvedValue({ passed: true, next_step: { step_order: 2 } })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('thanks the learner after a survey, without "Step validated"', async () => {
    mockGetCurrentStep.mockResolvedValue({ ...STEP, step_type: 'survey', questions: QUESTIONS })
    const wrapper = mountPanel('en')
    await flushPromises()

    const text = await submitAndHold(wrapper, '.quiz-stub')
    expect(mockSubmitQuiz).toHaveBeenCalled()
    expect(text).toContain('Thank you, your answers have been sent.')
    expect(text).not.toContain('Step validated')
    wrapper.unmount()
  })

  it('thanks the learner in French after a survey, without « Étape validée »', async () => {
    mockGetCurrentStep.mockResolvedValue({ ...STEP, step_type: 'survey', questions: QUESTIONS })
    const wrapper = mountPanel('fr')
    await flushPromises()

    const text = await submitAndHold(wrapper, '.quiz-stub')
    expect(text).toContain('Merci, vos réponses ont été envoyées.')
    expect(text).not.toContain('Étape validée')
    wrapper.unmount()
  })

  it('still shows "Step validated" after an exam quiz', async () => {
    mockGetCurrentStep.mockResolvedValue({ ...STEP, step_type: 'quiz', questions: QUESTIONS })
    const wrapper = mountPanel('en')
    await flushPromises()

    const text = await submitAndHold(wrapper, '.quiz-stub')
    expect(text).toContain('Step validated')
    expect(text).not.toContain('Thank you, your answers have been sent.')
    wrapper.unmount()
  })

  it('still shows "Step validated" after a terminal step', async () => {
    mockGetCurrentStep.mockResolvedValue({ ...STEP })
    const wrapper = mountPanel('en')
    await flushPromises()

    const text = await submitAndHold(wrapper, '.verify-stub')
    expect(text).toContain('Step validated')
    expect(text).not.toContain('Thank you, your answers have been sent.')
    wrapper.unmount()
  })
})
