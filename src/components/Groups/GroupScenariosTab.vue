<!--
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
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { teacherService } from '../../services/domain/scenario'
import type {
  SessionStepDetail,
  SessionDetailResponse,
  SessionCommand
} from '../../services/domain/scenario'
import { sanitizeCSVField } from '../../utils/csv'
import { useTerminalBackendsStore } from '../../stores/terminalBackends'
import BackendSelector from '../Terminal/BackendSelector.vue'
import BaseModal from '../Modals/BaseModal.vue'
import ScenarioUploadModal from '../Modals/ScenarioUploadModal.vue'
import ScenarioJSONImportModal from '../Modals/ScenarioJSONImportModal.vue'

interface ScenarioAssignment {
  id: string
  scenario_id: string
  group_id: string
  scope: string
  start_date?: string
  deadline?: string
  is_active: boolean
  scenario?: {
    id: string
    name: string
    title: string
    difficulty: string
    organization_id?: string
  }
}

interface Scenario {
  id: string
  name: string
  title: string
  difficulty: string
  source?: string
}

const props = defineProps<{
  groupId: string
  canEditGroup: boolean
  organizationId?: string
}>()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      assignedScenarios: 'Assigned Scenarios',
      assignScenario: 'Assign Scenario',
      bulkStart: 'Start for All',
      removeAssignment: 'Remove',
      deadline: 'Deadline',
      startDate: 'Start Date',
      noStartDate: 'No start date',
      noAssignments: 'No scenarios assigned to this group yet.',
      assignSuccess: 'Scenario assigned successfully',
      bulkStartResult: 'Started {started} sessions, skipped {skipped}',
      confirmRemove: 'Are you sure you want to remove this scenario assignment?',
      selectScenario: 'Select a Scenario',
      searchScenarios: 'Search scenarios...',
      cancel: 'Cancel',
      confirm: 'Assign',
      difficulty: 'Difficulty',
      active: 'Active',
      inactive: 'Inactive',
      noDeadline: 'No deadline',
      loadError: 'Failed to load scenario assignments',
      assignError: 'Failed to assign scenario',
      removeError: 'Failed to remove assignment',
      bulkStartError: 'Failed to start sessions',
      starting: 'Starting sessions...',
      bulkStartTitle: 'Sessions Started',
      confirmRemoveTitle: 'Remove Assignment',
      close: 'Close',
      remove: 'Remove',
      noKeyWarning: 'The following learners couldn\'t get a terminal key provisioned:',
      resetSessions: 'Reset Sessions',
      resetConfirmTitle: 'Reset Scenario Sessions',
      resetConfirm: 'This will abandon all active sessions for this scenario. Learners will need to restart. Continue?',
      resetSuccess: '{count} sessions reset',
      resetError: 'Failed to reset sessions',
      selectDistribution: 'Select Distribution',
      distribution: 'Distribution',
      distributionDescription: 'Choose the terminal distribution for all learners in this group.',
      terminalErrors: 'Some terminals could not be created:',
      viewResults: 'Results',
      studentResults: 'Learner Results',
      student: 'Learner',
      status: 'Status',
      grade: 'Grade',
      progress: 'Progress',
      startedAt: 'Started',
      completedAt: 'Completed',
      actions: 'Actions',
      viewDetails: 'Details',
      noResults: 'No sessions yet for this scenario.',
      sessionDetail: 'Session Detail',
      stepOrder: 'Step',
      stepTitle: 'Title',
      stepStatus: 'Status',
      stepType: 'Type',
      stepResult: 'Result',
      typeTerminal: 'Terminal',
      typeFlag: 'Flag',
      typeInfo: 'Reading',
      typeQuiz: 'Quiz',
      attempts: 'Attempts',
      attemptsCount: '{n} attempt(s)',
      quizScorePct: '{score}%',
      csvStepType: 'Step type',
      csvQuizScore: 'Quiz score',
      hintsUsed: 'Hints',
      timeSpent: 'Time',
      completed: 'completed',
      activeStatus: 'active',
      locked: 'locked',
      abandoned: 'abandoned',
      in_progress: 'in progress',
      notGraded: 'N/A',
      back: 'Back',
      difficultyBeginner: 'Beginner',
      difficultyIntermediate: 'Intermediate',
      difficultyAdvanced: 'Advanced',
      exportCsv: 'Export CSV',
      selectAll: 'Select all',
      exportStudent: 'Export this student',
      selectedCount: '{count} selected',
      exportSelected: 'Export selected',
      clearSelection: 'Clear selection',
      importKillercoda: 'Import KillerCoda',
      importJson: 'Import JSON',
      exportJson: 'Export JSON',
      exportKillercoda: 'Export KillerCoda',
      importSuccess: 'Scenario imported successfully',
      exportError: 'Failed to export scenario',
      orgLibrary: 'Organization Library',
      groupScenarios: 'Group Scenarios',
      orgScenario: 'Org',
      tabsLabel: 'Session detail tabs',
      tabSteps: 'Steps',
      tabCommands: 'Commands',
      commandsLoading: 'Loading commands...',
      commandsEmpty: 'No commands recorded yet',
      commandsNoTerminal: 'This session never started a terminal',
      commandsError: 'Failed to load commands',
      retry: 'Retry',
      commandSequence: '#',
      command: 'Command',
      commandExecutedAt: 'Executed at',
      exportCommandsCsv: 'Export CSV',
      prevPage: 'Previous',
      nextPage: 'Next',
      pageInfo: '{start}-{end} of {total}',
      showQuestions: 'Show questions',
      hideQuestions: 'Hide questions',
      question: 'Question',
      yourAnswer: 'Student answer',
      correctAnswer: 'Correct answer',
      studentAnswerCorrect: 'Student answer (correct)',
      correctIndicator: 'Correct',
      incorrectIndicator: 'Incorrect',
      noAnswer: 'No answer',
      questionsCorrect: '{correct}/{total} correct',
      commandsModeAll: 'All commands',
      commandsModePerStep: 'Per step',
      commandsDuringStep: 'Commands during this step',
      commandsNoneDuringStep: 'No commands during this step',
      commandsCount: '{count} commands',
      csvStepOrder: 'Step',
      csvStepTitle: 'Step title',
      export: {
        name: 'Name',
        email: 'Email',
        status: 'Status',
        grade: 'Grade',
        progress: 'Progress',
        hintsUsed: 'Hints Used',
        started: 'Started',
        completed: 'Completed'
      }
    }
  },
  fr: {
    groupScenarios: {
      assignedScenarios: 'Scénarios assignés',
      assignScenario: 'Assigner un scénario',
      bulkStart: 'Démarrer pour tous',
      removeAssignment: 'Supprimer',
      deadline: 'Date limite',
      startDate: 'Date de début',
      noStartDate: 'Pas de date de début',
      noAssignments: 'Aucun scénario assigné à ce groupe.',
      assignSuccess: 'Scénario assigné avec succès',
      bulkStartResult: '{started} sessions démarrées, {skipped} ignorées',
      confirmRemove: 'Êtes-vous sûr de vouloir supprimer cette assignation de scénario ?',
      selectScenario: 'Sélectionner un scénario',
      searchScenarios: 'Rechercher des scénarios...',
      cancel: 'Annuler',
      confirm: 'Assigner',
      difficulty: 'Difficulté',
      active: 'Actif',
      inactive: 'Inactif',
      noDeadline: 'Pas de date limite',
      loadError: 'Échec du chargement des assignations',
      assignError: 'Échec de l\'assignation du scénario',
      removeError: 'Échec de la suppression de l\'assignation',
      bulkStartError: 'Échec du démarrage des sessions',
      starting: 'Démarrage des sessions...',
      bulkStartTitle: 'Sessions démarrées',
      confirmRemoveTitle: 'Supprimer l\'assignation',
      close: 'Fermer',
      remove: 'Supprimer',
      noKeyWarning: 'Les apprenants suivants n\'ont pas pu recevoir de clé terminal :',
      resetSessions: 'Réinitialiser',
      resetConfirmTitle: 'Réinitialiser les sessions',
      resetConfirm: 'Ceci va abandonner toutes les sessions actives pour ce scénario. Les apprenants devront recommencer. Continuer ?',
      resetSuccess: '{count} sessions réinitialisées',
      resetError: 'Échec de la réinitialisation',
      selectDistribution: 'Sélectionner la distribution',
      distribution: 'Distribution',
      distributionDescription: 'Choisissez la distribution terminal pour tous les apprenants de ce groupe.',
      terminalErrors: 'Certains terminaux n\'ont pas pu être créés :',
      viewResults: 'Résultats',
      studentResults: 'Résultats des apprenants',
      student: 'Apprenant(e)',
      status: 'Statut',
      grade: 'Note',
      progress: 'Progression',
      startedAt: 'Début',
      completedAt: 'Fin',
      actions: 'Actions',
      viewDetails: 'Détails',
      noResults: 'Aucune session pour ce scénario.',
      sessionDetail: 'Détail de la session',
      stepOrder: 'Étape',
      stepTitle: 'Titre',
      stepStatus: 'Statut',
      stepType: 'Type',
      stepResult: 'Résultat',
      typeTerminal: 'Terminal',
      typeFlag: 'Drapeau',
      typeInfo: 'Lecture',
      typeQuiz: 'Quiz',
      attempts: 'Tentatives',
      attemptsCount: '{n} tentative(s)',
      quizScorePct: '{score} %',
      csvStepType: 'Type d\'étape',
      csvQuizScore: 'Score quiz',
      hintsUsed: 'Indices',
      timeSpent: 'Temps',
      completed: 'terminé',
      activeStatus: 'actif',
      locked: 'verrouillé',
      abandoned: 'abandonné',
      in_progress: 'en cours',
      notGraded: 'N/A',
      back: 'Retour',
      difficultyBeginner: 'Débutant',
      difficultyIntermediate: 'Intermédiaire',
      difficultyAdvanced: 'Avancé',
      exportCsv: 'Exporter CSV',
      selectAll: 'Tout sélectionner',
      exportStudent: 'Exporter cet étudiant',
      selectedCount: '{count} sélectionné(s)',
      exportSelected: 'Exporter la sélection',
      clearSelection: 'Annuler la sélection',
      importKillercoda: 'Importer KillerCoda',
      importJson: 'Importer JSON',
      exportJson: 'Exporter JSON',
      exportKillercoda: 'Exporter KillerCoda',
      importSuccess: 'Scénario importé avec succès',
      exportError: 'Échec de l\'export du scénario',
      orgLibrary: 'Bibliothèque de l\'organisation',
      groupScenarios: 'Scénarios du groupe',
      orgScenario: 'Org',
      tabsLabel: 'Onglets du détail de session',
      tabSteps: 'Étapes',
      tabCommands: 'Commandes',
      commandsLoading: 'Chargement des commandes...',
      commandsEmpty: 'Aucune commande enregistrée',
      commandsNoTerminal: 'Cette session n\'a pas démarré de terminal',
      commandsError: 'Échec du chargement des commandes',
      retry: 'Réessayer',
      commandSequence: 'N°',
      command: 'Commande',
      commandExecutedAt: 'Exécutée le',
      exportCommandsCsv: 'Exporter CSV',
      prevPage: 'Précédent',
      nextPage: 'Suivant',
      pageInfo: '{start}-{end} sur {total}',
      showQuestions: 'Afficher les questions',
      hideQuestions: 'Masquer les questions',
      question: 'Question',
      yourAnswer: 'Réponse de l\'apprenant',
      correctAnswer: 'Bonne réponse',
      studentAnswerCorrect: 'Réponse de l\'apprenant (correcte)',
      correctIndicator: 'Correcte',
      incorrectIndicator: 'Incorrecte',
      noAnswer: 'Pas de réponse',
      questionsCorrect: '{correct}/{total} correctes',
      commandsModeAll: 'Toutes les commandes',
      commandsModePerStep: 'Par étape',
      commandsDuringStep: 'Commandes pendant cette étape',
      commandsNoneDuringStep: 'Aucune commande pendant cette étape',
      commandsCount: '{count} commandes',
      csvStepOrder: 'Étape',
      csvStepTitle: 'Titre de l\'étape',
      export: {
        name: 'Nom',
        email: 'Email',
        status: 'Statut',
        grade: 'Note',
        progress: 'Progression',
        hintsUsed: 'Indices utilisés',
        started: 'Début',
        completed: 'Fin'
      }
    }
  }
})

