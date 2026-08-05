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
  // Distinct ACTIVE members who started / completed, not session counts.
  started_count: number
  completed_count: number
  // Percentage 0..100 of the CLASS: distinct members who completed over class
  // size, so a learner who retries still counts once.
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
  is_active: boolean
  expires_at?: string
  is_expired: boolean
  member_count: number
  live_session_count: number
  /**
   * Learners connected but idle for longer than the backend's threshold — the
   * "stuck learner" detector. Optional because the endpoint does not serve it
   * yet; every consumer must treat absent as "unknown", never as zero.
   */
  idle_session_count?: number
  assignments: TeacherGroupAssignment[]
}

/**
 * A class the teacher has closed, or whose expiry has passed.
 *
 * The one definition of "not a class you teach today": the console folds these
 * away, and the row mutes and re-labels itself from the same predicate. Two
 * copies of this rule would let the list and the row disagree about the very
 * same class.
 */
export function isInactiveClass(summary: TeacherGroupSummary): boolean {
  return !summary.is_active || summary.is_expired
}

/** What a class is called on screen, wherever it is shown. */
export function classDisplayName(summary: TeacherGroupSummary): string {
  return summary.display_name || summary.name
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

  async getGroupActivity(groupId: string): Promise<any[]> {
    const response = await axios.get(`/teacher/groups/${groupId}/activity`)
    return response.data?.sessions || response.data?.data || response.data || []
  },

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
