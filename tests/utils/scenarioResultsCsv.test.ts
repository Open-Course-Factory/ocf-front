/**
 * Tests for scenarioResultsCsv — the PURE CSV string builders extracted from
 * GroupScenariosTab.vue (commit c4 of #244).
 *
 * The fetch + download orchestration (exportResultsCsv / exportSingleResult /
 * exportSelectedResults / exportCommandsCsv) STAYS in the parent. Only the
 * pure string-building is extracted. Builders take their data + a `labels` map
 * of resolved header/yes-no strings so there is NO t() inside.
 *
 * Reality check on the parent: exportResultsCsv, exportSingleResult and
 * exportSelectedResults ALL call the SAME builder (buildDetailCsv) — they
 * differ only in which `details` array they pass. So there is one shared
 * session-detail builder, not a separate "results table" builder. We pin that.
 *
 * Escaping: every field passes through sanitizeCSVField, which ALWAYS wraps the
 * value in double quotes, doubles embedded quotes, and prefixes a leading
 * =/+/-/@ with a single quote (formula-injection guard). So every emitted cell
 * is quoted — the assertions account for that.
 */

import { describe, it, expect } from 'vitest'
import {
  buildSessionDetailCsv,
  buildCommandsCsv,
  formatQuizScoreCsv,
  type SessionDetailCsvLabels,
  type CommandsCsvLabels,
} from '../../src/utils/scenarioResultsCsv'

// ---- Label maps (the parent resolves these via t() and passes them in) ----

const detailLabels: SessionDetailCsvLabels = {
  name: 'Name',
  email: 'Email',
  status: 'Status',
  grade: 'Grade',
  stepOrder: 'Step #',
  stepTitle: 'Step Title',
  stepType: 'Step Type',
  stepStatus: 'Step Status',
  attempts: 'Attempts',
  quizScore: 'Quiz Score',
  hintsUsed: 'Hints',
  timeSpent: 'Time',
  completedAt: 'Completed At',
  questionOrder: 'Q #',
  questionText: 'Question',
  questionType: 'Q Type',
  studentAnswer: 'Student Answer',
  correctAnswer: 'Correct Answer',
  isCorrect: 'Correct?',
  yes: 'Yes',
  no: 'No',
}

const commandsLabels: CommandsCsvLabels = {
  commandSequence: 'Seq',
  command: 'Command',
  commandExecutedAt: 'Executed At',
  student: 'Student',
  stepOrder: 'Step #',
  stepTitle: 'Step Title',
  stepType: 'Step Type',
}

function makeResult(overrides: Record<string, any> = {}) {
  return {
    session_id: 'sess-1',
    user_id: 'u1',
    user_name: 'Alice',
    user_email: 'alice@example.com',
    status: 'completed',
    grade: 86.4,
    ...overrides,
  }
}

function makeTerminalStep(overrides: Record<string, any> = {}) {
  return {
    step_order: 0,
    step_title: 'Open a shell',
    step_type: 'terminal',
    status: 'completed',
    verify_attempts: 2,
    hints_revealed: 1,
    time_spent_seconds: 65,
    completed_at: '2026-05-10T12:00:00.000Z',
    ...overrides,
  }
}

function makeQuizStep(overrides: Record<string, any> = {}) {
  return {
    step_order: 1,
    step_title: 'Quiz time',
    step_type: 'quiz',
    status: 'completed',
    verify_attempts: 1,
    hints_revealed: 0,
    time_spent_seconds: 30,
    completed_at: '',
    quiz_score: 0.5,
    questions: [
      {
        id: 'q1',
        order: 0,
        question_text: 'Pick one',
        question_type: 'multiple_choice',
        options: JSON.stringify(['Alpha', 'Beta', 'Gamma']),
        student_answer: '2', // → Gamma
        correct_answer: '1', // → Beta
        is_correct: false,
        points: 1,
      },
    ],
    ...overrides,
  }
}

// Parse a CSV produced by sanitizeCSVField back into rows of unquoted cells.
// sanitizeCSVField quotes EVERY field, so a simple state-machine parse is safe.
function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i]
    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') { cell += '"'; i++ } else { inQuotes = false }
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell); cell = ''
    } else if (ch === '\n') {
      row.push(cell); rows.push(row); row = []; cell = ''
    } else {
      cell += ch
    }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

describe('formatQuizScoreCsv', () => {
  it('formats a 0..1 score as a 1-decimal percentage', () => {
    expect(formatQuizScoreCsv(0.5)).toBe('50.0%')
    expect(formatQuizScoreCsv(0.864)).toBe('86.4%')
    expect(formatQuizScoreCsv(1)).toBe('100.0%')
    expect(formatQuizScoreCsv(0)).toBe('0.0%')
  })

  it('returns empty string for null / undefined', () => {
    expect(formatQuizScoreCsv(undefined)).toBe('')
    expect(formatQuizScoreCsv(null as any)).toBe('')
  })
})

