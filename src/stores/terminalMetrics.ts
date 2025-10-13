/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'

export interface TerminalMetrics {
  cpu_percent: number
  ram_percent: number
  ram_available_gb: number
  timestamp: number
}

const CACHE_DURATION_MS = 8000 // 8 seconds cache as specified in backend

export const useTerminalMetricsStore = defineStore('terminalMetrics', () => {

  // State
  const metrics = ref<TerminalMetrics | null>(null)
  const isLoading = ref(false)
  const error = ref<string>('')
  const lastFetchTime = ref<number>(0)

  // Add translations
  useI18n().mergeLocaleMessage('en', {
    terminalMetrics: {
      pageTitle: 'Server Metrics',
      cpuUsage: 'CPU Usage',
      ramUsage: 'RAM Usage',
      ramAvailable: 'RAM Available',
      timestamp: 'Last Update',
      refresh: 'Refresh',
      serverStatus: 'Server Status',
      healthy: 'Healthy',
      warning: 'Warning',
      critical: 'Critical',
      capacityWarning: 'Server at capacity',
      capacityWarningMessage: 'Server resources are running low. Please try again in a few minutes.',
      insufficientRAM: 'Insufficient RAM available',
      highCPU: 'High CPU usage',
      autoRefresh: 'Auto-refreshing every {seconds} seconds'
    }
  })

  useI18n().mergeLocaleMessage('fr', {
    terminalMetrics: {
      pageTitle: 'Métriques du Serveur',
      cpuUsage: 'Utilisation CPU',
      ramUsage: 'Utilisation RAM',
      ramAvailable: 'RAM Disponible',
      timestamp: 'Dernière Mise à Jour',
      refresh: 'Actualiser',
      serverStatus: 'État du Serveur',
      healthy: 'Bon',
      warning: 'Attention',
      critical: 'Critique',
      capacityWarning: 'Serveur à capacité maximale',
      capacityWarningMessage: 'Les ressources du serveur sont faibles. Veuillez réessayer dans quelques minutes.',
      insufficientRAM: 'RAM disponible insuffisante',
      highCPU: 'Utilisation CPU élevée',
      autoRefresh: 'Actualisation automatique toutes les {seconds} secondes'
    }
  })

  // Computed properties
  const isCached = computed(() => {
    if (!lastFetchTime.value) return false
    const now = Date.now()
    return now - lastFetchTime.value < CACHE_DURATION_MS
  })

  const serverStatus = computed(() => {
    if (!metrics.value) return 'unknown'

    // Critical: RAM < 1GB or CPU > 95%
    if (metrics.value.ram_available_gb < 1.0 || metrics.value.cpu_percent > 95) {
      return 'critical'
    }

    // Warning: RAM < 2GB or CPU > 80%
    if (metrics.value.ram_available_gb < 2.0 || metrics.value.cpu_percent > 80) {
      return 'warning'
    }

    return 'healthy'
  })

  const hasCapacityIssues = computed(() => {
    return serverStatus.value === 'critical' || serverStatus.value === 'warning'
  })

  // Actions
  async function fetchMetrics(bypassCache = false): Promise<TerminalMetrics | null> {
    // Use cache if available and not bypassing
    if (!bypassCache && isCached.value && metrics.value) {
      return metrics.value
    }

    isLoading.value = true
    error.value = ''

    try {
      const params = bypassCache ? { nocache: '1' } : {}
      const response = await axios.get('/terminals/metrics', { params })

      metrics.value = response.data
      lastFetchTime.value = Date.now()

      return metrics.value
    } catch (err: any) {
      error.value = err.response?.data?.error_message || err.message || 'Failed to fetch metrics'
      console.error('Error fetching terminal metrics:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function refreshMetrics(): Promise<TerminalMetrics | null> {
    return fetchMetrics(true)
  }

  function clearCache() {
    metrics.value = null
    lastFetchTime.value = 0
    error.value = ''
  }

  return {
    // State
    metrics,
    isLoading,
    error,
    lastFetchTime,

    // Computed
    isCached,
    serverStatus,
    hasCapacityIssues,

    // Actions
    fetchMetrics,
    refreshMetrics,
    clearCache
  }
})
