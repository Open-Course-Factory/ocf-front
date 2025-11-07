/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import axios from 'axios'

export interface VersionInfo {
  api: string
  terminalTrainer?: string
}

export const versionService = {
  async getVersionInfo(): Promise<VersionInfo> {
    const response = await axios.get('/version')
    return response.data
  }
}
