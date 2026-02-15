/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import axios from 'axios'
import type { Backend } from '../../../types/entities'

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
  name?: string
  backend?: string
  organization_id?: string
}

export interface UpdateTerminalRequest {
  name?: string
}

export interface TerminalShareOutput {
  id: string
  terminal_id: string
  shared_with_user_id?: string
  shared_with_group_id?: string
  shared_by_user_id: string
  share_type: 'user' | 'group'
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
    name?: string
  }
  shared_by: string // User ID (for reference)
  shared_by_display_name: string // User display name (use this for display)
  access_level: 'read' | 'write' | 'admin' | 'owner'
  expires_at?: string
  shared_at: string
  shares?: TerminalShareOutput[]
}

export interface ShareTerminalRequest {
  shared_with_user_id?: string
  shared_with_group_id?: string
  access_level: 'read' | 'write' | 'admin'
  expires_at?: string
}

export interface InstanceAvailability {
  available: boolean
  matchingSizes: string[]
  upgradeSizes: string[]
  hasAllSizes: boolean
}

// Size ordering for sorting (smallest to largest)
const SIZE_ORDER: Record<string, number> = {
  'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6
}

// Utility functions for size handling
export const instanceUtils = {
  // Parse size string into array
  parseSizes(sizeString: string): string[] {
    return sizeString.split('|').map(s => s.trim())
  },

  // Get the minimum size order value for sorting instances by their smallest size
  getMinSizeOrder(sizeString: string): number {
    const sizes = this.parseSizes(sizeString)
    const orders = sizes.map(s => SIZE_ORDER[s.toUpperCase()] ?? 99)
    return Math.min(...orders)
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
  async getInstanceTypes(backendId?: string): Promise<InstanceType[]> {
    const params: Record<string, string> = {}
    if (backendId) {
      params.backend = backendId
    }
    const response = await axios.get('/terminals/instance-types', { params })
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
    const response = await axios.post('/terminals/start-session', sessionData)
    return response.data
  },

  async stopSession(sessionId: string) {
    const response = await axios.post(`/terminals/${sessionId}/stop`)
    return response.data
  },

  async syncSession(sessionId: string) {
    const response = await axios.post(`/terminals/${sessionId}/sync`)
    return response.data
  },

  // Terminal Sharing API functions
  async shareTerminal(terminalId: string, data: ShareTerminalRequest): Promise<TerminalShareOutput> {
    const response = await axios.post(`/terminals/${terminalId}/share`, data)
    return response.data
  },

  async getSharedTerminals(): Promise<SharedTerminalInfo[]> {
    const response = await axios.get('/terminals/shared-with-me')
    return response.data
  },

  async getTerminalInfo(terminalId: string): Promise<SharedTerminalInfo> {
    const response = await axios.get(`/terminals/${terminalId}/info`)
    return response.data
  },

  async getTerminalShares(terminalId: string): Promise<TerminalShareOutput[]> {
    const response = await axios.get(`/terminals/${terminalId}/shares`)
    return response.data
  },

  async revokeAccess(terminalId: string, userId: string): Promise<void> {
    await axios.delete(`/terminals/${terminalId}/share/${userId}`)
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
  }
}