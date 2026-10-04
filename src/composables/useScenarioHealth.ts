/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { computed, ref, watch, type Ref } from 'vue'
import axios from 'axios'
import type { ScenarioHealthFinding } from './useScenarioHealthSentence'

/**
 * One scenario's health, as its managers read it (GET /scenarios/:id/health —
 * the same CheckScenarioHealth the operators' report runs).
 *
 * `available` is false when the caller may not read it (403 for a scenario they
 * cannot manage) or the endpoint is missing: the editor then shows no checks
 * at all rather than an "all clear" it never verified.
 */
export function useScenarioHealth(scenarioId: Ref<string | null>) {
  const findings = ref<ScenarioHealthFinding[]>([])
  const available = ref(false)
  const isLoading = ref(false)

  async function refresh() {
    const id = scenarioId.value
    if (!id) {
      findings.value = []
      available.value = false
      return
    }
    isLoading.value = true
    try {
      const response = await axios.get(`/scenarios/${id}/health`)
      if (scenarioId.value !== id) return
      findings.value = response.data?.findings || []
      available.value = true
    } catch {
      if (scenarioId.value !== id) return
      findings.value = []
      available.value = false
    } finally {
      isLoading.value = false
    }
  }

  watch(scenarioId, refresh, { immediate: true })

  const blockingCount = computed(() => findings.value.filter(f => f.severity === 'blocking').length)
  const warningCount = computed(() => findings.value.length - blockingCount.value)

  return { findings, available, isLoading, blockingCount, warningCount, refresh }
}
