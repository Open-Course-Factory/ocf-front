/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Results-panel state + lifecycle for an assignment, extracted from
 * GroupScenariosTab.vue (commit c5 of #244). Owns the open assignment, the
 * results list, the loading flag, the 30s auto-refresh interval, and the
 * multi-select state. The inline results VIEW (presentational) and the
 * export/detail orchestration stay in the component.
 */

import { ref, computed, onUnmounted } from 'vue'
import { teacherService } from '../services/domain/scenario'
import type { ScenarioAssignment, ScenarioResultItem } from '../types/groupScenarios'

export function useAssignmentResults(groupId: () => string, onError?: () => void) {
  const showResultsForAssignment = ref<ScenarioAssignment | null>(null)
  const scenarioResults = ref<ScenarioResultItem[]>([])
  const loadingResults = ref(false)

  // Auto-refresh interval
  const resultsRefreshInterval = ref<ReturnType<typeof setInterval> | null>(null)

  // Selection state for multi-select export
  const selectedResults = ref<Set<string>>(new Set())
  const allSelected = computed({
    get: () => scenarioResults.value.length > 0 && selectedResults.value.size === scenarioResults.value.length,
    set: (val: boolean) => {
      if (val) {
        scenarioResults.value.forEach(r => selectedResults.value.add(r.session_id))
      } else {
        selectedResults.value.clear()
      }
    }
  })

  function clearRefreshInterval() {
    if (resultsRefreshInterval.value) {
      clearInterval(resultsRefreshInterval.value)
      resultsRefreshInterval.value = null
    }
  }

  // View results for an assignment
  async function handleViewResults(assignment: ScenarioAssignment) {
    showResultsForAssignment.value = assignment
    loadingResults.value = true
    scenarioResults.value = []
    selectedResults.value.clear()
    try {
      scenarioResults.value = await teacherService.getScenarioResults(
        groupId(),
        assignment.scenario_id
      )
    } catch (err: any) {
      console.error('Failed to load scenario results:', err)
      onError?.()
    } finally {
      loadingResults.value = false
    }

    // Start auto-refresh
    clearRefreshInterval()
    resultsRefreshInterval.value = setInterval(async () => {
      if (!showResultsForAssignment.value) return
      try {
        scenarioResults.value = await teacherService.getScenarioResults(
          groupId(),
          showResultsForAssignment.value.scenario_id
        )
      } catch {
        // Silently ignore refresh errors
      }
    }, 30000)
  }

  function closeResults() {
    showResultsForAssignment.value = null
    scenarioResults.value = []
    selectedResults.value.clear()
    clearRefreshInterval()
  }

  function toggleResult(sessionId: string) {
    if (selectedResults.value.has(sessionId)) {
      selectedResults.value.delete(sessionId)
    } else {
      selectedResults.value.add(sessionId)
    }
  }

  function toggleSelectAll() {
    allSelected.value = !allSelected.value
  }

  onUnmounted(clearRefreshInterval)

  return {
    showResultsForAssignment,
    scenarioResults,
    loadingResults,
    selectedResults,
    allSelected,
    handleViewResults,
    closeResults,
    toggleResult,
    toggleSelectAll
  }
}
