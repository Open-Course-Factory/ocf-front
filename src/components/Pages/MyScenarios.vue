<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Student-facing page to view scenario session history and performance.
 */
-->

<template>
  <div class="my-scenarios-page">
    <div class="page-header">
      <h2>{{ t('myScenarios.title') }}</h2>
    </div>

    <!-- Status filter tabs -->
    <div class="filter-tabs" role="tablist">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: selectedStatus === tab.value }"
        role="tab"
        :aria-selected="selectedStatus === tab.value"
        @click="selectedStatus = tab.value"
      >
        {{ tab.label }}
        <span class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <span>{{ t('myScenarios.loading') }}</span>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ loadError }}</span>
      <button class="btn btn-sm btn-primary" @click="loadSessions">
        {{ t('myScenarios.retry') }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="groupedScenarios.length === 0" class="empty-state">
      <i class="fas fa-flag-checkered"></i>
      <p>{{ selectedStatus === 'all' ? t('myScenarios.empty') : t('myScenarios.emptyFiltered') }}</p>
    </div>

    <!-- Grouped by scenario -->
    <div v-else class="scenario-groups">
      <div v-for="group in groupedScenarios" :key="group.title" class="scenario-group">
        <div class="group-header">
          <h3 class="group-title">{{ group.title }}</h3>
          <div class="group-meta">
            <span class="attempt-count">{{ group.sessions.length }} {{ group.sessions.length === 1 ? t('myScenarios.attempts').split(' | ')[0] : t('myScenarios.attempts').split(' | ')[1] }}</span>
            <span v-if="group.bestGrade != null" class="best-grade" :class="gradeClass(group.bestGrade)">
              {{ t('myScenarios.bestGrade') }}: {{ Math.round(group.bestGrade) }}%
            </span>
          </div>
        </div>
        <div class="sessions-grid">
          <div
            v-for="session in group.sessions"
            :key="session.id"
            class="scenario-card"
            :class="{ clickable: session.status === 'active' }"
            :tabindex="session.status === 'active' ? 0 : undefined"
            :role="session.status === 'active' ? 'button' : undefined"
            @click="handleCardClick(session)"
            @keydown.enter="handleCardClick(session)"
            @keydown.space.prevent="handleCardClick(session)"
          >
            <div class="card-header">
              <span class="status-badge" :class="session.status">
                <i :class="statusIcon(session.status)"></i>
                {{ statusLabel(session.status) }}
              </span>
            </div>

            <div class="card-body">
              <!-- Progress -->
              <div class="progress-row">
                <span class="progress-label">{{ t('myScenarios.progress') }}</span>
                <div class="progress-bar-container">
                  <div
                    class="progress-bar-fill"
                    :style="{ width: progressPercent(session) + '%' }"
                    :class="session.status"
                  ></div>
                </div>
                <span class="progress-text">{{ session.completed_steps }} / {{ session.total_steps }}</span>
              </div>

              <!-- Grade (if completed) -->
              <div v-if="session.status === 'completed' && session.grade != null" class="grade-row">
                <span class="grade-label">{{ t('myScenarios.grade') }}</span>
                <span class="grade-value" :class="gradeClass(session.grade)">
                  {{ Math.round(session.grade) }}%
                </span>
              </div>

              <!-- Timestamps -->
              <div class="timestamps">
                <div class="timestamp-row">
                  <i class="fas fa-play"></i>
                  <span>{{ formatDate(session.started_at) }}</span>
                </div>
                <div v-if="session.completed_at" class="timestamp-row">
                  <i class="fas fa-check"></i>
                  <span>{{ formatDate(session.completed_at) }}</span>
                </div>
                <div v-if="session.completed_at" class="timestamp-row">
                  <i class="fas fa-clock"></i>
                  <span>{{ t('myScenarios.duration') }}: {{ formatDuration(session.started_at, session.completed_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Actions for active sessions -->
            <div v-if="session.status === 'active'" class="card-footer">
              <router-link
                v-if="session.terminal_session_id"
                :to="`/terminal-session/${session.terminal_session_id}`"
                class="btn btn-sm btn-primary resume-btn"
                @click.stop
              >
                <i class="fas fa-play-circle"></i>
                {{ t('myScenarios.resume') }}
              </router-link>
              <button
                class="btn btn-sm btn-outline-danger abandon-btn"
                @click.stop="handleAbandon(session)"
              >
                <i class="fas fa-times-circle"></i>
                {{ t('myScenarios.abandon') }}
              </button>
            </div>

            <!-- Review action for completed/abandoned sessions -->
            <div v-if="session.terminal_session_id && (session.status === 'completed' || session.status === 'abandoned')" class="card-footer">
              <router-link
                :to="{ name: 'TerminalSessionView', params: { sessionId: session.terminal_session_id } }"
                class="btn btn-sm btn-secondary review-btn"
                @click.stop
              >
                <i class="fas fa-eye"></i>
                {{ t('myScenarios.review') }}
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTranslations } from '../../composables/useTranslations'
import { scenarioSessionService } from '../../services/domain/scenario'
import type { MyScenarioSession } from '../../services/domain/scenario'

const router = useRouter()

const { t } = useTranslations({
  en: {
    myScenarios: {
      title: 'Scenario History',
      loading: 'Loading scenarios...',
      retry: 'Retry',
      empty: 'You have not started any scenarios yet.',
      emptyFiltered: 'No scenarios match this filter.',
      progress: 'Progress',
      grade: 'Grade',
      duration: 'Duration',
      attempts: 'attempt | attempts',
      bestGrade: 'Best grade',
      resume: 'Resume',
      abandon: 'Abandon',
      review: 'Review',
      abandonConfirm: 'Abandon this scenario session? This cannot be undone.',
      abandonSuccess: 'Session abandoned.',
      abandonError: 'Failed to abandon session.',
      all: 'All',
      active: 'Active',
      completed: 'Completed',
      abandoned: 'Abandoned',
      loadError: 'Failed to load scenario sessions.'
    }
  },
  fr: {
    myScenarios: {
      title: 'Historique des scénarios',
      loading: 'Chargement des scénarios...',
      retry: 'Réessayer',
      empty: 'Vous n\'avez pas encore commencé de scénario.',
      emptyFiltered: 'Aucun scénario ne correspond à ce filtre.',
      progress: 'Progression',
      grade: 'Note',
      duration: 'Dur\u00e9e',
      attempts: 'tentative | tentatives',
      bestGrade: 'Meilleure note',
      resume: 'Reprendre',
      abandon: 'Abandonner',
      review: 'Revoir',
      abandonConfirm: 'Abandonner cette session de scénario ? Cette action est irréversible.',
      abandonSuccess: 'Session abandonnée.',
      abandonError: 'Impossible d\'abandonner la session.',
      all: 'Tous',
      active: 'Actifs',
      completed: 'Terminés',
      abandoned: 'Abandonnés',
      loadError: 'Impossible de charger les sessions de scénarios.'
    }
  }
})

const sessions = ref<MyScenarioSession[]>([])
const isLoading = ref(true)
const loadError = ref('')
const selectedStatus = ref<'all' | 'active' | 'completed' | 'abandoned'>('all')

const filteredSessions = computed(() => {
  if (selectedStatus.value === 'all') return sessions.value
  return sessions.value.filter(s => s.status === selectedStatus.value)
})

const statusTabs = computed(() => [
  { value: 'all' as const, label: t('myScenarios.all'), count: sessions.value.length },
  { value: 'active' as const, label: t('myScenarios.active'), count: sessions.value.filter(s => s.status === 'active').length },
  { value: 'completed' as const, label: t('myScenarios.completed'), count: sessions.value.filter(s => s.status === 'completed').length },
  { value: 'abandoned' as const, label: t('myScenarios.abandoned'), count: sessions.value.filter(s => s.status === 'abandoned').length }
])

function statusIcon(status: string): string {
  switch (status) {
    case 'active': return 'fas fa-play-circle'
    case 'completed': return 'fas fa-check-circle'
    case 'abandoned': return 'fas fa-times-circle'
    default: return 'fas fa-question-circle'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active': return t('myScenarios.active')
    case 'completed': return t('myScenarios.completed')
    case 'abandoned': return t('myScenarios.abandoned')
    default: return status
  }
}

function progressPercent(session: MyScenarioSession): number {
  if (!session.total_steps || session.total_steps === 0) return 0
  return Math.round((session.completed_steps / session.total_steps) * 100)
}

function gradeClass(grade: number): string {
  if (grade >= 80) return 'grade-high'
  if (grade >= 50) return 'grade-medium'
  return 'grade-low'
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

function formatDuration(startedAt: string, completedAt: string): string {
  const start = new Date(startedAt)
  const end = new Date(completedAt)
  const diffMs = end.getTime() - start.getTime()
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) return `${hours}h ${mins}min`
  return `${mins}min`
}

interface ScenarioGroup {
  title: string
  sessions: MyScenarioSession[]
  bestGrade: number | null
  latestStatus: string
}

const groupedScenarios = computed<ScenarioGroup[]>(() => {
  const groups = new Map<string, MyScenarioSession[]>()
  for (const session of filteredSessions.value) {
    const key = session.scenario_title
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(session)
  }
  return Array.from(groups.entries()).map(([title, sessions]) => {
    const bestGrade = sessions.reduce((best, s) => {
      if (s.grade != null && (best === null || s.grade > best)) return s.grade
      return best
    }, null as number | null)
    return {
      title,
      sessions,
      bestGrade,
      latestStatus: sessions[0].status
    }
  })
})

function handleCardClick(session: MyScenarioSession) {
  if (session.status === 'active' && session.terminal_session_id) {
    router.push(`/terminal-session/${session.terminal_session_id}`)
  }
}

async function loadSessions() {
  isLoading.value = true
  loadError.value = ''
  try {
    sessions.value = await scenarioSessionService.getMyScenarioSessions()
  } catch (err: any) {
    loadError.value = err.response?.data?.error_message || t('myScenarios.loadError')
  } finally {
    isLoading.value = false
  }
}

async function handleAbandon(session: MyScenarioSession) {
  if (!confirm(t('myScenarios.abandonConfirm'))) return
  try {
    await scenarioSessionService.abandonSession(session.id)
    session.status = 'abandoned'
  } catch {
    alert(t('myScenarios.abandonError'))
  }
}

onMounted(() => {
  loadSessions()
})
</script>

<style scoped>
.my-scenarios-page {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-header h2 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* Filter tabs */
.filter-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  padding-bottom: var(--spacing-xs);
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-tab:hover {
  color: var(--color-text-primary);
}

.filter-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--spacing-xs);
  border-radius: var(--border-radius-full);
  background: var(--color-bg-tertiary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.filter-tab.active .tab-count {
  background: var(--color-primary);
  color: var(--color-white);
}

/* Loading, error, empty states */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
  text-align: center;
}

.loading-state i,
.error-state i,
.empty-state i {
  font-size: var(--font-size-2xl);
}

.error-state i {
  color: var(--color-danger);
}

.error-state span {
  color: var(--color-danger-text);
}

/* Scenario groups */
.scenario-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.scenario-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: var(--spacing-xs);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.group-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.group-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.attempt-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.best-grade {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

/* Sessions grid */
.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

/* Scenario card */
.scenario-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.scenario-card.clickable {
  cursor: pointer;
}

.scenario-card.clickable:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  flex-shrink: 0;
}

.status-badge.active {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.status-badge.active i {
  color: var(--color-info);
}

.status-badge.completed {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-badge.completed i {
  color: var(--color-success);
}

.status-badge.abandoned {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.status-badge.abandoned i {
  color: var(--color-danger);
}

/* Card body */
.card-body {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex: 1;
}

/* Progress row */
.progress-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.progress-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.progress-bar-container {
  flex: 1;
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: var(--border-radius-full);
  transition: width var(--transition-slow);
}

.progress-bar-fill.active {
  background: var(--color-primary);
}

.progress-bar-fill.completed {
  background: var(--color-success);
}

.progress-bar-fill.abandoned {
  background: var(--color-danger);
}

.progress-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* Grade row */
.grade-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.grade-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.grade-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.grade-high {
  color: var(--color-success);
}

.grade-medium {
  color: var(--color-warning);
}

.grade-low {
  color: var(--color-danger);
}

/* Timestamps */
.timestamps {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timestamp-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.timestamp-row i {
  width: 14px;
  text-align: center;
  font-size: 10px;
}

/* Card footer */
.card-footer {
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: var(--border-width-thin) solid var(--color-border-light);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.resume-btn,
.abandon-btn,
.review-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.filter-tab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.scenario-card.clickable:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-color: var(--color-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .my-scenarios-page {
    padding: var(--spacing-md);
  }

  .sessions-grid {
    grid-template-columns: 1fr;
  }

  .filter-tabs {
    overflow-x: auto;
  }
}
</style>
