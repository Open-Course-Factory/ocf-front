/**
 * Tests for ScenarioQuizPanel — the quiz-step UI extracted from
 * ScenarioPanel.vue (commit #4 of ocf-front #243).
 *
 * Carved from the `resolvedStepType === 'quiz'` block (current markup lines
 * 276–457; logic at ~700–706, 844–928, 941–1004, 1408–1478).
 *
 * Split of responsibility (the whole point of the extraction):
 *   - The CHILD owns rendering, per-question answer state, multi-answer
 *     selections, localStorage persistence, option parsing and breakdown
 *     formatting.
 *   - The PARENT keeps the submit API call + transition/completion timing, so
 *     the child EMITS (`submit` / `advance` / `finish` / `retry`) instead of
 *     calling the service.
 *
 * Contract under test:
 *   Props: step:CurrentStepResponse, scenarioSessionId:string, isActive:boolean,
 *          isSubmitting:boolean, result:SubmitQuizResponse|null (default null),
 *          submitError:string (default '').
 *   Emits: submit (Record<string,string> payload, sent only from the
 *          confirmation), advance [], finish [], retry [].
 *   Internal state: current index, per-question answers, multi-answer
 *     selections. Resets + reloads from localStorage when
 *     [scenarioSessionId, step.step_order] changes. Persists to
 *     `ocf-quiz-${sid}-${step_order}` on answer/index change while result is
 *     null; clears that key when result becomes non-null.
 *
 * Note on i18n: the test i18n plugin is mounted with EMPTY messages and
 * missingWarn/fallbackWarn off, so t('scenarioPanel.foo') returns the bare
 * KEY (no interpolation). Therefore assertions here pin STRUCTURE (classes,
 * element presence/count), prop-driven text (question_text), parsed option
 * text, and the computed correct-answer formatting (which is derived from real
 * data, not i18n) — never the translated chrome strings.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import type {
  CurrentStepResponse,
  CurrentStepQuestion,
  SubmitQuizResponse,
} from '../../src/services/domain/scenario'

import ScenarioQuizPanel from '../../src/components/Terminal/ScenarioQuizPanel.vue'

const SID = 'sess-quiz-1'

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function makeStep(
  questions: CurrentStepQuestion[],
  overrides: Partial<CurrentStepResponse> = {},
): CurrentStepResponse {
  return {
    step_order: 0,
    total_steps: 3,
    title: 'Quiz step',
    status: 'active',
    has_flag: false,
    hints_total_count: 0,
    show_immediate_feedback: true,
    questions,
    ...overrides,
  } as CurrentStepResponse
}

// Convenience question builders (options as JSON-encoded string, the wire form).
function mcQuestion(id: string, order: number, options: string[]): CurrentStepQuestion {
  return {
    id,
    order,
    question_text: `MC ${id}?`,
    question_type: 'multiple_choice',
    options: JSON.stringify(options),
  }
}
function tfQuestion(id: string, order: number): CurrentStepQuestion {
  return { id, order, question_text: `TF ${id}?`, question_type: 'true_false' }
}
function maQuestion(id: string, order: number, options: string[]): CurrentStepQuestion {
  return {
    id,
    order,
    question_text: `MA ${id}?`,
    question_type: 'multi_answer',
    options: JSON.stringify(options),
  }
}

interface MountProps {
  step: CurrentStepResponse
  scenarioSessionId?: string
  isActive?: boolean
  isSubmitting?: boolean
  result?: SubmitQuizResponse | null
  submitError?: string
}

function mountQuiz(props: MountProps, locale: 'en' | 'fr' = 'en') {
  return mount(ScenarioQuizPanel, {
    props: {
      scenarioSessionId: SID,
      isActive: true,
      isSubmitting: false,
      result: null,
      submitError: '',
      ...props,
    },
    global: {
      plugins: [createTestI18n(locale)],
      // Render the teleported confirmation in place so the wrapper can find it.
      stubs: { teleport: true },
    },
  })
}

describe('ScenarioQuizPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders a navigator with one button per question; Previous/Next only disabled at the bounds', async () => {
    const step = makeStep([
      mcQuestion('q1', 0, ['Alpha', 'Beta', 'Gamma']),
      tfQuestion('q2', 1),
    ])
    const wrapper = mountQuiz({ step })

    expect(wrapper.find('.quiz-question-text').text()).toContain('MC q1?')
    expect(wrapper.findAll('[data-testid="quiz-nav-item"]').length).toBe(2)

    const prev = () => wrapper.find('[data-testid="quiz-previous"]')
    const next = () => wrapper.find('[data-testid="quiz-next"]')
    // Nothing answered: Next is still enabled — unanswered questions are allowed.
    expect(prev().attributes('disabled')).toBeDefined()
    expect(next().attributes('disabled')).toBeUndefined()
    // Submit is reachable from the first question.
    expect(wrapper.find('[data-testid="quiz-validate"]').attributes('disabled')).toBeUndefined()

    await next().trigger('click')
    expect(wrapper.find('.quiz-question-text').text()).toContain('TF q2?')
    expect(next().attributes('disabled')).toBeDefined()
    expect(prev().attributes('disabled')).toBeUndefined()
  })

  it('navigator jumps to any question and marks answered ones; selections survive navigation', async () => {
    const step = makeStep([
      mcQuestion('q1', 0, ['Alpha', 'Beta', 'Gamma']),
      tfQuestion('q2', 1),
      tfQuestion('q3', 2),
    ])
    const wrapper = mountQuiz({ step })
    const items = () => wrapper.findAll('[data-testid="quiz-nav-item"]')

    await wrapper.findAll('.quiz-options input[type="radio"]')[1].setValue()
    expect(items()[0].classes()).toContain('ocf-quiz-nav-item--answered')
    expect(items()[2].classes()).not.toContain('ocf-quiz-nav-item--answered')

    await items()[2].trigger('click')
    expect(wrapper.find('.quiz-question-text').text()).toContain('TF q3?')
    expect(items()[2].attributes('aria-current')).toBe('step')

    await items()[0].trigger('click')
    const radios = wrapper.findAll('.quiz-options input[type="radio"]')
    expect((radios[1].element as HTMLInputElement).checked).toBe(true)
  })

  it('validate opens a confirmation listing unanswered questions; only confirm submits', async () => {
    const step = makeStep([
      mcQuestion('q1', 0, ['Alpha', 'Beta', 'Gamma']),
      tfQuestion('q2', 1),
      maQuestion('q3', 2, ['One', 'Two', 'Three']),
    ])
    const wrapper = mountQuiz({ step })

    await wrapper.findAll('.quiz-options input[type="radio"]')[1].setValue()
    await wrapper.find('[data-testid="quiz-validate"]').trigger('click')

    expect(wrapper.find('[data-testid="quiz-confirm"]').exists()).toBe(true)
    expect(wrapper.emitted('submit')).toBeFalsy()
    const gotos = wrapper.findAll('[data-testid="quiz-confirm-goto"]')
    expect(gotos.map(g => g.text())).toEqual(['2', '3'])

    // Going back closes the confirmation on that question.
    await gotos[1].trigger('click')
    expect(wrapper.find('[data-testid="quiz-confirm"]').exists()).toBe(false)
    expect(wrapper.find('.quiz-question-text').text()).toContain('MA q3?')
    const boxes = wrapper.findAll('.quiz-options input[type="checkbox"]')
    await boxes[0].setValue(true)
    await boxes[2].setValue(true)

    await wrapper.find('[data-testid="quiz-validate"]').trigger('click')
    expect(wrapper.findAll('[data-testid="quiz-confirm-goto"]').map(g => g.text())).toEqual(['2'])
    await wrapper.find('[data-testid="quiz-confirm-submit"]').trigger('click')

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    expect(emitted!.length).toBe(1)
    expect(emitted![0][0]).toEqual({
      q1: '1',
      q2: '',
      q3: JSON.stringify([0, 2]),
    })
  })

  it('exam mode: the confirmation reads as final; learning mode keeps the softer text', async () => {
    const qs = [tfQuestion('q1', 0)]
    const exam = mountQuiz({ step: makeStep(qs, { show_immediate_feedback: false }) })
    await exam.find('[data-testid="quiz-validate"]').trigger('click')
    expect(exam.find('.base-modal-title').text()).toBe('Submit your answers for good?')
    expect(exam.find('[data-testid="quiz-confirm-warning"]').text()).toBe("This is final: you won't be able to change your answers or take this quiz again.")
    expect(exam.find('[data-testid="quiz-confirm-warning"]').classes()).toContain('ocf-quiz-confirm-warning--exam')
    expect(exam.find('[data-testid="quiz-confirm-submit"]').text()).toBe('Submit for good')

    const learning = mountQuiz({ step: makeStep(qs, { show_immediate_feedback: true }) })
    await learning.find('[data-testid="quiz-validate"]').trigger('click')
    expect(learning.find('.base-modal-title').text()).toBe('Submit your answers?')
    expect(learning.find('[data-testid="quiz-confirm-warning"]').classes()).not.toContain('ocf-quiz-confirm-warning--exam')
    expect(learning.find('[data-testid="quiz-confirm-submit"]').text()).toBe('Submit')
  })

  it('exam mode confirmation in French', async () => {
    const exam = mountQuiz({ step: makeStep([tfQuestion('q1', 0)], { show_immediate_feedback: false }) }, 'fr')
    await exam.find('[data-testid="quiz-validate"]').trigger('click')
    expect(exam.find('.base-modal-title').text()).toBe('Valider définitivement vos réponses ?')
    expect(exam.find('[data-testid="quiz-confirm-warning"]').text())
      .toBe('Cette validation est définitive : vous ne pourrez plus modifier vos réponses ni repasser ce QCM.')
    expect(exam.find('[data-testid="quiz-confirm-submit"]').text()).toBe('Valider définitivement')
  })

  it('shows the partial-scoring rule only when the step scores partially', () => {
    const qs = [maQuestion('q1', 0, ['One', 'Two'])]
    expect(mountQuiz({ step: makeStep(qs) }).find('[data-testid="quiz-scoring-rule"]').exists()).toBe(false)
    expect(
      mountQuiz({ step: makeStep(qs, { quiz_scoring_mode: 'partial' }) })
        .find('[data-testid="quiz-scoring-rule"]').exists()
    ).toBe(true)
    expect(
      mountQuiz({ step: makeStep(qs, { quiz_scoring_mode: 'partial_question_floor' }) })
        .find('[data-testid="quiz-scoring-rule"]').exists()
    ).toBe(true)
  })

  it('exam result without a score: shows "recorded", no score, no breakdown, no actions', () => {
    const step = makeStep([mcQuestion('q1', 0, ['Alpha', 'Beta'])], { show_immediate_feedback: false })
    const wrapper = mountQuiz({ step, result: { total: 1, next_step: 1 } })

    expect(wrapper.find('[data-testid="quiz-recorded"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="quiz-results-score"]').exists()).toBe(false)
    expect(wrapper.find('.quiz-breakdown').exists()).toBe(false)
    expect(wrapper.find('.quiz-results-actions').exists()).toBe(false)
  })

  it('exam result with a breakdown (teacher preview): shows score + breakdown and a manual advance, no retry', () => {
    const step = makeStep([mcQuestion('q1', 0, ['Alpha', 'Beta'])], { show_immediate_feedback: false })
    const result: SubmitQuizResponse = {
      score: 0,
      correct_count: 0,
      total: 1,
      next_step: 1,
      per_question_results: [{ question_id: 'q1', correct: false, correct_answer: '1' }],
    }
    const wrapper = mountQuiz({ step, result })

    expect(wrapper.find('[data-testid="quiz-results-score"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="quiz-recorded"]').exists()).toBe(false)
    expect(wrapper.find('.qb-correct').text()).toContain('Beta')
    expect(wrapper.find('[data-testid="quiz-advance"]').exists()).toBe(true)
    expect(wrapper.find('.quiz-results-actions .btn-secondary').exists()).toBe(false)
  })

  it('persists answers to localStorage and restores them on remount of the same step', async () => {
    const step = makeStep([mcQuestion('q1', 0, ['Alpha', 'Beta', 'Gamma'])])

    const wrapper = mountQuiz({ step })
    await wrapper.findAll('.quiz-options input[type="radio"]')[2].setValue() // pick "Gamma" (idx 2)

    const key = `ocf-quiz-${SID}-0`
    const raw = localStorage.getItem(key)
    expect(raw).toBeTruthy()
    const stored = JSON.parse(raw!)
    expect(stored.answers).toEqual({ q1: '2' })

    wrapper.unmount()

    // Remount with the SAME session+step → selection restored from storage.
    const wrapper2 = mountQuiz({ step })
    const radios = wrapper2.findAll('.quiz-options input[type="radio"]')
    expect((radios[2].element as HTMLInputElement).checked).toBe(true)
  })

  it('results view: renders score + breakdown; an incorrect MC shows the OPTION TEXT, not the index', () => {
    const step = makeStep(
      [mcQuestion('q1', 0, ['Alpha', 'Beta', 'Gamma'])],
      { show_immediate_feedback: true },
    )
    const result: SubmitQuizResponse = {
      score: 0.5,
      correct_count: 1,
      total: 2,
      next_step: 1,
      per_question_results: [
        { question_id: 'q1', correct: false, correct_answer: '2', explanation: 'It was Gamma.' },
      ],
    }
    const wrapper = mountQuiz({ step, result })

    // Entry view gone, results view shown.
    expect(wrapper.find('.quiz-position').exists()).toBe(false)
    expect(wrapper.find('.quiz-results').exists()).toBe(true)
    expect(wrapper.find('.quiz-results-score').exists()).toBe(true)

    // Breakdown item is marked incorrect and names the question.
    const item = wrapper.find('.quiz-breakdown-item')
    expect(item.exists()).toBe(true)
    expect(item.classes()).toContain('is-incorrect')
    expect(item.find('.qb-text').text()).toContain('MC q1?')

    // The correct answer must be the OPTION TEXT ("Gamma"), not the raw index "2".
    const correct = item.find('.qb-correct')
    expect(correct.exists()).toBe(true)
    expect(correct.text()).toContain('Gamma')
    expect(correct.text()).not.toMatch(/\b2\b/)

    // Explanation rendered.
    expect(item.find('.qb-explanation').text()).toContain('It was Gamma.')
  })

  it('results actions: Try again → retry; Next step → advance when next_step set', async () => {
    const step = makeStep([mcQuestion('q1', 0, ['Alpha', 'Beta'])], {
      show_immediate_feedback: true,
    })
    const result: SubmitQuizResponse = {
      score: 1,
      correct_count: 1,
      total: 1,
      next_step: 1,
      per_question_results: [{ question_id: 'q1', correct: true }],
    }
    const wrapper = mountQuiz({ step, result })

    const actions = wrapper.find('.quiz-results-actions')
    expect(actions.exists()).toBe(true)

    await actions.find('.btn-secondary').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
    expect(wrapper.emitted('retry')!.length).toBe(1)

    // next_step is set → the primary action emits advance (not finish).
    await actions.find('.verify-btn').trigger('click')
    expect(wrapper.emitted('advance')).toBeTruthy()
    expect(wrapper.emitted('advance')!.length).toBe(1)
    expect(wrapper.emitted('finish')).toBeFalsy()
  })

  it('results actions: Finish → finish when next_step is null', async () => {
    const step = makeStep([mcQuestion('q1', 0, ['Alpha', 'Beta'])], {
      show_immediate_feedback: true,
    })
    const result: SubmitQuizResponse = {
      score: 1,
      correct_count: 1,
      total: 1,
      // no next_step
      per_question_results: [{ question_id: 'q1', correct: true }],
    }
    const wrapper = mountQuiz({ step, result })

    await wrapper.find('.quiz-results-actions .verify-btn').trigger('click')
    expect(wrapper.emitted('finish')).toBeTruthy()
    expect(wrapper.emitted('finish')!.length).toBe(1)
    expect(wrapper.emitted('advance')).toBeFalsy()
  })

  it('renders a failed verify-result block when submitError is set', () => {
    const step = makeStep([mcQuestion('q1', 0, ['Alpha', 'Beta'])])
    const wrapper = mountQuiz({ step, submitError: 'Server exploded' })

    const errBlock = wrapper.find('.verify-result.failed')
    expect(errBlock.exists()).toBe(true)
    expect(errBlock.text()).toContain('Server exploded')
  })
  it('labels the quiz free-text input with its question (aria-labelledby → question id)', () => {
    const step = makeStep([{ id: 'q1', order: 0, question_text: 'FT q1?', question_type: 'free_text' }])
    const wrapper = mountQuiz({ step })
    const input = wrapper.find('[data-testid="quiz-free-input"]')
    const labelledBy = input.attributes('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    expect(wrapper.find('.quiz-question-text').attributes('id')).toBe(labelledBy)
    expect(wrapper.find(`#${labelledBy}`).text()).toContain('FT q1?')
  })

  describe('survey step (step_type "survey")', () => {
    function ftQuestion(id: string, order: number): CurrentStepQuestion {
      return { id, order, question_text: `FT ${id}?`, question_type: 'free_text' }
    }
    function surveyStep(questions: CurrentStepQuestion[], overrides: Partial<CurrentStepResponse> = {}) {
      return makeStep(questions, { step_type: 'survey', show_immediate_feedback: false, ...overrides } as Partial<CurrentStepResponse>)
    }

    it('renders a free_text survey question as a 4-row textarea, not a one-line input', () => {
      const wrapper = mountQuiz({ step: surveyStep([ftQuestion('q1', 0)]) })
      const area = wrapper.find('textarea[data-testid="survey-free-textarea"]')
      expect(area.exists()).toBe(true)
      expect(area.attributes('rows')).toBe('4')
      expect(wrapper.find('[data-testid="quiz-free-input"]').exists()).toBe(false)
    })

    it('Send submits directly: no confirmation modal, no "worth 0" warning', async () => {
      const step = surveyStep([ftQuestion('q1', 0), mcQuestion('q2', 1, ['Yes', 'No'])])
      const wrapper = mountQuiz({ step })

      await wrapper.find('[data-testid="survey-free-textarea"]').setValue('Great lab')
      const send = wrapper.find('[data-testid="quiz-validate"]')
      expect(send.text()).toContain('Send')
      await send.trigger('click')

      expect(wrapper.find('[data-testid="quiz-confirm"]').exists()).toBe(false)
      expect(wrapper.text()).not.toMatch(/score 0|worth 0|vaudront 0/i)
      const emitted = wrapper.emitted('submit')
      expect(emitted).toBeTruthy()
      expect(emitted!.length).toBe(1)
      expect(emitted![0][0]).toEqual({ q1: 'Great lab', q2: '' })
    })

    it('the Send button reads « Envoyer » in French', () => {
      const wrapper = mountQuiz({ step: surveyStep([ftQuestion('q1', 0)]) }, 'fr')
      expect(wrapper.find('[data-testid="quiz-validate"]').text()).toContain('Envoyer')
    })

    it('never shows the scoring rule, even when quiz_scoring_mode is partial', () => {
      const step = surveyStep([maQuestion('q1', 0, ['One', 'Two'])], { quiz_scoring_mode: 'partial' })
      expect(mountQuiz({ step }).find('[data-testid="quiz-scoring-rule"]').exists()).toBe(false)
    })

    it('after submit: thanks message, no score, no breakdown, no actions', () => {
      const wrapper = mountQuiz({ step: surveyStep([ftQuestion('q1', 0)]), result: { total: 1, next_step: 1 } })

      const recorded = wrapper.find('[data-testid="survey-recorded"]')
      expect(recorded.exists()).toBe(true)
      expect(recorded.text()).toContain('Thank you, your answers have been sent.')
      expect(wrapper.find('[data-testid="quiz-recorded"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="quiz-results-score"]').exists()).toBe(false)
      expect(wrapper.find('.quiz-breakdown').exists()).toBe(false)
      expect(wrapper.find('.quiz-results-actions').exists()).toBe(false)
    })

    it('labels the survey textarea with its question (aria-labelledby → question id)', () => {
      const wrapper = mountQuiz({ step: surveyStep([ftQuestion('q1', 0)]) })
      const area = wrapper.find('[data-testid="survey-free-textarea"]')
      const labelledBy = area.attributes('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      const question = wrapper.find('.quiz-question-text')
      expect(question.attributes('id')).toBe(labelledBy)
      expect(wrapper.find(`#${labelledBy}`).text()).toContain('FT q1?')
    })

    it('after submit in French: « Merci, vos réponses ont été envoyées. »', () => {
      const wrapper = mountQuiz({ step: surveyStep([ftQuestion('q1', 0)]), result: { total: 1, next_step: 1 } }, 'fr')
      expect(wrapper.find('[data-testid="survey-recorded"]').text()).toContain('Merci, vos réponses ont été envoyées.')
    })
  })
})
