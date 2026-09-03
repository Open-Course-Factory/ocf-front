/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import axios from 'axios'
import type { AssignmentProgress } from '../../../types/groupScenarios'

// Per-question result on a quiz step (returned by /detail endpoint)
export interface SessionStepQuestionDetail {
  id: string
  order: number
  question_text: string
  // multiple_choice | free_text | true_false (multi_answer returned by some scenarios is also tolerated)
  question_type: string
  // JSON-encoded array string for multiple_choice; absent or empty otherwise
  options?: string
  correct_answer: string
  student_answer: string
  is_correct: boolean
  points: number
  explanation?: string
}

// Step shape inside SessionDetailResponse — mirror of backend GET /teacher/groups/:gid/sessions/:sid/detail
export interface SessionStepDetail {
  step_order: number
  step_title: string
  // 'terminal' | 'flag' | 'info' | 'quiz' (defaults to terminal when empty)
  step_type?: string
  status: string
  verify_attempts: number
  hints_revealed: number
  // ISO timestamp; nil when previous step has not been completed yet
  started_at?: string
  completed_at?: string
  time_spent_seconds: number
  // 0..1 — only set for quiz steps
  quiz_score?: number
  // Present only for quiz steps; absent (or empty) for non-quiz steps
  questions?: SessionStepQuestionDetail[]
}

export interface SessionDetailResponse {
  session_id: string
  user_id: string
  user_name?: string
  user_email?: string
  scenario_id: string
  scenario_title: string
  status: string
  // 0..1 (terminal/flag/info contribute 1.0 if completed, quiz contributes its quiz_score)
  grade?: number
  // Sum of correct quiz answers + correct flag captures across the session
  correct_count?: number
  // Total quiz questions + count of flag-bearing steps in the scenario (static per scenario)
  total_correct_possible?: number
  started_at: string
  completed_at?: string
  steps: SessionStepDetail[]
}

export interface SessionCommand {
  session_uuid: string
  sequence_num: number
  command_text: string
  // unix seconds
  executed_at: number
}

export interface SessionCommandsResponse {
  commands: SessionCommand[]
  total: number
  limit: number
  offset: number
}

// Shape of one row in the paginated result list returned by
// GET /teacher/groups/:groupId/scenarios/:scenarioId/results.
// Owned here so views (GroupScenariosTab, future teacher dashboards) all
// agree on the contract — see issue #204.
export interface ScenarioResultItem {
  session_id: string
  user_id: string
  user_name?: string
  user_email?: string
  status: string
  grade?: number
  current_step: number
  total_steps: number
  completed_steps: number
  total_hints_used: number
  started_at: string
  completed_at?: string
}

// Aggregates for one scenario within one group, returned by
// GET /teacher/groups/:groupId/scenarios/:scenarioId/analytics.
// Mirror of services.ScenarioAnalytics in ocf-core — the field names differ from
// the column labels the analytics table shows, so keep them in step with the Go
// struct rather than with the UI.
export interface ScenarioAnalytics {
  total_sessions: number
  completed_count: number
  // Percentage 0..100 of SESSIONS: completed sessions over total sessions, so a
  // learner who retries counts once per attempt.
  //
  // Not the same metric as TeacherGroupAssignment.class_completion_rate, which
  // counts distinct MEMBERS over the class size. Same shape, different
  // population — they must not be unified under one name or swapped for each
  // other. Mirrors the note on both Go declarations.
  completion_rate: number
  // Absent when no completed session carries a grade
  avg_grade?: number
  // Absent when no session has completed yet
  avg_completion_time_seconds?: number
}

