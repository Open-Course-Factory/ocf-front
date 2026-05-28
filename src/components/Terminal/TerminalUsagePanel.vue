<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <div class="collapsible-section">
    <button
      type="button"
      class="collapsible-header"
      @click="isExpanded = !isExpanded"
    >
      <i class="fas" :class="isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
      {{ t('terminals.currentUsage') }}
      <span v-if="usage" class="usage-badge">
        <i class="fas fa-terminal"></i>
        {{ usage.active_sessions.length }}
      </span>
      <button
        type="button"
        class="refresh-icon-btn"
        :disabled="loading"
        :title="t('terminals.refreshUsage')"
        @click.stop="loadUsage(true)"
      >
        <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
      </button>
    </button>

    <div v-show="isExpanded" class="collapsible-content">
      <!-- Loading skeleton (only on first load) -->
      <div v-if="loading && !usage" class="skeleton-wrapper">
        <div class="skeleton skeleton-bar"></div>
        <div class="skeleton skeleton-bar short"></div>
        <div class="skeleton skeleton-row"></div>
      </div>

      <template v-else-if="usage">
        <!-- Plan + source -->
        <div class="info-line">
          <span class="info-label">
            <i class="fas fa-id-badge"></i>
            {{ t('terminals.planSource') }}:
          </span>
          <span class="info-value">
            {{ usage.plan_name }}
            <small class="text-muted">({{ planSourceLabel }})</small>
          </span>
        </div>

        <!-- Capacity reminder -->
        <div class="info-line">
          <span class="info-label">
            <i class="fas fa-server"></i>
            {{ t('terminals.capacity') }}:
          </span>
          <span class="info-value">{{ capacityLabel }}</span>
        </div>

        <!-- Progress bars -->
        <div class="bars-section">
          <div class="bar-row">
            <span class="bar-label">CPU</span>
            <div class="bar-track">
              <div
                v-if="!cpuUnlimited"
                class="bar-fill"
                data-test="cpu-bar-fill"
                :style="{ width: `${cpuUsedPct}%` }"
              ></div>
            </div>
            <span class="bar-meta">
              <template v-if="cpuUnlimited">{{ t('terminals.unlimited') }}</template>
              <template v-else>{{ usage.used_cpu }} / {{ usage.max_cpu }} vCPU</template>
            </span>
          </div>
          <div class="bar-row">
            <span class="bar-label">RAM</span>
            <div class="bar-track">
              <div
                v-if="!memUnlimited"
                class="bar-fill"
                data-test="mem-bar-fill"
                :style="{ width: `${memUsedPct}%` }"
              ></div>
            </div>
            <span class="bar-meta">
              <template v-if="memUnlimited">{{ t('terminals.unlimited') }}</template>
              <template v-else>{{ formatMemoryMb(usage.used_memory_mb) }} / {{ formatMemoryMb(usage.max_memory_mb) }}</template>
            </span>
          </div>
        </div>

        <!-- Sessions list -->
        <div class="sessions-section">
          <div class="sessions-header">
            <i class="fas fa-terminal"></i>
            {{ t('terminals.budget.sessionsHeader') }} ({{ usage.active_sessions.length }})
          </div>
          <div
            v-if="usage.active_sessions.length === 0"
            class="empty-state"
            data-test="usage-panel-empty"
          >
            <i class="fas fa-moon"></i>
            <p>{{ t('terminals.budget.noActiveSessions') }}</p>
          </div>
          <ul v-else class="sessions-list">
            <li
              v-for="session in usage.active_sessions"
              :key="session.session_id"
              class="session-row"
              data-test="session-row"
            >
              <span
                class="session-status"
                :class="session.state === 'running' ? 'is-running' : 'is-paused'"
              >
                <i :class="session.state === 'running' ? 'fas fa-circle' : 'fas fa-pause-circle'"></i>
              </span>
              <span class="session-name">{{ session.name || session.size_key }}</span>
              <span class="session-size">{{ session.size_key.toUpperCase() }}</span>
              <span class="session-state">
                {{ session.state === 'running' ? t('terminals.state.running') : t('terminals.state.paused') }}
              </span>
              <span class="session-elapsed">{{ formatElapsed(session.last_started_at) }}</span>
            </li>
          </ul>
        </div>

        <!-- Session duration footer -->
        <div class="info-line footer-line">
          <span class="info-label">
            <i class="fas fa-clock"></i>
            {{ capitalizeFirst(t('terminals.sessionDuration')) }}:
          </span>
          <span class="info-value">
            {{ sessionDurationLabel }}
          </span>
        </div>
      </template>

      <!-- Error banner -->
      <div v-else-if="fetchError" class="error-banner">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('terminals.fetchError') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { terminalService } from '../../services/domain/terminal'
