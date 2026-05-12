/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import axios from 'axios'

export type HookErrorEntry = {
  hook_name: string
  entity_name: string
  hook_type: string
  error: string
  timestamp: string
}

export type StripeOperationCounts = {
  success: number
  failure: number
}

export type ObservabilityMetrics = {
  stripe: {
    create: StripeOperationCounts
    update: StripeOperationCounts
    archive: StripeOperationCounts
    panics: number
  }
  scenarios: {
    setup_panics: number
    setup_failed_transitions: number
    terminal_stop_failures: number
  }
  hooks: {
    recent_errors: HookErrorEntry[]
  }
}

export const observabilityService = {
  async getMetrics(): Promise<ObservabilityMetrics> {
    const response = await axios.get('/admin/observability-metrics')
    return response.data
  }
}