// One scenario assignment on a "Mes classes" console row, with the class's
// progress on it. Mirror of services.TeacherGroupAssignment in ocf-core.
export interface TeacherGroupAssignment {
  assignment_id: string
  scenario_id: string
  scenario_title: string
  start_date?: string
  deadline?: string
  // Distinct ACTIVE APPRENANTS who started / completed — not session counts and
  // not teaching staff (ocf-core !361): a teacher walking through their own
  // scenario is preparation, not class progress.
  started_count: number
  completed_count: number
  // Percentage 0..100 of the CLASS: distinct apprenants who completed over
  // TeacherGroupSummary.learner_count, so a learner who retries still counts
  // once and an enrolled teacher neither dilutes the rate nor pushes it past 100.
  //
  // Not the same metric as ScenarioAnalytics.completion_rate, which counts
  // completed SESSIONS over total sessions. The differing name is deliberate
  // (ocf-core !357): same shape, different population, so they must not be
  // unified or swapped. Mirrors the note on both Go declarations.
  class_completion_rate: number
  // Average grade over completed sessions, on the same 0..100 scale as
  // ScenarioResultItem.grade. Null until somebody finishes.
  avg_grade?: number | null
}

// One class the caller owns or manages, as the console lists it. Mirror of
// services.TeacherGroupSummary in ocf-core (GET /teacher/groups).
//
// Archived and expired classes are returned flagged rather than omitted, so a
// consumer that hides them is hiding them on purpose.
export interface TeacherGroupSummary {
  group_id: string
  name: string
  display_name: string
  organization_id?: string
  caller_role: 'owner' | 'manager'
  /** Set once the class is archived — the one flag `isInactiveClass` reads. */
  archived_at?: string | null
  /** Derived from archived_at on the backend; transitional, never branch on it. */
  is_active: boolean
  expires_at?: string
  /** Expiry passed but not archived yet: a hint, the hourly cron archives it. */
  is_expired: boolean
  /**
   * The WHOLE active roster, teaching staff included — the capacity figure, what
   * fills against ClassGroup.max_members and what an invitation consumes.
   *
   * Deliberately NOT the number of apprenants: the class creator is enrolled with
   * the owner role, so a class of 3 students taught by one teacher reports
   * member_count 4 and `learner_count` 3. Every learner-facing figure below reads
   * the other one. Mirrors services.TeacherGroupSummary.MemberCount.
   */
  member_count: number
  /**
   * The APPRENANTS — active memberships in core's LearnerRoles (issue #480,
   * ocf-core !361). The denominator of every learner-facing figure on the row:
   * "X/N connectés", "3/N ont terminé", and the population `idle_member_count`
   * and `live_session_count` are counted over.
   *
   * Core !361 always sends it, so 0 there is a real answer — a class of staff
   * only. It stays optional for the backends that predate !361, where absent
   * means "not reported"; `classLearnerCount` below is the one place that turns
   * an absent one into the roster count, and nothing may turn it into a zero.
   */
  learner_count?: number
  /** Terminal sessions of those APPRENANTS running right now (ocf-core !361). */
  live_session_count: number
  /**
   * APPRENANTS whose scenario progress has been stale for longer than
   * `idle_threshold_minutes` — the "stuck learner" detector (core !360, narrowed
   * to learners in !361).
   *
   * Idle means no scenario event (step, verify, hint, quiz) in that window, NOT
   * an absence of keystrokes and NOT a disconnection: a learner reading a long
   * instruction counts as idle, and one who closed the tab does not appear here
   * at all. Any label built from it has to stay in that register.
   *
   * Core !360 always sends it, so 0 there is a real answer — nobody is stuck.
   * It stays optional for the backends that predate !360, where absent means
   * "not reported" rather than zero. Both render nothing, so no caller has to
   * tell them apart; none may turn absent INTO a zero either.
   */
  idle_member_count?: number

  /** The window, in minutes, `idle_member_count` was computed over. */
  idle_threshold_minutes?: number
  assignments: TeacherGroupAssignment[]
}

/**
 * A class that has been archived — by its teacher, or by the hourly cron once
 * its expiry passed (ocf-core#491).
 *
 * The one definition of "not a class you teach today": the console folds these
 * away, and the row mutes and re-labels itself from the same predicate. Two
 * copies of this rule would let the list and the row disagree about the very
 * same class. It deliberately ignores `is_expired`: an expired class is an
 * archive PENDING, still open until the backend stamps it.
 */
