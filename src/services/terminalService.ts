/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import axios from 'axios'

export interface InstanceType {
  name: string
  prefix: string
  description: string
  size: string // Available sizes separated by | (e.g., "XS|S|M")
}

export interface InstanceTypeResponse {
  instance_types: InstanceType[]
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

export interface InstanceAvailability {
  available: boolean
  matchingSizes: string[]
  upgradeSizes: string[]
  hasAllSizes: boolean
}

// Utility functions for size handling
export const instanceUtils = {
  // Parse size string into array
  parseSizes(sizeString: string): string[] {
    return sizeString.split('|').map(s => s.trim())
  },

  // Check if instance is available based on user's plan
  checkAvailability(instance: InstanceType, allowedSizes: string[]): InstanceAvailability {
    const instanceSizes = this.parseSizes(instance.size)

    // Check if "all" is in allowed sizes (unlimited plan)
    if (allowedSizes.includes('all')) {
      return {
        available: true,
        matchingSizes: instanceSizes,
        upgradeSizes: [],
        hasAllSizes: true
      }
    }

    // Find matching sizes
    const matchingSizes = instanceSizes.filter(size =>
      allowedSizes.includes(size)
    )

    const upgradeSizes = instanceSizes.filter(size =>
      !allowedSizes.includes(size)
    )

    return {
      available: matchingSizes.length > 0,
      matchingSizes,
      upgradeSizes,
      hasAllSizes: matchingSizes.length === instanceSizes.length
    }
  },

  // Get size display with badges
  getSizeDisplay(sizeString: string): string[] {
    return this.parseSizes(sizeString)
  },

  // Check if a specific size is allowed
  isSizeAllowed(size: string, allowedSizes: string[]): boolean {
    return allowedSizes.includes('all') || allowedSizes.includes(size)
  }
}

export const terminalService = {
  async getInstanceTypes(): Promise<InstanceType[]> {
    const response = await axios.get('/terminal-sessions/instance-types')
    const data = response.data

    // Handle both formats: direct array or wrapped in instance_types
    if (Array.isArray(data)) {
      return data
    } else if (data.instance_types && Array.isArray(data.instance_types)) {
      return data.instance_types
    } else {
      console.error('Unexpected instance types response format:', data)
      throw new Error('Invalid response format for instance types')
    }
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