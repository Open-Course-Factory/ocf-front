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
      <span v-if="!loading && usageData" class="usage-badge badge-budget">
        <i class="fas fa-coins"></i>
        {{ totalActiveSessions }}
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

        <!-- Top-line remaining-capacity summary -->
          <div class="budget-summary" data-testid="budget-summary">
            <i class="fas fa-coins"></i>
            <span v-if="isUnlimited">{{ t('orgTerminalUsage.unlimitedCapacity') }}</span>
            <span v-else-if="budgetSummary !== null">
              {{ t('orgTerminalUsage.remainingSummary', { summary: budgetSummary }) }}
            </span>
            <span v-else>{{ t('orgTerminalUsage.noRemaining') }}</span>
          </div>

          <!-- Per-size capacity table (skipped for unlimited plans) -->
          <div v-if="!isUnlimited && sortedSizeRows.length > 0" class="size-table" data-testid="size-table">
            <div class="size-table-header">
              <i class="fas fa-server"></i>
              {{ t('orgTerminalUsage.sizeTableHeader') }}
            </div>
            <ul class="size-rows">
              <li
                v-for="row in sortedSizeRows"
                :key="row.key"
                class="size-row"
                data-testid="size-row"
              >
                <span class="size-row-label">{{ row.key.toUpperCase() }}</span>
                <div class="size-row-bar">
                  <div
                    class="size-row-fill"
                    :class="row.remaining_count > 0 ? 'color-success' : 'color-danger'"
                    :style="{ width: `${sizeRowFillPct(row)}%` }"
                  ></div>
                </div>
                <span class="size-row-meta">
                  <span v-if="row.remaining_count > 0">
                    {{ t('orgTerminalUsage.sizeAllowsMore', { n: row.remaining_count }) }}
                  </span>
                  <span v-else class="color-muted">
                    {{ t('orgTerminalUsage.sizeNoneAvailable') }}
                  </span>
                </span>
              </li>
            </ul>
          </div>

          <!-- Advanced (vCPU / RAM) — collapsed by default -->
          <details class="advanced-quota" data-testid="advanced-quota">
            <summary class="advanced-summary">
              <i class="fas fa-microchip"></i>
              {{ t('orgTerminalUsage.advancedToggle') }}
            </summary>
            <div class="advanced-body">
              <div class="advanced-row">
                <span class="advanced-label">{{ t('orgTerminalUsage.advancedCpu') }}</span>
                <div class="progress-track">
                  <div
                    v-if="!cpuUnlimited"
                    class="progress-fill"
                    :class="cpuColorClass"
                    :style="{ width: `${cpuUsedPct}%` }"
                  ></div>
                </div>
                <span class="advanced-value">
                  <template v-if="cpuUnlimited">{{ t('orgTerminalUsage.unlimited') }}</template>
                  <template v-else>{{ formatMcpuAsVcpu(usageData.quota.used_cpu) }} / {{ formatMcpuAsVcpu(usageData.quota.max_cpu) }} vCPU</template>
                </span>
              </div>
              <div class="advanced-row">
                <span class="advanced-label">{{ t('orgTerminalUsage.advancedMemory') }}</span>
                <div class="progress-track">
                  <div
                    v-if="!memUnlimited"
                    class="progress-fill"
                    :class="memColorClass"
                    :style="{ width: `${memUsedPct}%` }"
                  ></div>
                </div>
                <span class="advanced-value">
                  <template v-if="memUnlimited">{{ t('orgTerminalUsage.unlimited') }}</template>
                  <template v-else>{{ formatMemoryMb(usageData.quota.used_memory_mb) }} / {{ formatMemoryMb(usageData.quota.max_memory_mb) }}</template>
                </span>
              </div>
            </div>
          </details>

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
              <div class="user-metrics">
                <span
                  class="user-metric user-metric-cpu"
                  :title="t('orgTerminalUsage.advancedCpu')"
                  data-testid="user-active-cpu"
                >
                  <i class="fas fa-microchip"></i>
                  <span class="user-metric-value">{{ formatMcpuAsVcpu(user.active_cpu) }}</span>
                  <span class="user-metric-unit">{{ t('orgTerminalUsage.userActiveCpu') }}</span>
                </span>
                <span
                  class="user-metric user-metric-memory"
                  :title="t('orgTerminalUsage.advancedMemory')"
                  data-testid="user-active-memory"
                >
                  <i class="fas fa-memory"></i>
                  <span class="user-metric-value">{{ formatMemoryMb(user.active_memory_mb) }}</span>
                </span>
                <span class="user-count" :class="{ 'count-warning': user.active_count >= 2 }">
                  <i class="fas fa-terminal"></i>
                  {{ user.active_count }}
                </span>
              </div>
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
import { terminalService } from '../../services/domain/terminal'
import { usePermissionsStore } from '../../stores/permissions'
import {
  summarizeRemaining,
  formatMemoryMb,
  capacityRank,
} from '../../utils/quotaFormatters'
import { formatMcpuAsVcpu } from '../../utils/formatters'
import type { OrgTerminalUsage, SizeRemaining } from '../../types/terminal'

