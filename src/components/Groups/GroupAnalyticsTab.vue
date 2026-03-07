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
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'

interface ScenarioAssignment {
  id: string
  scenario_id: string
  group_id: string
  scenario?: {
    id: string
    name: string
    title: string
    difficulty: string
  }
}

interface ScenarioAnalytics {
  scenario_id: string
  scenario_title: string
  difficulty: string
  started_count: number
  completed_count: number
  completion_rate: number
  avg_grade: number
  avg_time_seconds: number
}

const props = defineProps<{
  groupId: string
  canEditGroup: boolean
}>()

const { t } = useTranslations({
  en: {
    groupAnalytics: {
      analyticsTitle: 'Scenario Analytics',
      totalStarted: 'Total Started',
      totalCompleted: 'Total Completed',
      completionRate: 'Completion Rate',
      avgGrade: 'Avg Grade',
      avgTime: 'Avg Time',
      exportCsv: 'Export CSV',
      noData: 'No analytics data available yet.',
      scenario: 'Scenario',
      difficulty: 'Difficulty',
      started: 'Started',
      completed: 'Completed',
      loadError: 'Failed to load analytics data',
      difficultyBeginner: 'Beginner',
      difficultyIntermediate: 'Intermediate',
      difficultyAdvanced: 'Advanced'
    }
  },
  fr: {
    groupAnalytics: {
      analyticsTitle: 'Analyses des scénarios',
      totalStarted: 'Total démarrées',
      totalCompleted: 'Total terminées',
      completionRate: 'Taux de complétion',
      avgGrade: 'Moyenne note',
      avgTime: 'Temps moyen',
      exportCsv: 'Exporter CSV',
      noData: 'Aucune donnée analytique disponible.',
      scenario: 'Scénario',
      difficulty: 'Difficulté',
      started: 'Démarrées',
      completed: 'Terminées',
      loadError: 'Échec du chargement des analyses',
      difficultyBeginner: 'Débutant',
      difficultyIntermediate: 'Intermédiaire',
      difficultyAdvanced: 'Avancé'
    }
  }
})

// State
const analyticsData = ref<ScenarioAnalytics[]>([])
const isLoading = ref(false)
const error = ref('')

// Summary computed
const totalStarted = computed(() =>
  analyticsData.value.reduce((sum, a) => sum + a.started_count, 0)
)

const totalCompleted = computed(() =>
  analyticsData.value.reduce((sum, a) => sum + a.completed_count, 0)
)

const overallCompletionRate = computed(() => {
  if (totalStarted.value === 0) return 0
  return Math.round((totalCompleted.value / totalStarted.value) * 100)
})

// Methods
async function loadAnalytics() {
  isLoading.value = true
  error.value = ''
  try {
    // First get assignments for this group
    const assignResponse = await axios.get('/scenario-assignments', {
      params: { group_id: props.groupId }
    })
    const assignments: ScenarioAssignment[] = assignResponse.data?.data || assignResponse.data || []

    // Fetch analytics for each assigned scenario
    const results: ScenarioAnalytics[] = []
    for (const assignment of assignments) {
      try {
        const analyticsResponse = await axios.get(
          `/teacher/groups/${props.groupId}/scenarios/${assignment.scenario_id}/analytics`
        )
        const data = analyticsResponse.data
        results.push({
          scenario_id: assignment.scenario_id,
          scenario_title: data.scenario_title || assignment.scenario?.title || assignment.scenario_id,
          difficulty: data.difficulty || assignment.scenario?.difficulty || '',
          started_count: data.started_count || 0,
          completed_count: data.completed_count || 0,
          completion_rate: data.completion_rate || 0,
          avg_grade: data.avg_grade || 0,
          avg_time_seconds: data.avg_time_seconds || 0
        })
      } catch (err) {
        console.error(`Failed to load analytics for scenario ${assignment.scenario_id}:`, err)
      }
    }
    analyticsData.value = results
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('groupAnalytics.loadError')
  } finally {
    isLoading.value = false
  }
}

function formatTime(seconds: number): string {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  if (hours > 0) return `${hours}h ${remainMins}m`
  return `${mins}m`
}

function getDifficultyClass(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'difficulty-beginner'
    case 'intermediate': return 'difficulty-intermediate'
    case 'advanced': return 'difficulty-advanced'
    default: return ''
  }
}

function translateDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    beginner: t('groupAnalytics.difficultyBeginner'),
    intermediate: t('groupAnalytics.difficultyIntermediate'),
    advanced: t('groupAnalytics.difficultyAdvanced')
  }
  return difficultyMap[difficulty] || difficulty
}

