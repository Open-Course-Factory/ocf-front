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
        {{ totalOccupyingSlots }}
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

        <!-- Per-member limit subheader (the plan budget applies to EACH member) -->
        <div class="per-member-limit" data-testid="per-member-limit">
          <i class="fas fa-user-shield"></i>
          <span v-if="isUnlimited">
            {{ t('orgTerminalUsage.perMemberUnlimited', { plan: usageData.plan_name }) }}
          </span>
          <span v-else>
            {{ t('orgTerminalUsage.perMemberLimit', { plan: usageData.plan_name, cpu: maxCpuLabel, mem: maxMemoryLabel }) }}
          </span>
        </div>

        <!-- Members list — each member's usage against the per-member cap -->
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

              <div class="user-usage">
                <!-- CPU vs per-member cap -->
                <div class="bar-row">
                  <span class="bar-label">CPU</span>
                  <div class="bar-track">
                    <div
                      v-if="!cpuUnlimited"
                      class="bar-fill"
                      :class="memberCpuColorClass(user)"
                      data-testid="user-cpu-bar-fill"
                      :style="{ width: `${memberCpuPct(user)}%` }"
                    ></div>
                  </div>
                  <span class="bar-meta" data-testid="user-active-cpu">
                    <template v-if="cpuUnlimited">{{ formatMcpuAsVcpu(user.active_cpu) }} vCPU</template>
                    <template v-else>{{ formatMcpuAsVcpu(user.active_cpu) }} / {{ maxCpuLabel }} vCPU</template>
                  </span>
                </div>

                <!-- RAM vs per-member cap -->
                <div class="bar-row">
                  <span class="bar-label">RAM</span>
                  <div class="bar-track">
                    <div
                      v-if="!memUnlimited"
                      class="bar-fill"
                      :class="memberMemColorClass(user)"
                      data-testid="user-mem-bar-fill"
                      :style="{ width: `${memberMemPct(user)}%` }"
                    ></div>
                  </div>
                  <span class="bar-meta" data-testid="user-active-memory">
                    <template v-if="memUnlimited">{{ formatMemoryMb(user.active_memory_mb) }}</template>
                    <template v-else>{{ formatMemoryMb(user.active_memory_mb) }} / {{ maxMemoryLabel }}</template>
                  </span>
                </div>
              </div>

              <span class="user-count" :class="{ 'count-warning': user.occupying_slots >= 2 }">
                <i class="fas fa-terminal"></i>
                {{ user.occupying_slots }}
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
// Org plans apply their CPU/RAM budget PER MEMBER, not as a pooled org-wide
// quota. An org's real ceiling is its backend's physical capacity, which this
// panel does not have. So we show each member's usage against the per-member
// cap — never an org-total / remaining-by-size view (that pool doesn't exist).
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { terminalService } from '../../services/domain/terminal'
import { usePermissionsStore } from '../../stores/permissions'
import { formatMemoryMb } from '../../utils/quotaFormatters'
import { formatMcpuAsVcpu } from '../../utils/formatters'
import type { OrgTerminalUsage, OrgTerminalUsageUser } from '../../types/terminal'

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
      perMemberLimit: 'Plan {plan} — per-member limit: {cpu} vCPU · {mem}',
      perMemberUnlimited: 'Plan {plan} — unlimited per member (capped by the org\'s backend capacity)',
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
      perMemberLimit: 'Forfait {plan} — limite par membre : {cpu} vCPU · {mem}',
      perMemberUnlimited: 'Forfait {plan} — illimité par membre (limité par la capacité du backend de l\'organisation)',
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

// Canonical org-wide budget-scope count (running + stopped-reserving), shown as
// an informational total in the header badge.
const totalOccupyingSlots = computed<number>(() => usageData.value?.occupying_slots ?? 0)

// Per-member plan caps (0 = unlimited on that axis, server convention).
const maxCpu = computed(() => usageData.value?.quota?.max_cpu ?? 0)
const maxMemoryMb = computed(() => usageData.value?.quota?.max_memory_mb ?? 0)

const cpuUnlimited = computed(() => maxCpu.value <= 0)
const memUnlimited = computed(() => maxMemoryMb.value <= 0)
const isUnlimited = computed(() => {
  return usageData.value?.quota?.scope === 'unlimited' || (cpuUnlimited.value && memUnlimited.value)
})

const maxCpuLabel = computed(() => formatMcpuAsVcpu(maxCpu.value))
const maxMemoryLabel = computed(() => formatMemoryMb(maxMemoryMb.value))

function colorClassForPct(pct: number): string {
  if (pct > 80) return 'color-danger'
  if (pct >= 60) return 'color-warning'
  return 'color-success'
}

// A member's usage as a percentage of their own per-member cap.
function memberCpuPct(user: OrgTerminalUsageUser): number {
  if (maxCpu.value <= 0) return 0
  return Math.min(100, Math.round((user.active_cpu / maxCpu.value) * 100))
}

function memberMemPct(user: OrgTerminalUsageUser): number {
  if (maxMemoryMb.value <= 0) return 0
  return Math.min(100, Math.round((user.active_memory_mb / maxMemoryMb.value) * 100))
}

function memberCpuColorClass(user: OrgTerminalUsageUser): string {
  return colorClassForPct(memberCpuPct(user))
}

function memberMemColorClass(user: OrgTerminalUsageUser): string {
  return colorClassForPct(memberMemPct(user))
}

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

/* Per-member limit subheader */
.per-member-limit {
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

.per-member-limit i {
  color: var(--color-primary);
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
  gap: var(--spacing-md);
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
  flex-shrink: 0;
  width: 12em;
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

/* Per-member usage bars */
.user-usage {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.bar-row {
  display: grid;
  grid-template-columns: 3em 1fr auto;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.bar-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono, monospace);
}

.bar-track {
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  border: var(--border-width-thin) solid var(--color-border-light);
}

.bar-fill {
  height: 100%;
  border-radius: var(--border-radius-full);
  transition: width 0.4s ease;
}

.bar-fill.color-success {
  background: var(--color-success);
}

.bar-fill.color-warning {
  background: var(--color-warning);
}

.bar-fill.color-danger {
  background: var(--color-danger);
}

.bar-meta {
  font-family: var(--font-family-mono, monospace);
  color: var(--color-text-primary);
  white-space: nowrap;
  font-size: var(--font-size-xs, 0.75rem);
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

@media (max-width: 768px) {
  .collapsible-header {
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .collapsible-content {
    padding: var(--spacing-md);
  }

  .user-row {
    flex-direction: column;
    align-items: stretch;
  }

  .user-info {
    width: auto;
  }

  .user-email {
    display: none;
  }

  .user-count {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style>
