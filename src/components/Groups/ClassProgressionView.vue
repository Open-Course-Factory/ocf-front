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
/**
 * The exam view of a class: who is present, where each learner stands in the
 * scenario, and who needs a teacher walking over — refreshed every 30 seconds
 * while the tab is on screen.
 *
 * It renders one endpoint (GET /teacher/groups/:id/live-progress), which is the
 * point of issue #310: presence and scenario progress used to come from two
 * places joined on nothing, so the teacher alternated between two tabs.
 */
import { computed, onMounted, ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useVisiblePolling } from '../../composables/useVisiblePolling'
import { useClassProgression, type ClassProgressionSort } from '../../composables/useClassProgression'
import { formatCompactDuration } from '../../utils/quotaFormatters'
import { teacherService, type LearnerLiveProgress } from '../../services/domain/scenario'
import ClassStepDistribution from './ClassStepDistribution.vue'
import ClassProgressionTable from './ClassProgressionTable.vue'

const props = defineProps<{
  groupId: string
}>()

const emit = defineEmits<{
  (event: 'watch-terminal', sessionId: string): void
}>()

const { t } = useTranslations({
  en: {
    classProgression: {
      loading: 'Loading class progress…',
      refresh: 'Refresh',
      loadError: 'Failed to load class progress',
      permissionError: 'You do not have permission to follow this class’s progress.',
      retry: 'Retry',
      emptyClass: 'This class has no learner yet',
      noAssignment: 'No scenario assigned to this class — learners are listed with their presence only.',
      connectedCount: '{connected}/{total} connected',
      deadlineIn: 'ends in {duration}',
      deadlinePassed: 'deadline passed',
      assignmentPicker: 'Watched scenario',
      sortLabel: 'Sort:',
      sortStep: 'Step',
      sortHints: 'Hints',
      sortAttention: 'Inactivity',
      sortStepHint: 'Least advanced learners first',
      sortHintsHint: 'Most hints used first',
      sortAttentionHint: 'Learners to look at first'
    }
  },
  fr: {
    classProgression: {
      loading: 'Chargement de la progression…',
      refresh: 'Actualiser',
      loadError: 'Échec du chargement de la progression',
      permissionError: 'Vous n’avez pas la permission de suivre la progression de cette classe.',
      retry: 'Réessayer',
      emptyClass: 'Cette classe n’a pas encore d’apprenant',
      noAssignment: 'Aucun scénario assigné à cette classe — les apprenants sont listés avec leur seule présence.',
      connectedCount: '{connected}/{total} connectés',
      deadlineIn: 'fin dans {duration}',
      deadlinePassed: 'échéance dépassée',
      assignmentPicker: 'Scénario suivi',
      sortLabel: 'Trier :',
      sortStep: 'Étape',
      sortHints: 'Indices',
      sortAttention: 'Inactivité',
      sortStepHint: 'Les apprenants les moins avancés en premier',
      sortHintsHint: 'Le plus d’indices consommés en premier',
      sortAttentionHint: 'Les apprenants à regarder en premier'
    }
  }
})

const learners = ref<LearnerLiveProgress[]>([])
const isLoading = ref(false)
/**
 * Set by the first SUCCESSFUL load: it is what tells the skeleton from the
 * rows, so a first attempt that failed must keep showing the error rather than
 * an empty class.
 */
const hasRows = ref(false)
const error = ref('')
/** Refreshed with the rows, so the countdown moves with the data it describes. */
const now = ref(Date.now())

const {
  requestedAssignmentId,
  sort,
  assignments,
  selectedAssignment,
  totalSteps,
  sortedRows,
  distribution,
  connectedCount
} = useClassProgression(learners)

/**
 * The picker shows the assignment actually on screen, which is the requested
 * one only once the teacher has requested one — before that (and after a
 * refresh drops the requested assignment) it is the fallback.
 */
