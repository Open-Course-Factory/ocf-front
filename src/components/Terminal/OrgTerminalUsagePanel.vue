<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <div v-if="canManage" class="collapsible-section">
    <button
      type="button"
      class="collapsible-header"
      @click="isExpanded = !isExpanded"
    >
      <i class="fas" :class="isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
      <i class="fas fa-users-cog header-icon"></i>
      {{ t('orgTerminalUsage.title') }}
      <span v-if="!loading && usageData" class="usage-badge" :class="badgeColorClass">
        {{ usageData.active_terminals }}/{{ usageData.max_terminals }}
      </span>
      <span v-else-if="loading" class="usage-badge">
        <i class="fas fa-spinner fa-spin"></i>
      </span>
    </button>

    <div v-show="isExpanded" class="collapsible-content">
      <!-- Error state -->
      <div v-if="fetchError && !loading" class="error-banner">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('orgTerminalUsage.fetchError') }}
        <button type="button" class="retry-btn" @click="loadUsage">
          <i class="fas fa-redo"></i>
          {{ t('orgTerminalUsage.retry') }}
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-else-if="loading" class="skeleton-wrapper">
        <div class="skeleton skeleton-bar"></div>
        <div class="skeleton skeleton-bar short"></div>
        <div class="skeleton skeleton-row"></div>
        <div class="skeleton skeleton-row"></div>
      </div>

      <template v-else-if="usageData">
        <!-- Header row with refresh -->
        <div class="usage-header">
          <span class="plan-label">
            <i class="fas fa-id-badge"></i>
            {{ usageData.plan_name }}
            <small v-if="usageData.is_fallback" class="text-muted fallback-hint">
              ({{ t('orgTerminalUsage.fallback') }})
            </small>
          </span>
          <button
            type="button"
            class="refresh-btn"
            :disabled="refreshing"
            :title="t('orgTerminalUsage.refresh')"
            @click="refreshUsage"
          >
            <i :class="refreshing ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
            {{ t('orgTerminalUsage.refresh') }}
          </button>
        </div>

        <!-- Warning banner -->
        <div v-if="showWarning" class="warning-banner">
          <i class="fas fa-exclamation-triangle"></i>
          {{ t('orgTerminalUsage.warning') }}
        </div>

        <!-- Progress bar -->
        <div class="progress-section">
          <div class="progress-label">
            <span class="progress-text">
              {{ t('orgTerminalUsage.inUse', { active: usageData.active_terminals, max: usageData.max_terminals }) }}
            </span>
            <span class="progress-pct" :class="progressColorClass">{{ usagePct }}%</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :class="progressColorClass"
              :style="{ width: `${Math.min(usagePct, 100)}%` }"
            ></div>
          </div>
        </div>

        <!-- User breakdown -->
        <div class="users-section">
          <div class="users-header">
            <i class="fas fa-user-circle"></i>
            {{ t('orgTerminalUsage.usersHeader') }}
          </div>

          <!-- Empty state -->
          <div v-if="usageData.users.length === 0" class="empty-state">
            <i class="fas fa-terminal fa-2x"></i>
            <p>{{ t('orgTerminalUsage.noActiveTerminals') }}</p>
          </div>

          <ul v-else class="users-list">
            <li v-for="user in usageData.users" :key="user.user_id" class="user-row">
              <div class="user-info">
                <span class="user-name">
                  <i class="fas fa-user-circle"></i>
                  {{ user.display_name }}
                </span>
                <span class="user-email text-muted">{{ user.email }}</span>
              </div>
              <span class="user-count" :class="{ 'count-warning': user.active_count >= 2 }">
                <i class="fas fa-terminal"></i>
                {{ user.active_count }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Auto-refresh info -->
        <div class="usage-info">
          <small class="text-muted">
            <i class="fas fa-info-circle"></i>
            {{ t('orgTerminalUsage.autoRefreshInfo', { seconds: AUTO_REFRESH_SECONDS }) }}
          </small>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { terminalService } from '../../services/domain/terminal/terminalService'
import { usePermissionsStore } from '../../stores/permissions'
import type { OrgTerminalUsage } from '../../types/terminal'

interface Props {
  organizationId: string | null
}

const props = defineProps<Props>()

const { t } = useTranslations({
  en: {
    orgTerminalUsage: {
      title: 'Org Terminal Usage',
      inUse: '{active} of {max} terminals in use',
      warning: 'Warning: approaching terminal limit',
      noActiveTerminals: 'No active terminals',
      usersHeader: 'Active users',
      fallback: 'fallback plan',
      refresh: 'Refresh',
      retry: 'Retry',
      fetchError: 'Could not load terminal usage data.',
      autoRefreshInfo: 'Auto-refreshes every {seconds} seconds.',
    }
  },
  fr: {
    orgTerminalUsage: {
      title: 'Utilisation des terminaux',
      inUse: '{active} terminaux sur {max} en cours d\'utilisation',
      warning: 'Attention : limite presque atteinte',
      noActiveTerminals: 'Aucun terminal actif',
      usersHeader: 'Utilisateurs actifs',
      fallback: 'plan de secours',
      refresh: 'Actualiser',
      retry: 'Réessayer',
      fetchError: 'Impossible de charger les données d\'utilisation des terminaux.',
      autoRefreshInfo: 'Actualisation automatique toutes les {seconds} secondes.',
    }
  }
})

const permissionsStore = usePermissionsStore()

const AUTO_REFRESH_SECONDS = 30

const isExpanded = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const fetchError = ref(false)
const usageData = ref<OrgTerminalUsage | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

// Only show to org managers / owners
const canManage = computed(() => {
  if (!props.organizationId) return false
  return permissionsStore.canManageOrganization(props.organizationId)
})

const usagePct = computed(() => {
  if (!usageData.value || usageData.value.max_terminals <= 0) return 0
  return Math.round((usageData.value.active_terminals / usageData.value.max_terminals) * 100)
})

const progressColorClass = computed(() => {
  const pct = usagePct.value
  if (pct > 80) return 'color-danger'
  if (pct >= 60) return 'color-warning'
  return 'color-success'
})

const badgeColorClass = computed(() => {
  const pct = usagePct.value
  if (pct > 80) return 'badge-danger'
  if (pct >= 60) return 'badge-warning'
  return 'badge-success'
})

const showWarning = computed(() => usagePct.value >= 80)

async function loadUsage() {
  if (!props.organizationId) return
  loading.value = true
  fetchError.value = false
  try {
    usageData.value = await terminalService.getOrgTerminalUsage(props.organizationId)
  } catch {
    fetchError.value = true
  } finally {
    loading.value = false
  }
}

async function refreshUsage() {
  if (!props.organizationId) return
  refreshing.value = true
  fetchError.value = false
  try {
    usageData.value = await terminalService.getOrgTerminalUsage(props.organizationId)
  } catch {
    fetchError.value = true
  } finally {
    refreshing.value = false
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    if (isExpanded.value && props.organizationId) {
      refreshUsage()
    }
  }, AUTO_REFRESH_SECONDS * 1000)
}