describe('buildSessionDetailCsv', () => {
  it('emits the full header row in the documented column order', () => {
    const csv = buildSessionDetailCsv([], detailLabels)
    const [header] = parseCsv(csv)
    expect(header).toEqual([
      'Name', 'Email', 'Status', 'Grade',
      'Step #', 'Step Title', 'Step Type', 'Step Status',
      'Attempts', 'Quiz Score', 'Hints', 'Time', 'Completed At',
      'Q #', 'Question', 'Q Type', 'Student Answer', 'Correct Answer', 'Correct?',
    ])
  })

  it('header-only when there are no details', () => {
    const csv = buildSessionDetailCsv([], detailLabels)
    expect(parseCsv(csv).length).toBe(1)
  })

  it('renders a terminal step row with the student/step columns and blank question columns', () => {
    const csv = buildSessionDetailCsv(
      [{ result: makeResult(), detail: { steps: [makeTerminalStep()] } as any }],
      detailLabels,
    )
    const rows = parseCsv(csv)
    expect(rows.length).toBe(2) // header + 1 step row
    const r = rows[1]
    expect(r[0]).toBe('Alice')
    expect(r[1]).toBe('alice@example.com')
    expect(r[2]).toBe('completed')
    expect(r[3]).toBe('86%')            // grade rounded
    expect(r[4]).toBe('1')              // step_order + 1
    expect(r[5]).toBe('Open a shell')
    expect(r[6]).toBe('terminal')
    expect(r[8]).toBe('2')              // verify_attempts
    expect(r[9]).toBe('')               // quiz_score absent on terminal step
    expect(r[11]).toBe('1m 5s')         // formatDuration(65)
    // The 6 question columns are blank on a step row.
    expect(r.slice(13)).toEqual(['', '', '', '', '', ''])
  })

  it('quiz step emits a parent step row PLUS one question row, resolving MC answer indices to option text', () => {
    const csv = buildSessionDetailCsv(
      [{ result: makeResult(), detail: { steps: [makeQuizStep()] } as any }],
      detailLabels,
    )
    const rows = parseCsv(csv)
    expect(rows.length).toBe(3) // header + step row + 1 question row

    const stepRow = rows[1]
    expect(stepRow[6]).toBe('quiz')
    expect(stepRow[9]).toBe('50.0%')   // formatQuizScoreCsv(0.5)
    expect(stepRow.slice(13)).toEqual(['', '', '', '', '', ''])

    const qRow = rows[2]
    expect(qRow[13]).toBe('1')                 // q.order + 1
    expect(qRow[14]).toBe('Pick one')
    expect(qRow[15]).toBe('multiple_choice')
    // The load-bearing bit: index strings resolve to OPTION TEXT, not "2"/"1".
    expect(qRow[16]).toBe('Gamma')             // student_answer '2' → Gamma
    expect(qRow[17]).toBe('Beta')              // correct_answer '1' → Beta
    expect(qRow[18]).toBe('No')                // is_correct=false → no label
  })

  it('escapes fields containing commas, quotes and newlines', () => {
    const csv = buildSessionDetailCsv(
      [{
        result: makeResult({ user_name: 'Smith, "Bob"' }),
        detail: { steps: [makeTerminalStep({ step_title: 'line1\nline2' })] } as any,
      }],
      detailLabels,
    )
    const rows = parseCsv(csv)
    // Round-trips cleanly: the comma+quote name and the newline title survive.
    expect(rows[1][0]).toBe('Smith, "Bob"')
    expect(rows[1][5]).toBe('line1\nline2')

    // And the raw text quotes the field and doubles the inner quotes.
    expect(csv).toContain('"Smith, ""Bob"""')
  })
})

describe('buildCommandsCsv', () => {
  const commands = [
    { session_uuid: 's', sequence_num: 1, command_text: 'ls -la', executed_at: 1_700_000_000 },
    { session_uuid: 's', sequence_num: 2, command_text: 'echo "hi, there"', executed_at: 1_700_000_060 },
  ]

  it('flat mode: emits the base header and one row per command', () => {
    const csv = buildCommandsCsv(commands as any, commandsLabels, { learner: 'Alice' })
    const rows = parseCsv(csv)
    expect(rows[0]).toEqual(['Seq', 'Command', 'Executed At', 'Student'])
    expect(rows.length).toBe(3) // header + 2 commands
    expect(rows[1][0]).toBe('1')
    expect(rows[1][1]).toBe('ls -la')
    expect(rows[1][3]).toBe('Alice')
    // Escaping: the comma+quotes command round-trips.
    expect(rows[2][1]).toBe('echo "hi, there"')
  })

  it('header-only when there are no commands (flat mode)', () => {
    const csv = buildCommandsCsv([] as any, commandsLabels, { learner: 'Alice' })
    expect(parseCsv(csv).length).toBe(1)
  })
})
