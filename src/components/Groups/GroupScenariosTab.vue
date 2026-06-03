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
import { ref, onMounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { teacherService } from '../../services/domain/scenario'
import { downloadCsv, downloadJSON, downloadBlob } from '../../utils/download'
import { buildSessionDetailCsv } from '../../utils/scenarioResultsCsv'
import { useTerminalBackendsStore } from '../../stores/terminalBackends'
import ScenarioUploadModal from '../Modals/ScenarioUploadModal.vue'
import ScenarioJSONImportModal from '../Modals/ScenarioJSONImportModal.vue'
import BaseModal from '../Modals/BaseModal.vue'
import RemoveAssignmentConfirmModal from './modals/RemoveAssignmentConfirmModal.vue'
import ResetAssignmentModal from './modals/ResetAssignmentModal.vue'
import ScenarioAssignmentResultModal from './modals/ScenarioAssignmentResultModal.vue'
import AssignScenarioModal from './modals/AssignScenarioModal.vue'
import BulkStartScenarioModal from './modals/BulkStartScenarioModal.vue'
import AssignmentResultsView from './AssignmentResultsView.vue'
import SessionDetailModal from './SessionDetailModal.vue'
import AssignmentCard from './AssignmentCard.vue'
import { useDistributionPicker } from '../../composables/useDistributionPicker'
import { useAssignmentResults } from '../../composables/useAssignmentResults'
import type { ScenarioAssignment, Scenario, NoKeyUser, AssignmentResultError, ScenarioResultItem, AssignmentProgress } from '../../types/groupScenarios'

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
      noAssignments: 'No scenarios assigned to this group yet.',
      bulkStartResult: 'Started {started} sessions, skipped {skipped}',
      loadError: 'Failed to load scenario assignments',
      assignError: 'Failed to assign scenario',
      removeError: 'Failed to remove assignment',
      bulkStartError: 'Failed to start sessions',
      resetSuccess: '{count} sessions reset',
      resetError: 'Failed to reset sessions',
      completedAt: 'Completed',
      stepOrder: 'Step',
      stepTitle: 'Title',
      stepStatus: 'Status',
      attempts: 'Attempts',
      csvStepType: 'Step type',
      csvQuizScore: 'Quiz score',
      csvQuestionOrder: 'Question',
      csvQuestionText: 'Question text',
      csvQuestionType: 'Question type',
      csvStudentAnswer: 'Student answer',
      csvCorrectAnswer: 'Correct answer',
      csvIsCorrect: 'Correct?',
      csvYes: 'Yes',
      csvNo: 'No',
      hintsUsed: 'Hints',
      timeSpent: 'Time',
      importKillercoda: 'Import KillerCoda',
      importJson: 'Import JSON',
      exportError: 'Failed to export scenario',
      export: {
        name: 'Name',
        email: 'Email',
        status: 'Status',
        grade: 'Grade'
      }
    }
  },
  fr: {
    groupScenarios: {
      assignedScenarios: 'Scénarios assignés',
      assignScenario: 'Assigner un scénario',
      noAssignments: 'Aucun scénario assigné à ce groupe.',
      bulkStartResult: '{started} sessions démarrées, {skipped} ignorées',
      loadError: 'Échec du chargement des assignations',
      assignError: 'Échec de l\'assignation du scénario',
      removeError: 'Échec de la suppression de l\'assignation',
      bulkStartError: 'Échec du démarrage des sessions',
      resetSuccess: '{count} sessions réinitialisées',
      resetError: 'Échec de la réinitialisation',
      completedAt: 'Fin',
      stepOrder: 'Étape',
      stepTitle: 'Titre',
      stepStatus: 'Statut',
      attempts: 'Tentatives',
      csvStepType: 'Type d\'étape',
      csvQuizScore: 'Score quiz',
      csvQuestionOrder: 'Question',
      csvQuestionText: 'Énoncé',
      csvQuestionType: 'Type de question',
      csvStudentAnswer: 'Réponse de l\'apprenant',
      csvCorrectAnswer: 'Bonne réponse',
      csvIsCorrect: 'Correcte ?',
      csvYes: 'Oui',
      csvNo: 'Non',
      hintsUsed: 'Indices',
      timeSpent: 'Temps',
      importKillercoda: 'Importer KillerCoda',
      importJson: 'Importer JSON',
      exportError: 'Échec de l\'export du scénario',
      export: {
        name: 'Nom',
        email: 'Email',
        status: 'Statut',
        grade: 'Note'
      }
    }
  }
})

