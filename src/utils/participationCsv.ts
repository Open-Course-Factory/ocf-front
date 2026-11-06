import { sanitizeCSVField } from './csv'
import type { LearnerParticipation, ParticipationReport } from '../services/domain/scenario/teacherService'

export interface ParticipationCsvLabels {
  learner: string
  email: string
  hasLeft: string
  date: string
  firstActivity: string
  lastActivity: string
  commands: string
  yes: string
  no: string
}

// Fixed 24-hour format, whatever the viewer's locale: other tools read this file.
function clockTime(at: string, timezone: string): string {
  return new Date(at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: timezone })
}

// One row per learner and reported day, so a day without activity stays visible
// as an absence. Commands stay blank, not 0, when the terminal service did not answer.
function learnerRows(learner: LearnerParticipation, report: ParticipationReport, labels: ParticipationCsvLabels): unknown[][] {
  return report.days.map(date => {
    const activity = learner.days.find(day => day.date === date)
    return [
      learner.name,
      learner.email,
      learner.has_left ? labels.yes : labels.no,
      date,
      activity ? clockTime(activity.first_activity, report.timezone) : '',
      activity ? clockTime(activity.last_activity, report.timezone) : '',
      report.commands_available ? (activity?.commands ?? 0) : ''
    ]
  })
}

export function buildParticipationCsv(report: ParticipationReport, labels: ParticipationCsvLabels): string {
  const headers = [labels.learner, labels.email, labels.hasLeft, labels.date, labels.firstActivity, labels.lastActivity, labels.commands]
  const rows = report.learners.flatMap(learner => learnerRows(learner, report, labels))
  return [headers, ...rows].map(row => row.map(sanitizeCSVField).join(',')).join('\n')
}
