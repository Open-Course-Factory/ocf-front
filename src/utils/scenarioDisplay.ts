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

// Per multiple-choice option, returns one of:
//   'student-correct' — student picked this AND it's the right answer
//   'correct'         — the right answer (student picked something else)
//   'student-wrong'   — student picked this AND it's wrong
//   ''                — not picked, not the right answer
//
// Multiple-choice answers are stored as the option's index as a string —
// the player (ScenarioPanel.vue) submits `String(idx)` and the backend
// stores `correct_answer` as the same index string. So we compare indexes,
// not the literal option text.
export function optionRole(optIdx: number, q: SessionStepQuestionDetail): OptionRole {
  const idxStr = String(optIdx)
  const isStudent = idxStr === q.student_answer
  const isCorrect = idxStr === q.correct_answer
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

// Returns true when student_answer is set but cannot be resolved against the
// options list (legacy free-text-on-mc data, edited options, etc.). Used to
// decide whether to show the orphan-answer fallback line. We accept either
// the index form ("0") or the literal text form for backwards compat.
export function isOrphanStudentAnswer(q: SessionStepQuestionDetail, options: string[]): boolean {
  if (!q.student_answer) return false
  const asIndex = Number(q.student_answer)
  if (Number.isInteger(asIndex) && asIndex >= 0 && asIndex < options.length) return false
  if (options.includes(q.student_answer)) return false
  return true
}

// Resolve a stored answer (string) to display text. For multiple_choice the
// answer is an option index ("0", "1", ...) and we look up the text in the
// options list. For other types it's the literal value. Returns '' when the
// answer is empty.
export function resolveAnswerText(q: SessionStepQuestionDetail, raw: string): string {
  if (!raw) return ''
  if (q.question_type === 'multiple_choice') {
    const opts = parseQuizOptions(q.options)
    const idx = Number(raw)
    if (Number.isInteger(idx) && idx >= 0 && idx < opts.length) {
      return opts[idx]
    }
  }
  return raw
}

export function quizCorrectCount(step: SessionStepDetail): number {
  return (step.questions || []).filter(q => q.is_correct).length
}

export function quizQuestionTotal(step: SessionStepDetail): number {
  return (step.questions || []).length
}

export function normalizedStepType(stepType?: string): 'terminal' | 'flag' | 'info' | 'quiz' {
  switch (stepType) {
    case 'flag': return 'flag'
    case 'info': return 'info'
    case 'quiz': return 'quiz'
    default: return 'terminal'
  }
}

export function stepTypeIcon(stepType?: string): string {
  switch (normalizedStepType(stepType)) {
    case 'flag': return 'fas fa-flag'
    case 'info': return 'fas fa-book-open'
    case 'quiz': return 'fas fa-question-circle'
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
    case 'locked': return 'status-locked'
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