const pickedAssignmentId = computed({
  get: () => selectedAssignment.value?.assignmentId ?? '',
  set: (assignmentId: string) => { requestedAssignmentId.value = assignmentId }
})

const SORT_OPTIONS: { key: ClassProgressionSort; labelKey: string; hintKey: string }[] = [
  { key: 'step', labelKey: 'sortStep', hintKey: 'sortStepHint' },
  { key: 'hints', labelKey: 'sortHints', hintKey: 'sortHintsHint' },
  { key: 'attention', labelKey: 'sortAttention', hintKey: 'sortAttentionHint' }
]

/** Placeholder rows for the very first load, sized like the real ones. */
const SKELETON_ROWS = [1, 2, 3, 4]

const presenceLabel = computed(() =>
  t('classProgression.connectedCount', {
    connected: connectedCount.value,
    total: learners.value.length
  })
)

const DEADLINE_WARNING_SECONDS = 60 * 60

const deadlineSecondsLeft = computed<number | null>(() => {
  const deadline = selectedAssignment.value?.deadline
  if (!deadline) return null
  const at = Date.parse(deadline)
  if (!Number.isFinite(at)) return null
  return (at - now.value) / 1000
})

const deadlineLabel = computed(() => {
  const left = deadlineSecondsLeft.value
  if (left === null) return ''
  if (left <= 0) return t('classProgression.deadlinePassed')
  // Rounded UP to the minute: the shared duration formatter truncates, which is
  // right for time already spent but would announce "41m" for the whole minute
  // after a 42-minute exam started.
  const remaining = left < 60 ? left : Math.ceil(left / 60) * 60
  return t('classProgression.deadlineIn', { duration: formatCompactDuration(remaining) })
})

const deadlineIsClose = computed(() => {
  const left = deadlineSecondsLeft.value
  return left !== null && left <= DEADLINE_WARNING_SECONDS
})