const { showError: notifyError } = useNotification()
const backendsStore = useTerminalBackendsStore()

interface Distribution {
  prefix: string
  name: string
  description: string
  os_type?: string
  is_global: boolean
}

interface ScenarioResultItem {
  session_id: string
  user_id: string
  user_name?: string
  user_email?: string
  status: string
  grade?: number
  current_step: number
  total_steps: number
  completed_steps: number
  total_hints_used: number
  started_at: string
  completed_at?: string
}

// SessionStepDetail and SessionDetailResponse are imported from teacherService

// State
const assignments = ref<ScenarioAssignment[]>([])
const availableScenarios = ref<Scenario[]>([])
const isLoading = ref(false)
const showAssignModal = ref(false)
const selectedScenarioId = ref('')
const assignStartDate = ref('')
const assignDeadline = ref('')
const scenarioSearch = ref('')
const bulkStartingId = ref<string | null>(null)
const showResultModal = ref(false)
const resultMessage = ref('')
const resultNoKeyUsers = ref<Array<{ user_id?: string; user_name?: string; user_email?: string }>>([])
const resultErrors = ref<Array<{ user_id?: string; error?: string }>>([])
const showConfirmRemoveModal = ref(false)
const assignmentToRemove = ref<ScenarioAssignment | null>(null)
const showResetModal = ref(false)
const assignmentToReset = ref<ScenarioAssignment | null>(null)
const showBulkStartModal = ref(false)
const assignmentToBulkStart = ref<ScenarioAssignment | null>(null)
const distributions = ref<Distribution[]>([])
const selectedDistribution = ref('')
const loadingDistributions = ref(false)

// Import modal state
const showUploadModal = ref(false)
const showJSONImportModal = ref(false)

// Results view state
const showResultsForAssignment = ref<ScenarioAssignment | null>(null)
const scenarioResults = ref<ScenarioResultItem[]>([])
const loadingResults = ref(false)

// Auto-refresh interval
const resultsRefreshInterval = ref<ReturnType<typeof setInterval> | null>(null)

// Detail modal state
const showDetailModal = ref(false)
const sessionDetail = ref<SessionDetailResponse | null>(null)
const loadingDetail = ref(false)
const detailResult = ref<ScenarioResultItem | null>(null)

// Detail modal tabs
type DetailTab = 'steps' | 'commands'
const detailActiveTab = ref<DetailTab>('steps')

// Commands tab state — SessionCommand is imported from teacherService
const commandsList = ref<SessionCommand[]>([])
const commandsTotal = ref(0)
const commandsLimit = 100
const commandsOffset = ref(0)
const commandsLoading = ref(false)
const commandsLoaded = ref(false)
const commandsError = ref('')
const commandsNoTerminal = ref(false)

// Commands view mode toggle (within Commands tab)
type CommandsViewMode = 'all' | 'per-step'
const commandsViewMode = ref<CommandsViewMode>('all')

// All commands cache used by per-step grouping (separate from paginated commandsList)
const allCommandsCache = ref<SessionCommand[]>([])
const allCommandsLoading = ref(false)
const allCommandsLoaded = ref(false)
const allCommandsError = ref('')
const COMMANDS_FETCH_BATCH = 1000
const COMMANDS_FETCH_LIMIT = 5000

// Per-step commands UI: which step orders are expanded in the per-step view
const expandedStepOrders = ref<Set<number>>(new Set())

// Per-quiz questions UI: which quiz step orders have their question detail expanded
const expandedQuizSteps = ref<Set<number>>(new Set())

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

// Filtered scenarios for modal dropdown
const filteredAvailableScenarios = computed(() => {
  if (!scenarioSearch.value.trim()) return availableScenarios.value
  const q = scenarioSearch.value.toLowerCase()
  return availableScenarios.value.filter(
    s => s.title.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  )
})

const orgScenarios = computed(() =>
  filteredAvailableScenarios.value.filter((s: any) => s.source === 'org')
)
const groupOnlyScenarios = computed(() =>
  filteredAvailableScenarios.value.filter((s: any) => s.source === 'group')
)

// Load assignments
async function loadAssignments() {
  isLoading.value = true
  try {
    assignments.value = await teacherService.getGroupAssignments(props.groupId)
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.loadError'))
  } finally {
    isLoading.value = false
  }
}

// Load available scenarios for the assign modal
async function loadScenarios() {
  try {
    availableScenarios.value = await teacherService.listGroupAvailableScenarios(props.groupId)
  } catch (err: any) {
    console.error('Failed to load scenarios:', err)
  }
}

// Assign scenario
async function handleAssign() {
  if (!selectedScenarioId.value) return
  try {
    await teacherService.assignScenarioToGroup(
      props.groupId,
      selectedScenarioId.value,
      {
        start_date: assignStartDate.value || undefined,
        deadline: assignDeadline.value || undefined
      }
    )
    showAssignModal.value = false
    selectedScenarioId.value = ''
    assignStartDate.value = ''
    assignDeadline.value = ''
    scenarioSearch.value = ''
    await loadAssignments()
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.assignError'))
  }
}