const { showError: notifyError } = useNotification()
const backendsStore = useTerminalBackendsStore()

// Distribution picker (list + selection + loader; reloads on backend change)
const { distributions, selectedDistribution, loadingDistributions, loadDistributions } = useDistributionPicker()

// ScenarioResultItem, SessionStepDetail and SessionDetailResponse are imported

// State
const assignments = ref<ScenarioAssignment[]>([])
const availableScenarios = ref<Scenario[]>([])
const isLoading = ref(false)

// Per-assignment progress (keyed by scenario_id). Nice-to-have — silent-fail.
const progressByScenario = ref<Map<string, AssignmentProgress>>(new Map())
const showAssignModal = ref(false)
const bulkStartingId = ref<string | null>(null)
const showResultModal = ref(false)
const resultMessage = ref('')
const resultNoKeyUsers = ref<NoKeyUser[]>([])
const resultErrors = ref<AssignmentResultError[]>([])
const showConfirmRemoveModal = ref(false)
const assignmentToRemove = ref<ScenarioAssignment | null>(null)
const showResetModal = ref(false)
const assignmentToReset = ref<ScenarioAssignment | null>(null)
const showBulkStartModal = ref(false)
const assignmentToBulkStart = ref<ScenarioAssignment | null>(null)

// Import modal state
const showUploadModal = ref(false)
const showJSONImportModal = ref(false)

// Results view state + 30s polling + multi-select (composable-owned)
const {
  showResultsForAssignment,
  scenarioResults,
  loadingResults,
  selectedResults,
  handleViewResults,
  closeResults,
  toggleResult,
  toggleSelectAll
} = useAssignmentResults(() => props.groupId, () => notifyError(t('groupScenarios.loadError')))

// Session detail modal state (the modal owns its own data engine + commands logic)
const showDetailModal = ref(false)
const selectedDetailResult = ref<ScenarioResultItem | null>(null)

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

