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
      exportSuccess: 'CSV export downloaded'
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
      exportSuccess: 'Export CSV téléchargé'
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

// Computed
const currentPage = computed(() => Math.floor(currentOffset.value / pageSize) + 1)
const totalPages = computed(() => Math.ceil(total.value / pageSize))
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

function handleRefresh() {
  currentOffset.value = 0
  fetchCommands()
}

// Watch for filter changes: reset pagination and re-fetch
watch(includeStopped, () => {
  currentOffset.value = 0
  fetchCommands()
})

// Watch for groupId changes
watch(() => props.groupId, () => {
  currentOffset.value = 0
  fetchCommands()
})

onMounted(() => {
  fetchCommands()
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
      <p>{{ includeStopped ? t('groupCommandHistory.empty') : t('groupCommandHistory.emptyWithStopped') }}</p>
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
