/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import axios from 'axios'

export interface InstanceType {
  name: string
  prefix: string
  description: string
}

export interface StartSessionData {
  terms: string
  expiry?: number
  instance_type?: string
}

export interface TerminalShareOutput {
  id: string
  terminal_id: string
  shared_with_user_id: string
  shared_by_user_id: string
  access_level: 'read' | 'write' | 'admin'
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface SharedTerminalInfo {
  terminal: {
    id: string
    session_id: string
    user_id: string
    status: string
    expires_at: string
    instance_type: string
    created_at: string
  }
  shared_by: string
  access_level: 'read' | 'write' | 'admin' | 'owner'
  expires_at?: string
  shared_at: string
  shares?: TerminalShareOutput[]
}

export interface ShareTerminalRequest {
  shared_with_user_id: string
  access_level: 'read' | 'write' | 'admin'
  expires_at?: string
}

export const terminalService = {
  async getInstanceTypes(): Promise<InstanceType[]> {
    const response = await axios.get('/terminal-sessions/instance-types')
    return response.data
  },

  async startSession(sessionData: StartSessionData) {
    const response = await axios.post('/terminal-sessions/start-session', sessionData)
    return response.data
  },

  async stopSession(sessionId: string) {
    const response = await axios.post(`/terminal-sessions/${sessionId}/stop`)
    return response.data
  },

  // Terminal Sharing API functions
  async shareTerminal(terminalId: string, data: ShareTerminalRequest): Promise<TerminalShareOutput> {
    const response = await axios.post(`/terminal-sessions/${terminalId}/share`, data)
    return response.data
  },

  async getSharedTerminals(): Promise<SharedTerminalInfo[]> {
    const response = await axios.get('/terminal-sessions/shared-with-me')
    return response.data
  },

  async getTerminalInfo(terminalId: string): Promise<SharedTerminalInfo> {
    const response = await axios.get(`/terminal-sessions/${terminalId}/info`)
    return response.data
  },

  async getTerminalShares(terminalId: string): Promise<TerminalShareOutput[]> {
    const response = await axios.get(`/terminal-sessions/${terminalId}/shares`)
    return response.data
  },

  async revokeAccess(terminalId: string, userId: string): Promise<void> {
    await axios.delete(`/terminal-sessions/${terminalId}/share/${userId}`)
  }
}