export function isInactiveClass(summary: Pick<TeacherGroupSummary, 'archived_at'>): boolean {
  return !!summary.archived_at
}

/** What a class is called on screen, wherever it is shown. */
export function classDisplayName(summary: TeacherGroupSummary): string {
  return summary.display_name || summary.name
}

/**
 * How many APPRENANTS a class has — the denominator every learner-facing figure
 * is stated over: how many are connected, how many finished a scenario.
 *
 * The single home of the pre-!361 fallback. A backend that does not report
 * `learner_count` yet leaves the console counting the whole roster, exactly as
 * it did before this rule existed — one class over-counted by its teachers is
 * better than one class reported empty. An explicit 0 is an answer and stays 0:
 * a class of teaching staff has no apprenant, and `??` is what tells the two
 * apart. Never re-derive this from a roster's roles; core's LearnerRoles owns
 * who is an apprenant.
 */
export function classLearnerCount(summary: TeacherGroupSummary): number {
  return summary.learner_count ?? summary.member_count
}

// The three-value standing the class view renders. Mirror of the
// LearnerStatus* constants in ocf-core services/teacherLiveProgressService.go.
export type LearnerAssignmentStatus = 'not_started' | 'in_progress' | 'completed'

// Where one learner stands on one of the class's active assignments. Mirror of
// services.LearnerAssignmentProgress in ocf-core.
//
// An assignment the learner never opened is returned all-zero with
// status 'not_started' rather than omitted — "assigned, untouched" is a state
// the class view must show, not a gap.
export interface LearnerAssignmentProgress {
  assignment_id: string
  scenario_id: string
  scenario_title: string
  deadline?: string
  // The attempt this row describes; absent when not started.
  session_id?: string
  status: LearnerAssignmentStatus
  // The RAW scenario_sessions.status behind `status`, absent when not started.
  // `status` collapses every non-completed attempt into 'in_progress', so an
  // abandoned or setup_failed run is only visible here — render it as an
  // annotation rather than folding it into the three statuses.
  session_status?: string
  current_step: number
  current_step_title?: string
  total_steps: number
  // How long the learner has been on the step they are on now. Absent unless
  // the attempt is in progress. Computed server-side at fetch time, so it is
  // stale by up to one polling interval and must not be ticked locally.
  current_step_elapsed_seconds?: number
  hints_used: number
  // 0..100, same scale as ScenarioResultItem.grade. Absent until graded.
  grade?: number
  started_at?: string
  completed_at?: string
}

// One row of the merged class view: who the learner is, whether they are
// present, and where they stand on each of the class's assignments. Mirror of
// services.LearnerLiveProgress in ocf-core (GET /teacher/groups/:id/live-progress).
//
// Every ACTIVE member of the class gets a row, including one who has done
// nothing — the surface invigilates exams, so a missing learner would read as
// "nobody to worry about".
export interface LearnerLiveProgress {
  user_id: string
  user_name?: string
  user_email?: string
  // A terminal session alive right now AND supervisable in the class's
  // organization — the same rule the supervision wall lists tiles by.
  connected: boolean
  // The live session the "watch" action targets. Absent when not connected.
  terminal_session_id?: string
  // Most recent SCENARIO interaction (verify, hint, quiz, step completion),
  // not keystrokes: ocf-core stores no per-command timestamp.
  last_activity_at?: string
  // Present, but no scenario activity for the backend's idle threshold —
  // computed by isLearnerIdle in ocf-core so this view and the "N inactifs"
  // badge on the classes console cannot disagree. Never re-derive it here.
  //
  // A learner with no live session is ABSENT (connected=false), not idle: the
  // two states mean different things and must stay distinguishable.
  idle: boolean
  assignments: LearnerAssignmentProgress[]
}