async function loadProgress() {
  isLoading.value = true
  try {
    learners.value = await teacherService.getGroupLiveProgress(props.groupId)
    now.value = Date.now()
    error.value = ''
    hasRows.value = true
  } catch (err: any) {
    error.value = err?.response?.data?.error_message
      || (err?.response?.status === 403 ? t('classProgression.permissionError') : '')
      || t('classProgression.loadError')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProgress)
useVisiblePolling(loadProgress, 30000)
</script>

<template>
  <div class="ocf-clp">
    <div class="ocf-clp-header">
      <div class="ocf-clp-summary">
        <!-- Held back until the class is known: "0/0 connectés" over a skeleton
             would be a number the teacher could believe. -->
        <span v-if="hasRows" class="ocf-clp-presence">{{ presenceLabel }}</span>
        <!-- With several assignments the picker names the watched one instead. -->
        <span v-if="assignments.length === 1" class="ocf-clp-scenario">
          {{ selectedAssignment?.scenarioTitle }}
        </span>
        <span
          v-if="deadlineLabel"
          class="ocf-clp-deadline"
          :class="{ 'ocf-clp-deadline-close': deadlineIsClose }"
        >
          <i class="fas fa-hourglass-half" aria-hidden="true"></i>
          {{ deadlineLabel }}
        </span>
      </div>

      <div class="ocf-clp-header-actions">
        <label v-if="assignments.length > 1" class="ocf-clp-picker">
          <span class="ocf-clp-picker-label">{{ t('classProgression.assignmentPicker') }}</span>
          <select v-model="pickedAssignmentId" class="ocf-clp-select">
            <option v-for="option in assignments" :key="option.assignmentId" :value="option.assignmentId">
              {{ option.scenarioTitle }}
            </option>
          </select>
        </label>
        <button
          type="button"
          class="ocf-btn ocf-btn-secondary ocf-btn-sm"
          :disabled="isLoading"
          @click="loadProgress"
        >
          <i :class="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync'" aria-hidden="true"></i>
          {{ t('classProgression.refresh') }}
        </button>
      </div>
    </div>

    <!-- Error (includes the backend 403 when the caller may not follow this class) -->
    <div v-if="error && !hasRows" class="ocf-clp-state ocf-clp-state-error">
      <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
      <p>{{ error }}</p>
      <button type="button" class="ocf-btn ocf-btn-primary ocf-btn-sm" @click="loadProgress">
        {{ t('classProgression.retry') }}
      </button>
    </div>

    <!-- First load only: later refreshes replace rows in place, without a flash -->
    <div v-else-if="!hasRows" class="ocf-clp-skeleton" role="status" :aria-label="t('classProgression.loading')">
      <span v-for="row in SKELETON_ROWS" :key="row" class="ocf-clp-skeleton-row"></span>
    </div>

    <div v-else-if="learners.length === 0" class="ocf-clp-state">
      <i class="fas fa-user-group" aria-hidden="true"></i>
      <p>{{ t('classProgression.emptyClass') }}</p>
    </div>

    <template v-else>
      <!-- A refresh that fails keeps the rows on screen and says so. -->
      <p v-if="error" class="ocf-clp-inline-error" role="alert">{{ error }}</p>

      <p v-if="assignments.length === 0" class="ocf-clp-note">{{ t('classProgression.noAssignment') }}</p>

      <ClassStepDistribution v-if="distribution.length > 0" :buckets="distribution" />

      <div v-if="assignments.length > 0" class="ocf-clp-sorts">
        <span class="ocf-clp-sort-label">{{ t('classProgression.sortLabel') }}</span>
        <button
          v-for="option in SORT_OPTIONS"
          :key="option.key"
          type="button"
          class="ocf-clp-chip"
          :class="{ 'ocf-clp-chip-active': sort === option.key }"
          :aria-pressed="sort === option.key"
          :title="t(`classProgression.${option.hintKey}`)"
          @click="sort = option.key"
        >
          {{ t(`classProgression.${option.labelKey}`) }}
        </button>
      </div>

      <ClassProgressionTable
        :rows="sortedRows"
        :total-steps="totalSteps"
        :has-assignment="assignments.length > 0"
        @watch-terminal="emit('watch-terminal', $event)"
      />
    </template>
  </div>
</template>

<style scoped>
.ocf-clp {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ocf-clp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.ocf-clp-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.ocf-clp-presence {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.ocf-clp-scenario {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 32ch;
}

.ocf-clp-deadline {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 1px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
}

.ocf-clp-deadline-close {
  color: var(--color-warning-amber);
  background: var(--color-warning-amber-bg);
  border: var(--border-width-thin) solid var(--color-warning-amber-border);
  font-weight: var(--font-weight-semibold);
}

.ocf-clp-header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.ocf-clp-picker {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.ocf-clp-picker-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.ocf-clp-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  max-width: 220px;
}

.ocf-clp-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
  text-align: center;
}

.ocf-clp-state i {
  font-size: var(--font-size-2xl);
  color: var(--color-primary);
}

.ocf-clp-state-error i {
  color: var(--color-danger);
}

.ocf-clp-inline-error {
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  font-size: var(--font-size-sm);
}

.ocf-clp-note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.ocf-clp-skeleton {
  display: grid;
  gap: var(--spacing-xs);
}

.ocf-clp-skeleton-row {
  height: 44px;
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
  animation: ocf-clp-pulse 1.4s ease-in-out infinite;
}

@keyframes ocf-clp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (prefers-reduced-motion: reduce) {
  .ocf-clp-skeleton-row {
    animation: none;
  }
}

.ocf-clp-sorts {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.ocf-clp-sort-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.ocf-clp-chip {
  padding: var(--spacing-xs) var(--spacing-md);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.ocf-clp-chip:hover {
  background: var(--color-surface-hover);
}

.ocf-clp-chip:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.ocf-clp-chip-active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

/* Button styles are shared via assets/styles/supervision-buttons.css (.ocf-btn*). */
</style>
