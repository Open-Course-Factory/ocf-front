/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import axios from 'axios'

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

export const teacherService = {
  // --- Group scenario assignment operations ---

  async getGroupAssignments(groupId: string): Promise<any[]> {
    const response = await axios.get('/scenario-assignments', {
      params: { group_id: groupId }
    })
    return response.data?.data || response.data || []
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

  async getScenarioResults(groupId: string, scenarioId: string): Promise<any[]> {
    const response = await axios.get(
      `/teacher/groups/${groupId}/scenarios/${scenarioId}/results`
    )
    return response.data?.items || []
  },

  async getScenarioAnalytics(groupId: string): Promise<any> {
    const response = await axios.get(`/teacher/groups/${groupId}/scenarios/analytics`)
    return response.data
  },

  async getSessionDetail(groupId: string, sessionId: string): Promise<SessionDetailResponse> {
    const response = await axios.get(
      `/teacher/groups/${groupId}/sessions/${sessionId}/detail`
    )
    return response.data
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
