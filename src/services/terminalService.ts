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

export const terminalService = {
  async getInstanceTypes(): Promise<InstanceType[]> {
    const response = await axios.get('/terminals/instance-types')
    return response.data
  },

  async startSession(sessionData: StartSessionData) {
    const response = await axios.post('/terminals/start-session', sessionData)
    return response.data
  },

  async stopSession(sessionId: string) {
    const response = await axios.post(`/terminals/${sessionId}/stop`)
    return response.data
  }
}