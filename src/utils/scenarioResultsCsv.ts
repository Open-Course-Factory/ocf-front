/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Pure CSV string builders for the group scenario result/command exports,
 * extracted from GroupScenariosTab.vue (commit c4 of #244).
 *
 * No DOM, no fetch, no t(): the fetch + download orchestration stays in the
 * component, which resolves header/yes-no strings via t() and passes them in
 * as a `labels` map. Every field passes through sanitizeCSVField (always
 * quotes, doubles inner quotes, formula-injection guard).
 */

import {
  resolveAnswerText,
  formatDuration,
  formatDate,
  normalizedStepType,
  formatExecutedAt,
  commandsForStepFromList
} from './scenarioDisplay'
import { sanitizeCSVField } from './csv'
import type {
  SessionStepDetail,
  SessionDetailResponse,
  SessionCommand
} from '../services/domain/scenario'
import type { ScenarioResultItem } from '../types/groupScenarios'

export interface SessionDetailCsvLabels {
  name: string
  email: string
  status: string
  grade: string
  stepOrder: string
  stepTitle: string
  stepType: string
  stepStatus: string
  attempts: string
  quizScore: string
  hintsUsed: string
  timeSpent: string
  completedAt: string
  questionOrder: string
  questionText: string
  questionType: string
  studentAnswer: string
  correctAnswer: string
  isCorrect: string
  yes: string
  no: string
}

export interface CommandsCsvLabels {
  commandSequence: string
  command: string
  commandExecutedAt: string
  student: string
  stepOrder: string
  stepTitle: string
  stepType: string
}

export function formatQuizScoreCsv(score?: number): string {
  if (score == null) return ''
  return `${(score * 100).toFixed(1)}%`
}

// Full 19-column per-student session-detail CSV. Shared by every result export
// (full / single / selected) — they differ only in which `details` they pass.
export function buildSessionDetailCsv(
  details: Array<{ result: ScenarioResultItem; detail: SessionDetailResponse }>,
  labels: SessionDetailCsvLabels
): string {
  const headers = [
    labels.name,
    labels.email,
    labels.status,
    labels.grade,
    labels.stepOrder,
    labels.stepTitle,
    labels.stepType,
    labels.stepStatus,
    labels.attempts,
    labels.quizScore,
    labels.hintsUsed,
    labels.timeSpent,
    labels.completedAt,
    // Per-question columns. Blank on step rows; filled on question rows
    // (one extra row per quiz question, after the parent step row).
    labels.questionOrder,
    labels.questionText,
    labels.questionType,
    labels.studentAnswer,
    labels.correctAnswer,
    labels.isCorrect
  ]
  const yes = labels.yes
  const no = labels.no
  const rows: any[][] = []
  for (const { result, detail } of details) {
    const studentName = result.user_name || result.user_id
    const email = result.user_email || ''
    const status = result.status
    const grade = result.grade != null ? Math.round(result.grade) + '%' : ''
    for (const step of detail.steps) {
      const stepCols = [
        studentName, email, status, grade,
        step.step_order + 1,
        step.step_title,
        normalizedStepType(step.step_type),
        step.status,
        step.verify_attempts,
        formatQuizScoreCsv(step.quiz_score),
        step.hints_revealed,
        formatDuration(step.time_spent_seconds),
        step.completed_at ? formatDate(step.completed_at) : ''
      ]
      // Step row: leave the 6 question columns blank.
      rows.push([...stepCols, '', '', '', '', '', ''])
      // Quiz step → one row per question, repeating the step columns so
      // each row is self-contained for filtering / pivoting.
      if (normalizedStepType(step.step_type) === 'quiz' && step.questions) {
        for (let i = 0; i < step.questions.length; i++) {
          const q = step.questions[i]
          rows.push([
            ...stepCols,
            (q.order != null ? q.order + 1 : i + 1),
            q.question_text,
            q.question_type,
            resolveAnswerText(q, q.student_answer),
            resolveAnswerText(q, q.correct_answer),
            q.is_correct ? yes : no
          ])
        }
      }
    }
  }
  return [headers, ...rows].map(row => row.map(sanitizeCSVField).join(',')).join('\n')
}

// Session command log CSV. Flat mode = one row per command; per-step mode
// prefixes step columns and buckets commands by step time window.
export function buildCommandsCsv(
  commands: SessionCommand[],
  labels: CommandsCsvLabels,
  opts: { learner: string; perStep?: boolean; steps?: SessionStepDetail[]; now?: number }
): string {
  const { learner, perStep, steps } = opts
  const now = opts.now ?? Date.now()
  const baseHeaders = [
    labels.commandSequence,
    labels.command,
    labels.commandExecutedAt,
    labels.student
  ]
  const headers = perStep
    ? [
        labels.stepOrder,
        labels.stepTitle,
        labels.stepType,
        ...baseHeaders
      ]
    : baseHeaders

  let rows: any[][]
  if (perStep && steps) {
    rows = []
    // Build per-step buckets so each command appears once under the step it falls in.
    for (const step of steps) {
      const stepCommands = commandsForStepFromList(step, commands, now)
      for (const c of stepCommands) {
        rows.push([
          step.step_order + 1,
          step.step_title,
          normalizedStepType(step.step_type),
          c.sequence_num,
          c.command_text,
          formatExecutedAt(c.executed_at),
          learner
        ])
      }
    }
  } else {
    rows = commands.map(c => [
      c.sequence_num,
      c.command_text,
      formatExecutedAt(c.executed_at),
      learner
    ])
  }
  return [headers, ...rows].map(row => row.map(sanitizeCSVField).join(',')).join('\n')
}
