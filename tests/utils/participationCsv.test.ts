import { describe, it, expect } from 'vitest'
import { buildParticipationCsv } from '../../src/utils/participationCsv'
import type { ParticipationReport } from '../../src/services/domain/scenario/teacherService'

const labels = {
  learner: 'Learner', email: 'Email', hasLeft: 'Left', date: 'Date',
  firstActivity: 'First', lastActivity: 'Last', commands: 'Commands', yes: 'yes', no: 'no'
}
const header = '"Learner","Email","Left","Date","First","Last","Commands"'

function report(overrides: Partial<ParticipationReport> = {}): ParticipationReport {
  return {
    title: 'DevOps week', organization_name: 'Acme', from: '2026-03-02', to: '2026-03-03',
    timezone: 'Europe/Paris', generated_at: '2026-03-07T10:00:00Z', trainers: [],
    days: ['2026-03-02', '2026-03-03'], activity_days: [], other_activity_days: 0, commands_available: true,
    learners: [{
      user_id: 'u-1', name: 'Lea Learner', email: 'lea@example.org', has_left: true, commands: 42, scenarios: [],
      days: [{ date: '2026-03-02', commands: 42, first_activity: '2026-03-02T08:05:00Z', last_activity: '2026-03-02T16:30:00Z' }]
    }],
    ...overrides
  }
}

describe('buildParticipationCsv', () => {
  it('writes one row per learner and day, in the timezone of the report', () => {
    expect(buildParticipationCsv(report(), labels).split('\n')).toEqual([
      header,
      '"Lea Learner","lea@example.org","yes","2026-03-02","09:05","17:30","42"',
      '"Lea Learner","lea@example.org","yes","2026-03-03","","","0"'
    ])
  })

  it('leaves commands blank rather than zero when they could not be read', () => {
    const rows = buildParticipationCsv(report({ commands_available: false }), labels).split('\n')
    expect(rows[1].endsWith('"09:05","17:30",""')).toBe(true)
    expect(rows[2].endsWith('"","",""')).toBe(true)
  })

  it('neutralises a name a spreadsheet would run as a formula', () => {
    const learner = { ...report().learners[0], name: '=HYPERLINK("x")' }
    expect(buildParticipationCsv(report({ learners: [learner] }), labels)).toContain('"\'=HYPERLINK(""x"")"')
  })

  it('writes only the header without learners or days', () => {
    expect(buildParticipationCsv(report({ learners: [] }), labels)).toBe(header)
    expect(buildParticipationCsv(report({ days: [] }), labels)).toBe(header)
  })
})
