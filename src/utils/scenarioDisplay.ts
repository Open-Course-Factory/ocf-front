/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Pure, i18n-free display/parse helpers for scenario session detail rendering,
 * extracted verbatim from GroupScenariosTab.vue (commit c1 of #244).
 *
 * No t(), no reactive refs, no service calls. The "active step, open-ended
 * window" case in commandsForStepFromList takes an injected `now` (ms) instead
 * of reading Date.now(), so it stays pure and testable. The i18n wrappers
 * (translateStatus / translateDifficulty / stepTypeLabel / optionRoleText) and
 * formatQuizScorePct stay in the component.
 */

import type {
  ScenarioInfo,
  SessionStepDetail,
  SessionStepQuestionDetail,
  SessionCommand
} from '../services/domain/scenario'

export type OptionRole = 'student-correct' | 'correct' | 'student-wrong' | ''

export function parseQuizOptions(rawOptions?: string): string[] {
  if (!rawOptions) return []
  try {
    const parsed = JSON.parse(rawOptions)
    if (Array.isArray(parsed)) {
      return parsed.map(v => String(v))
    }
    return []
  } catch {
    return []
  }
}

// Questions answered by picking options, rendered as an option list.
export function isChoiceQuestion(q: SessionStepQuestionDetail): boolean {
  return q.question_type === 'multiple_choice' || q.question_type === 'multi_answer'
}

// The options a stored answer picks. multiple_choice stores one index as a
// string ("1"; legacy data may hold the option text), multi_answer a JSON list
// of indexes ("[0,2]"). Returns [] for no answer, null when the answer does not
// match the options (edited options, legacy data).
export function answerIndexes(q: SessionStepQuestionDetail, raw: string): number[] | null {
  if (!raw) return []
  const options = parseQuizOptions(q.options)
  const inRange = (i: unknown): i is number =>
    typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < options.length
  if (q.question_type === 'multiple_choice') {
    const idx = Number(raw)
    if (inRange(idx)) return [idx]
    const textIdx = options.indexOf(raw)
    return textIdx >= 0 ? [textIdx] : null
  }
  if (q.question_type === 'multi_answer') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.every(inRange)) return parsed
    } catch {
      // not a JSON list: unresolvable
    }
  }
  return null
}

// Per option of a choice question, returns one of:
//   'student-correct' — student picked this AND it's expected
//   'correct'         — expected, the student did not pick it
//   'student-wrong'   — student picked this AND it's not expected
//   ''                — not picked, not expected
export function optionRole(optIdx: number, q: SessionStepQuestionDetail): OptionRole {
  const isStudent = (answerIndexes(q, q.student_answer) ?? []).includes(optIdx)
  const isCorrect = (answerIndexes(q, q.correct_answer) ?? []).includes(optIdx)
  if (isStudent && isCorrect) return 'student-correct'
  if (isCorrect) return 'correct'
  if (isStudent) return 'student-wrong'
  return ''
}

export function optionRoleClass(optIdx: number, q: SessionStepQuestionDetail): string {
  const role = optionRole(optIdx, q)
  return role ? `option-${role}` : ''
}

export function optionRoleIcon(optIdx: number, q: SessionStepQuestionDetail): string {
  const role = optionRole(optIdx, q)
  if (role === 'student-correct' || role === 'correct') return 'fas fa-check'
  if (role === 'student-wrong') return 'fas fa-times'
  return ''
}

// For multiple_choice questions the answer string is the option text;
// for free_text/true_false it is the literal answer. Returns the value to render.
export function displayAnswer(answer: string): string {
  return answer && answer.trim() !== '' ? answer : ''
}

// True when a choice question's student_answer is set but matches no option,
// so the option list cannot show it and the raw value must be.
export function isOrphanStudentAnswer(q: SessionStepQuestionDetail): boolean {
  return !!q.student_answer && answerIndexes(q, q.student_answer) === null
}

// A stored answer in the words the learner saw: option texts for choice
// questions (joined with ", " for multi_answer), the literal value otherwise.
// Returns '' when the answer is empty, the raw value when it matches no option.
export function resolveAnswerText(q: SessionStepQuestionDetail, raw: string): string {
  if (!isChoiceQuestion(q)) return raw
  const indexes = answerIndexes(q, raw)
  if (indexes === null) return raw
  const options = parseQuizOptions(q.options)
  return indexes.map(i => options[i]).join(', ')
}

export function quizCorrectCount(step: SessionStepDetail): number {
  return (step.questions || []).filter(q => q.is_correct).length
}

export function quizQuestionTotal(step: SessionStepDetail): number {
  return (step.questions || []).length
}

export function normalizedStepType(stepType?: string): 'terminal' | 'flag' | 'info' | 'quiz' | 'survey' {
  switch (stepType) {
    case 'flag': return 'flag'
    case 'info': return 'info'
    case 'quiz': return 'quiz'
    case 'survey': return 'survey'
    default: return 'terminal'
  }
}

export function stepTypeIcon(stepType?: string): string {
  switch (normalizedStepType(stepType)) {
    case 'flag': return 'fas fa-flag'
    case 'info': return 'fas fa-book-open'
    case 'quiz': return 'fas fa-question-circle'
    case 'survey': return 'fas fa-clipboard-list'
    default: return 'fas fa-terminal'
  }
}

export function formatExecutedAt(unixSeconds: number): string {
  try {
    return new Date(unixSeconds * 1000).toLocaleString()
  } catch {
    return String(unixSeconds)
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes < 60) return `${minutes}m ${secs}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString()
}

export function getStatusClass(status: string): string {
  switch (status) {
    case 'completed': return 'status-completed'
    case 'active': case 'in_progress': return 'status-active'
    case 'locked': case 'skipped': return 'status-locked'
    case 'abandoned': return 'status-abandoned'
    default: return ''
  }
}

export function getDifficultyClass(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'difficulty-beginner'
    case 'intermediate': return 'difficulty-intermediate'
    case 'advanced': return 'difficulty-advanced'
    default: return ''
  }
}

export function quizScoreClass(score: number): string {
  if (score >= 0.7) return 'quiz-score-success'
  if (score >= 0.4) return 'quiz-score-warning'
  return 'quiz-score-danger'
}

// Returns the commands executed during a given step's time window, filtered
// from an arbitrary command list. step.started_at is inclusive; completed_at is
// exclusive. For an active step (no completed_at) the open end is the injected
// `now` (ms). Commands' executed_at is unix SECONDS.
export function commandsForStepFromList(
  step: SessionStepDetail,
  list: SessionCommand[],
  now: number
): SessionCommand[] {
  if (!step.started_at) return []
  const startMs = new Date(step.started_at).getTime()
  if (Number.isNaN(startMs)) return []
  const endMs = step.completed_at ? new Date(step.completed_at).getTime() : now
  if (Number.isNaN(endMs)) return []
  const startSec = startMs / 1000
  const endSec = endMs / 1000
  return list.filter(c => c.executed_at >= startSec && c.executed_at < endSec)
}

// The learner's validated-flags panel. ocf-core issues a flag for every flag
// step whether or not flags_enabled is set, and says so in has_flag_steps;
// a backend that predates the field leaves flags_enabled as the only signal.
export function showsValidatedFlags(scenario?: ScenarioInfo | null): boolean {
  return !!scenario?.flags_enabled || !!scenario?.has_flag_steps
}