export const teacherService = {
  // --- Cross-class overview ---

  // Every class the caller owns or manages, with its live sessions and
  // assignment progress, in one request. The console renders this list and the
  // group cards read their live counts from the same response — see
  // stores/teacherGroups.ts.
  async getManagedGroups(): Promise<TeacherGroupSummary[]> {
    const response = await axios.get('/teacher/groups')
    return Array.isArray(response.data) ? response.data : []
  },

  // One row per active member of the class, joining supervision presence with
  // scenario position and assignment results — the data behind the merged
  // "Classe en direct" view (issue #310). Always an array: an unknown class, a
  // class with no member and a class with no assignment all list nothing.
  async getGroupLiveProgress(groupId: string): Promise<LearnerLiveProgress[]> {
    const response = await axios.get(`/teacher/groups/${groupId}/live-progress`)
    return Array.isArray(response.data) ? response.data : []
  },

  // --- Group scenario assignment operations ---

  async getGroupAssignments(groupId: string): Promise<any[]> {
    const response = await axios.get('/scenario-assignments', {
      params: { group_id: groupId }
    })
    return response.data?.data || response.data || []
  },

  // Per-assignment progress (attempt/completion counts + avg grade) for a group.
  async getAssignmentsProgress(groupId: string): Promise<AssignmentProgress[]> {
    const response = await axios.get(`/teacher/groups/${groupId}/assignments-progress`)
    return response.data
  },

  async assignScenarioToGroup(groupId: string, scenarioId: string, data?: { start_date?: string; deadline?: string }): Promise<any> {
    const response = await axios.post('/scenario-assignments', {
      scenario_id: scenarioId,
      group_id: groupId,
      scope: 'group',
      start_date: data?.start_date || undefined,
      deadline: data?.deadline || undefined
    })
    return response.data
  },

  async removeAssignment(assignmentId: string): Promise<void> {
    await axios.delete(`/scenario-assignments/${assignmentId}`)
  },

  // --- Teacher dashboard operations ---

  async getScenarioResults(groupId: string, scenarioId: string): Promise<ScenarioResultItem[]> {
    const response = await axios.get(
      `/teacher/groups/${groupId}/scenarios/${scenarioId}/results`
    )
    return response.data?.items || []
  },

  async getScenarioAnalytics(groupId: string, scenarioId: string): Promise<ScenarioAnalytics> {
    const response = await axios.get(
      `/teacher/groups/${groupId}/scenarios/${scenarioId}/analytics`
    )
    return response.data
  },

  async getSessionDetail(groupId: string, sessionId: string): Promise<SessionDetailResponse> {
    const response = await axios.get(
      `/teacher/groups/${groupId}/sessions/${sessionId}/detail`
    )
    return response.data
  },

  async getSessionDetailsBulk(
    groupId: string,
    sessionIds: string[]
  ): Promise<SessionDetailResponse[]> {
    const response = await axios.post(
      `/teacher/groups/${groupId}/sessions/details`,
      { session_ids: sessionIds }
    )
    return response.data?.items || []
  },

  async getSessionCommands(
    groupId: string,
    sessionId: string,
    limit = 100,
    offset = 0
  ): Promise<SessionCommandsResponse> {
    const response = await axios.get(
      `/teacher/groups/${groupId}/sessions/${sessionId}/commands`,
      { params: { limit, offset } }
    )
    return response.data
  },

  async bulkStartScenario(groupId: string, scenarioId: string, data: { distribution: string; backend?: string }): Promise<any> {
    // Longer timeout: challenge scenarios run setup.sh for each student (~90s each, parallelized in batches)
    const response = await axios.post(
      `/teacher/groups/${groupId}/scenarios/${scenarioId}/bulk-start`,
      { instance_type: data.distribution, backend: data.backend },
      { timeout: 300000 }
    )
    return response.data
  },

  async resetGroupScenarioSessions(groupId: string, scenarioId: string): Promise<any> {
    const response = await axios.post(
      `/teacher/groups/${groupId}/scenarios/${scenarioId}/reset-sessions`
    )
    return response.data
  },

  // --- Supporting data ---

  async listScenarios(): Promise<any[]> {
    const response = await axios.get('/scenarios')
    return response.data?.data || response.data || []
  },

  async getDistributions(backendId?: string): Promise<any[]> {
    const params: Record<string, string> = {}
    if (backendId) params.backend = backendId
    const response = await axios.get('/terminals/distributions', { params })
    return response.data
  },

  // --- Scenario import/export operations ---

  async uploadScenario(file: File, onProgress?: (percent: number) => void): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post('/scenarios/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      }
    })
    return response.data
  },

  async exportScenarioJSON(scenarioId: string): Promise<any> {
    const response = await axios.get(`/scenarios/${scenarioId}/export`, { params: { format: 'json' } })
    return response.data
  },

  async exportScenarioArchive(scenarioId: string): Promise<Blob> {
    const response = await axios.get(`/scenarios/${scenarioId}/export`, {
      params: { format: 'killerkoda' },
      responseType: 'blob'
    })
    return response.data
  },

  async exportScenariosJSON(ids: string[]): Promise<any[]> {
    const response = await axios.post('/scenarios/export', { ids })
    return response.data
  },

  async importScenarioJSON(data: any): Promise<any> {
    const response = await axios.post('/scenarios/import-json', data)
    return response.data
  },

  // --- Group-level import/export ---

  async groupExportScenarioJSON(groupId: string, scenarioId: string): Promise<any> {
    const response = await axios.get(`/groups/${groupId}/scenarios/${scenarioId}/export`, { params: { format: 'json' } })
    return response.data
  },

  async groupExportScenarioArchive(groupId: string, scenarioId: string): Promise<Blob> {
    const response = await axios.get(`/groups/${groupId}/scenarios/${scenarioId}/export`, {
      params: { format: 'killerkoda' },
      responseType: 'blob'
    })
    return response.data
  },

  async groupImportScenarioJSON(groupId: string, data: any): Promise<any> {
    const response = await axios.post(`/groups/${groupId}/scenarios/import-json`, data)
    return response.data
  },

  async groupUploadScenario(groupId: string, file: File, onProgress?: (percent: number) => void): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post(`/groups/${groupId}/scenarios/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      }
    })
    return response.data
  },

  // --- Organization-level scenario management ---

  async orgListScenarios(orgId: string): Promise<any[]> {
    const response = await axios.get(`/organizations/${orgId}/scenarios`)
    return response.data?.data || response.data || []
  },

  async orgImportScenarioJSON(orgId: string, data: any): Promise<any> {
    const response = await axios.post(`/organizations/${orgId}/scenarios/import-json`, data)
    return response.data
  },

  async orgUploadScenario(orgId: string, file: File, onProgress?: (percent: number) => void): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post(`/organizations/${orgId}/scenarios/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      }
    })
    return response.data
  },

  async orgExportScenarioJSON(orgId: string, scenarioId: string): Promise<any> {
    const response = await axios.get(`/organizations/${orgId}/scenarios/${scenarioId}/export`, { params: { format: 'json' } })
    return response.data
  },

  async orgExportScenarioArchive(orgId: string, scenarioId: string): Promise<Blob> {
    const response = await axios.get(`/organizations/${orgId}/scenarios/${scenarioId}/export`, {
      params: { format: 'killerkoda' },
      responseType: 'blob'
    })
    return response.data
  },

  async orgDeleteScenario(orgId: string, scenarioId: string): Promise<void> {
    await axios.delete(`/organizations/${orgId}/scenarios/${scenarioId}`)
  },

  // Combined listing for group assign modal
  async listGroupAvailableScenarios(groupId: string): Promise<any[]> {
    const response = await axios.get(`/groups/${groupId}/scenarios`)
    return response.data?.data || response.data || []
  }
}
