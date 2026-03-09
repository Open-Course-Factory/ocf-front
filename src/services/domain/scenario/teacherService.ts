/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import axios from 'axios'

export const teacherService = {
  // --- Group scenario assignment operations ---

  async getGroupAssignments(groupId: string): Promise<any[]> {
    const response = await axios.get('/scenario-assignments', {
      params: { group_id: groupId }
    })
    return response.data?.data || response.data || []
  },

  async assignScenarioToGroup(groupId: string, scenarioId: string, data?: { deadline?: string }): Promise<any> {
    const response = await axios.post('/scenario-assignments', {
      scenario_id: scenarioId,
      group_id: groupId,
      scope: 'group',
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
    return response.data || []
  },

  async getScenarioAnalytics(groupId: string): Promise<any> {
    const response = await axios.get(`/teacher/groups/${groupId}/scenarios/analytics`)
    return response.data
  },

  async getSessionDetail(groupId: string, sessionId: string): Promise<any> {
    const response = await axios.get(
      `/teacher/groups/${groupId}/sessions/${sessionId}/detail`
    )
    return response.data
  },

  async bulkStartScenario(groupId: string, scenarioId: string, data: { instance_type: string; backend?: string }): Promise<any> {
    const response = await axios.post(
      `/teacher/groups/${groupId}/scenarios/${scenarioId}/bulk-start`,
      data
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

  async getInstanceTypes(backendId?: string): Promise<any[]> {
    const params: Record<string, string> = {}
    if (backendId) params.backend = backendId
    const response = await axios.get('/terminals/instance-types', { params })
    const data = response.data
    if (Array.isArray(data)) return data
    if (data.instance_types && Array.isArray(data.instance_types)) return data.instance_types
    return []
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
  }
}
