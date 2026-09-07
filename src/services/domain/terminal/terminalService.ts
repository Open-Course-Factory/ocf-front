/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 */

import axios from 'axios'
import type { Backend } from '../../../types/entities'
import type {
  Distribution,
  SessionOptionsResponse,
  StartComposedSessionData,
  OrgTerminalUsage,
  Size,
  MyTerminalUsageResponse
} from '../../../types/terminal'

export interface UpdateTerminalRequest {
  name?: string
}

// Module-level cache so editor + launcher share a single in-flight request.
// Backend already caches for 60s; this just deduplicates within the SPA lifetime.
let sizesCache: Promise<Size[]> | null = null

/**
 * How long the browser waits for a session to start. Creating the container
 * happens inside the request, and a backend that has never run a distribution
 * downloads its image first. 30 s, the axios default, lost that race.
 */
export const START_SESSION_TIMEOUT_MS = 120_000

export const terminalService = {
  async stopSession(sessionId: string) {
    const response = await axios.post(`/terminals/${sessionId}/stop`)
    return response.data
  },

  async startSession(sessionId: string) {
    const response = await axios.post(`/terminals/${sessionId}/start`)
    return response.data
  },

  async deleteSession(sessionId: string) {
    const response = await axios.delete(`/terminals/${sessionId}`)
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

  async getSizes(): Promise<Size[]> {
    if (!sizesCache) {
      sizesCache = axios
        .get<Size[]>('/terminals/sizes')
        .then(r => r.data)
        .catch(e => {
          sizesCache = null
          throw e
        })
    }
    return sizesCache
  },

  async getSessionOptions(distribution: string, backendId?: string, organizationId?: string): Promise<SessionOptionsResponse> {
    const params: Record<string, string> = { distribution }
    if (backendId) params.backend = backendId
    if (organizationId) params.organization_id = organizationId
    const response = await axios.get('/terminals/session-options', { params })
    return response.data
  },

  async startComposedSession(data: StartComposedSessionData) {
    // Longer than the 30 s default: the backend creates the container before
    // answering, and the first session of a distribution on a backend pulls the
    // image first (38 s seen in production). The session was fine; the browser
    // had given up. Same allowance as scenario launches.
    const response = await axios.post('/terminals/start-composed-session', data, { timeout: START_SESSION_TIMEOUT_MS })
    return response.data
  },

  async getOrgTerminalUsage(orgId: string): Promise<OrgTerminalUsage> {
    const response = await axios.get(`/organizations/${orgId}/terminal-usage`)
    return response.data
  },

  async getMyUsage(organizationId?: string): Promise<MyTerminalUsageResponse> {
    const params: Record<string, string> = {}
    if (organizationId) params.organization_id = organizationId
    const response = await axios.get('/terminals/my-usage', { params })
    return response.data
  },

  async checkCapacity(distribution: string, size: string): Promise<{ status: 'ok' | 'warning' | 'critical' | 'unknown', reason: string }> {
    const response = await axios.get('/terminals/capacity-check', {
      params: { distribution, size }
    })
    return response.data
  }
}