import {
  formatBudgetAsSizes,
  formatElapsed,
  formatMemoryMb,
  CANONICAL_SIZE_CATALOG
} from '../../utils/quotaFormatters'
import type { MyTerminalUsageResponse } from '../../types/terminal'

const { t } = useTranslations({
  en: {
    terminals: {
      currentUsage: 'Current Usage',
      refreshUsage: 'Refresh usage',
      capacity: 'Capacity',
      unlimited: 'Unlimited',
      or: 'OR',
      sessionDuration: 'session duration',
      planSource: 'Plan',
      sourcePersonal: 'personal',
      sourceOrganization: 'provided by {orgName}',
      fetchError: 'Could not load usage data.',
      budget: {
        cpuUsed: 'CPU used',
        memUsed: 'RAM used',
        sessionsHeader: 'Sessions',
        noActiveSessions: 'No active sessions',
      },
      state: {
        running: 'running',
        paused: 'paused',
      },
    }
  },
  fr: {
    terminals: {
      currentUsage: 'Utilisation Actuelle',
      refreshUsage: 'Actualiser l\'utilisation',
      capacity: 'Capacité',
      unlimited: 'Illimité',
      or: 'OU',
      sessionDuration: 'durée de session',
      planSource: 'Plan',
      sourcePersonal: 'personnel',
      sourceOrganization: 'fourni par {orgName}',
      fetchError: 'Impossible de charger les données d\'utilisation.',
      budget: {
        cpuUsed: 'CPU utilisé',
        memUsed: 'RAM utilisée',
        sessionsHeader: 'Sessions',
        noActiveSessions: 'Aucune session active',
      },
      state: {
        running: 'en cours',
        paused: 'en pause',
      },
    }
  }
})

interface Props {
  organizationId?: string
}

const props = withDefaults(defineProps<Props>(), {
  organizationId: undefined
})

const { showError } = useNotification()

const AUTO_REFRESH_MS = 30_000

const isExpanded = ref(false)
const loading = ref(false)
const fetchError = ref(false)
const usage = ref<MyTerminalUsageResponse | null>(null)
let refreshTimer: ReturnType<typeof setTimeout> | null = null

async function loadUsage(showToastOnError = false) {
  loading.value = true
  fetchError.value = false
  try {
    usage.value = await terminalService.getMyUsage(props.organizationId || undefined)
  } catch (err) {
    fetchError.value = true
    if (showToastOnError) {
      showError(t('terminals.fetchError'))
    }
    // Keep prior `usage.value` so the panel doesn't blank out on transient errors.
    console.warn('Failed to load terminal usage:', err)
  } finally {
    loading.value = false
  }
}

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(async () => {
    await loadUsage(false)
    scheduleRefresh()
  }, AUTO_REFRESH_MS)
}

function clearRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

// Re-fetch when the org context changes — the backend honours the
// organization_id query param to pick the right plan envelope.
watch(() => props.organizationId, async () => {
  await loadUsage(false)
})

