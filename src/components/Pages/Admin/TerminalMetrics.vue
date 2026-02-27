<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="terminal-metrics-page">
    <div class="page-header">
      <h2>{{ t('terminalMetrics.dashboardTitle') }}</h2>
      <div class="header-actions">
        <Button
          variant="primary"
          size="md"
          :icon="isRefreshing ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
          :disabled="isRefreshing"
          @click="handleRefresh"
        >
          {{ t('terminalMetrics.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Overall Status Banner -->
    <div v-if="backendsStore.backends.length > 0" class="status-banner" :class="`status-${overallStatus}`">
      <div class="status-indicator">
        <i :class="overallStatusIcon"></i>
        <span class="status-label">{{ t('terminalMetrics.status') }}:</span>
        <strong>{{ t('terminalMetrics.onlineCount', { count: onlineCount, total: backendsStore.backends.length }) }}</strong>
        <span v-if="overallStatus !== 'critical'" class="status-health-label">
          — {{ t(`terminalMetrics.${overallStatus}`) }}
        </span>
      </div>
      <div v-if="offlineCount > 0" class="status-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('terminalMetrics.offlineWarning', { count: offlineCount }) }}
      </div>
    </div>

    <!-- Backend Cards -->
    <div v-if="backendsStore.backends.length > 0" class="backends-list">
      <div
        v-for="backend in backendsStore.backends"
        :key="backend.id"
        :class="['backend-card', { 'offline': !backend.connected }]"
      >
        <!-- Card Header -->
        <div class="card-header">
          <div class="card-title-row">
            <span class="connection-dot" :class="backend.connected ? 'online' : 'offline'"></span>
            <h3>{{ backend.name || backend.id }}</h3>
            <span v-if="backend.is_default" class="default-badge">
              {{ t('terminalMetrics.currentDefault') }}
            </span>
            <Button
              v-else-if="backend.connected"
              size="sm"
              variant="outline-primary"
              icon="fas fa-star"
              :loading="settingDefault === backend.id"
              :disabled="!!settingDefault"
              @click="setAsDefault(backend.id)"
            >
              {{ t('terminalMetrics.setDefault') }}
            </Button>
          </div>
          <div class="card-status-row">
            <span class="connection-label" :class="backend.connected ? 'text-success' : 'text-danger'">
              {{ backend.connected ? t('terminalMetrics.healthy') : t('terminalMetrics.backendOffline') }}
            </span>
            <span
              v-if="backend.connected && backendMetrics[backend.id]"
              class="health-badge"
              :class="`health-${getBackendStatus(backendMetrics[backend.id])}`"
            >
              {{ t(`terminalMetrics.${getBackendStatus(backendMetrics[backend.id])}`) }}
            </span>
          </div>
        </div>

        <!-- Metrics (online only) -->
        <div v-if="backend.connected && backendMetrics[backend.id]" class="card-metrics">
          <div class="metrics-row">
            <!-- CPU Gauge -->
            <div class="metric-item">
              <div class="metric-label">
                <i class="fas fa-microchip"></i>
                {{ t('terminalMetrics.cpuUsage') }}
              </div>
              <div class="gauge-container">
                <div class="gauge" :style="getGaugeStyle(backendMetrics[backend.id].cpu_percent)">
                  <div class="gauge-fill" :style="`width: ${backendMetrics[backend.id].cpu_percent}%`"></div>
                </div>
                <div class="gauge-value">
                  <span class="value">{{ backendMetrics[backend.id].cpu_percent.toFixed(1) }}</span>
                  <span class="unit">%</span>
                </div>
              </div>
            </div>

            <!-- RAM Gauge -->
            <div class="metric-item">
              <div class="metric-label">
                <i class="fas fa-memory"></i>
                {{ t('terminalMetrics.ramUsage') }}
              </div>
              <div class="gauge-container">
                <div class="gauge" :style="getGaugeStyle(backendMetrics[backend.id].ram_percent)">
                  <div class="gauge-fill" :style="`width: ${backendMetrics[backend.id].ram_percent}%`"></div>
                </div>
                <div class="gauge-value">
                  <span class="value">{{ backendMetrics[backend.id].ram_percent.toFixed(1) }}</span>
                  <span class="unit">%</span>
                </div>
              </div>
            </div>

            <!-- RAM Available -->
            <div class="metric-item">
              <div class="metric-label">
                <i class="fas fa-hdd"></i>
                {{ t('terminalMetrics.ramAvailable') }}
              </div>
              <div class="metric-large-value">
                <span class="value">{{ backendMetrics[backend.id].ram_available_gb.toFixed(2) }}</span>
                <span class="unit">GB</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Offline message -->
        <div v-else-if="!backend.connected" class="card-offline-message">
          <i class="fas fa-plug"></i>
          {{ t('terminalMetrics.backendOffline') }}
        </div>

        <!-- Loading metrics -->
        <div v-else-if="backend.connected && !backendMetrics[backend.id] && !metricsError[backend.id]" class="card-loading">
          <i class="fas fa-spinner fa-spin"></i>
        </div>

        <!-- Organizations Section -->
        <div class="card-organizations">
          <div class="org-section-header" @click="toggleOrgSection(backend.id)">
            <i class="fas fa-building"></i>
            <span>{{ t('terminalMetrics.organizations') }}</span>
            <span v-if="orgsByBackend[backend.id]?.length" class="org-count">({{ orgsByBackend[backend.id].length }})</span>
            <i class="fas fa-chevron-down org-chevron" :class="{ rotated: expandedOrgs[backend.id] }"></i>
          </div>
          <div v-if="expandedOrgs[backend.id]" class="org-section-body">
            <div v-if="orgsByBackend[backend.id]?.length > 0" class="org-filter-row">
              <button
                v-for="filterOption in orgFilterOptions"
                :key="filterOption.value"
                :class="['org-filter-chip', { active: orgFilter === filterOption.value }]"
                @click="orgFilter = filterOption.value"
              >
                {{ filterOption.label }}
              </button>
            </div>
            <div v-if="filteredOrgsByBackend(backend.id).length > 0" class="org-list">
              <div v-for="entry in filteredOrgsByBackend(backend.id)" :key="entry.org.id" class="org-item">
                <span class="org-name">{{ entry.org.display_name || entry.org.name }}</span>
                <span class="org-reason-tag" :class="`reason-${entry.reason}`">
                  {{ entry.reason === 'explicit' ? t('terminalMetrics.explicitAssignment') : t('terminalMetrics.systemDefaultAssignment') }}
                </span>
              </div>
            </div>
            <div v-else-if="orgsByBackend[backend.id]?.length > 0" class="no-orgs">
              {{ t('terminalMetrics.noMatchingOrganizations') }}
            </div>
            <div v-else class="no-orgs">
              {{ t('terminalMetrics.noOrganizations') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="backendsStore.isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p>{{ t('terminalMetrics.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="backendsStore.error" class="error-state">
      <i class="fas fa-exclamation-triangle fa-3x"></i>
      <p>{{ backendsStore.error }}</p>
      <Button variant="primary" @click="handleRefresh">
        {{ t('terminalMetrics.refresh') }}
      </Button>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="fas fa-server fa-3x"></i>
      <p>{{ t('terminalMetrics.noBackends') }}</p>
    </div>

    <!-- Last Update Footer -->
    <div v-if="backendsStore.backends.length > 0 && lastUpdateTime" class="last-update">
      <i class="fas fa-clock"></i>
      <span>{{ t('terminalMetrics.timestamp') }}: {{ formatTimestamp(lastUpdateTime) }}</span>
      <span class="auto-refresh-info">
        <i class="fas fa-sync-alt"></i>
        {{ t('terminalMetrics.autoRefresh', { seconds: autoRefreshInterval / 1000 }) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTerminalMetricsStore, type TerminalMetrics } from '../../../stores/terminalMetrics'
import { useTerminalBackendsStore } from '../../../stores/terminalBackends'
import { useOrganizationsStore } from '../../../stores/organizations'
import axios from 'axios'
import Button from '../../UI/Button.vue'

const { t } = useI18n()
// Initialize store to register translations
useTerminalMetricsStore()
const backendsStore = useTerminalBackendsStore()
const organizationsStore = useOrganizationsStore()

// Per-backend metrics
const backendMetrics: Record<string, TerminalMetrics> = reactive({})
const metricsError: Record<string, string> = reactive({})
const isRefreshing = ref(false)
const lastUpdateTime = ref<number>(0)

// Per-org backend configs
const orgConfigs: Record<string, { allowed_backends: string[], default_backend: string }> = reactive({})

// Set as default
const settingDefault = ref<string | null>(null)

// Org section expand/collapse (collapsed by default)
const expandedOrgs: Record<string, boolean> = reactive({})

function toggleOrgSection(backendId: string) {
  expandedOrgs[backendId] = !expandedOrgs[backendId]
}

// Org filter
const orgFilter = ref<'all' | 'explicit' | 'default'>('all')

const orgFilterOptions = computed(() => [
  { value: 'all' as const, label: t('terminalMetrics.orgFilterAll') },
  { value: 'explicit' as const, label: t('terminalMetrics.explicitAssignment') },
  { value: 'default' as const, label: t('terminalMetrics.systemDefaultAssignment') }
])

function filteredOrgsByBackend(backendId: string) {
  const orgs = orgsByBackend.value[backendId] || []
  if (orgFilter.value === 'all') return orgs
  return orgs.filter(entry => entry.reason === orgFilter.value)
}

// Auto-refresh
const autoRefreshInterval = 30000
let refreshIntervalId: NodeJS.Timeout | null = null

// Computed: online/offline counts
const onlineCount = computed(() => backendsStore.onlineBackends.length)
const offlineCount = computed(() => backendsStore.backends.length - onlineCount.value)

const overallStatus = computed(() => {
  if (onlineCount.value === 0) return 'critical'
  if (offlineCount.value > 0) return 'warning'

  // Also check metrics health
  let worstStatus = 'healthy'
  for (const backend of backendsStore.backends) {
    if (backend.connected) {
      const status = getBackendStatus(backendMetrics[backend.id])
      if (status === 'critical') return 'critical'
      if (status === 'warning') worstStatus = 'warning'
    }
  }
  return worstStatus
})

const overallStatusIcon = computed(() => {
  switch (overallStatus.value) {
    case 'healthy': return 'fas fa-check-circle'
    case 'warning': return 'fas fa-exclamation-triangle'
    case 'critical': return 'fas fa-exclamation-circle'
    default: return 'fas fa-question-circle'
  }
})

// Organization reverse mapping
const orgsByBackend = computed(() => {
  const map: Record<string, { org: any, reason: 'explicit' | 'default' }[]> = {}
  for (const backend of backendsStore.backends) {
    map[backend.id] = []
  }
  const systemDefault = backendsStore.defaultBackend?.id
  for (const org of organizationsStore.organizations) {
    const config = orgConfigs[org.id]
    if (config?.allowed_backends?.length > 0) {
      for (const backendId of config.allowed_backends) {
        if (map[backendId]) {
          map[backendId].push({ org, reason: 'explicit' })
        }
      }
    } else if (systemDefault && map[systemDefault]) {
      map[systemDefault].push({ org, reason: 'default' })
    }
  }
  return map
})

// Helpers
function getBackendStatus(metrics: TerminalMetrics | undefined): string {
  if (!metrics) return 'unknown'
  if (metrics.ram_available_gb < 1.0 || metrics.cpu_percent > 95) return 'critical'
  if (metrics.ram_available_gb < 2.0 || metrics.cpu_percent > 80) return 'warning'
  return 'healthy'
}

function getGaugeStyle(percentage: number) {
  if (percentage > 95) {
    return { '--gauge-color': 'var(--color-danger)' }
  } else if (percentage > 80) {
    return { '--gauge-color': 'var(--color-warning)' }
  }
  return { '--gauge-color': 'var(--color-success)' }
}

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// Data fetching
async function fetchAllMetrics() {
  const promises = backendsStore.backends
    .filter(b => b.connected)
    .map(async (backend) => {
      try {
        const response = await axios.get('/terminals/metrics', {
          params: { backend: backend.id, nocache: '1' }
        })
        backendMetrics[backend.id] = response.data
        delete metricsError[backend.id]
      } catch (err: any) {
        metricsError[backend.id] = err.response?.data?.error_message || err.message || t('terminalMetrics.metricsLoadError')
      }
    })

  await Promise.allSettled(promises)
  lastUpdateTime.value = Date.now()
}

async function fetchOrgConfigs() {
  const promises = organizationsStore.organizations.map(async (org) => {
    try {
      const response = await axios.get(`/organizations/${org.id}/backends`)
      orgConfigs[org.id] = response.data
    } catch {
      // Non-critical: org just won't show backend mapping
    }
  })

  await Promise.allSettled(promises)
}

async function initialLoad() {
  isRefreshing.value = true
  try {
    // Load backends and organizations in parallel
    await Promise.all([
      backendsStore.fetchBackends(),
      organizationsStore.loadOrganizations()
    ])

    // Then load metrics and org configs in parallel
    await Promise.all([
      fetchAllMetrics(),
      fetchOrgConfigs()
    ])
  } catch {
    // Errors are tracked per-store
  } finally {
    isRefreshing.value = false
  }
}

async function handleRefresh() {
  isRefreshing.value = true
  try {
    await Promise.all([
      backendsStore.fetchBackends(),
      organizationsStore.loadOrganizations()
    ])
    await Promise.all([
      fetchAllMetrics(),
      fetchOrgConfigs()
    ])
  } finally {
    isRefreshing.value = false
  }
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
  await initialLoad()

  // Auto-refresh: only re-fetch metrics every 30s
  refreshIntervalId = setInterval(async () => {
    try {
      await fetchAllMetrics()
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
.terminal-metrics-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.page-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

/* Status Banner */
.status-banner {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-md);
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

.status-health-label {
  font-weight: var(--font-weight-medium);
}

.status-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

/* Backend Cards List */
.backends-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
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
  opacity: 0.7;
  background: var(--color-bg-secondary);
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-title-row h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
}

.card-status-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.connection-dot {
  width: 12px;
  height: 12px;
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

.health-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-md);
}

.health-healthy {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.health-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.health-critical {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

/* Metrics Row */
.card-metrics {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.metric-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.metric-label i {
  color: var(--color-primary);
}

/* Gauge */
.gauge-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.gauge {
  width: 100%;
  height: 16px;
  background-color: var(--color-gray-200);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  position: relative;
}

.gauge-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gauge-color, var(--color-primary)), var(--gauge-color, var(--color-primary)));
  transition: width var(--transition-slow);
  border-radius: var(--border-radius-full);
}

.gauge-value {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
}

.gauge-value .value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.gauge-value .unit {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Large Value Display */
.metric-large-value {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  padding: 0;
}

.metric-large-value .value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.metric-large-value .unit {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Offline / Loading states inside card */
.card-offline-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  color: var(--color-text-muted);
  font-style: italic;
}

.card-loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
}

/* Organizations Section */
.card-organizations {
  border-top: var(--border-width-thin) solid var(--color-border-light);
  padding-top: var(--spacing-md);
}

.org-section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs) 0;
  user-select: none;
}

.org-section-header:hover {
  color: var(--color-text-primary);
}

.org-count {
  color: var(--color-text-muted);
  font-weight: var(--font-weight-normal);
}

.org-chevron {
  margin-left: auto;
  font-size: var(--font-size-xs);
  transition: transform var(--transition-base);
}

.org-chevron.rotated {
  transform: rotate(180deg);
}

.org-section-body {
  padding-top: var(--spacing-sm);
}

.org-filter-row {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.org-filter-chip {
  font-size: var(--font-size-xs);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  border: var(--border-width-thin) solid var(--color-border-medium);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.org-filter-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.org-filter-chip.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.org-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.org-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.org-name {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.org-reason-tag {
  font-size: var(--font-size-xs);
  padding: 1px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-medium);
}

.reason-explicit {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.reason-default {
  background-color: var(--color-gray-300);
  color: var(--color-text-secondary);
}

.no-orgs {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-style: italic;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.empty-state i {
  opacity: 0.4;
}

/* Loading/Error States */
.loading-state,
.error-state {
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
  flex-wrap: wrap;
}

.auto-refresh-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding-left: var(--spacing-md);
  border-left: var(--border-width-thin) solid var(--color-border-medium);
}

/* Responsive */
@media (max-width: 768px) {
  .terminal-metrics-page {
    padding: var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .metrics-row {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
  }

  .last-update {
    flex-direction: column;
    text-align: center;
  }

  .auto-refresh-info {
    padding-left: 0;
    border-left: none;
    padding-top: var(--spacing-sm);
    border-top: var(--border-width-thin) solid var(--color-border-medium);
  }
}
</style>
