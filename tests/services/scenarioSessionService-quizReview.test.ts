/**
 * quizResultAwaitsReview decides whether the learner stays on the quiz results
 * until they move on by hand. A survey has nothing to review: it moves on by
 * itself even when its step says show_immediate_feedback.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

import { quizResultAwaitsReview } from '../../src/services/domain/scenario/scenarioSessionService'

describe('quizResultAwaitsReview', () => {
  it('never holds a survey for review, even with show_immediate_feedback', () => {
    expect(quizResultAwaitsReview({ step_type: 'survey', show_immediate_feedback: true }, {})).toBe(false)
    expect(quizResultAwaitsReview(
      { step_type: 'survey', show_immediate_feedback: true },
      { per_question_results: [{ question_id: 'q1', correct: false }] }
    )).toBe(false)
  })

  it('still holds a learning-mode quiz, and an exam with a breakdown', () => {
    expect(quizResultAwaitsReview({ step_type: 'quiz', show_immediate_feedback: true }, {})).toBe(true)
    expect(quizResultAwaitsReview(
      { step_type: 'quiz', show_immediate_feedback: false },
      { per_question_results: [{ question_id: 'q1', correct: true }] }
    )).toBe(true)
    expect(quizResultAwaitsReview({ step_type: 'quiz', show_immediate_feedback: false }, {})).toBe(false)
  })
})