// Load per-assignment progress in one call. Silent-fail: progress is a
// nice-to-have — on error leave the map empty so cards show "no attempts".
async function loadProgress() {
  try {
    const rows = await teacherService.getAssignmentsProgress(props.groupId)
    const map = new Map<string, AssignmentProgress>()
    for (const row of rows) {
      map.set(row.scenario_id, row)
    }
    progressByScenario.value = map
  } catch {
    // Ignore — leave whatever we had (cards fall back to "no attempts").
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
async function handleAssign(payload: { scenarioId: string; startDate: string; deadline: string }) {
  if (!payload.scenarioId) return
  try {
    await teacherService.assignScenarioToGroup(
      props.groupId,
      payload.scenarioId,
      {
        start_date: payload.startDate || undefined,
        deadline: payload.deadline || undefined
      }
    )
    showAssignModal.value = false
    await loadAssignments()
    loadProgress()
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.assignError'))
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
    loadProgress()
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
    loadProgress()
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
    loadProgress()
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.resetError'))
  }
}

// Open the session-detail modal; the modal owns its own data + commands logic.
function handleViewDetail(result: ScenarioResultItem) {
  selectedDetailResult.value = result
  showDetailModal.value = true
}

// Resolve the t()-backed labels for the session-detail CSV header + yes/no cells.
function detailCsvLabels() {
  return {
    name: t('groupScenarios.export.name'),
    email: t('groupScenarios.export.email'),
    status: t('groupScenarios.export.status'),
    grade: t('groupScenarios.export.grade'),
    stepOrder: t('groupScenarios.stepOrder'),
    stepTitle: t('groupScenarios.stepTitle'),
    stepType: t('groupScenarios.csvStepType'),
    stepStatus: t('groupScenarios.stepStatus'),
    attempts: t('groupScenarios.attempts'),
    quizScore: t('groupScenarios.csvQuizScore'),
    hintsUsed: t('groupScenarios.hintsUsed'),
    timeSpent: t('groupScenarios.timeSpent'),
    completedAt: t('groupScenarios.completedAt'),
    questionOrder: t('groupScenarios.csvQuestionOrder'),
    questionText: t('groupScenarios.csvQuestionText'),
    questionType: t('groupScenarios.csvQuestionType'),
    studentAnswer: t('groupScenarios.csvStudentAnswer'),
    correctAnswer: t('groupScenarios.csvCorrectAnswer'),
    isCorrect: t('groupScenarios.csvIsCorrect'),
    yes: t('groupScenarios.csvYes'),
    no: t('groupScenarios.csvNo')
  }
}

async function exportResultsCsv() {
  if (scenarioResults.value.length === 0) return
  try {
    const ids = scenarioResults.value.map(r => r.session_id)
    const detailList = await teacherService.getSessionDetailsBulk(props.groupId, ids)
    // Zip by index — backend preserves input order per !227 contract.
    const details = scenarioResults.value.map((result, i) => ({
      result,
      detail: detailList[i]
    }))
    const csv = buildSessionDetailCsv(details, detailCsvLabels())
    const scenarioTitle = showResultsForAssignment.value?.scenario?.title || 'export'
    downloadCsv(csv, `scenario-results-${scenarioTitle}.csv`)
  } catch (err: any) {
    notifyError(err.response?.data?.error || t('groupScenarios.exportError'))
  }
}

async function exportSingleResult(result: ScenarioResultItem) {
  try {
    const detail = await teacherService.getSessionDetail(props.groupId, result.session_id)
    const csv = buildSessionDetailCsv([{ result, detail }], detailCsvLabels())
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
    const ids = selected.map(r => r.session_id)
    const detailList = await teacherService.getSessionDetailsBulk(props.groupId, ids)
    const details = selected.map((result, i) => ({
      result,
      detail: detailList[i]
    }))
    const csv = buildSessionDetailCsv(details, detailCsvLabels())
    const scenarioTitle = showResultsForAssignment.value?.scenario?.title || 'scenario'
    downloadCsv(csv, `${scenarioTitle}-${selected.length}-students.csv`)
  } catch (err: any) {
    notifyError(err.response?.data?.error || t('groupScenarios.exportError'))
  }
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

onMounted(() => {
  loadAssignments()
  loadProgress()
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
      <AssignmentCard
        v-for="assignment in assignments"
        :key="assignment.id"
        :assignment="assignment"
        :progress="progressByScenario.get(assignment.scenario_id) ?? null"
        :can-edit-group="canEditGroup"
        :bulk-starting="bulkStartingId === assignment.id"
        @view-results="handleViewResults(assignment)"
        @bulk-start="handleBulkStart(assignment)"
        @reset="handleReset(assignment)"
        @remove="handleRemove(assignment)"
        @export-json="handleExportJSON(assignment)"
        @export-archive="handleExportArchive(assignment)"
      />
    </div>

    <!-- Student Results Modal (focused) -->
    <BaseModal
      :visible="!!showResultsForAssignment"
      size="xlarge"
      :show-close="false"
      no-padding
      @close="closeResults"
    >
      <AssignmentResultsView
        v-if="showResultsForAssignment"
        :assignment="showResultsForAssignment"
        :results="scenarioResults"
        :loading="loadingResults"
        :selected-results="selectedResults"
        @close="closeResults"
        @view-detail="handleViewDetail"
        @export-all="exportResultsCsv"
        @export-single="exportSingleResult"
        @export-selected="exportSelectedResults"
        @toggle-result="toggleResult"
        @toggle-select-all="toggleSelectAll"
      />
    </BaseModal>

    <!-- Session Detail Modal -->
    <SessionDetailModal
      :visible="showDetailModal"
      :result="selectedDetailResult"
      :group-id="groupId"
      @close="showDetailModal = false"
    />

    <!-- Assign Scenario Modal -->
    <AssignScenarioModal
      :visible="showAssignModal"
      :scenarios="availableScenarios"
      @assign="handleAssign"
      @close="showAssignModal = false"
    />

    <!-- Bulk Start Distribution Modal -->
    <BulkStartScenarioModal
      :visible="showBulkStartModal"
      :assignment="assignmentToBulkStart"
      :distributions="distributions"
      v-model:selected-distribution="selectedDistribution"
      :loading-distributions="loadingDistributions"
      @confirm="confirmBulkStart"
      @close="showBulkStartModal = false"
    />

    <!-- Bulk Start Result Modal -->
    <ScenarioAssignmentResultModal
      :visible="showResultModal"
      :message="resultMessage"
      :no-key-users="resultNoKeyUsers"
      :errors="resultErrors"
      @close="showResultModal = false"
    />

    <!-- Confirm Remove Modal -->
    <RemoveAssignmentConfirmModal
      :visible="showConfirmRemoveModal"
      :assignment="assignmentToRemove"
      @confirm="confirmRemove"
      @close="showConfirmRemoveModal = false"
    />

    <!-- Confirm Reset Modal -->
    <ResetAssignmentModal
      :visible="showResetModal"
      :assignment="assignmentToReset"
      @confirm="confirmReset"
      @close="showResetModal = false"
    />

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


</style>
