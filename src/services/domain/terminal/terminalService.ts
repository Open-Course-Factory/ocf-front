/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import axios from 'axios'
import type { Backend } from '../../../types/entities'
import type {
  Distribution,
  SessionOptionsResponse,
  StartComposedSessionData,
  OrgTerminalUsage
} from '../../../types/terminal'

export interface UpdateTerminalRequest {
  name?: string
}

export const terminalService = {
  async stopSession(sessionId: string) {
    const response = await axios.post(`/terminals/${sessionId}/stop`)
    return response.data
  },

  async syncSession(sessionId: string) {
    const response = await axios.post(`/terminals/${sessionId}/sync`)
    return response.data
  },

  async updateTerminal(terminalId: string, data: UpdateTerminalRequest): Promise<any> {
    const response = await axios.patch(`/terminals/${terminalId}`, data)
    return response.data
  },

  async getBackends(organizationId?: string): Promise<Backend[]> {
    const params = organizationId ? { organization_id: organizationId } : {}
    const response = await axios.get('/terminals/backends', { params })
    return response.data
  },

  async setDefaultBackend(backendId: string): Promise<Backend> {
    const response = await axios.patch(`/terminals/backends/${backendId}/set-default`)
    return response.data
  },

  async getDistributions(backendId?: string): Promise<Distribution[]> {
    const params: Record<string, string> = {}
    if (backendId) params.backend = backendId
    const response = await axios.get('/terminals/distributions', { params })
    return response.data
  },

  async getSessionOptions(distribution: string, backendId?: string, organizationId?: string): Promise<SessionOptionsResponse> {
    const params: Record<string, string> = { distribution }
    if (backendId) params.backend = backendId
    if (organizationId) params.organization_id = organizationId
    const response = await axios.get('/terminals/session-options', { params })
    return response.data
  },

  async startComposedSession(data: StartComposedSessionData) {
    const response = await axios.post('/terminals/start-composed-session', data)
    return response.data
  },

  async getOrgTerminalUsage(orgId: string): Promise<OrgTerminalUsage> {
    const response = await axios.get(`/organizations/${orgId}/terminal-usage`)
    return response.data
  }
}