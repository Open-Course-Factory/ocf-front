<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Group Command History component
 * Displays aggregated command history for all members in a class group
 * with server-side pagination, CSV export, and session filtering
 */
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'

interface CommandEntry {
  student_name: string
  student_email: string
  session_uuid: string
  sequence_num: number
  command_text: string
  executed_at: number
}

interface CommandHistoryResponse {
  commands: CommandEntry[]
  total: number
  limit: number
  offset: number
}

interface StudentStats {
  student_name: string
  student_email: string
  total_commands: number
  session_count: number
  total_time_seconds: number
  last_active_at: number
}

interface StatsSummary {
  total_commands: number
  total_sessions: number
  active_students: number
  avg_commands_per_student: number
  avg_time_per_student_seconds: number
}

interface StatsResponse {
  summary: StatsSummary
  students: StudentStats[]
}

interface Props {
  groupId: string
}

const props = defineProps<Props>()

const { t } = useTranslations({
  en: {
    groupCommandHistory: {
      // Header
      title: 'Command History',

      // Toolbar
      includeStopped: 'Include stopped sessions',
      exportCsv: 'Export CSV',
      refresh: 'Refresh',

      // Table headers
      colStudent: 'Student',
      colCommand: 'Command',
      colTime: 'Time',

      // Pagination
      showing: 'Showing {start}-{end} of {total}',
      previous: 'Previous',
      next: 'Next',

      // States
      loading: 'Loading command history...',
      empty: 'No commands recorded yet.',
      emptyWithStopped: 'No commands found. Try including stopped sessions.',
      errorLoad: 'Failed to load command history',
      exportError: 'Failed to export command history',
      exportSuccess: 'CSV export downloaded',

      // Search
      searchPlaceholder: 'Search commands...',
      searchClear: 'Clear search',
      noSearchResults: 'No commands match your search.',

      // Stats summary cards
      statTotalCommands: 'Total Commands',
      statActiveStudents: 'Active Students',
      statTotalSessions: 'Sessions',
      statAvgTime: 'Avg Time / Student',

      // Per-student breakdown
      studentBreakdown: 'Per-Student Breakdown',
      colStudentName: 'Student',
      colCommands: 'Commands',
      colSessions: 'Sessions',
      colTimeSpent: 'Time Spent',
      colLastActive: 'Last Active',
      noStudentData: 'No student activity data available.',

      // Time formatting
      timeHours: '{h}h {m}m',
      timeMinutes: '{m}m',
      timeLessThanMinute: '< 1m'
    }
  },
  fr: {
    groupCommandHistory: {
      // Header
      title: 'Historique des commandes',

      // Toolbar
      includeStopped: 'Inclure les sessions arrêtées',
      exportCsv: 'Exporter CSV',
      refresh: 'Actualiser',

      // Table headers
      colStudent: 'Apprenant',
      colCommand: 'Commande',
      colTime: 'Heure',

      // Pagination
      showing: '{start}-{end} sur {total}',
      previous: 'Précédent',
      next: 'Suivant',

      // States
      loading: 'Chargement de l\'historique des commandes...',
      empty: 'Aucune commande enregistrée.',
      emptyWithStopped: 'Aucune commande trouvée. Essayez d\'inclure les sessions arrêtées.',
      errorLoad: 'Échec du chargement de l\'historique des commandes',
      exportError: 'Échec de l\'exportation de l\'historique',
      exportSuccess: 'Export CSV téléchargé',

      // Search
      searchPlaceholder: 'Rechercher des commandes...',
      searchClear: 'Effacer la recherche',
      noSearchResults: 'Aucune commande ne correspond à votre recherche.',

      // Stats summary cards
      statTotalCommands: 'Commandes totales',
      statActiveStudents: 'Apprenants actifs',
      statTotalSessions: 'Sessions',
      statAvgTime: 'Temps moy. / Apprenant',

      // Per-student breakdown
      studentBreakdown: 'Détail par apprenant',
      colStudentName: 'Apprenant',
      colCommands: 'Commandes',
      colSessions: 'Sessions',
      colTimeSpent: 'Temps passé',
      colLastActive: 'Dernière activité',
      noStudentData: 'Aucune donnée d\'activité disponible.',

      // Time formatting
      timeHours: '{h}h {m}min',
      timeMinutes: '{m}min',
      timeLessThanMinute: '< 1min'
    }
  }
})

