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
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'
import BaseModal from '../Modals/BaseModal.vue'

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
  }
}

interface Scenario {
  id: string
  name: string
  title: string
  difficulty: string
}

const props = defineProps<{
  groupId: string
  canEditGroup: boolean
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
      starting: 'Starting sessions...'
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
      starting: 'Démarrage des sessions...'
    }
  }
})

// State
const assignments = ref<ScenarioAssignment[]>([])
const availableScenarios = ref<Scenario[]>([])
const isLoading = ref(false)
const error = ref('')
const showAssignModal = ref(false)
const selectedScenarioId = ref('')
const assignDeadline = ref('')
const scenarioSearch = ref('')
const bulkStartingId = ref<string | null>(null)

// Filtered scenarios for modal dropdown
const filteredScenarios = () => {
  if (!scenarioSearch.value.trim()) return availableScenarios.value
  const q = scenarioSearch.value.toLowerCase()
  return availableScenarios.value.filter(
    s => s.title.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  )
}

// Load assignments
async function loadAssignments() {
  isLoading.value = true
  error.value = ''
  try {
    const response = await axios.get('/scenario-assignments', {
      params: { group_id: props.groupId }
    })
    assignments.value = response.data?.data || response.data || []
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('groupScenarios.loadError')
  } finally {
    isLoading.value = false
  }
}

// Load available scenarios for the assign modal
async function loadScenarios() {
  try {
    const response = await axios.get('/scenarios')
    availableScenarios.value = response.data?.data || response.data || []
  } catch (err: any) {
    console.error('Failed to load scenarios:', err)
  }
}

// Assign scenario
async function handleAssign() {
  if (!selectedScenarioId.value) return
  error.value = ''
  try {
    await axios.post('/scenario-assignments', {
      scenario_id: selectedScenarioId.value,
      group_id: props.groupId,
      scope: 'group',
      deadline: assignDeadline.value || undefined
    })
    showAssignModal.value = false
    selectedScenarioId.value = ''
    assignDeadline.value = ''
    scenarioSearch.value = ''
    await loadAssignments()
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('groupScenarios.assignError')
  }
}

// Bulk start
async function handleBulkStart(assignment: ScenarioAssignment) {
  bulkStartingId.value = assignment.id
  error.value = ''
  try {
    const response = await axios.post(
      `/teacher/groups/${props.groupId}/scenarios/${assignment.scenario_id}/bulk-start`
    )
    const data = response.data
    const started = data?.started || 0
    const skipped = data?.skipped || 0
    alert(t('groupScenarios.bulkStartResult', { started, skipped }))
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('groupScenarios.bulkStartError')
  } finally {
    bulkStartingId.value = null
  }
}

// Remove assignment
async function handleRemove(assignment: ScenarioAssignment) {
  if (!window.confirm(t('groupScenarios.confirmRemove'))) return
  error.value = ''
  try {
    await axios.delete(`/scenario-assignments/${assignment.id}`)
    await loadAssignments()
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('groupScenarios.removeError')
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

function openAssignModal() {
  loadScenarios()
  showAssignModal.value = true
}

onMounted(() => {
  loadAssignments()
})
</script>

<template>
  <div class="scenarios-tab">
    <div class="tab-header">
      <h3>{{ t('groupScenarios.assignedScenarios') }}</h3>
      <button
        v-if="canEditGroup"
        @click="openAssignModal"
        class="btn btn-primary"
      >
        <i class="fas fa-plus"></i>
        {{ t('groupScenarios.assignScenario') }}
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="isLoading" class="loading-state">
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
          </div>
          <div class="assignment-meta">
            <span
              v-if="assignment.scenario?.difficulty"
              :class="['difficulty-badge', getDifficultyClass(assignment.scenario.difficulty)]"
            >
              {{ assignment.scenario.difficulty }}
            </span>
            <span class="deadline-text">
              <i class="fas fa-calendar"></i>
              {{ assignment.deadline ? assignment.deadline : t('groupScenarios.noDeadline') }}
            </span>
            <span :class="['status-chip', assignment.is_active ? 'status-active' : 'status-inactive']">
              {{ assignment.is_active ? t('groupScenarios.active') : t('groupScenarios.inactive') }}
            </span>
          </div>
        </div>
        <div v-if="canEditGroup" class="assignment-actions">
          <button
            @click="handleBulkStart(assignment)"
            class="btn btn-sm btn-secondary"
            :disabled="bulkStartingId === assignment.id"
          >
            <i :class="bulkStartingId === assignment.id ? 'fas fa-spinner fa-spin' : 'fas fa-play'"></i>
            {{ bulkStartingId === assignment.id ? t('groupScenarios.starting') : t('groupScenarios.bulkStart') }}
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
          <option
            v-for="scenario in filteredScenarios()"
            :key="scenario.id"
            :value="scenario.id"
          >
            {{ scenario.title }} ({{ scenario.difficulty }})
          </option>
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

.alert {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
}

.alert-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
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