// Load distributions for bulk start modal
async function loadDistributions() {
  loadingDistributions.value = true
  try {
    const backendId = backendsStore.selectedBackendId || undefined
    distributions.value = await teacherService.getDistributions(backendId)
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

// Open bulk start modal with distribution selection
async function handleBulkStart(assignment: ScenarioAssignment) {
  assignmentToBulkStart.value = assignment
  selectedDistribution.value = ''
  if (props.organizationId) {
    await backendsStore.fetchBackends(props.organizationId)
  } else {
    await backendsStore.fetchBackends()
  }
  await loadDistributions()
  showBulkStartModal.value = true
}

// Confirm bulk start with selected distribution
async function confirmBulkStart() {
  if (!assignmentToBulkStart.value || !selectedDistribution.value) return
  const assignment = assignmentToBulkStart.value
  showBulkStartModal.value = false
  bulkStartingId.value = assignment.id
  try {
    const data = await teacherService.bulkStartScenario(
      props.groupId,
      assignment.scenario_id,
      {
        distribution: selectedDistribution.value,
        ...(backendsStore.selectedBackendId && { backend: backendsStore.selectedBackendId })
      }
    )
    const started = data?.created || data?.started || 0
    const skipped = data?.skipped || 0
    resultMessage.value = t('groupScenarios.bulkStartResult', { started, skipped })
    resultNoKeyUsers.value = data?.no_key_users || []
    resultErrors.value = data?.errors || []
    showResultModal.value = true
  } catch (err: any) {
    notifyError(err.response?.data?.error || err.response?.data?.error_message || t('groupScenarios.bulkStartError'))
  } finally {
    bulkStartingId.value = null
    assignmentToBulkStart.value = null
  }
}

// Remove assignment
function handleRemove(assignment: ScenarioAssignment) {
  assignmentToRemove.value = assignment
  showConfirmRemoveModal.value = true
}

async function confirmRemove() {
  if (!assignmentToRemove.value) return
  try {
    await teacherService.removeAssignment(assignmentToRemove.value.id)
    showConfirmRemoveModal.value = false
    assignmentToRemove.value = null
    await loadAssignments()
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.removeError'))
  }
}

// Reset sessions
function handleReset(assignment: ScenarioAssignment) {
  assignmentToReset.value = assignment
  showResetModal.value = true
}

async function confirmReset() {
  if (!assignmentToReset.value) return
  try {
    const data = await teacherService.resetGroupScenarioSessions(
      props.groupId,
      assignmentToReset.value.scenario_id
    )
    const count = data?.abandoned || 0
    showResetModal.value = false
    assignmentToReset.value = null
    resultMessage.value = t('groupScenarios.resetSuccess', { count })
    resultNoKeyUsers.value = []
    showResultModal.value = true
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.resetError'))
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
      props.groupId,
      assignment.scenario_id
    )
  } catch (err: any) {
    notifyError(err.response?.data?.error || t('groupScenarios.loadError'))
  } finally {
    loadingResults.value = false
  }

  // Start auto-refresh
  if (resultsRefreshInterval.value) clearInterval(resultsRefreshInterval.value)
  resultsRefreshInterval.value = setInterval(async () => {
    if (!showResultsForAssignment.value) return
    try {
      scenarioResults.value = await teacherService.getScenarioResults(
        props.groupId,
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
  if (resultsRefreshInterval.value) {
    clearInterval(resultsRefreshInterval.value)
    resultsRefreshInterval.value = null
  }
}

// View step-by-step detail for a session
async function handleViewDetail(result: ScenarioResultItem) {
  showDetailModal.value = true
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
      props.groupId,
      result.session_id
    )
  } catch (err: any) {
    notifyError(err.response?.data?.error || t('groupScenarios.loadError'))
    showDetailModal.value = false
  } finally {
    loadingDetail.value = false
  }
}

function closeDetailModal() {
  showDetailModal.value = false
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
      props.groupId,
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
        || t('groupScenarios.commandsError')
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

const detailTabs: ReadonlyArray<{ key: DetailTab; labelKey: string }> = [
  { key: 'steps', labelKey: 'groupScenarios.tabSteps' },
  { key: 'commands', labelKey: 'groupScenarios.tabCommands' }
]

function onDetailTabKeydown(e: KeyboardEvent) {
  const keys: DetailTab[] = detailTabs.map(t_ => t_.key)
  const i = keys.indexOf(detailActiveTab.value)
  if (i === -1) return
  let next = i
  if (e.key === 'ArrowRight') next = (i + 1) % keys.length
  else if (e.key === 'ArrowLeft') next = (i - 1 + keys.length) % keys.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = keys.length - 1
  else return
  e.preventDefault()
  selectDetailTab(keys[next])
  requestAnimationFrame(() => {
    const el = document.getElementById(`detail-tab-${keys[next]}`) as HTMLElement | null
    el?.focus()
  })
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

function formatExecutedAt(unixSeconds: number): string {
  try {
    return new Date(unixSeconds * 1000).toLocaleString()
  } catch {
    return String(unixSeconds)
  }
}

async function exportCommandsCsv() {
  if (!detailResult.value) return
  // For a small page (≤100), the visible page is enough; if more pages exist
  // and we want a full export, fetch all pages on demand. Keep KISS: one shot of all pages.
  let allCommands: SessionCommand[] = []
  try {
    let offset = 0
    while (true) {
      const data = await teacherService.getSessionCommands(
        props.groupId,
        detailResult.value.session_id,
        commandsLimit,
        offset
      )
      const batch = data.commands || []
      allCommands = allCommands.concat(batch)
      if (batch.length < commandsLimit || allCommands.length >= (data.total || 0)) break
      offset += commandsLimit
    }
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.commandsError'))
    return
  }

  const result = detailResult.value
  const learner = result.user_name || result.user_email || result.user_id
  const perStep = commandsViewMode.value === 'per-step'
  const baseHeaders = [
    t('groupScenarios.commandSequence'),
    t('groupScenarios.command'),
    t('groupScenarios.commandExecutedAt'),
    t('groupScenarios.student')
  ]
  const headers = perStep
    ? [
        t('groupScenarios.csvStepOrder'),
        t('groupScenarios.csvStepTitle'),
        t('groupScenarios.csvStepType'),
        ...baseHeaders
      ]
    : baseHeaders

  let rows: any[][]
  if (perStep && sessionDetail.value) {
    rows = []
    const steps = sessionDetail.value.steps
    // Build per-step buckets so each command appears once under the step it falls in.
    for (const step of steps) {
      const stepCommands = commandsForStepFromList(step, allCommands)
      for (const c of stepCommands) {
        rows.push([
          step.step_order + 1,
          step.step_title,
          normalizedStepType(step.step_type),
          c.sequence_num,
          c.command_text,
          formatExecutedAt(c.executed_at),
          learner
        ])
      }
    }
  } else {
    rows = allCommands.map(c => [
      c.sequence_num,
      c.command_text,
      formatExecutedAt(c.executed_at),
      learner
    ])
  }
  const csv = [headers, ...rows]
    .map(row => row.map(sanitizeCSVField).join(','))
    .join('\n')

  const safeLearner = learner.replace(/[^a-zA-Z0-9-_]/g, '_')
  const sessionShort = result.session_id.split('-')[0] || result.session_id.slice(0, 8)
  const suffix = perStep ? '-per-step' : ''
  downloadCsv(csv, `commands-${safeLearner}-${sessionShort}${suffix}.csv`)
}

// Like commandsForStep but operates on an arbitrary command list (for CSV export).
function commandsForStepFromList(step: SessionStepDetail, list: SessionCommand[]): SessionCommand[] {
  if (!step.started_at) return []
  const startMs = new Date(step.started_at).getTime()
  if (Number.isNaN(startMs)) return []
  const endMs = step.completed_at ? new Date(step.completed_at).getTime() : Date.now()
  if (Number.isNaN(endMs)) return []
  const startSec = startMs / 1000
  const endSec = endMs / 1000
  return list.filter(c => c.executed_at >= startSec && c.executed_at < endSec)
}

// --- Quiz question rendering helpers ---

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

function parseQuizOptions(rawOptions?: string): string[] {
  if (!rawOptions) return []
  try {
    const parsed = JSON.parse(rawOptions)
    if (Array.isArray(parsed)) {
      return parsed.map(v => String(v))
    }
    return []
  } catch {
    return []
  }
}

// For multiple_choice questions the answer string is the option text;
// for free_text/true_false it is the literal answer. Returns the value to render.
function displayAnswer(answer: string): string {
  return answer && answer.trim() !== '' ? answer : ''
}

function quizCorrectCount(step: SessionStepDetail): number {
  return (step.questions || []).filter(q => q.is_correct).length
}

function quizQuestionTotal(step: SessionStepDetail): number {
  return (step.questions || []).length
}

// Per multiple-choice option, returns one of:
//   'student-correct' — student picked this AND it's the right answer
//   'correct'         — the right answer (student picked something else)
//   'student-wrong'   — student picked this AND it's wrong
//   ''                — not picked, not the right answer
//
// Multiple-choice answers are stored as the option's index as a string —
// the player (ScenarioPanel.vue) submits `String(idx)` and the backend
// stores `correct_answer` as the same index string. So we compare indexes,
// not the literal option text.
type OptionRole = 'student-correct' | 'correct' | 'student-wrong' | ''
type QuestionDetail = NonNullable<SessionStepDetail['questions']>[number]

function optionRole(optIdx: number, q: QuestionDetail): OptionRole {
  const idxStr = String(optIdx)
  const isStudent = idxStr === q.student_answer
  const isCorrect = idxStr === q.correct_answer
  if (isStudent && isCorrect) return 'student-correct'
  if (isCorrect) return 'correct'
  if (isStudent) return 'student-wrong'
  return ''
}

function optionRoleClass(optIdx: number, q: QuestionDetail): string {
  const role = optionRole(optIdx, q)
  return role ? `option-${role}` : ''
}

function optionRoleIcon(optIdx: number, q: QuestionDetail): string {
  const role = optionRole(optIdx, q)
  if (role === 'student-correct' || role === 'correct') return 'fas fa-check'
  if (role === 'student-wrong') return 'fas fa-times'
  return ''
}

function optionRoleText(optIdx: number, q: QuestionDetail): string {
  switch (optionRole(optIdx, q)) {
    case 'student-correct': return t('groupScenarios.studentAnswerCorrect')
    case 'correct':         return t('groupScenarios.correctAnswer')
    case 'student-wrong':   return t('groupScenarios.yourAnswer')
    default:                return ''
  }
}

// Returns true when student_answer is set but cannot be resolved against the
// options list (legacy free-text-on-mc data, edited options, etc.). Used to
// decide whether to show the orphan-answer fallback line. We accept either
// the index form ("0") or the literal text form for backwards compat.
function isOrphanStudentAnswer(q: QuestionDetail, options: string[]): boolean {
  if (!q.student_answer) return false
  const asIndex = Number(q.student_answer)
  if (Number.isInteger(asIndex) && asIndex >= 0 && asIndex < options.length) return false
  if (options.includes(q.student_answer)) return false
  return true
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
        props.groupId,
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
        || t('groupScenarios.commandsError')
    }
  } finally {
    allCommandsLoading.value = false
  }
}

// Returns the commands executed during a given step's time window.
// step.started_at is inclusive; step.completed_at is exclusive (Date.now() for active step).
// Commands' executed_at is unix SECONDS.
function commandsForStep(step: SessionStepDetail): SessionCommand[] {
  if (!step.started_at) return []
  const startMs = new Date(step.started_at).getTime()
  if (Number.isNaN(startMs)) return []
  const endMs = step.completed_at ? new Date(step.completed_at).getTime() : Date.now()
  if (Number.isNaN(endMs)) return []
  const startSec = startMs / 1000
  const endSec = endMs / 1000
  return allCommandsCache.value.filter(c => c.executed_at >= startSec && c.executed_at < endSec)
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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes < 60) return `${minutes}m ${secs}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString()
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'completed': return 'status-completed'
    case 'active': case 'in_progress': return 'status-active'
    case 'locked': return 'status-locked'
    case 'abandoned': return 'status-abandoned'
    default: return ''
  }
}

function getDifficultyClass(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'difficulty-beginner'
    case 'intermediate': return 'difficulty-intermediate'
    case 'advanced': return 'difficulty-advanced'
    default: return ''
  }
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    completed: t('groupScenarios.completed'),
    active: t('groupScenarios.activeStatus'),
    in_progress: t('groupScenarios.in_progress'),
    locked: t('groupScenarios.locked'),
    abandoned: t('groupScenarios.abandoned')
  }
  return statusMap[status] || status
}

function translateDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    beginner: t('groupScenarios.difficultyBeginner'),
    intermediate: t('groupScenarios.difficultyIntermediate'),
    advanced: t('groupScenarios.difficultyAdvanced')
  }
  return difficultyMap[difficulty] || difficulty
}

function isOrgScenario(assignment: ScenarioAssignment): boolean {
  return assignment.scenario?.organization_id != null
}

function normalizedStepType(stepType?: string): 'terminal' | 'flag' | 'info' | 'quiz' {
  switch (stepType) {
    case 'flag': return 'flag'
    case 'info': return 'info'
    case 'quiz': return 'quiz'
    default: return 'terminal'
  }
}

function stepTypeIcon(stepType?: string): string {
  switch (normalizedStepType(stepType)) {
    case 'flag': return 'fas fa-flag'
    case 'info': return 'fas fa-book-open'
    case 'quiz': return 'fas fa-question-circle'
    default: return 'fas fa-terminal'
  }
}

function stepTypeLabel(stepType?: string): string {
  switch (normalizedStepType(stepType)) {
    case 'flag': return t('groupScenarios.typeFlag')
    case 'info': return t('groupScenarios.typeInfo')
    case 'quiz': return t('groupScenarios.typeQuiz')
    default: return t('groupScenarios.typeTerminal')
  }
}

function quizScoreClass(score: number): string {
  if (score >= 0.7) return 'quiz-score-success'
  if (score >= 0.4) return 'quiz-score-warning'
  return 'quiz-score-danger'
}

function formatQuizScorePct(score: number): string {
  return t('groupScenarios.quizScorePct', { score: Math.round(score * 100) })
}

function formatQuizScoreCsv(score?: number): string {
  if (score == null) return ''
  return `${(score * 100).toFixed(1)}%`
}

function buildResultsCsv(results: ScenarioResultItem[]): string {
  const headers = [
    t('groupScenarios.export.name'),
    t('groupScenarios.export.email'),
    t('groupScenarios.export.status'),
    t('groupScenarios.export.grade'),
    t('groupScenarios.export.progress'),
    t('groupScenarios.export.hintsUsed'),
    t('groupScenarios.export.started'),
    t('groupScenarios.export.completed')
  ]
  const rows = results.map(r => [
    r.user_name || r.user_id,
    r.user_email || '',
    r.status,
    r.grade != null ? Math.round(r.grade) + '%' : '',
    `${r.completed_steps}/${r.total_steps}`,
    r.total_hints_used ?? 0,
    r.started_at ? formatDate(r.started_at) : '',
    r.completed_at ? formatDate(r.completed_at) : ''
  ])
  return [headers, ...rows].map(row => row.map(sanitizeCSVField).join(',')).join('\n')
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportResultsCsv() {
  if (scenarioResults.value.length === 0) return
  const csv = buildResultsCsv(scenarioResults.value)
  downloadCsv(csv, `scenario-results-${showResultsForAssignment.value?.scenario?.title || 'export'}.csv`)
}

function buildDetailCsv(details: Array<{ result: ScenarioResultItem; detail: SessionDetailResponse }>): string {
  const headers = [
    t('groupScenarios.export.name'),
    t('groupScenarios.export.email'),
    t('groupScenarios.export.status'),
    t('groupScenarios.export.grade'),
    t('groupScenarios.stepOrder'),
    t('groupScenarios.stepTitle'),
    t('groupScenarios.csvStepType'),
    t('groupScenarios.stepStatus'),
    t('groupScenarios.attempts'),
    t('groupScenarios.csvQuizScore'),
    t('groupScenarios.hintsUsed'),
    t('groupScenarios.timeSpent'),
    t('groupScenarios.completedAt')
  ]
  const rows: any[][] = []
  for (const { result, detail } of details) {
    const studentName = result.user_name || result.user_id
    const email = result.user_email || ''
    const status = result.status
    const grade = result.grade != null ? Math.round(result.grade) + '%' : ''
    for (const step of detail.steps) {
      rows.push([
        studentName, email, status, grade,
        step.step_order + 1,
        step.step_title,
        normalizedStepType(step.step_type),
        step.status,
        step.verify_attempts,
        formatQuizScoreCsv(step.quiz_score),
        step.hints_revealed,
        formatDuration(step.time_spent_seconds),
        step.completed_at ? formatDate(step.completed_at) : ''
      ])
    }
  }
  return [headers, ...rows].map(row => row.map(sanitizeCSVField).join(',')).join('\n')
}

async function exportSingleResult(result: ScenarioResultItem) {
  try {
    const detail = await teacherService.getSessionDetail(props.groupId, result.session_id)
    const csv = buildDetailCsv([{ result, detail }])
    const studentName = (result.user_name || result.user_id).replace(/[^a-zA-Z0-9-_]/g, '_')
    const scenarioTitle = showResultsForAssignment.value?.scenario?.title || 'scenario'
    downloadCsv(csv, `${scenarioTitle}-${studentName}.csv`)
  } catch (err: any) {
    notifyError(err.response?.data?.error || t('groupScenarios.exportError'))
  }
}

async function exportSelectedResults() {
  const selected = scenarioResults.value.filter(r => selectedResults.value.has(r.session_id))
  if (selected.length === 0) return
  try {
    const details = await Promise.all(
      selected.map(async r => ({
        result: r,
        detail: await teacherService.getSessionDetail(props.groupId, r.session_id)
      }))
    )
    const csv = buildDetailCsv(details)
    const scenarioTitle = showResultsForAssignment.value?.scenario?.title || 'scenario'
    downloadCsv(csv, `${scenarioTitle}-${selected.length}-students.csv`)
  } catch (err: any) {
    notifyError(err.response?.data?.error || t('groupScenarios.exportError'))
  }
}

function toggleSelection(sessionId: string) {
  if (selectedResults.value.has(sessionId)) {
    selectedResults.value.delete(sessionId)
  } else {
    selectedResults.value.add(sessionId)
  }
}

// Download helpers
function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Export handlers
async function handleExportJSON(assignment: ScenarioAssignment) {
  try {
    const data = await teacherService.groupExportScenarioJSON(props.groupId, assignment.scenario_id)
    const name = assignment.scenario?.title || assignment.scenario?.name || assignment.scenario_id
    downloadJSON(data, `${name}.json`)
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.exportError'))
  }
}

async function handleExportArchive(assignment: ScenarioAssignment) {
  try {
    const blob = await teacherService.groupExportScenarioArchive(props.groupId, assignment.scenario_id)
    const name = assignment.scenario?.title || assignment.scenario?.name || assignment.scenario_id
    downloadBlob(blob, `${name}.zip`)
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.exportError'))
  }
}

// Import handlers
function handleImportUploaded() {
  showUploadModal.value = false
  loadAssignments()
}

function handleJSONImported() {
  showJSONImportModal.value = false
  loadAssignments()
}

function openAssignModal() {
  loadScenarios()
  showAssignModal.value = true
}

// When backend selection changes, reload distributions
watch(() => backendsStore.selectedBackendId, () => {
  selectedDistribution.value = ''
  loadDistributions()
})

onMounted(() => {
  loadAssignments()
})

onUnmounted(() => {
  if (resultsRefreshInterval.value) {
    clearInterval(resultsRefreshInterval.value)
  }
})
</script>

<template>
  <div class="scenarios-tab">
    <div class="tab-header">
      <h3>{{ t('groupScenarios.assignedScenarios') }}</h3>
      <div v-if="canEditGroup" class="tab-header-actions">
        <button @click="openAssignModal" class="btn btn-sm btn-primary">
          <i class="fas fa-plus"></i>
          {{ t('groupScenarios.assignScenario') }}
        </button>
        <button @click="showUploadModal = true" class="btn btn-sm btn-primary">
          <i class="fas fa-file-import"></i>
          {{ t('groupScenarios.importKillercoda') }}
        </button>
        <button @click="showJSONImportModal = true" class="btn btn-sm btn-primary">
          <i class="fas fa-file-code"></i>
          {{ t('groupScenarios.importJson') }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state" role="status">
      <i class="fas fa-spinner fa-spin"></i>
    </div>

    <div v-else-if="assignments.length === 0" class="empty-state">
      <i class="fas fa-clipboard-list"></i>
      <p>{{ t('groupScenarios.noAssignments') }}</p>
    </div>

    <div v-else class="assignments-list">
      <div
        v-for="assignment in assignments"
        :key="assignment.id"
        class="assignment-card"
      >
        <div class="assignment-info">
          <div class="assignment-title">
            {{ assignment.scenario?.title || assignment.scenario_id }}
            <span v-if="isOrgScenario(assignment)" class="source-badge org-badge">
              <i class="fas fa-building"></i> {{ t('groupScenarios.orgScenario') }}
            </span>
          </div>
          <div class="assignment-meta">
            <span
              v-if="assignment.scenario?.difficulty"
              :class="['difficulty-badge', getDifficultyClass(assignment.scenario.difficulty)]"
            >
              {{ translateDifficulty(assignment.scenario.difficulty) }}
            </span>
            <span class="start-date-text">
              <i class="fas fa-calendar-plus"></i>
              {{ assignment.start_date ? formatDate(assignment.start_date) : t('groupScenarios.noStartDate') }}
            </span>
            <span class="deadline-text">
              <i class="fas fa-calendar"></i>
              {{ assignment.deadline ? formatDate(assignment.deadline) : t('groupScenarios.noDeadline') }}
            </span>
            <span :class="['status-chip', assignment.is_active ? 'status-active' : 'status-inactive']">
              {{ assignment.is_active ? t('groupScenarios.active') : t('groupScenarios.inactive') }}
            </span>
          </div>
        </div>
        <div v-if="canEditGroup" class="assignment-actions">
          <button
            @click="handleExportJSON(assignment)"
            class="btn btn-sm btn-outline"
            :title="t('groupScenarios.exportJson')"
          >
            <i class="fas fa-file-download"></i>
          </button>
          <button
            @click="handleExportArchive(assignment)"
            class="btn btn-sm btn-outline"
            :title="t('groupScenarios.exportKillercoda')"
          >
            <i class="fas fa-file-archive"></i>
          </button>
          <button
            @click="handleViewResults(assignment)"
            class="btn btn-sm btn-info"
          >
            <i class="fas fa-chart-bar"></i>
            {{ t('groupScenarios.viewResults') }}
          </button>
          <button
            @click="handleBulkStart(assignment)"
            class="btn btn-sm btn-secondary"
            :disabled="bulkStartingId === assignment.id"
          >
            <i :class="bulkStartingId === assignment.id ? 'fas fa-spinner fa-spin' : 'fas fa-play'"></i>
            {{ bulkStartingId === assignment.id ? t('groupScenarios.starting') : t('groupScenarios.bulkStart') }}
          </button>
          <button
            @click="handleReset(assignment)"
            class="btn btn-sm btn-outline"
            :title="t('groupScenarios.resetSessions')"
          >
            <i class="fas fa-undo"></i>
            {{ t('groupScenarios.resetSessions') }}
          </button>
          <button
            @click="handleRemove(assignment)"
            class="btn btn-sm btn-danger"
          >
            <i class="fas fa-trash"></i>
            {{ t('groupScenarios.removeAssignment') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Student Results Panel -->
    <div v-if="showResultsForAssignment" class="results-panel">
      <div class="results-header">
        <button @click="closeResults" class="btn btn-sm btn-outline">
          <i class="fas fa-arrow-left"></i> {{ t('groupScenarios.back') }}
        </button>
        <h4>{{ t('groupScenarios.studentResults') }} — {{ showResultsForAssignment.scenario?.title }}</h4>
        <button @click="exportResultsCsv" class="btn btn-sm btn-outline" :disabled="scenarioResults.length === 0">
          <i class="fas fa-download"></i> {{ t('groupScenarios.exportCsv') }}
        </button>
      </div>

      <div v-if="loadingResults" class="loading-state" role="status">
        <i class="fas fa-spinner fa-spin"></i>
      </div>

      <div v-else-if="scenarioResults.length === 0" class="empty-state">
        <p>{{ t('groupScenarios.noResults') }}</p>
      </div>

      <div v-else class="results-table-container">
      <div v-if="selectedResults.size > 0" class="bulk-actions-bar">
        <span>{{ t('groupScenarios.selectedCount', { count: selectedResults.size }) }}</span>
        <button @click="exportSelectedResults" class="btn btn-sm btn-primary">
          <i class="fas fa-download"></i> {{ t('groupScenarios.exportSelected') }}
        </button>
        <button @click="selectedResults.clear()" class="btn btn-sm btn-outline">
          {{ t('groupScenarios.clearSelection') }}
        </button>
      </div>
      <table class="results-table" :aria-label="t('groupScenarios.studentResults')">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" v-model="allSelected" :title="t('groupScenarios.selectAll')" />
            </th>
            <th>{{ t('groupScenarios.student') }}</th>
            <th>{{ t('groupScenarios.status') }}</th>
            <th>{{ t('groupScenarios.grade') }}</th>
            <th>{{ t('groupScenarios.progress') }}</th>
            <th>{{ t('groupScenarios.hintsUsed') }}</th>
            <th>{{ t('groupScenarios.startedAt') }}</th>
            <th>{{ t('groupScenarios.completedAt') }}</th>
            <th>{{ t('groupScenarios.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in scenarioResults" :key="result.session_id">
            <td class="checkbox-col">
              <input type="checkbox" :checked="selectedResults.has(result.session_id)" @change="toggleSelection(result.session_id)" />
            </td>
            <td>
              <div class="student-name">{{ result.user_name || result.user_id }}</div>
              <div v-if="result.user_email" class="student-email">{{ result.user_email }}</div>
            </td>
            <td>
              <span :class="['status-chip', getStatusClass(result.status)]">
                {{ translateStatus(result.status) }}
              </span>
            </td>
            <td>
              {{ result.grade != null ? Math.round(result.grade) + '%' : t('groupScenarios.notGraded') }}
            </td>
            <td>
              <div class="progress-cell">
                <div class="progress-bar-bg">
                  <div
                    class="progress-bar-fill"
                    :style="{ width: (result.total_steps > 0 ? (result.completed_steps / result.total_steps) * 100 : 0) + '%' }"
                  ></div>
                </div>
                <span class="progress-text">{{ result.completed_steps }}/{{ result.total_steps }}</span>
              </div>
            </td>
            <td>
              <span v-if="result.total_hints_used > 0" class="hints-used-badge">
                {{ result.total_hints_used }}
              </span>
              <span v-else class="hints-none">0</span>
            </td>
            <td class="date-cell">{{ formatDate(result.started_at) }}</td>
            <td class="date-cell">{{ result.completed_at ? formatDate(result.completed_at) : '—' }}</td>
            <td>
              <div class="actions-cell">
                <button @click="handleViewDetail(result)" class="btn btn-sm btn-outline">
                  <i class="fas fa-eye"></i> {{ t('groupScenarios.viewDetails') }}
                </button>
                <button @click="exportSingleResult(result)" class="btn btn-sm btn-outline" :title="t('groupScenarios.exportStudent')">
                  <i class="fas fa-download"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- Session Detail Modal -->
    <BaseModal
      :visible="showDetailModal"
      :title="t('groupScenarios.sessionDetail')"
      size="large"
      :show-default-footer="true"
      :confirm-text="t('groupScenarios.close')"
      @confirm="closeDetailModal"
      @close="closeDetailModal"
    >
      <div v-if="loadingDetail" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <div v-else-if="sessionDetail">
        <div class="detail-header-info">
          <div><strong>{{ t('groupScenarios.student') }}:</strong> {{ sessionDetail.user_name || sessionDetail.user_id }}</div>
          <div><strong>{{ t('groupScenarios.status') }}:</strong>
            <span :class="['status-chip', getStatusClass(sessionDetail.status)]">{{ translateStatus(sessionDetail.status) }}</span>
          </div>
          <div v-if="sessionDetail.grade != null"><strong>{{ t('groupScenarios.grade') }}:</strong> {{ Math.round(sessionDetail.grade) }}%</div>
          <div><strong>{{ t('groupScenarios.startedAt') }}:</strong> {{ formatDate(sessionDetail.started_at) }}</div>
          <div v-if="sessionDetail.completed_at"><strong>{{ t('groupScenarios.completedAt') }}:</strong> {{ formatDate(sessionDetail.completed_at) }}</div>
        </div>

        <!-- Tabs -->
        <div
          class="detail-tabs"
          role="tablist"
          :aria-label="t('groupScenarios.tabsLabel')"
          @keydown="onDetailTabKeydown"
        >
          <button
            v-for="tab in detailTabs"
            :key="tab.key"
            :id="`detail-tab-${tab.key}`"
            class="detail-tab-btn"
            :class="{ active: detailActiveTab === tab.key }"
            role="tab"
            :aria-selected="detailActiveTab === tab.key"
            :aria-controls="`detail-panel-${tab.key}`"
            :tabindex="detailActiveTab === tab.key ? 0 : -1"
            type="button"
            @click="selectDetailTab(tab.key)"
          >
            {{ t(tab.labelKey) }}
          </button>
        </div>

        <!-- Steps panel -->
        <div
          v-if="detailActiveTab === 'steps'"
          id="detail-panel-steps"
          class="detail-tab-panel"
          role="tabpanel"
          aria-labelledby="detail-tab-steps"
        >
          <table class="steps-table">
            <thead>
              <tr>
                <th>{{ t('groupScenarios.stepOrder') }}</th>
                <th>{{ t('groupScenarios.stepTitle') }}</th>
                <th>{{ t('groupScenarios.stepType') }}</th>
                <th>{{ t('groupScenarios.stepStatus') }}</th>
                <th>{{ t('groupScenarios.stepResult') }}</th>
                <th>{{ t('groupScenarios.hintsUsed') }}</th>
                <th>{{ t('groupScenarios.timeSpent') }}</th>
                <th>{{ t('groupScenarios.completedAt') }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="step in sessionDetail.steps" :key="step.step_order">
                <tr>
                  <td>{{ step.step_order + 1 }}</td>
                  <td>{{ step.step_title }}</td>
                  <td>
                    <span :class="['step-type-chip', `step-type-${normalizedStepType(step.step_type)}`]">
                      <i :class="stepTypeIcon(step.step_type)"></i>
                      <span class="step-type-label">{{ stepTypeLabel(step.step_type) }}</span>
                    </span>
                  </td>
                  <td>
                    <span :class="['status-chip', getStatusClass(step.status)]">{{ translateStatus(step.status) }}</span>
                  </td>
                  <td>
                    <template v-if="normalizedStepType(step.step_type) === 'quiz'">
                      <span
                        v-if="step.quiz_score != null"
                        :class="['quiz-score-badge', quizScoreClass(step.quiz_score)]"
                      >
                        {{ formatQuizScorePct(step.quiz_score) }}
                      </span>
                      <span v-else class="hints-none">&mdash;</span>
                      <button
                        v-if="step.questions && step.questions.length > 0"
                        type="button"
                        class="quiz-toggle-btn"
                        :aria-expanded="isQuizStepExpanded(step.step_order)"
                        :aria-controls="`quiz-questions-${step.step_order}`"
                        @click="toggleQuizStep(step.step_order)"
                      >
                        <i :class="isQuizStepExpanded(step.step_order) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                        {{ isQuizStepExpanded(step.step_order)
                          ? t('groupScenarios.hideQuestions')
                          : t('groupScenarios.showQuestions') }}
                      </button>
                    </template>
                    <template v-else-if="normalizedStepType(step.step_type) === 'info'">
                      <i v-if="step.status === 'completed'" class="fas fa-check" :title="t('groupScenarios.completed')"></i>
                      <span v-else class="hints-none">&mdash;</span>
                    </template>
                    <template v-else>
                      {{ t('groupScenarios.attemptsCount', { n: step.verify_attempts }) }}
                    </template>
                  </td>
                  <td>
                    <span v-if="step.hints_revealed > 0" class="hints-used-badge">
                      {{ step.hints_revealed }}
                    </span>
                    <span v-else class="hints-none">&mdash;</span>
                  </td>
                  <td>{{ formatDuration(step.time_spent_seconds) }}</td>
                  <td class="date-cell">{{ step.completed_at ? formatDate(step.completed_at) : '—' }}</td>
                </tr>
                <tr
                  v-if="normalizedStepType(step.step_type) === 'quiz'
                    && step.questions && step.questions.length > 0
                    && isQuizStepExpanded(step.step_order)"
                  :key="`questions-${step.step_order}`"
                  class="quiz-questions-row"
                >
                  <td :colspan="8" :id="`quiz-questions-${step.step_order}`">
                    <div class="quiz-questions-block">
                      <div class="quiz-questions-summary">
                        {{ t('groupScenarios.questionsCorrect', {
                          correct: quizCorrectCount(step),
                          total: quizQuestionTotal(step)
                        }) }}
                      </div>
                      <ol class="quiz-questions-list">
                        <li
                          v-for="(q, qIdx) in step.questions"
                          :key="q.id || qIdx"
                          class="quiz-question-item"
                          :class="q.is_correct ? 'quiz-q-correct' : 'quiz-q-incorrect'"
                        >
                          <div class="quiz-question-header">
                            <span class="quiz-question-label">
                              {{ t('groupScenarios.question') }} {{ q.order != null ? q.order + 1 : qIdx + 1 }}
                            </span>
                            <span :class="['quiz-question-indicator', q.is_correct ? 'indicator-correct' : 'indicator-incorrect']">
                              <i :class="q.is_correct ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                              {{ q.is_correct
                                ? t('groupScenarios.correctIndicator')
                                : t('groupScenarios.incorrectIndicator') }}
                            </span>
                          </div>
                          <div class="quiz-question-text">{{ q.question_text }}</div>
                          <div
                            v-if="q.question_type === 'multiple_choice' && parseQuizOptions(q.options).length > 0"
                            class="quiz-question-options"
                          >
                            <div
                              v-for="(opt, optIdx) in parseQuizOptions(q.options)"
                              :key="optIdx"
                              class="quiz-question-option"
                              :class="optionRoleClass(optIdx, q)"
                            >
                              <span class="quiz-option-label">{{ opt }}</span>
                              <span
                                v-if="optionRole(optIdx, q)"
                                class="quiz-option-tag"
                                :class="'tag-' + optionRole(optIdx, q)"
                              >
                                <i :class="optionRoleIcon(optIdx, q)"></i>
                                {{ optionRoleText(optIdx, q) }}
                              </span>
                            </div>
                            <!-- If the student's submitted value cannot be resolved as an
                                 index OR a literal option (legacy data, edited options,
                                 etc.), surface the raw value so the trainer still sees
                                 what was actually submitted. -->
                            <div
                              v-if="isOrphanStudentAnswer(q, parseQuizOptions(q.options))"
                              class="quiz-answer-line"
                            >
                              <span class="quiz-answer-label">{{ t('groupScenarios.yourAnswer') }}:</span>
                              <span class="quiz-answer-value quiz-answer-wrong">
                                {{ displayAnswer(q.student_answer) }}
                              </span>
                            </div>
                          </div>
                          <div v-else class="quiz-question-answers">
                            <div class="quiz-answer-line">
                              <span class="quiz-answer-label">{{ t('groupScenarios.yourAnswer') }}:</span>
                              <span
                                class="quiz-answer-value"
                                :class="q.is_correct ? 'quiz-answer-correct' : 'quiz-answer-wrong'"
                              >
                                {{ displayAnswer(q.student_answer) || t('groupScenarios.noAnswer') }}
                              </span>
                            </div>
                            <div class="quiz-answer-line">
                              <span class="quiz-answer-label">{{ t('groupScenarios.correctAnswer') }}:</span>
                              <span class="quiz-answer-value quiz-answer-correct">{{ q.correct_answer }}</span>
                            </div>
                          </div>
                          <div v-if="q.explanation" class="quiz-question-explanation">
                            <i class="fas fa-info-circle"></i>
                            {{ q.explanation }}
                          </div>
                        </li>
                      </ol>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Commands panel -->
        <div
          v-if="detailActiveTab === 'commands'"
          id="detail-panel-commands"
          class="detail-tab-panel"
          role="tabpanel"
          aria-labelledby="detail-tab-commands"
        >
          <!-- Commands view mode segmented control -->
          <div class="commands-mode-bar" role="group" :aria-label="t('groupScenarios.tabCommands')">
            <button
              type="button"
              class="commands-mode-btn"
              :class="{ active: commandsViewMode === 'all' }"
              :aria-pressed="commandsViewMode === 'all'"
              @click="setCommandsViewMode('all')"
            >
              <i class="fas fa-list"></i>
              {{ t('groupScenarios.commandsModeAll') }}
            </button>
            <button
              type="button"
              class="commands-mode-btn"
              :class="{ active: commandsViewMode === 'per-step' }"
              :aria-pressed="commandsViewMode === 'per-step'"
              @click="setCommandsViewMode('per-step')"
            >
              <i class="fas fa-layer-group"></i>
              {{ t('groupScenarios.commandsModePerStep') }}
            </button>
          </div>

          <!-- All-commands view -->
          <template v-if="commandsViewMode === 'all'">
            <div v-if="commandsLoading" class="loading-state" role="status">
              <i class="fas fa-spinner fa-spin"></i>
              <span class="loading-label">{{ t('groupScenarios.commandsLoading') }}</span>
            </div>

            <div v-else-if="commandsNoTerminal" class="empty-state">
              <i class="fas fa-terminal"></i>
              <p>{{ t('groupScenarios.commandsNoTerminal') }}</p>
            </div>

            <div v-else-if="commandsError" class="empty-state empty-state-error">
              <i class="fas fa-exclamation-circle"></i>
              <p>{{ commandsError }}</p>
              <button class="btn btn-sm btn-primary" @click="fetchSessionCommands">
                <i class="fas fa-redo"></i> {{ t('groupScenarios.retry') }}
              </button>
            </div>

            <div v-else-if="commandsList.length === 0" class="empty-state">
              <i class="fas fa-terminal"></i>
              <p>{{ t('groupScenarios.commandsEmpty') }}</p>
            </div>

            <template v-else>
              <div class="commands-toolbar">
                <button
                  class="btn btn-sm btn-outline"
                  @click="exportCommandsCsv"
                  :disabled="commandsTotal === 0"
                >
                  <i class="fas fa-file-csv"></i>
                  {{ t('groupScenarios.exportCommandsCsv') }}
                </button>
              </div>
              <table class="commands-table" :aria-label="t('groupScenarios.tabCommands')">
                <thead>
                  <tr>
                    <th class="commands-col-seq">{{ t('groupScenarios.commandSequence') }}</th>
                    <th class="commands-col-cmd">{{ t('groupScenarios.command') }}</th>
                    <th class="commands-col-time">{{ t('groupScenarios.commandExecutedAt') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cmd in commandsList" :key="`${cmd.session_uuid}-${cmd.sequence_num}`">
                    <td class="commands-col-seq">{{ cmd.sequence_num }}</td>
                    <td class="commands-col-cmd">
                      <code class="commands-cmd-text">{{ cmd.command_text }}</code>
                    </td>
                    <td class="commands-col-time">{{ formatExecutedAt(cmd.executed_at) }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="commands-pagination">
                <span class="commands-page-info">
                  {{ t('groupScenarios.pageInfo', {
                    start: commandsPageStart,
                    end: commandsPageEnd,
                    total: commandsTotal
                  }) }}
                </span>
                <div class="commands-page-buttons">
                  <button
                    class="btn btn-sm btn-outline"
                    :disabled="!commandsHasPrev || commandsLoading"
                    @click="commandsPrevPage"
                  >
                    <i class="fas fa-chevron-left"></i>
                    {{ t('groupScenarios.prevPage') }}
                  </button>
                  <button
                    class="btn btn-sm btn-outline"
                    :disabled="!commandsHasNext || commandsLoading"
                    @click="commandsNextPage"
                  >
                    {{ t('groupScenarios.nextPage') }}
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </template>
          </template>

          <!-- Per-step view -->
          <template v-else>
            <div v-if="allCommandsLoading" class="loading-state" role="status">
              <i class="fas fa-spinner fa-spin"></i>
              <span class="loading-label">{{ t('groupScenarios.commandsLoading') }}</span>
            </div>

            <div v-else-if="commandsNoTerminal" class="empty-state">
              <i class="fas fa-terminal"></i>
              <p>{{ t('groupScenarios.commandsNoTerminal') }}</p>
            </div>

            <div v-else-if="allCommandsError" class="empty-state empty-state-error">
              <i class="fas fa-exclamation-circle"></i>
              <p>{{ allCommandsError }}</p>
              <button class="btn btn-sm btn-primary" @click="fetchAllSessionCommands">
                <i class="fas fa-redo"></i> {{ t('groupScenarios.retry') }}
              </button>
            </div>

            <template v-else>
              <div class="commands-toolbar">
                <button
                  class="btn btn-sm btn-outline"
                  @click="exportCommandsCsv"
                  :disabled="allCommandsCache.length === 0"
                >
                  <i class="fas fa-file-csv"></i>
                  {{ t('groupScenarios.exportCommandsCsv') }}
                </button>
              </div>
              <div class="per-step-list">
                <div
                  v-for="step in sessionDetail.steps"
                  :key="`per-step-${step.step_order}`"
                  class="per-step-item"
                >
                  <button
                    type="button"
                    class="per-step-header"
                    :aria-expanded="isStepRowExpanded(step.step_order)"
                    :aria-controls="`per-step-body-${step.step_order}`"
                    @click="toggleStepRow(step.step_order)"
                  >
                    <i :class="isStepRowExpanded(step.step_order) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                    <span class="per-step-order">{{ step.step_order + 1 }}.</span>
                    <span class="per-step-title">{{ step.step_title }}</span>
                    <span :class="['step-type-chip', `step-type-${normalizedStepType(step.step_type)}`]">
                      <i :class="stepTypeIcon(step.step_type)"></i>
                      <span class="step-type-label">{{ stepTypeLabel(step.step_type) }}</span>
                    </span>
                    <span class="per-step-duration">
                      <i class="fas fa-clock"></i>
                      {{ formatDuration(step.time_spent_seconds) }}
                    </span>
                    <span class="per-step-count">
                      {{ t('groupScenarios.commandsCount', {
                        count: commandsForStep(step).length
                      }) }}
                    </span>
                  </button>
                  <div
                    v-if="isStepRowExpanded(step.step_order)"
                    :id="`per-step-body-${step.step_order}`"
                    class="per-step-body"
                  >
                    <div v-if="commandsForStep(step).length === 0" class="per-step-empty">
                      <i class="fas fa-terminal"></i>
                      {{ t('groupScenarios.commandsNoneDuringStep') }}
                    </div>
                    <table v-else class="commands-table" :aria-label="t('groupScenarios.commandsDuringStep')">
                      <thead>
                        <tr>
                          <th class="commands-col-seq">{{ t('groupScenarios.commandSequence') }}</th>
                          <th class="commands-col-cmd">{{ t('groupScenarios.command') }}</th>
                          <th class="commands-col-time">{{ t('groupScenarios.commandExecutedAt') }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="cmd in commandsForStep(step)"
                          :key="`${cmd.session_uuid}-${cmd.sequence_num}`"
                        >
                          <td class="commands-col-seq">{{ cmd.sequence_num }}</td>
                          <td class="commands-col-cmd">
                            <code class="commands-cmd-text">{{ cmd.command_text }}</code>
                          </td>
                          <td class="commands-col-time">{{ formatExecutedAt(cmd.executed_at) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>
    </BaseModal>

    <!-- Assign Scenario Modal -->
    <BaseModal
      :visible="showAssignModal"
      :title="t('groupScenarios.assignScenario')"
      size="medium"
      :show-default-footer="true"
      :confirm-text="t('groupScenarios.confirm')"
      :cancel-text="t('groupScenarios.cancel')"
      @confirm="handleAssign"
      @close="showAssignModal = false"
    >
      <div class="form-group">
        <label>{{ t('groupScenarios.selectScenario') }}</label>
        <input
          v-model="scenarioSearch"
          type="text"
          class="form-control"
          :placeholder="t('groupScenarios.searchScenarios')"
        />
        <select v-model="selectedScenarioId" class="form-control select-scenario">
          <option value="" disabled>{{ t('groupScenarios.selectScenario') }}</option>
          <optgroup v-if="orgScenarios.length > 0" :label="t('groupScenarios.orgLibrary')">
            <option v-for="s in orgScenarios" :key="s.id" :value="s.id">
              {{ s.title }} ({{ translateDifficulty(s.difficulty) }})
            </option>
          </optgroup>
          <optgroup v-if="groupOnlyScenarios.length > 0" :label="t('groupScenarios.groupScenarios')">
            <option v-for="s in groupOnlyScenarios" :key="s.id" :value="s.id">
              {{ s.title }} ({{ translateDifficulty(s.difficulty) }})
            </option>
          </optgroup>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('groupScenarios.startDate') }}</label>
        <input
          v-model="assignStartDate"
          type="date"
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label>{{ t('groupScenarios.deadline') }}</label>
        <input
          v-model="assignDeadline"
          type="date"
          class="form-control"
        />
      </div>
    </BaseModal>

    <!-- Bulk Start Distribution Modal -->
    <BaseModal
      :visible="showBulkStartModal"
      :title="t('groupScenarios.selectDistribution')"
      size="medium"
      :show-default-footer="true"
      :confirm-text="t('groupScenarios.bulkStart')"
      :cancel-text="t('groupScenarios.cancel')"
      @confirm="confirmBulkStart"
      @close="showBulkStartModal = false"
    >
      <p class="instance-type-description">
        {{ t('groupScenarios.distributionDescription') }}
      </p>
      <!-- Backend selector (only if org has backends) -->
      <BackendSelector
        v-if="backendsStore.backends.length > 0"
        :model-value="backendsStore.selectedBackendId || ''"
        :backends="backendsStore.backends"
        :disabled="backendsStore.isLoading"
        @update:model-value="backendsStore.selectBackend($event)"
      />
      <div v-if="loadingDistributions" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <div v-else class="form-group">
        <label>{{ t('groupScenarios.distribution') }}</label>
        <select v-model="selectedDistribution" class="form-control">
          <option value="" disabled>{{ t('groupScenarios.selectDistribution') }}</option>
          <option
            v-for="dist in distributions"
            :key="dist.prefix"
            :value="dist.prefix"
          >
            {{ dist.name }} — {{ dist.description }}
          </option>
        </select>
      </div>
    </BaseModal>

    <!-- Bulk Start Result Modal -->
    <BaseModal
      :visible="showResultModal"
      :title="t('groupScenarios.bulkStartTitle')"
      size="medium"
      :show-default-footer="true"
      :confirm-text="t('groupScenarios.close')"
      @confirm="showResultModal = false"
      @close="showResultModal = false"
    >
      <p class="result-message">
        <i class="fas fa-check-circle result-icon"></i>
        {{ resultMessage }}
      </p>
      <div v-if="resultNoKeyUsers.length > 0" class="no-key-warning">
        <p class="no-key-title">
          <i class="fas fa-exclamation-triangle"></i>
          {{ t('groupScenarios.noKeyWarning') }}
        </p>
        <ul class="no-key-list">
          <li v-for="(user, idx) in resultNoKeyUsers" :key="idx">
            {{ user.user_name || user.user_email || user.user_id }}
            <span v-if="user.user_email && user.user_name" class="no-key-email">
              ({{ user.user_email }})
            </span>
          </li>
        </ul>
      </div>
      <div v-if="resultErrors.length > 0" class="no-key-warning">
        <p class="no-key-title">
          <i class="fas fa-exclamation-triangle"></i>
          {{ t('groupScenarios.terminalErrors') }}
        </p>
        <ul class="no-key-list">
          <li v-for="(err, idx) in resultErrors" :key="idx">
            {{ err.user_id }}: {{ err.error }}
          </li>
        </ul>
      </div>
    </BaseModal>

    <!-- Confirm Remove Modal -->
    <BaseModal
      :visible="showConfirmRemoveModal"
      :title="t('groupScenarios.confirmRemoveTitle')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('groupScenarios.remove')"
      :cancel-text="t('groupScenarios.cancel')"
      @confirm="confirmRemove"
      @close="showConfirmRemoveModal = false"
    >
      <p>{{ t('groupScenarios.confirmRemove') }}</p>
    </BaseModal>

    <!-- Confirm Reset Modal -->
    <BaseModal
      :visible="showResetModal"
      :title="t('groupScenarios.resetConfirmTitle')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('groupScenarios.resetSessions')"
      :cancel-text="t('groupScenarios.cancel')"
      @confirm="confirmReset"
      @close="showResetModal = false"
    >
      <p>{{ t('groupScenarios.resetConfirm') }}</p>
    </BaseModal>

    <!-- KillerCoda Upload Modal -->
    <ScenarioUploadModal
      :visible="showUploadModal"
      :group-id="groupId"
      @close="showUploadModal = false"
      @uploaded="handleImportUploaded"
    />

    <!-- JSON Import Modal -->
    <ScenarioJSONImportModal
      :visible="showJSONImportModal"
      :group-id="groupId"
      @close="showJSONImportModal = false"
      @imported="handleJSONImported"
    />
  </div>
</template>

<style scoped>
.scenarios-tab {
  padding: 0;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.tab-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.tab-header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-primary);
  font-size: var(--font-size-xl);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-md);
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.assignment-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  transition: var(--transition-base);
}

.assignment-card:hover {
  border-color: var(--color-border-medium);
}

.assignment-info {
  flex: 1;
}

.assignment-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-xs);
}

.assignment-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.difficulty-badge {
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.difficulty-beginner {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.difficulty-intermediate {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.difficulty-advanced {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.org-badge {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.start-date-text,
.deadline-text {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-chip {
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.status-active {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-inactive {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.hints-used-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5em;
  padding: 0.15em 0.4em;
  border-radius: var(--border-radius-sm);
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.hints-none {
  color: var(--color-text-muted);
}

.step-type-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.step-type-chip i {
  font-size: var(--font-size-xs);
}

.step-type-terminal {
  background: var(--scenario-node-terminal-bg);
  color: var(--scenario-node-terminal);
}

.step-type-flag {
  background: var(--scenario-node-flag-bg);
  color: var(--scenario-node-flag);
}

.step-type-info {
  background: var(--scenario-node-info-bg);
  color: var(--scenario-node-info);
}

.step-type-quiz {
  background: var(--scenario-node-quiz-bg);
  color: var(--scenario-node-quiz);
}

.quiz-score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.quiz-score-success {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.quiz-score-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.quiz-score-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.assignment-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Form */
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.select-scenario {
  margin-top: var(--spacing-sm);
}

.result-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
  margin: 0;
}

.result-icon {
  color: var(--color-success);
  font-size: var(--font-size-lg);
}

.no-key-warning {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--border-radius-md);
}

.no-key-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-warning-text);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--spacing-xs) 0;
}

.no-key-list {
  margin: 0;
  padding-left: var(--spacing-lg);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.no-key-list li {
  margin-bottom: 2px;
}

.no-key-email {
  color: var(--color-text-muted);
}

.instance-type-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.checkbox-col {
  width: 2rem;
  text-align: center;
}

.checkbox-col input[type="checkbox"] {
  cursor: pointer;
  accent-color: var(--color-primary);
}

.actions-cell {
  display: flex;
  align-items: stretch;
  gap: var(--spacing-xs);
}

.bulk-actions-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary-bg);
  border: var(--border-width-thin) solid var(--color-primary-border);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
}

.btn-outline:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-dark);
}

.results-table-container {
  overflow-x: auto;
}

/* Results panel */
.results-panel {
  margin-top: var(--spacing-lg);
}

.results-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.results-header h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.results-table,
.steps-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.results-table th,
.results-table td,
.steps-table th,
.steps-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

.results-table th,
.steps-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-secondary);
}

.results-table tbody tr:hover,
.steps-table tbody tr:hover {
  background-color: var(--color-bg-secondary);
}

.student-name {
  font-weight: var(--font-weight-medium);
}

.student-email {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.date-cell {
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.progress-bar-bg {
  flex: 1;
  height: 8px;
  background-color: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  min-width: 60px;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.status-completed {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-locked {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}

.status-abandoned {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.btn-info {
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
}

.btn-info:hover {
  opacity: 0.9;
}

.detail-header-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md) var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .assignment-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .assignment-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .assignment-meta {
    flex-wrap: wrap;
  }
}

/* Detail modal tabs */
.detail-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border-light);
  margin: var(--spacing-md) 0;
}

.detail-tab-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-family: inherit;
}

.detail-tab-btn:hover {
  color: var(--color-text-primary);
  background-color: var(--color-surface-hover);
}

.detail-tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.detail-tab-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.detail-tab-panel {
  padding-top: var(--spacing-sm);
}

.loading-label {
  margin-left: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.empty-state-error {
  color: var(--color-danger);
}

.empty-state-error i {
  opacity: 1;
}

/* Commands tab */
.commands-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-sm);
}

.commands-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.commands-table thead th {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  background-color: var(--color-bg-secondary);
  border-bottom: 2px solid var(--color-border-light);
  white-space: nowrap;
}

.commands-table tbody tr {
  transition: background-color var(--transition-fast);
}

.commands-table tbody tr:hover {
  background-color: var(--color-bg-secondary);
}

.commands-table tbody td {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: top;
}

.commands-col-seq {
  width: 60px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
}

.commands-col-cmd {
  min-width: 200px;
}

.commands-cmd-text {
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  background-color: var(--color-bg-tertiary);
  padding: 2px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  word-break: break-all;
}

.commands-col-time {
  white-space: nowrap;
  width: 200px;
  color: var(--color-text-secondary);
}

.commands-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-md);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.commands-page-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.commands-page-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

/* Quiz questions inline detail */
.quiz-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-left: var(--spacing-sm);
  padding: 2px 8px;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-family: inherit;
  transition: var(--transition-fast);
}

.quiz-toggle-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.quiz-toggle-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.quiz-questions-row td {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md) !important;
}

.quiz-questions-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quiz-questions-summary {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.quiz-questions-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quiz-question-item {
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-primary);
}

.quiz-q-correct {
  border-left: 3px solid var(--color-success);
}

.quiz-q-incorrect {
  border-left: 3px solid var(--color-danger);
}

.quiz-question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.quiz-question-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quiz-question-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
}

.indicator-correct {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.indicator-incorrect {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.quiz-question-text {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.quiz-question-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.quiz-question-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border-light);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.quiz-question-option {
  justify-content: space-between;
}

/* Student picked the right answer */
.option-student-correct {
  background: var(--color-success-bg);
  border-color: var(--color-success-text);
  color: var(--color-success-text);
}

/* Right answer (student picked something else) */
.option-correct {
  background: var(--color-success-bg);
  border-color: var(--color-success-text);
  color: var(--color-success-text);
}

/* Student picked the wrong answer */
.option-student-wrong {
  background: var(--color-danger-bg);
  border-color: var(--color-danger-text);
  color: var(--color-danger-text);
}

.quiz-option-label {
  flex: 1;
}

.quiz-option-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.quiz-option-tag.tag-student-correct {
  background: var(--color-success-text);
  color: var(--color-bg-primary);
}

.quiz-option-tag.tag-correct {
  background: var(--color-success-text);
  color: var(--color-bg-primary);
}

.quiz-option-tag.tag-student-wrong {
  background: var(--color-danger-text);
  color: var(--color-bg-primary);
}

.quiz-answer-wrong {
  color: var(--color-danger-text);
  font-weight: var(--font-weight-semibold);
}

.quiz-question-answers {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.quiz-answer-line {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.quiz-answer-label {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  min-width: 8em;
}

.quiz-answer-value {
  color: var(--color-text-primary);
  font-family: var(--font-family-monospace);
  word-break: break-word;
}

.quiz-answer-correct {
  color: var(--color-success-text);
}

.quiz-question-explanation {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-info-bg);
  color: var(--color-info);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  display: flex;
  gap: var(--spacing-xs);
  align-items: flex-start;
}

/* Commands view-mode toggle (segmented control) */
.commands-mode-bar {
  display: inline-flex;
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  margin-bottom: var(--spacing-md);
  background: var(--color-bg-primary);
}

.commands-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-family: inherit;
  transition: var(--transition-fast);
}

.commands-mode-btn + .commands-mode-btn {
  border-left: 1px solid var(--color-border-medium);
}

.commands-mode-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.commands-mode-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
}

.commands-mode-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Per-step accordion */
.per-step-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.per-step-item {
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  overflow: hidden;
}

.per-step-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  text-align: left;
  transition: var(--transition-fast);
}

.per-step-header:hover {
  background: var(--color-surface-hover, var(--color-bg-tertiary));
}

.per-step-header:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.per-step-order {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  min-width: 2em;
}

.per-step-title {
  flex: 1;
  font-weight: var(--font-weight-medium);
}

.per-step-duration {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.per-step-count {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.per-step-body {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

.per-step-empty {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: var(--spacing-sm) 0;
}
</style>
