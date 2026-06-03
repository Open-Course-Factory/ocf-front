<template>
  <div class="assignment-card">
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

      <!-- Progress -->
      <div class="assignment-progress">
        <template v-if="hasProgress">
          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill"
              :style="{ width: (progress!.completed_count / progress!.total_count) * 100 + '%' }"
            ></div>
          </div>
          <span class="assignment-progress-text">
            <strong class="assignment-progress-count">{{ progress!.completed_count }}/{{ progress!.total_count }}</strong>
            <span class="assignment-progress-done">{{ t('groupScenarios.progressDone') }}</span>
          </span>
          <span v-if="progress!.avg_grade != null" class="assignment-progress-avg">
            {{ t('groupScenarios.progressAvg') }}
            <span class="assignment-progress-avg-value">{{ Math.round(progress!.avg_grade) }}%</span>
          </span>
        </template>
        <span v-else class="no-attempts">
          <i class="fas fa-circle-notch"></i>
          {{ t('groupScenarios.noAttempts') }}
        </span>
      </div>
    </div>

    <div v-if="canEditGroup" ref="containerRef" class="assignment-actions">
      <button class="btn btn-primary btn-view-results" @click="$emit('view-results')">
        <i class="fas fa-chart-bar"></i>
        {{ t('groupScenarios.viewResults') }}
        <i class="fas fa-arrow-right"></i>
      </button>

      <div class="dropdown-container">
        <button
          class="btn-icon"
          @click.stop="toggleMenu"
          :title="t('groupScenarios.moreActions')"
        >
          <i class="fas fa-ellipsis-v"></i>
        </button>

        <div v-if="menuOpen" class="dropdown-menu" @click.stop>
          <button
            class="dropdown-item"
            data-test="action-bulk-start"
            :disabled="bulkStarting"
            @click="$emit('bulk-start'); closeMenu()"
          >
            <i :class="bulkStarting ? 'fas fa-spinner fa-spin' : 'fas fa-play'"></i>
            <span>{{ bulkStarting ? t('groupScenarios.starting') : t('groupScenarios.bulkStart') }}</span>
          </button>
          <button
            class="dropdown-item"
            data-test="action-reset"
            @click="$emit('reset'); closeMenu()"
          >
            <i class="fas fa-undo"></i>
            <span>{{ t('groupScenarios.resetSessions') }}</span>
          </button>
          <button
            class="dropdown-item"
            data-test="action-export-json"
            @click="$emit('export-json'); closeMenu()"
          >
            <i class="fas fa-file-download"></i>
            <span>{{ t('groupScenarios.exportJson') }}</span>
          </button>
          <button
            class="dropdown-item"
            data-test="action-export-archive"
            @click="$emit('export-archive'); closeMenu()"
          >
            <i class="fas fa-file-archive"></i>
            <span>{{ t('groupScenarios.exportKillercoda') }}</span>
          </button>
          <button
            class="dropdown-item dropdown-item-danger"
            data-test="action-remove"
            @click="$emit('remove'); closeMenu()"
          >
            <i class="fas fa-trash"></i>
            <span>{{ t('groupScenarios.removeAssignment') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { getDifficultyClass, formatDate } from '../../utils/scenarioDisplay'
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
      moreActions: 'More actions',
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
      moreActions: 'Plus d\'actions',
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

function translateDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    beginner: t('groupScenarios.difficultyBeginner'),
    intermediate: t('groupScenarios.difficultyIntermediate'),
    advanced: t('groupScenarios.difficultyAdvanced')
  }
  return difficultyMap[difficulty] || difficulty
}

// --- Overflow dropdown (mirrors TerminalMySessions.vue) ---
const containerRef = ref<HTMLElement | null>(null)
const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (containerRef.value && !containerRef.value.contains(target)) {
    menuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
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

/* Progress section */
.assignment-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
  flex-wrap: wrap;
}

.progress-bar-bg {
  flex: 0 0 140px;
  height: 8px;
  background-color: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
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

.no-attempts {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

/* Actions */
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

/* Overflow dropdown */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover:not(:disabled) {
  background-color: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  right: 0;
  min-width: 200px;
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 10;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dropdown-item:hover:not(:disabled) {
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
}

.dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-item i {
  width: 18px;
  text-align: center;
  opacity: 0.7;
}

.dropdown-item:hover:not(:disabled) i {
  opacity: 1;
}

.dropdown-item-danger {
  color: var(--color-danger);
}

.dropdown-item-danger:hover:not(:disabled) {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
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
