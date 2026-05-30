/**
 * Tests for scenarioDisplay — pure, i18n-free display/parse helpers extracted
 * from GroupScenariosTab.vue (commit c1 of ocf-front #244).
 *
 * These are pure functions: no t(), no reactive refs, no service calls. Two
 * helpers that referenced Date.now() in the component (the "active step,
 * open-ended window" case) are made pure here by INJECTING `now` as a
 * parameter — see commandsForStepFromList below and the purity notes in the
 * accompanying report.
 *
 * `formatQuizScorePct` is intentionally NOT covered: in the component it calls
 * t('groupScenarios.quizScorePct', …) and is therefore i18n-coupled, not a
 * pure-util candidate. It must stay in the component. `quizScoreClass` (the
 * pure score→class mapping) is covered instead.
 *
 * Assertions pin observable outputs, never reimplementations of the formula.
 */

import { describe, it, expect } from 'vitest'
import {
  parseQuizOptions,
  optionRole,
  optionRoleClass,
  optionRoleIcon,
  displayAnswer,
  isOrphanStudentAnswer,
  resolveAnswerText,
  quizCorrectCount,
  quizQuestionTotal,
  normalizedStepType,
  stepTypeIcon,
  commandsForStepFromList,
  formatExecutedAt,
  formatDuration,
  formatDate,
  getStatusClass,
  getDifficultyClass,
  quizScoreClass,
} from '../../src/utils/scenarioDisplay'

// ---- Fixture builders (mirror SessionStepQuestionDetail / SessionStepDetail / SessionCommand) ----

function makeQuestion(overrides: Record<string, any> = {}) {
  return {
    id: 'q1',
    order: 0,
    question_text: 'Pick one',
    question_type: 'multiple_choice',
    options: JSON.stringify(['Alpha', 'Beta', 'Gamma']),
    correct_answer: '1',
    student_answer: '1',
    is_correct: true,
    points: 1,
    ...overrides,
  }
}

function makeStep(overrides: Record<string, any> = {}) {
  return {
    step_order: 0,
    step_title: 'Step',
    step_type: 'terminal',
    status: 'active',
    verify_attempts: 0,
    hints_revealed: 0,
    time_spent_seconds: 0,
    ...overrides,
  }
}

function makeCommand(seq: number, executedAt: number) {
  return {
    session_uuid: 's',
    sequence_num: seq,
    command_text: `cmd-${seq}`,
    executed_at: executedAt, // unix SECONDS
  }
}

describe('parseQuizOptions', () => {
  it('parses a JSON-encoded array string into a string array', () => {
    expect(parseQuizOptions(JSON.stringify(['a', 'b', 'c']))).toEqual(['a', 'b', 'c'])
  })

  it('coerces non-string array members to strings', () => {
    expect(parseQuizOptions(JSON.stringify([1, true, 'x']))).toEqual(['1', 'true', 'x'])
  })

  it('returns [] for a JSON value that is not an array', () => {
    expect(parseQuizOptions(JSON.stringify({ a: 1 }))).toEqual([])
  })

  it('returns [] for malformed JSON', () => {
    expect(parseQuizOptions('{not json')).toEqual([])
  })

  it('returns [] for undefined / empty input', () => {
    expect(parseQuizOptions(undefined)).toEqual([])
    expect(parseQuizOptions('')).toEqual([])
  })
})