function stopAutoRefresh() {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Reload when org context changes
watch(() => props.organizationId, (newId) => {
  if (newId && canManage.value) {
    usageData.value = null
    loadUsage()
  }
})

onMounted(() => {
  if (canManage.value && props.organizationId) {
    loadUsage()
  }
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.collapsible-section {
  margin-top: var(--spacing-lg);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.collapsible-header {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: none;
  text-align: left;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: background-color var(--transition-fast);
}

.collapsible-header:hover {
  background: var(--color-bg-tertiary);
}

.collapsible-header > .fa-chevron-right,
.collapsible-header > .fa-chevron-down {
  color: var(--color-primary);
  transition: transform var(--transition-fast);
}

.header-icon {
  color: var(--color-primary);
}

.collapsible-content {
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

/* Badge */
.usage-badge {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.badge-success {
  background: var(--color-success-bg, rgba(34, 197, 94, 0.12));
  color: var(--color-success, #16a34a);
}

.badge-warning {
  background: var(--color-warning-bg, rgba(251, 191, 36, 0.15));
  color: var(--color-warning, #d97706);
}

.badge-danger {
  background: var(--color-danger-bg, rgba(239, 68, 68, 0.12));
  color: var(--color-danger, #dc2626);
}

/* Error banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-danger-bg, rgba(239, 68, 68, 0.1));
  color: var(--color-danger-text, #dc2626);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.retry-btn {
  margin-left: auto;
  padding: 4px 12px;
  background: transparent;
  border: var(--border-width-thin) solid var(--color-danger, #dc2626);
  color: var(--color-danger, #dc2626);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: background-color var(--transition-fast);
}

.retry-btn:hover {
  background: var(--color-danger-bg, rgba(239, 68, 68, 0.1));
}

/* Skeleton */
.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.skeleton {
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-sm);
  animation: shimmer 1.4s infinite linear;
}

.skeleton-bar {
  height: 12px;
  width: 100%;
}

.skeleton-bar.short {
  width: 60%;
}

.skeleton-row {
  height: 40px;
  width: 100%;
}

@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

/* Header row */
.usage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.plan-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.fallback-hint {
  font-style: italic;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px 12px;
  background: transparent;
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-bg-secondary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Warning banner */
.warning-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-md);
  background: var(--color-warning-bg, rgba(251, 191, 36, 0.15));
  color: var(--color-warning-text, #92400e);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-left: 3px solid var(--color-warning, #d97706);
}

/* Progress bar */
.progress-section {
  margin-bottom: var(--spacing-lg);
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.progress-text {
  color: var(--color-text-secondary);
}

.progress-pct {
  font-weight: var(--font-weight-semibold);
}

.progress-track {
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--border-radius-full);
  transition: width 0.4s ease;
}

/* Color utilities */
.color-success {
  color: var(--color-success, #16a34a);
}

.color-warning {
  color: var(--color-warning, #d97706);
}

.color-danger {
  color: var(--color-danger, #dc2626);
}

.progress-fill.color-success {
  background: var(--color-success, #16a34a);
}

.progress-fill.color-warning {
  background: var(--color-warning, #d97706);
}

.progress-fill.color-danger {
  background: var(--color-danger, #dc2626);
}

/* Users section */
.users-section {
  margin-bottom: var(--spacing-md);
}

.users-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-lg);
  color: var(--color-text-muted);
  text-align: center;
}

.empty-state p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.users-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-light);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.user-email {
  font-size: var(--font-size-xs, 0.75rem);
  padding-left: calc(var(--spacing-sm) + 1em); /* align with name text after icon */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: var(--spacing-md);
}

.user-count.count-warning {
  color: var(--color-warning, #d97706);
}

/* Info footer */
.usage-info {
  padding-top: var(--spacing-sm);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

.text-muted {
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .collapsible-header {
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .collapsible-content {
    padding: var(--spacing-md);
  }

  .user-email {
    display: none;
  }
}
</style>
