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
 *   Emits: submit (Record<string,string> payload), advance [], finish [], retry [].
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
    },
  })
}

describe('ScenarioQuizPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the first question and disables submit until all questions are answered', () => {
    const step = makeStep([
      mcQuestion('q1', 0, ['Alpha', 'Beta', 'Gamma']),
      tfQuestion('q2', 1),
    ])
    const wrapper = mountQuiz({ step })

    // Position chip present, first question text rendered.
    expect(wrapper.find('.quiz-position').exists()).toBe(true)
    expect(wrapper.find('.quiz-question-text').text()).toContain('MC q1?')

    // First question's options rendered as radios.
    const radios = wrapper.findAll('.quiz-options .quiz-option input[type="radio"]')
    expect(radios.length).toBe(3)

    // Two questions → first is not the last → a Next button, no Submit yet.
    expect(wrapper.find('.verify-btn.quiz-submit').exists()).toBe(false)
    expect(wrapper.find('.quiz-nav .verify-btn').exists()).toBe(true)
  })

  it('multiple_choice: selecting an option enables Next; navigating preserves the selection', async () => {
    const step = makeStep([
      mcQuestion('q1', 0, ['Alpha', 'Beta', 'Gamma']),
      tfQuestion('q2', 1),
    ])
    const wrapper = mountQuiz({ step })

    const nextBtn = () => wrapper.find('.quiz-nav .verify-btn')
    // Next disabled until current answered.
    expect(nextBtn().attributes('disabled')).toBeDefined()

    // Select option index 1 ("Beta").
    const radios = wrapper.findAll('.quiz-options .quiz-option input[type="radio"]')
    await radios[1].setValue()
    expect(nextBtn().attributes('disabled')).toBeUndefined()

    // Go to question 2, then back — selection on q1 must persist.
    await nextBtn().trigger('click')
    expect(wrapper.find('.quiz-question-text').text()).toContain('TF q2?')

    await wrapper.find('.quiz-nav .btn-secondary').trigger('click') // Previous
    expect(wrapper.find('.quiz-question-text').text()).toContain('MC q1?')

    const radiosAfter = wrapper.findAll('.quiz-options .quiz-option input[type="radio"]')
    expect((radiosAfter[1].element as HTMLInputElement).checked).toBe(true)
  })

  it('submitting a fully answered quiz emits submit once with the assembled payload', async () => {
    const step = makeStep([
      mcQuestion('q1', 0, ['Alpha', 'Beta', 'Gamma']),
      tfQuestion('q2', 1),
      maQuestion('q3', 2, ['One', 'Two', 'Three']),
    ])
    const wrapper = mountQuiz({ step })

    // q1: pick index 1.
    await wrapper.findAll('.quiz-options input[type="radio"]')[1].setValue()
    await wrapper.find('.quiz-nav .verify-btn').trigger('click')

    // q2 (true_false): pick "true" (value 'true').
    const tfRadios = wrapper.findAll('.quiz-options input[type="radio"]')
    await tfRadios[0].setValue() // value="true"
    await wrapper.find('.quiz-nav .verify-btn').trigger('click')

    // q3 (multi_answer): check indices 0 and 2.
    const boxes = wrapper.findAll('.quiz-options input[type="checkbox"]')
    await boxes[0].setValue(true)
    await boxes[2].setValue(true)

    // Now on the last question → Submit button present and enabled.
    const submit = wrapper.find('.verify-btn.quiz-submit')
    expect(submit.exists()).toBe(true)
    expect(submit.attributes('disabled')).toBeUndefined()

    await submit.trigger('click')

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    expect(emitted!.length).toBe(1)
    expect(emitted![0][0]).toEqual({
      q1: '1',
      q2: 'true',
      q3: JSON.stringify([0, 2]),
    })
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
})