describe('optionRole (index-vs-index classification)', () => {
  // student picked idx 2, correct is idx 1.
  const q = makeQuestion({ student_answer: '2', correct_answer: '1', is_correct: false })

  const cases: Array<{ idx: number; expected: string }> = [
    { idx: 0, expected: '' },              // neither picked nor correct
    { idx: 1, expected: 'correct' },        // the right answer, student missed it
    { idx: 2, expected: 'student-wrong' },  // student picked, wrong
    { idx: 3, expected: '' },               // out of the way
  ]

  for (const { idx, expected } of cases) {
    it(`classifies idx ${idx} as '${expected}'`, () => {
      expect(optionRole(idx, q as any)).toBe(expected)
    })
  }

  it("returns 'student-correct' when the student picked the right index", () => {
    const correct = makeQuestion({ student_answer: '1', correct_answer: '1', is_correct: true })
    expect(optionRole(1, correct as any)).toBe('student-correct')
    // other options are neutral
    expect(optionRole(0, correct as any)).toBe('')
  })

  it('compares by INDEX, not option text (regression guard)', () => {
    // If a buggy impl compared against the option text "Beta" it would misfire.
    const q2 = makeQuestion({ student_answer: '1', correct_answer: '1' })
    // idx 1 is the only one flagged; the text "Beta" must not leak into the match.
    expect(optionRole(1, q2 as any)).toBe('student-correct')
    expect(optionRole(0, q2 as any)).toBe('')
    expect(optionRole(2, q2 as any)).toBe('')
  })
})

describe('optionRoleClass / optionRoleIcon', () => {
  const q = makeQuestion({ student_answer: '2', correct_answer: '1', is_correct: false })

  it('maps roles to option-* classes, and neutral to empty', () => {
    expect(optionRoleClass(1, q as any)).toBe('option-correct')
    expect(optionRoleClass(2, q as any)).toBe('option-student-wrong')
    expect(optionRoleClass(0, q as any)).toBe('')
  })

  it('maps roles to icons (check for correct, times for wrong, empty for neutral)', () => {
    expect(optionRoleIcon(1, q as any)).toBe('fas fa-check')
    expect(optionRoleIcon(2, q as any)).toBe('fas fa-times')
    expect(optionRoleIcon(0, q as any)).toBe('')
  })

  it('uses the check icon for a student-correct pick', () => {
    const correct = makeQuestion({ student_answer: '1', correct_answer: '1' })
    expect(optionRoleIcon(1, correct as any)).toBe('fas fa-check')
  })
})

describe('displayAnswer', () => {
  it('returns the trimmed-non-empty answer as-is', () => {
    expect(displayAnswer('ls -la')).toBe('ls -la')
  })

  it('returns empty string for empty / whitespace-only input', () => {
    expect(displayAnswer('')).toBe('')
    expect(displayAnswer('   ')).toBe('')
  })
})

describe('isOrphanStudentAnswer', () => {
  const options = ['Alpha', 'Beta', 'Gamma']

  it('returns false when there is no student answer', () => {
    expect(isOrphanStudentAnswer(makeQuestion({ student_answer: '' }) as any, options)).toBe(false)
  })

  it('returns false when the answer is a valid index into options', () => {
    expect(isOrphanStudentAnswer(makeQuestion({ student_answer: '2' }) as any, options)).toBe(false)
  })

  it('returns false when the answer matches an option text literally (legacy form)', () => {
    expect(isOrphanStudentAnswer(makeQuestion({ student_answer: 'Beta' }) as any, options)).toBe(false)
  })

  it('returns true when the answer resolves to nothing (orphan)', () => {
    expect(isOrphanStudentAnswer(makeQuestion({ student_answer: '9' }) as any, options)).toBe(true)
    expect(isOrphanStudentAnswer(makeQuestion({ student_answer: 'Zeta' }) as any, options)).toBe(true)
  })
})

describe('resolveAnswerText', () => {
  it('resolves a multiple_choice index string to the option text', () => {
    const q = makeQuestion({ question_type: 'multiple_choice', options: JSON.stringify(['Alpha', 'Beta', 'Gamma']) })
    expect(resolveAnswerText(q as any, '2')).toBe('Gamma')
  })

  it('falls back to the raw value when the index is out of range', () => {
    const q = makeQuestion({ question_type: 'multiple_choice', options: JSON.stringify(['Alpha', 'Beta']) })
    expect(resolveAnswerText(q as any, '5')).toBe('5')
  })

  it('passes through free-text / true_false answers literally', () => {
    const free = makeQuestion({ question_type: 'free_text', options: '' })
    expect(resolveAnswerText(free as any, 'my answer')).toBe('my answer')
    const tf = makeQuestion({ question_type: 'true_false', options: '' })
    expect(resolveAnswerText(tf as any, 'true')).toBe('true')
  })

  it('returns empty string for an empty raw answer', () => {
    const q = makeQuestion()
    expect(resolveAnswerText(q as any, '')).toBe('')
  })
})

