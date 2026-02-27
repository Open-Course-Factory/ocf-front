<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="terminal-backends-page">
    <div class="page-header">
      <h2>{{ t('terminalBackends.pageTitle') }}</h2>
      <div class="header-actions">
        <Button
          variant="primary"
          size="md"
          :icon="backendsStore.isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
          :disabled="backendsStore.isLoading"
          @click="handleRefresh"
        >
          {{ t('terminalBackends.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Summary Banner -->
    <div v-if="backendsStore.backends.length > 0" class="status-banner" :class="`status-${overallStatus}`">
      <div class="status-indicator">
        <i :class="overallStatusIcon"></i>
        <span class="status-label">{{ t('terminalBackends.status') }}:</span>
        <strong>{{ onlineCount }}/{{ backendsStore.backends.length }} {{ t('terminalBackends.online') }}</strong>
      </div>
      <div v-if="offlineCount > 0" class="status-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('terminalBackends.offlineWarning', { count: offlineCount }) }}
      </div>
    </div>

    <!-- Backends Grid -->
    <div v-if="backendsStore.backends.length > 0" class="backends-grid">
      <div
        v-for="backend in backendsStore.backends"
        :key="backend.id"
        :class="['backend-card', { 'offline': !backend.connected }]"
      >
        <div class="card-header">
          <div class="card-title-row">
            <span class="connection-dot" :class="backend.connected ? 'online' : 'offline'"></span>
            <h3>{{ backend.name || backend.id }}</h3>
            <span v-if="backend.is_default" class="default-badge">
              {{ t('terminalBackends.default') }}
            </span>
          </div>
          <span class="connection-label" :class="backend.connected ? 'text-success' : 'text-danger'">
            {{ backend.connected ? t('terminalBackends.connected') : t('terminalBackends.disconnected') }}
          </span>
        </div>

        <p v-if="backend.description" class="card-description">{{ backend.description }}</p>

        <div class="card-footer">
          <span class="backend-id">{{ backend.id }}</span>
          <Button
            v-if="backend.connected && !backend.is_default"
            size="sm"
            variant="outline-primary"
            icon="fas fa-star"
            :loading="settingDefault === backend.id"
            :disabled="!!settingDefault"
            @click="setAsDefault(backend.id)"
          >
            {{ t('terminalBackends.setDefault') }}
          </Button>
          <span v-else-if="backend.is_default" class="current-default-label">
            <i class="fas fa-star"></i> {{ t('terminalBackends.currentDefault') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="backendsStore.isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p>{{ t('terminalBackends.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="backendsStore.error" class="error-state">
      <i class="fas fa-exclamation-triangle fa-3x"></i>
      <p>{{ backendsStore.error }}</p>
      <Button variant="primary" @click="handleRefresh">
        {{ t('terminalBackends.refresh') }}
      </Button>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="fas fa-server fa-3x"></i>
      <p>{{ t('terminalBackends.noBackends') }}</p>
    </div>

    <!-- Auto-refresh info -->
    <div v-if="backendsStore.backends.length > 0" class="last-update">
      <i class="fas fa-sync-alt"></i>
      <span>{{ t('terminalBackends.autoRefresh', { seconds: autoRefreshInterval / 1000 }) }}</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTerminalBackendsStore } from '../../../stores/terminalBackends'
import { useTranslations } from '../../../composables/useTranslations'
import Button from '../../UI/Button.vue'

const backendsStore = useTerminalBackendsStore()
const settingDefault = ref<string | null>(null)

const autoRefreshInterval = 30000
let refreshIntervalId: NodeJS.Timeout | null = null

const { t } = useTranslations({
  en: {
    terminalBackends: {
      pageTitle: 'Terminal Backends',
      refresh: 'Refresh',
      status: 'Status',
      online: 'online',
      connected: 'Connected',
      disconnected: 'Disconnected',
      default: 'Default',
      setDefault: 'Set as Default',
      currentDefault: 'System Default',
      offlineWarning: '{count} backend(s) offline',
      loading: 'Loading backends...',
      noBackends: 'No backends configured',
      autoRefresh: 'Auto-refreshing every {seconds} seconds'
    }
  },
  fr: {
    terminalBackends: {
      pageTitle: 'Backends Terminal',
      refresh: 'Actualiser',
      status: 'Statut',
      online: 'en ligne',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      default: 'Par défaut',
      setDefault: 'Définir par défaut',
      currentDefault: 'Défaut système',
      offlineWarning: '{count} backend(s) hors ligne',
      loading: 'Chargement des backends...',
      noBackends: 'Aucun backend configuré',
      autoRefresh: 'Actualisation automatique toutes les {seconds} secondes'
    }
  }
})

const onlineCount = computed(() => backendsStore.onlineBackends.length)
const offlineCount = computed(() => backendsStore.backends.length - onlineCount.value)

const overallStatus = computed(() => {
  if (onlineCount.value === 0) return 'critical'
  if (offlineCount.value > 0) return 'warning'
  return 'healthy'
})

const overallStatusIcon = computed(() => {
  switch (overallStatus.value) {
    case 'healthy': return 'fas fa-check-circle'
    case 'warning': return 'fas fa-exclamation-triangle'
    case 'critical': return 'fas fa-exclamation-circle'
    default: return 'fas fa-question-circle'
  }
})

async function handleRefresh() {
  await backendsStore.fetchBackends()
}

async function setAsDefault(backendId: string) {
  settingDefault.value = backendId
  try {
    await backendsStore.setSystemDefault(backendId)
    await backendsStore.fetchBackends()
  } finally {
    settingDefault.value = null
  }
}

onMounted(async () => {
  await backendsStore.fetchBackends()

  refreshIntervalId = setInterval(async () => {
    try {
      await backendsStore.fetchBackends()
    } catch {
      // Silent refresh failure
    }
  }, autoRefreshInterval)
})

onBeforeUnmount(() => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
  }
})
</script>

<style scoped>
.terminal-backends-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.page-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 2rem;
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

/* Status Banner */
.status-banner {
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  border-left: 4px solid;
}

.status-banner.status-healthy {
  background-color: var(--color-success-bg);
  border-left-color: var(--color-success);
  color: var(--color-success-text);
}

.status-banner.status-warning {
  background-color: var(--color-warning-bg);
  border-left-color: var(--color-warning);
  color: var(--color-warning-text);
}

.status-banner.status-critical {
  background-color: var(--color-danger-bg);
  border-left-color: var(--color-danger);
  color: var(--color-danger-text);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
}

.status-indicator i {
  font-size: var(--font-size-xl);
}

.status-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

/* Backends Grid */
.backends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.backend-card {
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base);
}

.backend-card:hover {
  box-shadow: var(--shadow-md);
}

.backend-card.offline {
  opacity: 0.6;
  background: var(--color-bg-secondary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-title-row h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.connection-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connection-dot.online {
  background-color: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.connection-dot.offline {
  background-color: var(--color-danger);
}

.default-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  background-color: var(--color-primary);
  color: var(--color-white);
}

.connection-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }

.card-description {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

.backend-id {
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.current-default-label {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* Loading / Error / Empty States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.error-state {
  color: var(--color-danger-text);
}

.empty-state i {
  opacity: 0.4;
}

/* Last Update */
.last-update {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .terminal-backends-page {
    padding: var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .backends-grid {
    grid-template-columns: 1fr;
  }
}
</style>
