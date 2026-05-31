/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Session-detail subsystem (steps + commands) state/logic, extracted from
 * GroupScenariosTab.vue (commit c6 of #244). Owns the session detail, the
 * loading flag, the selected result, the detail tab, the paginated commands
 * state, the per-step/per-quiz expansion sets, and the commands fetchers. The
 * modal VIEW and exportCommandsCsv live in SessionDetailModal; this is the data
 * engine. Error notifications surface via the injected onError callback.
 */

import { ref, computed } from 'vue'
import { teacherService } from '../services/domain/scenario'
import { commandsForStepFromList } from '../utils/scenarioDisplay'
import type {
  SessionDetailResponse,
  SessionStepDetail,
  SessionCommand
} from '../services/domain/scenario'
import type { ScenarioResultItem } from '../types/groupScenarios'

type DetailTab = 'steps' | 'commands'
type CommandsViewMode = 'all' | 'per-step'

export function useSessionDetail(groupId: () => string, onError?: () => void) {
  const sessionDetail = ref<SessionDetailResponse | null>(null)
  const loadingDetail = ref(false)
  const detailResult = ref<ScenarioResultItem | null>(null)

  // Detail modal tabs
  const detailActiveTab = ref<DetailTab>('steps')

  // Commands tab state
  const commandsList = ref<SessionCommand[]>([])
  const commandsTotal = ref(0)
  const commandsLimit = 100
  const commandsOffset = ref(0)
  const commandsLoading = ref(false)
  const commandsLoaded = ref(false)
  const commandsError = ref('')
  const commandsNoTerminal = ref(false)

  // Commands view mode toggle (within Commands tab)
  const commandsViewMode = ref<CommandsViewMode>('all')

  // All commands cache used by per-step grouping (separate from paginated commandsList)
  const allCommandsCache = ref<SessionCommand[]>([])
  const allCommandsLoading = ref(false)
  const allCommandsLoaded = ref(false)
  const allCommandsError = ref('')
  const COMMANDS_FETCH_BATCH = 1000
  const COMMANDS_FETCH_LIMIT = 5000

  // Expansion sets
  const expandedStepOrders = ref<Set<number>>(new Set())
  const expandedQuizSteps = ref<Set<number>>(new Set())

  // Load step-by-step detail for a session.
  async function loadDetail(result: ScenarioResultItem) {
    loadingDetail.value = true
    sessionDetail.value = null
    detailResult.value = result
    // Reset tab and commands state every time we open a session
    detailActiveTab.value = 'steps'
    commandsList.value = []
    commandsTotal.value = 0
    commandsOffset.value = 0
    commandsLoaded.value = false
    commandsError.value = ''
    commandsNoTerminal.value = false
    commandsViewMode.value = 'all'
    allCommandsCache.value = []
    allCommandsLoading.value = false
    allCommandsLoaded.value = false
    allCommandsError.value = ''
    expandedStepOrders.value = new Set()
    expandedQuizSteps.value = new Set()
    try {
      sessionDetail.value = await teacherService.getSessionDetail(
        groupId(),
        result.session_id
      )
    } catch (err: any) {
      console.error('Failed to load session detail:', err)
      onError?.()
    } finally {
      loadingDetail.value = false
    }
  }

  function closeDetail() {
    detailResult.value = null
  }

  // --- Commands tab ---

  async function fetchSessionCommands() {
    if (!detailResult.value) return
    commandsLoading.value = true
    commandsError.value = ''
    commandsNoTerminal.value = false
    try {
      const data = await teacherService.getSessionCommands(
        groupId(),
        detailResult.value.session_id,
        commandsLimit,
        commandsOffset.value
      )
      commandsList.value = data.commands || []
      commandsTotal.value = data.total || 0
      commandsLoaded.value = true
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Session has no terminal — distinct UI from a generic error
        commandsNoTerminal.value = true
        commandsList.value = []
        commandsTotal.value = 0
        commandsLoaded.value = true
      } else {
        commandsError.value = err.response?.data?.error_message
          || err.response?.data?.error
          || err.response?.data?.message
          || ''
      }
    } finally {
      commandsLoading.value = false
    }
  }

  function selectDetailTab(tab: DetailTab) {
    detailActiveTab.value = tab
    // Lazy-load commands the first time the tab is activated
    if (tab === 'commands' && !commandsLoaded.value && !commandsLoading.value) {
      fetchSessionCommands()
    }
  }

  const commandsHasPrev = computed(() => commandsOffset.value > 0)
  const commandsHasNext = computed(() => commandsOffset.value + commandsLimit < commandsTotal.value)
  const commandsPageStart = computed(() => commandsTotal.value === 0 ? 0 : commandsOffset.value + 1)
  const commandsPageEnd = computed(() => Math.min(commandsOffset.value + commandsLimit, commandsTotal.value))

  function commandsPrevPage() {
    if (!commandsHasPrev.value) return
    commandsOffset.value = Math.max(0, commandsOffset.value - commandsLimit)
    fetchSessionCommands()
  }

  function commandsNextPage() {
    if (!commandsHasNext.value) return
    commandsOffset.value = commandsOffset.value + commandsLimit
    fetchSessionCommands()
  }

  // --- Per-step commands helpers ---

  function setCommandsViewMode(mode: CommandsViewMode) {
    if (commandsViewMode.value === mode) return
    commandsViewMode.value = mode
    if (mode === 'per-step' && !allCommandsLoaded.value && !allCommandsLoading.value) {
      fetchAllSessionCommands()
    }
  }

  async function fetchAllSessionCommands() {
    if (!detailResult.value) return
    allCommandsLoading.value = true
    allCommandsError.value = ''
    let collected: SessionCommand[] = []
    try {
      let offset = 0
      while (collected.length < COMMANDS_FETCH_LIMIT) {
        const data = await teacherService.getSessionCommands(
          groupId(),
          detailResult.value.session_id,
          COMMANDS_FETCH_BATCH,
          offset
        )
        const batch = data.commands || []
        collected = collected.concat(batch)
        const total = data.total || 0
        if (batch.length < COMMANDS_FETCH_BATCH || collected.length >= total) {
          break
        }
        offset += COMMANDS_FETCH_BATCH
      }
      allCommandsCache.value = collected
      allCommandsLoaded.value = true
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Session has no terminal — degrade to empty cache (UI will fall back to no-terminal state)
        allCommandsCache.value = []
        allCommandsLoaded.value = true
        commandsNoTerminal.value = true
      } else {
        allCommandsError.value = err.response?.data?.error_message
          || err.response?.data?.error
          || err.response?.data?.message
          || ''
      }
    } finally {
      allCommandsLoading.value = false
    }
  }

  // Returns the commands executed during a given step's time window, from the
  // in-memory command cache. Active step (no completed_at) uses Date.now() as the
  // open end. Pure window logic lives in commandsForStepFromList.
  function commandsForStep(step: SessionStepDetail): SessionCommand[] {
    return commandsForStepFromList(step, allCommandsCache.value, Date.now())
  }

  function toggleStepRow(stepOrder: number) {
    if (expandedStepOrders.value.has(stepOrder)) {
      expandedStepOrders.value.delete(stepOrder)
    } else {
      expandedStepOrders.value.add(stepOrder)
    }
    expandedStepOrders.value = new Set(expandedStepOrders.value)
  }

  function isStepRowExpanded(stepOrder: number): boolean {
    return expandedStepOrders.value.has(stepOrder)
  }

  function toggleQuizStep(stepOrder: number) {
    if (expandedQuizSteps.value.has(stepOrder)) {
      expandedQuizSteps.value.delete(stepOrder)
    } else {
      expandedQuizSteps.value.add(stepOrder)
    }
    // Force reactivity update on Set
    expandedQuizSteps.value = new Set(expandedQuizSteps.value)
  }

  function isQuizStepExpanded(stepOrder: number): boolean {
    return expandedQuizSteps.value.has(stepOrder)
  }

  return {
    sessionDetail,
    loadingDetail,
    detailResult,
    detailActiveTab,
    commandsList,
    commandsTotal,
    commandsLimit,
    commandsOffset,
    commandsLoading,
    commandsLoaded,
    commandsError,
    commandsNoTerminal,
    commandsViewMode,
    allCommandsCache,
    allCommandsLoading,
    allCommandsLoaded,
    allCommandsError,
    expandedStepOrders,
    expandedQuizSteps,
    loadDetail,
    closeDetail,
    fetchSessionCommands,
    selectDetailTab,
    commandsHasPrev,
    commandsHasNext,
    commandsPageStart,
    commandsPageEnd,
    commandsPrevPage,
    commandsNextPage,
    setCommandsViewMode,
    fetchAllSessionCommands,
    commandsForStep,
    toggleStepRow,
    isStepRowExpanded,
    toggleQuizStep,
    isQuizStepExpanded
  }
}
