/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import axios from 'axios'

export interface CurrentStepResponse {
  step_order: number
  total_steps: number
  title: string
  text?: string
  hint?: string
  status: string // 'locked' | 'active' | 'completed' | 'skipped'
  has_flag: boolean
  hints_total_count: number
  hints_revealed: number
}

export interface RevealHintResponse {
  level: number
  content: string
  total: number
}

export interface VerifyStepResponse {
  passed: boolean
  output?: string
  next_step?: number
}

export interface SubmitFlagResponse {
  correct: boolean
  message?: string
  next_step?: number
}

export interface ValidatedFlag {
  step_order: number
  flag: string
  submitted_at: string
}

export interface ScenarioSessionInfo {
  id: string
  scenario_id: string
  user_id: string
  current_step: number
  status: string // 'active' | 'provisioning' | 'completed' | 'abandoned' | 'setup_failed'
  started_at: string
  completed_at?: string
  terminal_session_id?: string
  grade?: number
  provisioning_phase?: string
}

export interface MyScenarioSession {
  id: string
  scenario_id: string
  scenario_title: string
  status: string // 'active' | 'provisioning' | 'completed' | 'abandoned' | 'setup_failed'
  current_step: number
  total_steps: number
  completed_steps: number
  grade?: number
  started_at: string
  completed_at?: string
  terminal_session_id?: string
  provisioning_phase?: string
}

export interface ScenarioInfo {
  id: string
  name: string
  title: string
  description?: string
  intro_text?: string
  finish_text?: string
  difficulty?: string
  estimated_time?: string
  flags_enabled?: boolean
}

export const scenarioSessionService = {
  async getMyScenarioSessions(): Promise<MyScenarioSession[]> {
    const response = await axios.get('/scenario-sessions/my')
    return response.data?.data || response.data || []
  },

  async startScenario(scenarioId: string, options?: { terminal_session_id?: string; backend?: string; instance_type?: string }): Promise<ScenarioSessionInfo> {
    // Longer timeout: challenge scenarios run setup.sh which installs packages (~60-90s)
    const response = await axios.post('/scenario-sessions/start', { scenario_id: scenarioId, ...options }, { timeout: 180000 })
    return response.data
  },

  async listScenarios(organizationId?: string): Promise<any[]> {
    const params: Record<string, string> = {}
    if (organizationId) params.organization_id = organizationId
    const response = await axios.get('/scenario-sessions/available', { params })
    return response.data?.data || response.data || []
  },

  async launchScenario(scenarioId: string, options?: { backend?: string; organization_id?: string }): Promise<{
    terminal_session_id: string
    scenario_session_id: string
    status: string
    provisioning_phase?: string
  }> {
    const response = await axios.post('/scenario-sessions/launch', {
      scenario_id: scenarioId,
      ...options
    }, { timeout: 180000 })
    return response.data
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
  },

  async getSessionInfo(sessionId: string): Promise<ScenarioSessionInfo> {
    const response = await axios.get(`/scenario-sessions/${sessionId}`)
    return response.data
  },

  async getScenario(scenarioId: string): Promise<ScenarioInfo> {
    const response = await axios.get(`/scenarios/${scenarioId}`)
    return response.data
  },

  async getStepByOrder(sessionId: string, stepOrder: number): Promise<CurrentStepResponse | null> {
    try {
      const response = await axios.get(`/scenario-sessions/${sessionId}/step/${stepOrder}`)
      return response.data
    } catch {
      return null
    }
  },

  async getValidatedFlags(sessionId: string): Promise<ValidatedFlag[]> {
    try {
      const response = await axios.get(`/scenario-sessions/${sessionId}/flags`)
      return response.data || []
    } catch {
      return []
    }
  },

  async revealHint(sessionId: string, stepOrder: number, level: number): Promise<RevealHintResponse> {
    const response = await axios.post(`/scenario-sessions/${sessionId}/steps/${stepOrder}/hints/${level}/reveal`)
    return response.data
  }
}

/**
 * Polls a scenario session until provisioning completes or fails.
 * Throws 'SETUP_FAILED' if setup fails, 'SETUP_TIMEOUT' if max attempts reached.
 * Accepts an optional AbortSignal to cancel polling early.
 */
export async function pollProvisioningStatus(
  sessionId: string,
  onPhaseChange?: (phase: string) => void,
  abortSignal?: AbortSignal,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<void> {
  const maxAttempts = options?.maxAttempts ?? 120
  const intervalMs = options?.intervalMs ?? 3000

  for (let i = 0; i < maxAttempts; i++) {
    if (abortSignal?.aborted) return
    await new Promise(resolve => setTimeout(resolve, intervalMs))
    if (abortSignal?.aborted) return
    try {
      const info = await scenarioSessionService.getSessionInfo(sessionId)
      onPhaseChange?.(info.provisioning_phase || '')
      if (info.status === 'setup_failed') {
        throw new Error('SETUP_FAILED')
      }
      if (info.status !== 'provisioning') return
    } catch (err: any) {
      if (err.message === 'SETUP_FAILED') throw err
      // Ignore transient network errors, keep polling
    }
  }
  throw new Error('SETUP_TIMEOUT')
}