interface Props {
  organizationId: string | null
}

const props = defineProps<Props>()

const { t } = useTranslations({
  en: {
    orgTerminalUsage: {
      title: 'Organization Usage',
      noActiveTerminals: 'No active terminals',
      usersHeader: 'Active users',
      fallback: 'fallback plan',
      refresh: 'Refresh',
      retry: 'Retry',
      fetchError: 'Could not load terminal usage data.',
      autoRefreshInfo: 'Auto-refreshes every {seconds} seconds.',
      remainingSummary: 'Your organization has the budget for {summary} more sessions.',
      noRemaining: 'No remaining capacity.',
      unlimitedCapacity: 'Your organization has unlimited terminal capacity.',
      unlimited: 'Unlimited',
      sizeTableHeader: 'Capacity per size',
      sizeAllowsMore: '{n} more available',
      sizeNoneAvailable: 'Budget allows 0 more',
      advancedToggle: 'Show advanced (vCPU / RAM)',
      advancedCpu: 'CPU used',
      advancedMemory: 'RAM used',
      userActiveCpu: 'CPU',
      userActiveMemory: 'RAM',
    }
  },
  fr: {
    orgTerminalUsage: {
      title: 'Utilisation de l\'organisation',
      noActiveTerminals: 'Aucun terminal actif',
      usersHeader: 'Utilisateurs actifs',
      fallback: 'plan de secours',
      refresh: 'Actualiser',
      retry: 'Réessayer',
      fetchError: 'Impossible de charger les données d\'utilisation des terminaux.',
      autoRefreshInfo: 'Actualisation automatique toutes les {seconds} secondes.',
      remainingSummary: 'Votre organisation a le budget pour {summary} sessions supplémentaires.',
      noRemaining: 'Plus de capacité disponible.',
      unlimitedCapacity: 'Votre organisation dispose d\'une capacité de terminaux illimitée.',
      unlimited: 'Illimité',
      sizeTableHeader: 'Capacité par taille',
      sizeAllowsMore: '{n} encore disponible(s)',
      sizeNoneAvailable: 'Budget épuisé pour cette taille',
      advancedToggle: 'Afficher l\'avancé (vCPU / RAM)',
      advancedCpu: 'CPU utilisé',
      advancedMemory: 'RAM utilisée',
      userActiveCpu: 'CPU',
      userActiveMemory: 'RAM',
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

const totalActiveSessions = computed<number>(() => {
  const users = usageData.value?.users
  if (!users) return 0
  return users.reduce((sum, u) => sum + u.active_count, 0)
})

const budgetSummary = computed<string | null>(() => {
  // Shared helper joins with the passed joiner — pass "/" to preserve the
  // existing "1 XL / 2 L / 3 M" layout (composer uses localized "OR" / "OU").
  // It returns '' for the no-remaining-capacity case; we convert to null so
  // the template can pick the "no remaining" copy via `v-if`.
  const summary = summarizeRemaining(usageData.value?.remaining_by_size, '/')
  return summary === '' ? null : summary
})

const sortedSizeRows = computed<SizeRemaining[]>(() => {
  const rows = usageData.value?.remaining_by_size
  if (!rows || rows.length === 0) return []
  return [...rows].sort((a, b) => capacityRank(a.key) - capacityRank(b.key))
})

const maxRemainingCount = computed<number>(() => {
  let max = 0
  for (const row of sortedSizeRows.value) {
    if (row.remaining_count > max) max = row.remaining_count
  }
  return max
})

function sizeRowFillPct(row: SizeRemaining): number {
  // Show fill proportional to this size's remaining capacity relative to the
  // largest remaining bucket. Empty buckets render an empty bar.
  if (maxRemainingCount.value <= 0) return 0
  return Math.min(100, Math.round((row.remaining_count / maxRemainingCount.value) * 100))
}

const cpuUsedPct = computed<number>(() => {
  const q = usageData.value?.quota
  if (!q || q.max_cpu <= 0) return 0
  return Math.min(100, Math.round((q.used_cpu / q.max_cpu) * 100))
})

const memUsedPct = computed<number>(() => {
  const q = usageData.value?.quota
  if (!q || q.max_memory_mb <= 0) return 0
  return Math.min(100, Math.round((q.used_memory_mb / q.max_memory_mb) * 100))
})

// An axis is unlimited when its budget is 0 (server convention). The plan is
// unlimited overall when the backend says so via `scope`, or when both axes are.
const cpuUnlimited = computed(() => (usageData.value?.quota?.max_cpu ?? 0) <= 0)
const memUnlimited = computed(() => (usageData.value?.quota?.max_memory_mb ?? 0) <= 0)
const isUnlimited = computed(() => {
  return usageData.value?.quota?.scope === 'unlimited' || (cpuUnlimited.value && memUnlimited.value)
})

function colorClassForPct(pct: number): string {
  if (pct > 80) return 'color-danger'
  if (pct >= 60) return 'color-warning'
  return 'color-success'
}

const cpuColorClass = computed(() => colorClassForPct(cpuUsedPct.value))
const memColorClass = computed(() => colorClassForPct(memUsedPct.value))

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
  background: var(--color-success-bg);
  color: var(--color-success);
}

.badge-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.badge-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

/* Error banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.retry-btn {
  margin-left: auto;
  padding: 4px 12px;
  background: transparent;
  border: var(--border-width-thin) solid var(--color-danger);
  color: var(--color-danger);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: background-color var(--transition-fast);
}

.retry-btn:hover {
  background: var(--color-danger-bg);
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
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-left: 3px solid var(--color-warning);
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
  color: var(--color-success);
}

.color-warning {
  color: var(--color-warning);
}

.color-danger {
  color: var(--color-danger);
}

.progress-fill.color-success {
  background: var(--color-success);
}

.progress-fill.color-warning {
  background: var(--color-warning);
}

.progress-fill.color-danger {
  background: var(--color-danger);
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
  color: var(--color-warning);
}

/* Info footer */
.usage-info {
  padding-top: var(--spacing-sm);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

.text-muted {
  color: var(--color-text-muted);
}

/* Budget-mode badge */
.badge-budget {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* Budget summary */
.budget-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.budget-summary i {
  color: var(--color-primary);
}

/* Per-size table */
.size-table {
  margin-bottom: var(--spacing-lg);
}

.size-table-header {
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

.size-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.size-row {
  display: grid;
  grid-template-columns: 3em 1fr auto;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.size-row-label {
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-mono, monospace);
  color: var(--color-text-primary);
}

.size-row-bar {
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.size-row-fill {
  height: 100%;
  border-radius: var(--border-radius-full);
  transition: width 0.3s ease;
}

.size-row-fill.color-success {
  background: var(--color-success);
}

.size-row-fill.color-danger {
  background: var(--color-danger);
  opacity: 0.4;
}

.size-row-meta {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.color-muted {
  color: var(--color-text-muted);
}

/* Advanced (vCPU / RAM) section */
.advanced-quota {
  margin-bottom: var(--spacing-md);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
}

.advanced-summary {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  user-select: none;
}

.advanced-summary i {
  color: var(--color-primary);
}

.advanced-body {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.advanced-row {
  display: grid;
  grid-template-columns: 6em 1fr auto;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-xs, 0.75rem);
}

.advanced-label {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.advanced-value {
  font-family: var(--font-family-mono, monospace);
  color: var(--color-text-primary);
  white-space: nowrap;
}

/* User metrics (budget mode) */
.user-metrics {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  margin-left: var(--spacing-md);
}

.user-metric {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono, monospace);
  white-space: nowrap;
}

.user-metric i {
  color: var(--color-text-muted);
}

.user-metric-unit {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
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

  .size-row {
    grid-template-columns: 2.5em 1fr auto;
    gap: var(--spacing-sm);
  }

  .advanced-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
  }

  .user-metric-unit {
    display: none;
  }
}
</style>
