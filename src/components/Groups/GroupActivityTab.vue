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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'

interface ActiveSession {
  user_id: string
  user_name?: string
  user_email?: string
  scenario_id: string
  scenario_title?: string
  current_step: number
  total_steps: number
  started_at: string
  status: string
}

const props = defineProps<{
  groupId: string
  canViewHistory: boolean
}>()

const { t } = useTranslations({
  en: {
    groupActivity: {
      activeSessionsTitle: 'Active Sessions',
      student: 'Student',
      scenario: 'Scenario',
      progress: 'Progress',
      elapsedTime: 'Elapsed Time',
      status: 'Status',
      filterByScenario: 'Filter by scenario',
      allScenarios: 'All scenarios',
      noActiveSessions: 'No active sessions at the moment.',
      autoRefresh: 'Auto-refresh every 30s',
      loadError: 'Failed to load activity data',
      statusActive: 'Active',
      statusPaused: 'Paused',
      statusCompleted: 'Completed'
    }
  },
  fr: {
    groupActivity: {
      activeSessionsTitle: 'Sessions actives',
      student: 'Étudiant',
      scenario: 'Scénario',
      progress: 'Progression',
      elapsedTime: 'Temps écoulé',
      status: 'Statut',
      filterByScenario: 'Filtrer par scénario',
      allScenarios: 'Tous les scénarios',
      noActiveSessions: 'Aucune session active pour le moment.',
      autoRefresh: 'Rafraîchissement automatique toutes les 30s',
      loadError: 'Échec du chargement des données d\'activité',
      statusActive: 'Actif',
      statusPaused: 'En pause',
      statusCompleted: 'Terminé'
    }
  }
})

// State
const sessions = ref<ActiveSession[]>([])
const isLoading = ref(false)
const error = ref('')
const scenarioFilter = ref('')
let refreshInterval: ReturnType<typeof setInterval> | null = null

// Computed
const uniqueScenarios = computed(() => {
  const map = new Map<string, string>()
  for (const s of sessions.value) {
    if (s.scenario_id && !map.has(s.scenario_id)) {
      map.set(s.scenario_id, s.scenario_title || s.scenario_id)
    }
  }
  return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
})

const filteredSessions = computed(() => {
  if (!scenarioFilter.value) return sessions.value
  return sessions.value.filter(s => s.scenario_id === scenarioFilter.value)
})

// Methods
async function loadActivity() {
  isLoading.value = true
  error.value = ''
  try {
    const response = await axios.get(`/teacher/groups/${props.groupId}/activity`)
    sessions.value = response.data?.sessions || response.data?.data || response.data || []
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('groupActivity.loadError')
  } finally {
    isLoading.value = false
  }
}

function formatElapsed(startedAt: string): string {
  const start = new Date(startedAt)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'active': return 'status-active'
    case 'paused': return 'status-paused'
    case 'completed': return 'status-completed'
    default: return ''
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return t('groupActivity.statusActive')
    case 'paused': return t('groupActivity.statusPaused')
    case 'completed': return t('groupActivity.statusCompleted')
    default: return status
  }
}

function progressPercent(current: number, total: number): number {
  if (!total) return 0
  return Math.round((current / total) * 100)
}

onMounted(() => {
  loadActivity()
  refreshInterval = setInterval(loadActivity, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
</script>

<template>
  <div class="activity-tab">
    <div class="tab-header">
      <h3>{{ t('groupActivity.activeSessionsTitle') }}</h3>
      <div class="header-controls">
        <select
          v-model="scenarioFilter"
          class="filter-select"
        >
          <option value="">{{ t('groupActivity.allScenarios') }}</option>
          <option
            v-for="sc in uniqueScenarios"
            :key="sc.id"
            :value="sc.id"
          >
            {{ sc.title }}
          </option>
        </select>
        <span class="auto-refresh-badge">
          <i class="fas fa-sync-alt"></i>
          {{ t('groupActivity.autoRefresh') }}
        </span>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="isLoading && sessions.length === 0" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
    </div>

    <div v-else-if="filteredSessions.length === 0" class="empty-state">
      <i class="fas fa-desktop"></i>
      <p>{{ t('groupActivity.noActiveSessions') }}</p>
    </div>

    <div v-else class="sessions-table-container">
      <table class="sessions-table">
        <thead>
          <tr>
            <th>{{ t('groupActivity.student') }}</th>
            <th>{{ t('groupActivity.scenario') }}</th>
            <th>{{ t('groupActivity.progress') }}</th>
            <th>{{ t('groupActivity.elapsedTime') }}</th>
            <th>{{ t('groupActivity.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in filteredSessions" :key="session.user_id + session.scenario_id">
            <td>
              <div class="student-cell">
                <div class="student-avatar">
                  {{ (session.user_name || session.user_email || session.user_id).charAt(0).toUpperCase() }}
                </div>
                <div class="student-info">
                  <span class="student-name">{{ session.user_name || session.user_id }}</span>
                  <span v-if="session.user_email" class="student-email">{{ session.user_email }}</span>
                </div>
              </div>
            </td>
            <td>{{ session.scenario_title || session.scenario_id }}</td>
            <td>
              <div class="progress-cell">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: progressPercent(session.current_step, session.total_steps) + '%' }"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ session.current_step }}/{{ session.total_steps }}
                </span>
              </div>
            </td>
            <td>{{ formatElapsed(session.started_at) }}</td>
            <td>
              <span :class="['status-chip', getStatusClass(session.status)]">
                {{ getStatusLabel(session.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.activity-tab {
  padding: 0;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.tab-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.filter-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.auto-refresh-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
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

.sessions-table-container {
  overflow-x: auto;
}

.sessions-table {
  width: 100%;
  border-collapse: collapse;
}

.sessions-table th,
.sessions-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
}

.sessions-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-secondary);
}

.sessions-table tbody tr:hover {
  background-color: var(--color-bg-secondary);
}

.student-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.student-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-full);
  background-color: var(--color-primary);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.student-info {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.student-email {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.progress-bar {
  width: 100px;
  height: 6px;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width var(--transition-base);
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
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

.status-paused {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.status-completed {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
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
  .tab-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-controls {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-select {
    width: 100%;
  }
}
</style>
