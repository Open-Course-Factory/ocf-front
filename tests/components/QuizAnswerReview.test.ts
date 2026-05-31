/**
 * Tests for QuizAnswerReview — the per-question answer visualization for a quiz
 * step, extracted from GroupScenariosTab.vue (commit c6 of #244).
 *
 * Source: the `quiz-questions-block` markup (parent lines 1197–1278). For each
 * question it renders the multiple-choice options with role classes/icons from
 * optionRole / optionRoleClass / optionRoleIcon (scenarioDisplay), the
 * student/correct answer lines via displayAnswer, and the orphan fallback via
 * isOrphanStudentAnswer. Receives the STEP (it needs step.questions plus the
 * quizCorrectCount/quizQuestionTotal summary).
 *
 * This is the BUG-PRONE index-vs-text path: MC answers are stored as the
 * option INDEX as a string ("0","1",...). optionRole compares indices, so the
 * option DOM must carry: option-correct on the correct index, option-student-wrong
 * on the (different) student index, option-student-correct when they coincide.
 *
 * i18n note: empty test messages → assert on the role CLASSES/ICONS and the
 * resolved answer DATA, not translated chrome.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import QuizAnswerReview from '../../src/components/Groups/QuizAnswerReview.vue'

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

function makeQuestion(overrides: Record<string, any> = {}) {
  return {
    id: 'q1',
    order: 0,
    question_text: 'Pick the right one',
    question_type: 'multiple_choice',
    options: JSON.stringify(['Alpha', 'Beta', 'Gamma']),
    correct_answer: '1', // Beta
    student_answer: '2',  // Gamma (wrong)
    is_correct: false,
    points: 1,
    ...overrides,
  }
}

function makeStep(questions: any[], overrides: Record<string, any> = {}) {
  return {
    step_order: 1,
    step_title: 'Quiz time',
    step_type: 'quiz',
    status: 'completed',
    verify_attempts: 1,
    hints_revealed: 0,
    time_spent_seconds: 30,
    quiz_score: 0.5,
    questions,
    ...overrides,
  }
}

function mountReview(step: any) {
  return mount(QuizAnswerReview, {
    props: { step },
    global: { plugins: [createTestI18n()] },
  })
}

describe('QuizAnswerReview', () => {
  it('renders one option element per parsed MC option', () => {
    const wrapper = mountReview(makeStep([makeQuestion()]))
    const options = wrapper.findAll('.quiz-question-option')
    expect(options.length).toBe(3)
    expect(options[0].text()).toContain('Alpha')
    expect(options[1].text()).toContain('Beta')
    expect(options[2].text()).toContain('Gamma')
  })

  it('marks the correct option and the student-wrong option by INDEX, not text', () => {
    // student picked idx2 (Gamma), correct is idx1 (Beta).
    const wrapper = mountReview(makeStep([makeQuestion({ student_answer: '2', correct_answer: '1' })]))
    const options = wrapper.findAll('.quiz-question-option')

    // idx0: neutral — no role class, no tag.
    expect(options[0].classes()).not.toContain('option-correct')
    expect(options[0].classes()).not.toContain('option-student-wrong')
    expect(options[0].find('.quiz-option-tag').exists()).toBe(false)

    // idx1: the correct answer (student missed it) → option-correct + check icon.
    expect(options[1].classes()).toContain('option-correct')
    expect(options[1].find('.quiz-option-tag i.fas.fa-check').exists()).toBe(true)

    // idx2: the student's wrong pick → option-student-wrong + times icon.
    expect(options[2].classes()).toContain('option-student-wrong')
    expect(options[2].find('.quiz-option-tag i.fas.fa-times').exists()).toBe(true)
  })

  it('marks a fully-correct pick as student-correct', () => {
    // student picked idx1 AND idx1 is correct.
    const wrapper = mountReview(makeStep([makeQuestion({ student_answer: '1', correct_answer: '1', is_correct: true })]))
    const options = wrapper.findAll('.quiz-question-option')

    expect(options[1].classes()).toContain('option-student-correct')
    expect(options[1].find('.quiz-option-tag i.fas.fa-check').exists()).toBe(true)
    // The other options stay neutral.
    expect(options[0].find('.quiz-option-tag').exists()).toBe(false)
    expect(options[2].find('.quiz-option-tag').exists()).toBe(false)
  })

  it('renders the orphan fallback when the student answer resolves to no option', () => {
    // student_answer '9' is neither a valid index nor an option text → orphan.
    const q = makeQuestion({ student_answer: '9', correct_answer: '1' })
    const wrapper = mountReview(makeStep([q]))

    // The orphan line surfaces the raw submitted value.
    const review = wrapper.find('.quiz-question-item')
    expect(review.text()).toContain('9')
    // No option carries a student-wrong/student-correct role (the index didn't match any option).
    const options = wrapper.findAll('.quiz-question-option')
    for (const o of options) {
      expect(o.classes()).not.toContain('option-student-wrong')
      expect(o.classes()).not.toContain('option-student-correct')
    }
  })

  it('renders non-MC questions with the answer lines (student + correct)', () => {
    const free = makeQuestion({
      question_type: 'free_text',
      options: '',
      student_answer: 'my typed answer',
      correct_answer: 'expected answer',
      is_correct: false,
    })
    const wrapper = mountReview(makeStep([free]))

    // No MC option grid for a free-text question.
    expect(wrapper.findAll('.quiz-question-option').length).toBe(0)
    const text = wrapper.find('.quiz-question-item').text()
    expect(text).toContain('my typed answer')
    expect(text).toContain('expected answer')
  })

  it('flags each question item correct/incorrect', () => {
    const wrapper = mountReview(makeStep([
      makeQuestion({ id: 'a', is_correct: true, student_answer: '1', correct_answer: '1' }),
      makeQuestion({ id: 'b', is_correct: false, student_answer: '2', correct_answer: '1' }),
    ]))
    const items = wrapper.findAll('.quiz-question-item')
    expect(items.length).toBe(2)
    expect(items[0].classes()).toContain('quiz-q-correct')
    expect(items[1].classes()).toContain('quiz-q-incorrect')
  })
})