describe('quizCorrectCount / quizQuestionTotal', () => {
  it('counts correct answers and total questions on a mixed step', () => {
    const step = makeStep({
      questions: [
        makeQuestion({ id: 'a', is_correct: true }),
        makeQuestion({ id: 'b', is_correct: false }),
        makeQuestion({ id: 'c', is_correct: true }),
      ],
    })
    expect(quizCorrectCount(step as any)).toBe(2)
    expect(quizQuestionTotal(step as any)).toBe(3)
  })

  it('returns 0 for a step with no questions', () => {
    const step = makeStep({ questions: undefined })
    expect(quizCorrectCount(step as any)).toBe(0)
    expect(quizQuestionTotal(step as any)).toBe(0)
  })
})

describe('normalizedStepType / stepTypeIcon', () => {
  const cases: Array<{ input: string | undefined; type: string; icon: string }> = [
    { input: 'flag', type: 'flag', icon: 'fas fa-flag' },
    { input: 'info', type: 'info', icon: 'fas fa-book-open' },
    { input: 'quiz', type: 'quiz', icon: 'fas fa-question-circle' },
    { input: 'terminal', type: 'terminal', icon: 'fas fa-terminal' },
    { input: 'something-unknown', type: 'terminal', icon: 'fas fa-terminal' },
    { input: undefined, type: 'terminal', icon: 'fas fa-terminal' },
    { input: '', type: 'terminal', icon: 'fas fa-terminal' },
  ]

  for (const { input, type, icon } of cases) {
    it(`maps ${JSON.stringify(input)} → type '${type}', icon '${icon}'`, () => {
      expect(normalizedStepType(input)).toBe(type)
      expect(stepTypeIcon(input)).toBe(icon)
    })
  }
})

describe('commandsForStepFromList (window filter, now injected)', () => {
  // Commands at t=100,150,200,250 (unix seconds).
  const list = [makeCommand(1, 100), makeCommand(2, 150), makeCommand(3, 200), makeCommand(4, 250)]

  it('returns only commands inside [started_at, completed_at) for a closed window', () => {
    // started_at = 150s → ISO; completed_at = 230s → ISO. Window [150,230): seq 2 and 3.
    const step = makeStep({
      started_at: new Date(150 * 1000).toISOString(),
      completed_at: new Date(230 * 1000).toISOString(),
    })
    const out = commandsForStepFromList(step as any, list as any, 999 * 1000)
    expect(out.map(c => c.sequence_num)).toEqual([2, 3])
  })

  it('treats started_at as inclusive and completed_at as exclusive', () => {
    // Window exactly [150,200): includes 150 (seq 2), excludes 200 (seq 3).
    const step = makeStep({
      started_at: new Date(150 * 1000).toISOString(),
      completed_at: new Date(200 * 1000).toISOString(),
    })
    const out = commandsForStepFromList(step as any, list as any, 999 * 1000)
    expect(out.map(c => c.sequence_num)).toEqual([2])
  })

  it('uses the injected `now` as the open end for an active step (no completed_at)', () => {
    // started_at = 150s, no completed_at → end = now. now=210s → [150,210): seq 2,3.
    const step = makeStep({ started_at: new Date(150 * 1000).toISOString(), completed_at: undefined })
    const out = commandsForStepFromList(step as any, list as any, 210 * 1000)
    expect(out.map(c => c.sequence_num)).toEqual([2, 3])
  })

  it('returns [] when the step has no started_at', () => {
    const step = makeStep({ started_at: undefined })
    expect(commandsForStepFromList(step as any, list as any, 999 * 1000)).toEqual([])
  })

  it('returns [] when started_at is unparseable', () => {
    const step = makeStep({ started_at: 'not-a-date' })
    expect(commandsForStepFromList(step as any, list as any, 999 * 1000)).toEqual([])
  })

  it('returns [] for an empty command list', () => {
    const step = makeStep({
      started_at: new Date(150 * 1000).toISOString(),
      completed_at: new Date(230 * 1000).toISOString(),
    })
    expect(commandsForStepFromList(step as any, [] as any, 999 * 1000)).toEqual([])
  })
})

