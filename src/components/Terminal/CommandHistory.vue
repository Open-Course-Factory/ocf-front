<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Command History component for terminal sessions
 * Displays recorded commands with export and delete capabilities
 */
-->

<template>
  <div class="command-history">
    <div class="command-history-header">
      <h4>
        <button class="btn-collapse" @click="toggleCollapse" :aria-label="isCollapsed ? t('history.showHistory') : t('history.hideHistory')" :title="isCollapsed ? t('history.showHistory') : t('history.hideHistory')">
          <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-down'"></i>
        </button>
        <i class="fas fa-history"></i> {{ t('history.title') }}
      </h4>
      <div v-show="!isCollapsed && commands.length > 0" class="command-history-search">
        <input
          type="text"
          v-model="searchFilter"
          class="search-filter-input"
          :placeholder="t('history.filterPlaceholder')"
        />
      </div>
      <div v-show="!isCollapsed" class="command-history-actions">
        <button class="btn btn-sm btn-outline-primary" @click="exportCSV" :disabled="commands.length === 0" :aria-label="t('history.exportCSV')">
          <i class="fas fa-file-csv"></i> CSV
        </button>
        <button class="btn btn-sm btn-outline-primary" @click="exportJSON" :disabled="commands.length === 0" :aria-label="t('history.exportJSON')">
          <i class="fas fa-file-code"></i> JSON
        </button>
        <button class="btn btn-sm btn-outline-danger" @click="confirmDelete" :disabled="commands.length === 0" :aria-label="t('history.deleteAll')">
          <i class="fas fa-trash"></i> {{ t('history.delete') }}
        </button>
      </div>
    </div>
    <div v-show="!isCollapsed" class="command-list" ref="commandListRef">
      <div v-if="filteredCommands.length === 0 && commands.length === 0 && !isLoading" class="empty-state">
        <i class="fas fa-terminal"></i>
        <p>{{ t('history.empty') }}</p>
      </div>
      <div v-if="isLoading && commands.length === 0" class="empty-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ t('history.loading') }}</p>
      </div>
      <div v-if="filteredCommands.length === 0 && commands.length > 0 && !isLoading" class="empty-state">
        <i class="fas fa-search"></i>
        <p>{{ t('history.noFilterResults') }}</p>
      </div>
      <div v-for="cmd in filteredCommands" :key="cmd.sequence_num" class="command-entry">
        <span class="command-time">{{ formatTime(cmd.executed_at) }}</span>
        <span class="command-text">{{ cmd.command_text }}</span>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <BaseModal
      :visible="showDeleteConfirm"
      :title="t('history.deleteConfirmTitle')"
      title-icon="fas fa-exclamation-triangle"
      size="small"
      :show-close="true"
      @close="showDeleteConfirm = false"
    >
      <p>{{ t('history.deleteConfirmMessage') }}</p>
      <template #footer>
        <button class="btn btn-danger" @click="deleteHistory">
          <i class="fas fa-trash"></i> {{ t('history.deleteConfirm') }}
        </button>
        <button class="btn btn-secondary" @click="showDeleteConfirm = false">
          {{ t('history.cancel') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import BaseModal from '../Modals/BaseModal.vue'

interface CommandEntry {
  sequence_num: number
  command_text: string
  executed_at: number
}

interface Props {
  sessionId?: string
  isActive: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sessionId: undefined,
  isActive: false
})

const { t } = useTranslations({
  en: {
    history: {
      title: 'Command History',
      empty: 'No commands recorded yet. Start typing in the terminal to see your command history.',
      loading: 'Loading command history...',
      delete: 'Delete',
      deleteConfirmTitle: 'Delete Command History',
      deleteConfirmMessage: 'Are you sure you want to delete all recorded commands? This action cannot be undone.',
      deleteConfirm: 'Delete all',
      cancel: 'Cancel',
      deleteSuccess: 'Command history deleted',
      deleteError: 'Failed to delete command history',
      exportError: 'Failed to export command history',
      exportCSV: 'Export as CSV',
      exportJSON: 'Export as JSON',
      deleteAll: 'Delete all command history',
      showHistory: 'Show history',
      hideHistory: 'Hide history',
      exportSuccess: 'Export successful',
      filterPlaceholder: 'Filter commands...',
      noFilterResults: 'No commands match your filter.'
    }
  },
  fr: {
    history: {
      title: 'Historique des commandes',
      empty: 'Aucune commande enregistrée. Commencez à taper dans le terminal pour voir votre historique de commandes.',
      loading: 'Chargement de l\'historique des commandes...',
      delete: 'Supprimer',
      deleteConfirmTitle: 'Supprimer l\'historique des commandes',
      deleteConfirmMessage: 'Êtes-vous sûr de vouloir supprimer toutes les commandes enregistrées ? Cette action est irréversible.',
      deleteConfirm: 'Tout supprimer',
      cancel: 'Annuler',
      deleteSuccess: 'Historique des commandes supprimé',
      deleteError: 'Échec de la suppression de l\'historique',
      exportError: 'Échec de l\'exportation de l\'historique',
      exportCSV: 'Exporter en CSV',
      exportJSON: 'Exporter en JSON',
      deleteAll: 'Supprimer tout l\'historique des commandes',
      showHistory: 'Afficher l\'historique',
      hideHistory: 'Masquer l\'historique',
      exportSuccess: 'Export réussi',
      filterPlaceholder: 'Filtrer les commandes...',
      noFilterResults: 'Aucune commande ne correspond au filtre.'
    }
  }
})

const { showSuccess, showError: showErrorNotification } = useNotification()

const isCollapsed = ref(true)
const COLLAPSED_KEY = 'terminal_history_collapsed'
const savedCollapsed = localStorage.getItem(COLLAPSED_KEY)
if (savedCollapsed !== null) {
  isCollapsed.value = savedCollapsed === 'true'
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(COLLAPSED_KEY, String(isCollapsed.value))
  if (isCollapsed.value) {
    stopPolling()
  } else if (props.isActive && props.sessionId) {
    startPolling()
  }
}

const commands = ref<CommandEntry[]>([])
const isLoading = ref(false)
const showDeleteConfirm = ref(false)
const commandListRef = ref<HTMLElement | null>(null)
const searchFilter = ref('')

const filteredCommands = computed(() => {
  if (!searchFilter.value.trim()) return commands.value
  const query = searchFilter.value.trim().toLowerCase()
  return commands.value.filter(cmd => cmd.command_text.toLowerCase().includes(query))
})
let pollInterval: ReturnType<typeof setTimeout> | null = null
let lastTimestamp: number | null = null
let errorCount = 0
let emptyResponseCount = 0
const MAX_POLL_INTERVAL = 30000
const BASE_POLL_INTERVAL = 3000

function formatTime(unixSeconds: number): string {
  try {
    const date = new Date(unixSeconds * 1000)
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return String(unixSeconds)
  }
}

async function fetchHistory() {
  if (!props.sessionId) return

  try {
    isLoading.value = commands.value.length === 0
    const params: Record<string, string> = {}
    if (lastTimestamp !== null) {
      params.since = String(lastTimestamp)
    } else {
      params.limit = '1000'
    }

    const response = await axios.get(`/terminals/${props.sessionId}/history`, { params })
    const data = response.data

    // API returns { commands: [...] } from ocf-core proxy
    let newCommands: CommandEntry[] = []
    if (data && Array.isArray(data.commands)) {
      newCommands = data.commands
    } else if (Array.isArray(data)) {
      // Fallback: direct array response
      newCommands = data
    }

    if (newCommands.length > 0) {
      errorCount = 0
      emptyResponseCount = 0

      if (lastTimestamp) {
        // Append new commands, avoiding duplicates by sequence_num
        const existingNums = new Set(commands.value.map(c => c.sequence_num))
        const toAdd = newCommands.filter(c => !existingNums.has(c.sequence_num))
        if (toAdd.length > 0) {
          commands.value = [...commands.value, ...toAdd]
          await nextTick()
          scrollToBottom()
        }
      } else {
        commands.value = newCommands
        await nextTick()
        scrollToBottom()
      }

      // Update timestamp to last command's execution time
      const lastCmd = newCommands[newCommands.length - 1]
      if (lastCmd?.executed_at != null) {
        lastTimestamp = lastCmd.executed_at
      }
    } else {
      emptyResponseCount++
    }
  } catch (error) {
    console.error('Failed to fetch command history:', error)
    errorCount++
  } finally {
    isLoading.value = false
  }
}

function scrollToBottom() {
  if (commandListRef.value) {
    commandListRef.value.scrollTop = commandListRef.value.scrollHeight
  }
}

function schedulePoll() {
  stopPolling()
  const interval = Math.min(BASE_POLL_INTERVAL * (1 + emptyResponseCount), MAX_POLL_INTERVAL)
  pollInterval = setTimeout(async () => {
    await fetchHistory()
    if (props.isActive && props.sessionId && !isCollapsed.value) {
      schedulePoll()
    }
  }, interval)
}

function startPolling() {
  if (isCollapsed.value) return
  stopPolling()
  lastTimestamp = null
  commands.value = []
  errorCount = 0
  emptyResponseCount = 0
  fetchHistory()
  schedulePoll()
}

function stopPolling() {
  if (pollInterval) {
    clearTimeout(pollInterval)
    pollInterval = null
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopPolling()
  } else if (props.isActive && props.sessionId) {
    startPolling()
  }
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function exportCSV() {
  if (!props.sessionId) return

  try {
    const response = await axios.get(`/terminals/${props.sessionId}/history`, {
      params: { format: 'csv' },
      responseType: 'text'
    })
    // Only trigger download if we actually got CSV content
    if (typeof response.data !== 'string' || response.data.trim().startsWith('{')) {
      showErrorNotification(t('history.exportError'))
      return
    }
    triggerDownload(
      response.data,
      `command-history-${props.sessionId}.csv`,
      'text/csv'
    )
    showSuccess(t('history.exportSuccess'))
  } catch (error) {
    console.error('Failed to export CSV:', error)
    showErrorNotification(t('history.exportError'))
  }
}

async function exportJSON() {
  if (!props.sessionId) return

  try {
    const response = await axios.get(`/terminals/${props.sessionId}/history`, {
      params: { format: 'json' }
    })
    const jsonContent = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
    triggerDownload(
      jsonContent,
      `command-history-${props.sessionId}.json`,
      'application/json'
    )
    showSuccess(t('history.exportSuccess'))
  } catch (error) {
    console.error('Failed to export JSON:', error)
    showErrorNotification(t('history.exportError'))
  }
}

function confirmDelete() {
  showDeleteConfirm.value = true
}

async function deleteHistory() {
  if (!props.sessionId) return

  try {
    await axios.delete(`/terminals/${props.sessionId}/history`)
    commands.value = []
    lastTimestamp = null
    showDeleteConfirm.value = false
    showSuccess(t('history.deleteSuccess'))
  } catch (error) {
    console.error('Failed to delete command history:', error)
    showDeleteConfirm.value = false
    showErrorNotification(t('history.deleteError'))
  }
}

// Watch active state and terminal ID to start/stop polling
watch(
  () => [props.isActive, props.sessionId] as const,
  ([active, termId]) => {
    if (active && termId) {
      startPolling()
    } else {
      stopPolling()
    }
  },
  { immediate: true }
)

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.command-history {
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.command-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.command-history-title {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;
}

.collapse-icon {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
}

.btn-collapse {
  background: none;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: 0;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
}

.btn-collapse:hover {
  color: var(--color-primary);
}

.command-history-search {
  padding: 0 var(--spacing-sm);
}

.search-filter-input {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  outline: none;
  font-family: var(--font-family-monospace);
}

.search-filter-input:focus {
  border-color: var(--color-primary);
}

.search-filter-input::placeholder {
  color: var(--color-text-muted);
}

.command-history-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.command-list {
  max-height: 300px;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
  text-align: center;
}

.empty-state i {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-sm);
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.command-entry {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-sm);
  transition: background-color var(--transition-fast);
}

.command-entry:hover {
  background-color: var(--color-bg-secondary);
}

.command-time {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  white-space: nowrap;
  flex-shrink: 0;
}

.command-text {
  color: var(--color-text-primary);
  word-break: break-all;
}

@media (max-width: 768px) {
  .command-history-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .command-history-actions {
    justify-content: flex-end;
  }

  .command-list {
    max-height: 200px;
  }
}
</style>