const { showSuccess, showError: showErrorNotification } = useNotification()

// State
const commands = ref<CommandEntry[]>([])
const total = ref(0)
const isLoading = ref(false)
const error = ref('')
const includeStopped = ref(false)
const pageSize = 50
const currentOffset = ref(0)
const searchQuery = ref('')
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

// Stats state
const stats = ref<StatsResponse | null>(null)
const isLoadingStats = ref(false)

// Computed
const hasPrevious = computed(() => currentOffset.value > 0)
const hasNext = computed(() => currentOffset.value + pageSize < total.value)

const showingStart = computed(() => {
  if (total.value === 0) return 0
  return currentOffset.value + 1
})

const showingEnd = computed(() => {
  return Math.min(currentOffset.value + pageSize, total.value)
})

// Methods
function formatCommandTime(unixSeconds: number): string {
  try {
    const date = new Date(unixSeconds * 1000)
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return String(unixSeconds)
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return t('groupCommandHistory.timeLessThanMinute')
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return t('groupCommandHistory.timeHours', { h: hours, m: minutes })
  return t('groupCommandHistory.timeMinutes', { m: minutes })
}

function formatLastActive(unixSeconds: number): string {
  if (!unixSeconds) return '-'
  try {
    const date = new Date(unixSeconds * 1000)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return '-'
  }
}

async function fetchStats() {
  isLoadingStats.value = true
  try {
    const params: Record<string, string> = {}
    if (includeStopped.value) {
      params.include_stopped = 'true'
    }
    const response = await axios.get<StatsResponse>(
      `/class-groups/${props.groupId}/command-history-stats`,
      { params }
    )
    stats.value = response.data
  } catch {
    stats.value = null
  } finally {
    isLoadingStats.value = false
  }
}

async function fetchCommands() {
  isLoading.value = true
  error.value = ''

  try {
    const params: Record<string, string | number> = {
      limit: pageSize,
      offset: currentOffset.value,
      format: 'json'
    }

    if (includeStopped.value) {
      params.include_stopped = 'true'
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    const response = await axios.get<CommandHistoryResponse>(
      `/class-groups/${props.groupId}/command-history`,
      { params }
    )

    const data = response.data
    commands.value = data.commands || []
    total.value = data.total || 0
  } catch (err: any) {
    error.value = err.response?.data?.error_message ||
                  err.response?.data?.message ||
                  t('groupCommandHistory.errorLoad')
    commands.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

async function exportCsv() {
  try {
    const params: Record<string, string> = {
      format: 'csv',
      limit: '1000'
    }

    if (includeStopped.value) {
      params.include_stopped = 'true'
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    const response = await axios.get(
      `/class-groups/${props.groupId}/command-history`,
      {
        params,
        responseType: 'blob'
      }
    )

    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `command-history-group-${props.groupId}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showSuccess(t('groupCommandHistory.exportSuccess'))
  } catch (err: any) {
    console.error('Failed to export CSV:', err)
    showErrorNotification(t('groupCommandHistory.exportError'))
  }
}

function goToPreviousPage() {
  if (hasPrevious.value) {
    currentOffset.value = Math.max(0, currentOffset.value - pageSize)
    fetchCommands()
  }
}

function goToNextPage() {
  if (hasNext.value) {
    currentOffset.value = currentOffset.value + pageSize
    fetchCommands()
  }
}

function handleSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    currentOffset.value = 0
    fetchCommands()
  }, 400)
}

function clearSearch() {
  searchQuery.value = ''
  currentOffset.value = 0
  fetchCommands()
}

function handleRefresh() {
  currentOffset.value = 0
  fetchCommands()
  fetchStats()
}

// Watch for filter changes: reset pagination and re-fetch
watch(includeStopped, () => {
  currentOffset.value = 0
  fetchCommands()
  fetchStats()
})

// Watch for groupId changes
watch(() => props.groupId, () => {
  currentOffset.value = 0
  fetchCommands()
  fetchStats()
})

onMounted(() => {
  fetchCommands()
  fetchStats()
})
</script>

<template>
  <div class="group-command-history">
    <!-- Toolbar -->
    <div class="history-toolbar">
      <label class="toggle-label">
        <input
          type="checkbox"
          v-model="includeStopped"
          class="toggle-checkbox"
        />
        <span class="toggle-text">{{ t('groupCommandHistory.includeStopped') }}</span>
      </label>

      <div class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          v-model="searchQuery"
          @input="handleSearchInput"
          class="search-input"
          :placeholder="t('groupCommandHistory.searchPlaceholder')"
        />
        <button
          v-if="searchQuery"
          class="search-clear"
          @click="clearSearch"
          :aria-label="t('groupCommandHistory.searchClear')"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="toolbar-actions">
        <button
          class="btn btn-secondary btn-sm"
          @click="exportCsv"
          :disabled="isLoading || total === 0"
        >
          <i class="fas fa-file-csv"></i>
          {{ t('groupCommandHistory.exportCsv') }}
        </button>
        <button
          class="btn btn-secondary btn-sm"
          @click="handleRefresh"
          :disabled="isLoading"
        >
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i>
          {{ t('groupCommandHistory.refresh') }}
        </button>
      </div>
    </div>

    <!-- Stats Summary Cards -->
    <div v-if="stats?.summary" class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.summary.total_commands.toLocaleString() }}</div>
        <div class="stat-label">{{ t('groupCommandHistory.statTotalCommands') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.summary.active_students }}</div>
        <div class="stat-label">{{ t('groupCommandHistory.statActiveStudents') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.summary.total_sessions }}</div>
        <div class="stat-label">{{ t('groupCommandHistory.statTotalSessions') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatDuration(stats.summary.avg_time_per_student_seconds) }}</div>
        <div class="stat-label">{{ t('groupCommandHistory.statAvgTime') }}</div>
      </div>
    </div>

    <!-- Per-Student Breakdown -->
    <div v-if="stats?.students && stats.students.length > 0" class="student-breakdown">
      <h4 class="breakdown-title">
        <i class="fas fa-users"></i>
        {{ t('groupCommandHistory.studentBreakdown') }}
      </h4>
      <div class="breakdown-table-wrapper">
        <table class="history-table">
          <thead>
            <tr>
              <th>{{ t('groupCommandHistory.colStudentName') }}</th>
              <th class="col-numeric">{{ t('groupCommandHistory.colCommands') }}</th>
              <th class="col-numeric">{{ t('groupCommandHistory.colSessions') }}</th>
              <th>{{ t('groupCommandHistory.colTimeSpent') }}</th>
              <th>{{ t('groupCommandHistory.colLastActive') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in stats.students" :key="student.student_email">
              <td>
                <div class="student-cell">
                  <span class="student-name">{{ student.student_name }}</span>
                  <span class="student-email">{{ student.student_email }}</span>
                </div>
              </td>
              <td class="col-numeric">{{ student.total_commands.toLocaleString() }}</td>
              <td class="col-numeric">{{ student.session_count }}</td>
              <td>{{ formatDuration(student.total_time_seconds) }}</td>
              <td>{{ formatLastActive(student.last_active_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Command History Section Header -->
    <h4 v-if="stats?.summary" class="section-title">
      <i class="fas fa-terminal"></i>
      {{ t('groupCommandHistory.title') }}
    </h4>

    <!-- Loading State -->
    <div v-if="isLoading && commands.length === 0" class="history-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>{{ t('groupCommandHistory.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="history-state history-error">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary btn-sm" @click="handleRefresh">
        <i class="fas fa-redo"></i>
        {{ t('groupCommandHistory.refresh') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="commands.length === 0 && !isLoading" class="history-state">
      <i class="fas fa-terminal"></i>
      <p>{{ searchQuery.trim() ? t('groupCommandHistory.noSearchResults') : (includeStopped ? t('groupCommandHistory.empty') : t('groupCommandHistory.emptyWithStopped')) }}</p>
    </div>

    <!-- Command Table -->
    <template v-else>
      <div class="history-table-wrapper">
        <table class="history-table">
          <thead>
            <tr>
              <th class="col-student">{{ t('groupCommandHistory.colStudent') }}</th>
              <th class="col-command">{{ t('groupCommandHistory.colCommand') }}</th>
              <th class="col-time">{{ t('groupCommandHistory.colTime') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cmd in commands" :key="`${cmd.session_uuid}-${cmd.sequence_num}`">
              <td class="col-student">
                <div class="student-cell">
                  <span class="student-name">{{ cmd.student_name }}</span>
                  <span class="student-email">{{ cmd.student_email }}</span>
                </div>
              </td>
              <td class="col-command">
                <code class="command-text">{{ cmd.command_text }}</code>
              </td>
              <td class="col-time">
                <span class="time-text">{{ formatCommandTime(cmd.executed_at) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="history-pagination">
        <span class="pagination-info">
          {{ t('groupCommandHistory.showing', {
            start: showingStart,
            end: showingEnd,
            total: total
          }) }}
        </span>
        <div class="pagination-buttons">
          <button
            class="btn btn-secondary btn-sm"
            :disabled="!hasPrevious || isLoading"
            @click="goToPreviousPage"
          >
            <i class="fas fa-chevron-left"></i>
            {{ t('groupCommandHistory.previous') }}
          </button>
          <button
            class="btn btn-secondary btn-sm"
            :disabled="!hasNext || isLoading"
            @click="goToNextPage"
          >
            {{ t('groupCommandHistory.next') }}
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.group-command-history {
  width: 100%;
}

/* Toolbar */
.history-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  user-select: none;
}

.toggle-checkbox {
  accent-color: var(--color-primary);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.toggle-text {
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Search */
.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-md) var(--spacing-xs) calc(var(--spacing-sm) + 20px);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  outline: none;
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  border-color: var(--color-primary);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-clear {
  position: absolute;
  right: var(--spacing-xs);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--spacing-xs);
  font-size: var(--font-size-sm);
  line-height: 1;
}

.search-clear:hover {
  color: var(--color-text-primary);
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  text-align: center;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Student Breakdown */
.student-breakdown {
  margin-bottom: var(--spacing-lg);
}

.breakdown-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.breakdown-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
}

.col-numeric {
  text-align: right;
}

/* Section Title */
.section-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* States */
.history-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
  text-align: center;
}

.history-state i {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.history-state p {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-sm);
}

.history-error {
  color: var(--color-danger);
}

.history-error i {
  opacity: 1;
}

/* Table */
.history-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table thead th {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  background-color: var(--color-bg-secondary);
  border-bottom: 2px solid var(--color-border-light);
  white-space: nowrap;
}

.history-table tbody tr {
  transition: background-color var(--transition-fast);
}

.history-table tbody tr:hover {
  background-color: var(--color-bg-secondary);
}

.history-table tbody td {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: top;
}

/* Student Column */
.col-student {
  min-width: 160px;
}

.student-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.student-email {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Command Column */
.col-command {
  min-width: 200px;
}

.command-text {
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  background-color: var(--color-bg-tertiary);
  padding: 2px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  word-break: break-all;
}

/* Time Column */
.col-time {
  white-space: nowrap;
  min-width: 140px;
}

.time-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Pagination */
.history-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.pagination-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .history-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions {
    justify-content: flex-end;
  }

  .student-email {
    display: none;
  }

  .col-time {
    min-width: auto;
  }

  .time-text {
    font-size: var(--font-size-xs);
  }

  .history-pagination {
    flex-direction: column;
    align-items: center;
  }
}
</style>