describe('formatExecutedAt', () => {
  it('formats a unix-seconds timestamp into a non-empty locale string', () => {
    // Pin a known instant; assert it produced the date's locale string for that ms value.
    const unix = 1_700_000_000 // 2023-11-14T...
    const expected = new Date(unix * 1000).toLocaleString()
    expect(formatExecutedAt(unix)).toBe(expected)
    expect(formatExecutedAt(unix)).not.toBe('')
  })

  it('handles 0 (epoch) without throwing', () => {
    expect(formatExecutedAt(0)).toBe(new Date(0).toLocaleString())
  })
})

describe('formatDuration', () => {
  const cases: Array<{ secs: number; out: string }> = [
    { secs: 0, out: '0s' },
    { secs: 45, out: '45s' },
    { secs: 59, out: '59s' },
    { secs: 60, out: '1m 0s' },
    { secs: 125, out: '2m 5s' },
    { secs: 3600, out: '1h 0m' },
    { secs: 3661, out: '1h 1m' },
    { secs: 7325, out: '2h 2m' },
  ]
  for (const { secs, out } of cases) {
    it(`${secs}s → "${out}"`, () => {
      expect(formatDuration(secs)).toBe(out)
    })
  }
})

describe('formatDate', () => {
  it('formats an ISO string to a non-empty locale string', () => {
    const iso = '2026-05-10T12:00:00.000Z'
    expect(formatDate(iso)).toBe(new Date(iso).toLocaleString())
    expect(formatDate(iso)).not.toBe('')
  })

  it('returns empty string for empty / null input', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null as any)).toBe('')
  })
})

describe('getStatusClass', () => {
  const cases: Array<{ status: string; cls: string }> = [
    { status: 'completed', cls: 'status-completed' },
    { status: 'active', cls: 'status-active' },
    { status: 'in_progress', cls: 'status-active' },
    { status: 'locked', cls: 'status-locked' },
    { status: 'abandoned', cls: 'status-abandoned' },
    { status: 'wat', cls: '' },
    { status: '', cls: '' },
  ]
  for (const { status, cls } of cases) {
    it(`'${status}' → '${cls}'`, () => {
      expect(getStatusClass(status)).toBe(cls)
    })
  }
})

describe('getDifficultyClass', () => {
  const cases: Array<{ d: string; cls: string }> = [
    { d: 'beginner', cls: 'difficulty-beginner' },
    { d: 'intermediate', cls: 'difficulty-intermediate' },
    { d: 'advanced', cls: 'difficulty-advanced' },
    { d: 'expert', cls: '' },
    { d: '', cls: '' },
  ]
  for (const { d, cls } of cases) {
    it(`'${d}' → '${cls}'`, () => {
      expect(getDifficultyClass(d)).toBe(cls)
    })
  }
})

describe('quizScoreClass', () => {
  const cases: Array<{ score: number; cls: string }> = [
    { score: 1, cls: 'quiz-score-success' },
    { score: 0.7, cls: 'quiz-score-success' },   // boundary inclusive
    { score: 0.69, cls: 'quiz-score-warning' },
    { score: 0.4, cls: 'quiz-score-warning' },   // boundary inclusive
    { score: 0.39, cls: 'quiz-score-danger' },
    { score: 0, cls: 'quiz-score-danger' },
  ]
  for (const { score, cls } of cases) {
    it(`${score} → '${cls}'`, () => {
      expect(quizScoreClass(score)).toBe(cls)
    })
  }
})