function exportCsv() {
  const escape = (s: string) => s.replace(/"/g, '""')
  const headers = [
    t('groupAnalytics.scenario'),
    t('groupAnalytics.difficulty'),
    t('groupAnalytics.started'),
    t('groupAnalytics.completed'),
    t('groupAnalytics.completionRate'),
    t('groupAnalytics.avgGrade'),
    t('groupAnalytics.avgTime')
  ]
  const header = headers.map(h => `"${escape(h)}"`).join(',') + '\n'
  const rows = analyticsData.value
    .map(a => `"${escape(a.scenario_title)}","${escape(translateDifficulty(a.difficulty))}",${a.started_count},${a.completed_count},${a.completion_rate}%,${a.avg_grade.toFixed(1)},${formatTime(a.avg_time_seconds)}`)
    .join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-group-${props.groupId}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  loadAnalytics()
})
</script>

<template>
  <div class="analytics-tab">
    <div class="tab-header">
      <h3>{{ t('groupAnalytics.analyticsTitle') }}</h3>
      <button
        v-if="analyticsData.length > 0"
        @click="exportCsv"
        class="btn btn-secondary"
      >
        <i class="fas fa-download"></i>
        {{ t('groupAnalytics.exportCsv') }}
      </button>
    </div>

    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <div v-if="isLoading" class="loading-state" role="status">
      <i class="fas fa-spinner fa-spin"></i>
    </div>

    <div v-else-if="analyticsData.length === 0" class="empty-state">
      <i class="fas fa-chart-bar"></i>
      <p>{{ t('groupAnalytics.noData') }}</p>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="summary-cards" role="status">
        <div class="summary-card">
          <div class="summary-value">{{ totalStarted }}</div>
          <div class="summary-label">{{ t('groupAnalytics.totalStarted') }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">{{ totalCompleted }}</div>
          <div class="summary-label">{{ t('groupAnalytics.totalCompleted') }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">{{ overallCompletionRate }}%</div>
          <div class="summary-label">{{ t('groupAnalytics.completionRate') }}</div>
          <div class="summary-bar">
            <div class="summary-bar-fill" :style="{ width: overallCompletionRate + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Per-scenario table -->
      <div class="analytics-table-container">
        <table class="analytics-table" :aria-label="t('groupAnalytics.analyticsTitle')">
          <thead>
            <tr>
              <th>{{ t('groupAnalytics.scenario') }}</th>
              <th>{{ t('groupAnalytics.difficulty') }}</th>
              <th>{{ t('groupAnalytics.started') }}</th>
              <th>{{ t('groupAnalytics.completed') }}</th>
              <th>{{ t('groupAnalytics.completionRate') }}</th>
              <th>{{ t('groupAnalytics.avgGrade') }}</th>
              <th>{{ t('groupAnalytics.avgTime') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in analyticsData" :key="row.scenario_id">
              <td class="scenario-name">{{ row.scenario_title }}</td>
              <td>
                <span :class="['difficulty-badge', getDifficultyClass(row.difficulty)]">
                  {{ translateDifficulty(row.difficulty) }}
                </span>
              </td>
              <td>{{ row.started_count }}</td>
              <td>{{ row.completed_count }}</td>
              <td>
                <div class="rate-cell">
                  <div class="rate-bar">
                    <div class="rate-bar-fill" :style="{ width: row.completion_rate + '%' }"></div>
                  </div>
                  <span>{{ row.completion_rate }}%</span>
                </div>
              </td>
              <td>{{ row.avg_grade > 0 ? row.avg_grade.toFixed(1) : '-' }}</td>
              <td>{{ formatTime(row.avg_time_seconds) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.analytics-tab {
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

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.summary-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  text-align: center;
}

.summary-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.summary-bar {
  margin-top: var(--spacing-sm);
  height: 6px;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.summary-bar-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width var(--transition-base);
}

/* Analytics Table */
.analytics-table-container {
  overflow-x: auto;
}

.analytics-table {
  width: 100%;
  border-collapse: collapse;
}

.analytics-table th,
.analytics-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
}

.analytics-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-secondary);
}

.analytics-table tbody tr:hover {
  background-color: var(--color-bg-secondary);
}

.scenario-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
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

.rate-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.rate-bar {
  width: 80px;
  height: 6px;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.rate-bar-fill {
  height: 100%;
  background-color: var(--color-success);
  transition: width var(--transition-base);
}

.rate-cell span {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
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
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
