<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Organization Student Sessions Tab
 * Displays terminal sessions and command histories for organization students
 */
-->

<template>
  <div class="student-sessions">
    <!-- Header -->
    <div class="sessions-header">
      <div class="header-info">
        <h3>
          <i class="fas fa-terminal"></i>
          {{ t('sessions.title') }}
        </h3>
        <p class="session-count" v-if="!isLoading && !error">
          {{ filteredSessions.length }} {{ t('sessions.sessionsCount') }}
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="!isLoading && !error && sessions.length > 0" class="filters-bar">
      <div class="search-input-wrapper">
        <i class="fas fa-search"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="t('sessions.searchPlaceholder')"
        />
      </div>
      <div class="status-filter">
        <select v-model="statusFilter" class="filter-select">
          <option value="all">{{ t('sessions.allStatuses') }}</option>
          <option value="active">{{ t('sessions.statusActive') }}</option>
          <option value="stopped">{{ t('sessions.statusStopped') }}</option>
          <option value="expired">{{ t('sessions.statusExpired') }}</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p>{{ t('sessions.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadSessions">
        <i class="fas fa-redo"></i>
        {{ t('sessions.retry') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="sessions.length === 0" class="empty-state">
      <i class="fas fa-terminal fa-3x"></i>
      <p>{{ t('sessions.empty') }}</p>
    </div>

    <!-- No Search Results -->
    <div v-else-if="filteredSessions.length === 0" class="empty-state">
      <i class="fas fa-search fa-2x"></i>
      <p>{{ t('sessions.noResults') }}</p>
    </div>

    <!-- Sessions Table -->
    <div v-else class="sessions-table-wrapper">
      <table class="sessions-table">
        <thead>
          <tr>
            <th></th>
            <th>{{ t('sessions.colStudent') }}</th>
            <th>{{ t('sessions.colName') }}</th>
            <th>{{ t('sessions.colStatus') }}</th>
            <th>{{ t('sessions.colInstanceType') }}</th>
            <th>{{ t('sessions.colCreated') }}</th>
            <th>{{ t('sessions.colExpires') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="session in filteredSessions" :key="session.id">
            <tr
              class="session-row"
              :class="{ expanded: expandedSessionId === session.session_id }"
              @click="toggleSession(session.session_id)"
            >
              <td class="expand-cell">
                <i :class="expandedSessionId === session.session_id ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
              </td>
              <td class="student-cell">
                <div class="student-info">
                  <div class="student-avatar">
                    <i class="fas fa-user"></i>
                  </div>
                  <span>{{ session.user_display_name || session.user_id }}</span>
                </div>
              </td>
              <td>{{ session.name || '-' }}</td>
              <td>
                <span :class="['status-badge', `status-${getStatusClass(session.status)}`]">
                  {{ t(`sessions.status${capitalize(session.status)}`) }}
                </span>
              </td>
              <td>{{ session.instance_type || '-' }}</td>
              <td>{{ formatDateTime(session.created_at) }}</td>
              <td>{{ session.expires_at ? formatDateTime(session.expires_at) : '-' }}</td>
            </tr>
            <tr v-if="expandedSessionId === session.session_id" class="history-row">
              <td colspan="7">
                <div class="history-container">
                  <CommandHistory
                    :session-id="session.session_id"
                    :is-active="session.status === 'active'"
                  />
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'
import CommandHistory from '../Terminal/CommandHistory.vue'

interface TerminalSession {
  id: string
  session_id: string
  user_id: string
  user_display_name?: string
  name: string
  status: string
  instance_type: string
  machine_size: string
  created_at: string
  expires_at: string
  backend: string
  organization_id: string
}

interface Props {
  organizationId: string
}

const props = defineProps<Props>()

const { t } = useTranslations({
  en: {
    sessions: {
      title: 'Student Sessions',
      sessionsCount: 'sessions',
      loading: 'Loading sessions...',
      retry: 'Retry',
      empty: 'No terminal sessions found for this organization.',
      noResults: 'No sessions match your search criteria.',
      searchPlaceholder: 'Search by student or session name...',
      allStatuses: 'All statuses',
      statusActive: 'Active',
      statusStopped: 'Stopped',
      statusExpired: 'Expired',
      colStudent: 'Student',
      colName: 'Session Name',
      colStatus: 'Status',
      colInstanceType: 'Instance Type',
      colCreated: 'Created',
      colExpires: 'Expires',
      errorLoad: 'Failed to load sessions',
    }
  },
  fr: {
    sessions: {
      title: 'Sessions des apprenants',
      sessionsCount: 'sessions',
      loading: 'Chargement des sessions...',
      retry: 'Réessayer',
      empty: 'Aucune session de terminal trouvée pour cette organisation.',
      noResults: 'Aucune session ne correspond à vos critères de recherche.',
      searchPlaceholder: 'Rechercher par apprenant ou nom de session...',
      allStatuses: 'Tous les statuts',
      statusActive: 'Active',
      statusStopped: 'Arrêtée',
      statusExpired: 'Expirée',
      colStudent: 'Apprenant',
      colName: 'Nom de la session',
      colStatus: 'Statut',
      colInstanceType: 'Type d\'instance',
      colCreated: 'Créée le',
      colExpires: 'Expire le',
      errorLoad: 'Échec du chargement des sessions',
    }
  }
})

const sessions = ref<TerminalSession[]>([])
const isLoading = ref(false)
const error = ref('')
const searchQuery = ref('')
const statusFilter = ref('all')
const expandedSessionId = ref<string | null>(null)

const filteredSessions = computed(() => {
  let result = sessions.value

  if (statusFilter.value !== 'all') {
    result = result.filter(s => s.status === statusFilter.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(s =>
      (s.user_display_name && s.user_display_name.toLowerCase().includes(query)) ||
      (s.user_id && s.user_id.toLowerCase().includes(query)) ||
      (s.name && s.name.toLowerCase().includes(query))
    )
  }

  return result
})

function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'active': return 'active'
    case 'stopped': return 'stopped'
    case 'expired': return 'expired'
    default: return 'stopped'
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString(undefined, {
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

function toggleSession(sessionId: string) {
  if (expandedSessionId.value === sessionId) {
    expandedSessionId.value = null
  } else {
    expandedSessionId.value = sessionId
  }
}

async function loadSessions() {
  isLoading.value = true
  error.value = ''
  try {
    const response = await axios.get(`/organizations/${props.organizationId}/terminal-sessions`)
    const data = response.data
    if (data && Array.isArray(data.sessions)) {
      sessions.value = data.sessions
    } else if (Array.isArray(data)) {
      sessions.value = data
    } else {
      sessions.value = []
    }
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.message || t('sessions.errorLoad')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSessions()
})
</script>

<style scoped>
.student-sessions {
  width: 100%;
}

.sessions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-info h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.session-count {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0 0.75rem;
  flex: 1;
}

.search-input-wrapper i {
  color: var(--color-text-muted);
  margin-right: 0.5rem;
}

.search-input {
  border: none;
  background: transparent;
  padding: 0.625rem 0;
  width: 100%;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  outline: none;
}

.filter-select {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  outline: none;
}

.filter-select:focus {
  border-color: var(--color-primary);
}

.loading-state,
.empty-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.loading-state i,
.empty-state i,
.error-state i {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.error-state {
  color: var(--color-danger);
}

.error-state .btn {
  margin-top: 1rem;
}

.sessions-table-wrapper {
  overflow-x: auto;
}

.sessions-table {
  width: 100%;
  border-collapse: collapse;
}

.sessions-table thead th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
}

.sessions-table tbody td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light, var(--color-border));
}

.session-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.session-row:hover {
  background-color: var(--color-bg-secondary);
}

.session-row.expanded {
  background-color: var(--color-bg-secondary);
}

.expand-cell {
  width: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.expand-cell i {
  transition: transform 0.2s ease;
  font-size: 0.75rem;
}

.student-cell .student-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.student-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-active {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-stopped {
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}

.status-expired {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.history-row td {
  padding: 0;
  border-bottom: 2px solid var(--color-border);
}

.history-container {
  padding: 1rem;
  background: var(--color-bg-secondary);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }

  .sessions-table thead th,
  .sessions-table tbody td {
    padding: 0.5rem;
    font-size: 0.8rem;
  }
}
</style>
