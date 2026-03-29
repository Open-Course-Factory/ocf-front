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
      selectInstanceType: 'Select Instance Type',
      instanceType: 'Instance Type',
      instanceTypeDescription: 'Choose the terminal environment type for all learners in this group.',
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
      attempts: 'Attempts',
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
      selectInstanceType: 'Sélectionner le type d\'instance',
      instanceType: 'Type d\'instance',
      instanceTypeDescription: 'Choisissez le type d\'environnement terminal pour tous les apprenants de ce groupe.',
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
      attempts: 'Tentatives',
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

interface InstanceType {
  prefix: string
  name: string
  description: string
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

interface SessionStepDetail {
  step_order: number
  step_title: string
  status: string
  verify_attempts: number
  hints_revealed: number
  completed_at?: string
  time_spent_seconds: number
}

interface SessionDetailResponse {
  session_id: string
  user_id: string
  user_name?: string
  user_email?: string
  scenario_id: string
  scenario_title: string
  status: string
  grade?: number
  started_at: string
  completed_at?: string
  steps: SessionStepDetail[]
}

// State
const assignments = ref<ScenarioAssignment[]>([])
const availableScenarios = ref<Scenario[]>([])
const isLoading = ref(false)
const showAssignModal = ref(false)
const selectedScenarioId = ref('')
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
const instanceTypes = ref<InstanceType[]>([])
const selectedInstanceType = ref('')
const loadingInstanceTypes = ref(false)

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
      { deadline: assignDeadline.value || undefined }
    )
    showAssignModal.value = false
    selectedScenarioId.value = ''
    assignDeadline.value = ''
    scenarioSearch.value = ''
    await loadAssignments()
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.assignError'))
  }
}

// Load instance types for bulk start modal
async function loadInstanceTypes() {
  loadingInstanceTypes.value = true
  try {
    const backendId = backendsStore.selectedBackendId || undefined
    instanceTypes.value = await teacherService.getInstanceTypes(backendId)
    // Auto-select first if only one
    if (instanceTypes.value.length === 1) {
      selectedInstanceType.value = instanceTypes.value[0].prefix
    }
  } catch (err: any) {
    console.error('Failed to load instance types:', err)
  } finally {
    loadingInstanceTypes.value = false
  }
}

// Open bulk start modal with instance type selection
async function handleBulkStart(assignment: ScenarioAssignment) {
  assignmentToBulkStart.value = assignment
  selectedInstanceType.value = ''
  if (props.organizationId) {
    await backendsStore.fetchBackends(props.organizationId)
  } else {
    await backendsStore.fetchBackends()
  }
  await loadInstanceTypes()
  showBulkStartModal.value = true
}

// Confirm bulk start with selected instance type
async function confirmBulkStart() {
  if (!assignmentToBulkStart.value || !selectedInstanceType.value) return
  const assignment = assignmentToBulkStart.value
  showBulkStartModal.value = false
  bulkStartingId.value = assignment.id
  try {
    const data = await teacherService.bulkStartScenario(
      props.groupId,
      assignment.scenario_id,
      {
        instance_type: selectedInstanceType.value,
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
  return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
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
    t('groupScenarios.stepStatus'),
    t('groupScenarios.attempts'),
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
        step.status,
        step.verify_attempts,
        step.hints_revealed,
        formatDuration(step.time_spent_seconds),
        step.completed_at ? formatDate(step.completed_at) : ''
      ])
    }
  }
  return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
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

// When backend selection changes, reload instance types
watch(() => backendsStore.selectedBackendId, () => {
  selectedInstanceType.value = ''
  loadInstanceTypes()
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
      @confirm="showDetailModal = false"
      @close="showDetailModal = false"
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

        <table class="steps-table">
          <thead>
            <tr>
              <th>{{ t('groupScenarios.stepOrder') }}</th>
              <th>{{ t('groupScenarios.stepTitle') }}</th>
              <th>{{ t('groupScenarios.stepStatus') }}</th>
              <th>{{ t('groupScenarios.attempts') }}</th>
              <th>{{ t('groupScenarios.hintsUsed') }}</th>
              <th>{{ t('groupScenarios.timeSpent') }}</th>
              <th>{{ t('groupScenarios.completedAt') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="step in sessionDetail.steps" :key="step.step_order">
              <td>{{ step.step_order + 1 }}</td>
              <td>{{ step.step_title }}</td>
              <td>
                <span :class="['status-chip', getStatusClass(step.status)]">{{ translateStatus(step.status) }}</span>
              </td>
              <td>{{ step.verify_attempts }}</td>
              <td>
                <span v-if="step.hints_revealed > 0" class="hints-used-badge">
                  {{ step.hints_revealed }}
                </span>
                <span v-else class="hints-none">&mdash;</span>
              </td>
              <td>{{ formatDuration(step.time_spent_seconds) }}</td>
              <td class="date-cell">{{ step.completed_at ? formatDate(step.completed_at) : '—' }}</td>
            </tr>
          </tbody>
        </table>
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
        <label>{{ t('groupScenarios.deadline') }}</label>
        <input
          v-model="assignDeadline"
          type="date"
          class="form-control"
        />
      </div>
    </BaseModal>

    <!-- Bulk Start Instance Type Modal -->
    <BaseModal
      :visible="showBulkStartModal"
      :title="t('groupScenarios.selectInstanceType')"
      size="medium"
      :show-default-footer="true"
      :confirm-text="t('groupScenarios.bulkStart')"
      :cancel-text="t('groupScenarios.cancel')"
      @confirm="confirmBulkStart"
      @close="showBulkStartModal = false"
    >
      <p class="instance-type-description">
        {{ t('groupScenarios.instanceTypeDescription') }}
      </p>
      <!-- Backend selector (only if org has backends) -->
      <BackendSelector
        v-if="backendsStore.backends.length > 0"
        :model-value="backendsStore.selectedBackendId || ''"
        :backends="backendsStore.backends"
        :disabled="backendsStore.isLoading"
        @update:model-value="backendsStore.selectBackend($event)"
      />
      <div v-if="loadingInstanceTypes" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <div v-else class="form-group">
        <label>{{ t('groupScenarios.instanceType') }}</label>
        <select v-model="selectedInstanceType" class="form-control">
          <option value="" disabled>{{ t('groupScenarios.selectInstanceType') }}</option>
          <option
            v-for="instance in instanceTypes"
            :key="instance.prefix"
            :value="instance.prefix"
          >
            {{ instance.name }} — {{ instance.description }}
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
</style>
