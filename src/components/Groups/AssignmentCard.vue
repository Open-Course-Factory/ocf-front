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

<template>
  <div class="card assignment-card">
    <div class="assignment-info">
      <div class="assignment-title">
        {{ assignment.scenario?.title || assignment.scenario_id }}
        <span v-if="isOrgScenario" class="source-badge org-badge">
          <i class="fas fa-building"></i> {{ t('groupScenarios.orgScenario') }}
        </span>
      </div>
      <div class="assignment-meta">
        <span
          v-if="assignment.scenario?.difficulty"
          class="badge"
          :class="difficultyVariant"
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
        <span class="badge" :class="assignment.is_active ? 'badge-success' : 'badge-secondary'">
          {{ assignment.is_active ? t('groupScenarios.active') : t('groupScenarios.inactive') }}
        </span>
      </div>

      <!-- Progress -->
      <div class="assignment-progress">
        <template v-if="hasProgress">
          <ProgressBar :value="progress!.completed_count" :max="progress!.total_count" />
          <span class="assignment-progress-text">
            <strong class="assignment-progress-count">{{ progress!.completed_count }}/{{ progress!.total_count }}</strong>
            <span class="assignment-progress-done">{{ t('groupScenarios.progressDone') }}</span>
          </span>
          <span v-if="progress!.avg_grade != null" class="assignment-progress-avg">
            {{ t('groupScenarios.progressAvg') }}
            <span class="assignment-progress-avg-value">{{ Math.round(progress!.avg_grade) }}%</span>
          </span>
        </template>
        <span v-else class="text-muted">{{ t('groupScenarios.noAttempts') }}</span>
      </div>
    </div>

    <div v-if="canEditGroup" class="assignment-actions">
      <button class="btn btn-primary btn-sm btn-view-results" @click="$emit('view-results')">
        <i class="fas fa-chart-bar"></i>
        {{ t('groupScenarios.viewResults') }}
        <i class="fas fa-arrow-right"></i>
      </button>

      <DropdownMenu>
        <button
          class="dropdown-item"
          data-test="action-bulk-start"
          :disabled="bulkStarting"
          @click="$emit('bulk-start')"
        >
          <i :class="bulkStarting ? 'fas fa-spinner fa-spin' : 'fas fa-play'"></i>
          <span>{{ bulkStarting ? t('groupScenarios.starting') : t('groupScenarios.bulkStart') }}</span>
        </button>
        <button
          class="dropdown-item"
          data-test="action-reset"
          @click="$emit('reset')"
        >
          <i class="fas fa-undo"></i>
          <span>{{ t('groupScenarios.resetSessions') }}</span>
        </button>
        <button
          class="dropdown-item"
          data-test="action-export-json"
          @click="$emit('export-json')"
        >
          <i class="fas fa-file-download"></i>
          <span>{{ t('groupScenarios.exportJson') }}</span>
        </button>
        <button
          class="dropdown-item"
          data-test="action-export-archive"
          @click="$emit('export-archive')"
        >
          <i class="fas fa-file-archive"></i>
          <span>{{ t('groupScenarios.exportKillercoda') }}</span>
        </button>
        <button
          class="dropdown-item dropdown-item--danger"
          data-test="action-remove"
          @click="$emit('remove')"
        >
          <i class="fas fa-trash"></i>
          <span>{{ t('groupScenarios.removeAssignment') }}</span>
        </button>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { formatDate } from '../../utils/scenarioDisplay'
import ProgressBar from '../Common/ProgressBar.vue'
import DropdownMenu from '../Common/DropdownMenu.vue'
import type { ScenarioAssignment, AssignmentProgress } from '../../types/groupScenarios'

const props = defineProps<{
  assignment: ScenarioAssignment
  progress: AssignmentProgress | null
  canEditGroup: boolean
  bulkStarting: boolean
}>()

defineEmits<{
  'view-results': []
  'bulk-start': []
  reset: []
  remove: []
  'export-json': []
  'export-archive': []
}>()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      viewResults: 'View results',
      bulkStart: 'Start for All',
      starting: 'Starting sessions...',
      resetSessions: 'Reset Sessions',
      removeAssignment: 'Remove',
      exportJson: 'Export JSON',
      exportKillercoda: 'Export KillerCoda',
      active: 'Active',
      inactive: 'Inactive',
      noStartDate: 'No start date',
      noDeadline: 'No deadline',
      orgScenario: 'Org',
      difficultyBeginner: 'Beginner',
      difficultyIntermediate: 'Intermediate',
      difficultyAdvanced: 'Advanced',
      progressDone: 'done',
      progressAvg: 'avg',
      noAttempts: 'No attempts yet'
    }
  },
  fr: {
    groupScenarios: {
      viewResults: 'Voir les résultats',
      bulkStart: 'Démarrer pour tous',
      starting: 'Démarrage des sessions...',
      resetSessions: 'Réinitialiser',
      removeAssignment: 'Supprimer',
      exportJson: 'Exporter JSON',
      exportKillercoda: 'Exporter KillerCoda',
      active: 'Actif',
      inactive: 'Inactif',
      noStartDate: 'Pas de date de début',
      noDeadline: 'Pas de date limite',
      orgScenario: 'Org',
      difficultyBeginner: 'Débutant',
      difficultyIntermediate: 'Intermédiaire',
      difficultyAdvanced: 'Avancé',
      progressDone: 'terminés',
      progressAvg: 'moy.',
      noAttempts: 'Aucune tentative'
    }
  }
})

const isOrgScenario = computed(() => props.assignment.scenario?.organization_id != null)
const hasProgress = computed(() => !!props.progress && props.progress.total_count > 0)

// Difficulty → a DS badge variant. Kept distinct from the status badge's
// success/secondary variants so the two badges never collide visually.
const difficultyVariant = computed(() => {
  switch (props.assignment.scenario?.difficulty) {
    case 'beginner': return 'badge-primary'
    case 'intermediate': return 'badge-warning'
    case 'advanced': return 'badge-danger'
    default: return 'badge-secondary'
  }
})

function translateDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    beginner: t('groupScenarios.difficultyBeginner'),
    intermediate: t('groupScenarios.difficultyIntermediate'),
    advanced: t('groupScenarios.difficultyAdvanced')
  }
  return difficultyMap[difficulty] || difficulty
}
</script>

<style scoped>
/* The DS `.card` supplies chrome (border/radius/shadow/bg/hover); this only
   arranges the info row / progress / actions. */
.assignment-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.assignment-info {
  flex: 1;
  min-width: 0;
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
  flex-wrap: wrap;
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

/* Progress row layout (bar comes from <ProgressBar>) */
.assignment-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
  flex-wrap: wrap;
}

.assignment-progress :deep(.progress) {
  flex: 0 0 140px;
}

.assignment-progress-text {
  display: inline-flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.assignment-progress-count {
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.assignment-progress-done {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.assignment-progress-avg {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  background-color: var(--color-info-bg);
  color: var(--color-info);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.assignment-progress-avg-value {
  font-variant-numeric: tabular-nums;
}

/* Actions row */
.assignment-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.btn-view-results {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  white-space: nowrap;
}
</style>