const isOrgSubscription = computed(() => usage.value?.plan_source === 'organization')

const planSourceLabel = computed(() => {
  if (!usage.value) return ''
  if (isOrgSubscription.value) {
    const orgName = usage.value.plan_source_name || '—'
    return t('terminals.sourceOrganization', { orgName })
  }
  return t('terminals.sourcePersonal')
})

const cpuUnlimited = computed(() => (usage.value?.max_cpu ?? 0) === 0)
const memUnlimited = computed(() => (usage.value?.max_memory_mb ?? 0) === 0)

const cpuUsedPct = computed<number>(() => {
  const u = usage.value
  if (!u || u.max_cpu <= 0) return 0
  return Math.min(100, Math.round((u.used_cpu / u.max_cpu) * 100))
})

const memUsedPct = computed<number>(() => {
  const u = usage.value
  if (!u || u.max_memory_mb <= 0) return 0
  return Math.min(100, Math.round((u.used_memory_mb / u.max_memory_mb) * 100))
})

const capacityLabel = computed(() => {
  const u = usage.value
  if (!u) return '—'
  const summary = formatBudgetAsSizes(
    { max_cpu: u.max_cpu, max_memory_mb: u.max_memory_mb },
    CANONICAL_SIZE_CATALOG,
    t('terminals.or')
  )
  return summary || t('terminals.unlimited')
})

const sessionDurationLabel = computed(() => {
  const minutes = usage.value?.max_session_duration_minutes ?? 0
  if (minutes <= 0) return t('terminals.unlimited')
  if (minutes % 60 === 0) return `${minutes / 60}h`
  return `${minutes}min`
})

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

onMounted(async () => {
  await loadUsage(false)
  scheduleRefresh()
})

onBeforeUnmount(() => {
  clearRefresh()
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

.usage-badge {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  background: var(--color-primary-bg, rgba(59, 130, 246, 0.12));
  color: var(--color-primary, #2563eb);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.refresh-icon-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.refresh-icon-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.refresh-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.collapsible-content {
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-top: var(--border-width-thin) solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.info-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-light);
}

.info-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.info-value {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.footer-line {
  margin-top: var(--spacing-xs);
}

.text-muted {
  color: var(--color-text-muted);
}

/* Bars */
.bars-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-light);
}

.bar-row {
  display: grid;
  grid-template-columns: 3.5em 1fr auto;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
}

.bar-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono, monospace);
}

.bar-track {
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  border: var(--border-width-thin) solid var(--color-border-light);
}

.bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--border-radius-full);
  transition: width 0.4s ease;
}

.bar-row:hover .bar-fill {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.bar-meta {
  font-family: var(--font-family-mono, monospace);
  color: var(--color-text-primary);
  white-space: nowrap;
  font-size: var(--font-size-xs, 0.75rem);
}

/* Sessions */
.sessions-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.sessions-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sessions-header i {
  color: var(--color-primary);
}

.sessions-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.session-row {
  display: grid;
  grid-template-columns: 1.5em 1fr 2.5em auto auto;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-light);
  font-size: var(--font-size-sm);
}

.session-status.is-running i {
  color: var(--color-success, #16a34a);
}

.session-status.is-paused i {
  color: var(--color-warning, #d97706);
}

.session-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-size {
  font-family: var(--font-family-mono, monospace);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.session-state {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs, 0.75rem);
}

.session-elapsed {
  font-family: var(--font-family-mono, monospace);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs, 0.75rem);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  color: var(--color-text-muted);
  text-align: center;
}

.empty-state p {
  margin: 0;
  font-size: var(--font-size-sm);
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

/* Error */
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

@media (max-width: 768px) {
  .collapsible-header {
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .collapsible-content {
    padding: var(--spacing-md);
  }

  .session-row {
    grid-template-columns: 1.5em 1fr auto;
  }

  .session-state,
  .session-elapsed {
    display: none;
  }
}
</style>
