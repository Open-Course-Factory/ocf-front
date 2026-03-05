/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import axios from 'axios'

export interface CurrentStepResponse {
  step_order: number
  title: string
  text?: string
  hint?: string
  status: string // 'locked' | 'active' | 'completed' | 'skipped'
  has_flag: boolean
}

export interface VerifyStepResponse {
  passed: boolean
  output?: string
  next_step?: number
}

export interface SubmitFlagResponse {
  correct: boolean
  message?: string
}

export interface ScenarioSessionInfo {
  id: string
  scenario_id: string
  user_id: string
  current_step: number
  status: string // 'active' | 'completed' | 'abandoned'
  started_at: string
  completed_at?: string
  terminal_session_id?: string
}

export const scenarioSessionService = {
  async startScenario(scenarioId: string, options?: { terminal_session_id?: string; backend?: string; instance_type?: string }): Promise<ScenarioSessionInfo> {
    const response = await axios.post(`/scenarios/${scenarioId}/start`, options || {})
    return response.data
  },

  async listScenarios(): Promise<any[]> {
    const response = await axios.get('/scenarios')
    return response.data?.data || response.data || []
  },

  async getCurrentStep(sessionId: string): Promise<CurrentStepResponse> {
    const response = await axios.get(`/scenario-sessions/${sessionId}/current-step`)
    return response.data
  },

  async verifyStep(sessionId: string): Promise<VerifyStepResponse> {
    const response = await axios.post(`/scenario-sessions/${sessionId}/verify`)
    return response.data
  },

  async submitFlag(sessionId: string, flag: string): Promise<SubmitFlagResponse> {
    const response = await axios.post(`/scenario-sessions/${sessionId}/submit-flag`, { flag })
    return response.data
  },

  async abandonSession(sessionId: string): Promise<void> {
    await axios.post(`/scenario-sessions/${sessionId}/abandon`)
  },

  async getSessionByTerminal(terminalSessionId: string): Promise<ScenarioSessionInfo | null> {
    try {
      const response = await axios.get(`/scenario-sessions/by-terminal/${terminalSessionId}`)
      return response.data
    } catch {
      // 404 means no scenario linked — not an error
      return null
    }
  }
}
