<template>
  <div class="results-panel">
    <div class="results-header">
      <button @click="$emit('close')" class="btn btn-sm btn-outline">
        <i class="fas fa-arrow-left"></i> {{ t('groupScenarios.back') }}
      </button>
      <h4>{{ t('groupScenarios.studentResults') }} — {{ assignment.scenario?.title }}</h4>
      <button @click="$emit('export-all')" class="btn btn-sm btn-outline" :disabled="results.length === 0">
        <i class="fas fa-download"></i> {{ t('groupScenarios.exportCsv') }}
      </button>
    </div>

    <div v-if="loading" class="loading-state" role="status">
      <i class="fas fa-spinner fa-spin"></i>
    </div>

    <div v-else-if="results.length === 0" class="empty-state">
      <p>{{ t('groupScenarios.noResults') }}</p>
    </div>

    <div v-else class="results-table-container">
      <div v-if="selectedResults.size > 0" class="bulk-actions-bar">
        <span>{{ t('groupScenarios.selectedCount', { count: selectedResults.size }) }}</span>
        <button @click="$emit('export-selected')" class="btn btn-sm btn-primary">
          <i class="fas fa-download"></i> {{ t('groupScenarios.exportSelected') }}
        </button>
        <button @click="$emit('toggle-select-all')" class="btn btn-sm btn-outline">
          {{ t('groupScenarios.clearSelection') }}
        </button>
      </div>
      <table class="results-table" :aria-label="t('groupScenarios.studentResults')">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input
                type="checkbox"
                :checked="allSelected"
                :title="t('groupScenarios.selectAll')"
                @change="$emit('toggle-select-all')"
              />
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
          <tr v-for="result in results" :key="result.session_id">
            <td class="checkbox-col">
              <input
                type="checkbox"
                :checked="selectedResults.has(result.session_id)"
                @change="$emit('toggle-result', result.session_id)"
              />
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
              <div>{{ result.grade != null ? Math.round(result.grade) + '%' : t('groupScenarios.notGraded') }}</div>
              <div
                v-if="result.total_correct_possible"
                class="correct-count-sub"
              >
                {{ t('groupScenarios.correctCount', {
                  correct: result.correct_count ?? 0,
                  total: result.total_correct_possible
                }) }}
              </div>
            </td>
            <td>
              <div class="progress-cell">
                <ProgressBar :value="result.completed_steps" :max="result.total_steps" />
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
                <button @click="$emit('view-detail', result)" class="btn btn-sm btn-outline">
                  <i class="fas fa-eye"></i> {{ t('groupScenarios.viewDetails') }}
                </button>
                <button @click="$emit('export-single', result)" class="btn btn-sm btn-outline" :title="t('groupScenarios.exportStudent')">
                  <i class="fas fa-download"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { getStatusClass, formatDate } from '../../utils/scenarioDisplay'
import ProgressBar from '../Common/ProgressBar.vue'
import type { ScenarioAssignment, ScenarioResultItem } from '../../types/groupScenarios'

const props = defineProps<{
  assignment: ScenarioAssignment
  results: ScenarioResultItem[]
  loading: boolean
  selectedResults: Set<string>
}>()

defineEmits<{
  close: []
  'view-detail': [result: ScenarioResultItem]
  'export-all': []
  'export-single': [result: ScenarioResultItem]
  'export-selected': []
  'toggle-result': [sessionId: string]
  'toggle-select-all': []
}>()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      back: 'Back',
      studentResults: 'Learner Results',
      exportCsv: 'Export CSV',
      noResults: 'No sessions yet for this scenario.',
      selectedCount: '{count} selected',
      exportSelected: 'Export selected',
      clearSelection: 'Clear selection',
      selectAll: 'Select all',
      student: 'Learner',
      status: 'Status',
      grade: 'Grade',
      progress: 'Progress',
      hintsUsed: 'Hints',
      startedAt: 'Started',
      completedAt: 'Completed',
      actions: 'Actions',
      notGraded: 'N/A',
      correctCount: '{correct}/{total} correct',
      viewDetails: 'Details',
      exportStudent: 'Export this student',
      completed: 'completed',
      activeStatus: 'active',
      in_progress: 'in progress',
      locked: 'locked',
      abandoned: 'abandoned'
    }
  },
  fr: {
    groupScenarios: {
      back: 'Retour',
      studentResults: 'Résultats des apprenants',
      exportCsv: 'Exporter CSV',
      noResults: 'Aucune session pour ce scénario.',
      selectedCount: '{count} sélectionné(s)',
      exportSelected: 'Exporter la sélection',
      clearSelection: 'Annuler la sélection',
      selectAll: 'Tout sélectionner',
      student: 'Apprenant(e)',
      status: 'Statut',
      grade: 'Note',
      progress: 'Progression',
      hintsUsed: 'Indices',
      startedAt: 'Début',
      completedAt: 'Fin',
      actions: 'Actions',
      notGraded: 'N/A',
      correctCount: '{correct}/{total} correctes',
      viewDetails: 'Détails',
      exportStudent: 'Exporter cet étudiant',
      completed: 'terminé',
      activeStatus: 'actif',
      in_progress: 'en cours',
      locked: 'verrouillé',
      abandoned: 'abandonné'
    }
  }
})

const allSelected = computed(
  () => props.results.length > 0 && props.selectedResults.size === props.results.length
)

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
</script>

<style scoped>
.results-panel {
  /* Rendered inside an xlarge no-padding BaseModal — supply its own interior
     padding instead of the old inline-panel top margin. */
  padding: var(--spacing-lg);
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

.results-table-container {
  overflow-x: auto;
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

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.results-table th,
.results-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

.results-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-secondary);
}

.results-table tbody tr:hover {
  background-color: var(--color-bg-secondary);
}

.checkbox-col {
  width: 2rem;
  text-align: center;
}

.checkbox-col input[type="checkbox"] {
  cursor: pointer;
  accent-color: var(--color-primary);
}

.student-name {
  font-weight: var(--font-weight-medium);
}

.student-email {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
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

.correct-count-sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* Constrain the shared <ProgressBar> within the table cell. */
.progress-cell :deep(.progress) {
  flex: 1;
  min-width: 60px;
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
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

.date-cell {
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  align-items: stretch;
  gap: var(--spacing-xs);
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
</style>
