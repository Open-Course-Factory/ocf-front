/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Distribution-picker state + loader for the bulk-start flow, extracted from
 * GroupScenariosTab.vue (commit c3 of #244). Owns the distribution list, the
 * selected prefix, the loading flag, and reloads when the selected backend
 * changes. The bulk-start modal (presentational) and the confirmBulkStart
 * service call stay in the component.
 */

import { ref, watch } from 'vue'
import { useTerminalBackendsStore } from '../stores/terminalBackends'
import { teacherService } from '../services/domain/scenario'
import type { Distribution } from '../types/groupScenarios'

export function useDistributionPicker() {
  const backendsStore = useTerminalBackendsStore()

  const distributions = ref<Distribution[]>([])
  const selectedDistribution = ref('')
  const loadingDistributions = ref(false)

  async function loadDistributions(backendId?: string) {
    loadingDistributions.value = true
    try {
      const id = backendId ?? (backendsStore.selectedBackendId || undefined)
      distributions.value = await teacherService.getDistributions(id)
      // Auto-select first if only one
      if (distributions.value.length === 1) {
        selectedDistribution.value = distributions.value[0].prefix
      }
    } catch (err: any) {
      console.error('Failed to load distributions:', err)
    } finally {
      loadingDistributions.value = false
    }
  }

  // When backend selection changes, reset the selection and reload distributions.
  watch(() => backendsStore.selectedBackendId, (newId) => {
    selectedDistribution.value = ''
    loadDistributions(newId || undefined)
  })

  return {
    distributions,
    selectedDistribution,
    loadingDistributions,
    loadDistributions
  }
}
