<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="terminal-metrics-page">
    <div class="page-header">
      <h2>{{ t('terminalMetrics.pageTitle') }}</h2>
      <div class="header-actions">
        <Button
          variant="primary"
          size="md"
          :icon="metricsStore.isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
          :disabled="metricsStore.isLoading"
          @click="handleRefresh"
        >
          {{ t('terminalMetrics.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Server Status Banner -->
    <div v-if="metricsStore.metrics" class="status-banner" :class="`status-${metricsStore.serverStatus}`">
      <div class="status-indicator">
        <i :class="getStatusIcon()"></i>
        <span class="status-label">{{ t('terminalMetrics.serverStatus') }}:</span>
        <strong>{{ t(`terminalMetrics.${metricsStore.serverStatus}`) }}</strong>
      </div>
      <div v-if="metricsStore.hasCapacityIssues" class="status-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('terminalMetrics.capacityWarningMessage') }}
      </div>
    </div>

    <!-- Metrics Cards -->
    <div v-if="metricsStore.metrics" class="metrics-grid">
      <!-- CPU Usage Card -->
      <div class="metric-card">
        <div class="metric-header">
          <i class="fas fa-microchip"></i>
          <h3>{{ t('terminalMetrics.cpuUsage') }}</h3>
        </div>
        <div class="metric-content">
          <div class="gauge-container">
            <div class="gauge" :style="getGaugeStyle(metricsStore.metrics.cpu_percent)">
              <div class="gauge-fill" :style="`width: ${metricsStore.metrics.cpu_percent}%`"></div>
            </div>
            <div class="gauge-value">
              <span class="value">{{ metricsStore.metrics.cpu_percent.toFixed(1) }}</span>
              <span class="unit">%</span>
            </div>
          </div>
          <div class="metric-status">
            <span v-if="metricsStore.metrics.cpu_percent > 95" class="status-critical">
              <i class="fas fa-exclamation-circle"></i> {{ t('terminalMetrics.critical') }}
            </span>
            <span v-else-if="metricsStore.metrics.cpu_percent > 80" class="status-warning">
              <i class="fas fa-exclamation-triangle"></i> {{ t('terminalMetrics.warning') }}
            </span>
            <span v-else class="status-healthy">
              <i class="fas fa-check-circle"></i> {{ t('terminalMetrics.healthy') }}
            </span>
          </div>
        </div>
      </div>

      <!-- RAM Usage Card -->
      <div class="metric-card">
        <div class="metric-header">
          <i class="fas fa-memory"></i>
          <h3>{{ t('terminalMetrics.ramUsage') }}</h3>
        </div>
        <div class="metric-content">
          <div class="gauge-container">
            <div class="gauge" :style="getGaugeStyle(metricsStore.metrics.ram_percent)">
              <div class="gauge-fill" :style="`width: ${metricsStore.metrics.ram_percent}%`"></div>
            </div>
            <div class="gauge-value">
              <span class="value">{{ metricsStore.metrics.ram_percent.toFixed(1) }}</span>
              <span class="unit">%</span>
            </div>
          </div>
          <div class="metric-status">
            <span v-if="metricsStore.metrics.ram_percent > 95" class="status-critical">
              <i class="fas fa-exclamation-circle"></i> {{ t('terminalMetrics.critical') }}
            </span>
            <span v-else-if="metricsStore.metrics.ram_percent > 80" class="status-warning">
              <i class="fas fa-exclamation-triangle"></i> {{ t('terminalMetrics.warning') }}
            </span>
            <span v-else class="status-healthy">
              <i class="fas fa-check-circle"></i> {{ t('terminalMetrics.healthy') }}
            </span>
          </div>
        </div>
      </div>

      <!-- RAM Available Card -->
      <div class="metric-card">
        <div class="metric-header">
          <i class="fas fa-hdd"></i>
          <h3>{{ t('terminalMetrics.ramAvailable') }}</h3>
        </div>
        <div class="metric-content">
          <div class="metric-large-value">
            <span class="value">{{ metricsStore.metrics.ram_available_gb.toFixed(2) }}</span>
            <span class="unit">GB</span>
          </div>
          <div class="metric-status">
            <span v-if="metricsStore.metrics.ram_available_gb < 1.0" class="status-critical">
              <i class="fas fa-exclamation-circle"></i> {{ t('terminalMetrics.insufficientRAM') }}
            </span>
            <span v-else-if="metricsStore.metrics.ram_available_gb < 2.0" class="status-warning">
              <i class="fas fa-exclamation-triangle"></i> {{ t('terminalMetrics.warning') }}
            </span>
            <span v-else class="status-healthy">
              <i class="fas fa-check-circle"></i> {{ t('terminalMetrics.healthy') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="metricsStore.isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p>Loading metrics...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="metricsStore.error" class="error-state">
      <i class="fas fa-exclamation-triangle fa-3x"></i>
      <p>{{ metricsStore.error }}</p>
      <Button variant="primary" @click="handleRefresh">
        {{ t('terminalMetrics.refresh') }}
      </Button>
    </div>

    <!-- Last Update Info -->
    <div v-if="metricsStore.metrics" class="last-update">
      <i class="fas fa-clock"></i>
      <span>{{ t('terminalMetrics.timestamp') }}: {{ formatTimestamp(metricsStore.metrics.timestamp) }}</span>
      <span class="auto-refresh-info">
        <i class="fas fa-sync-alt"></i>
        {{ t('terminalMetrics.autoRefresh', { seconds: autoRefreshInterval / 1000 }) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTerminalMetricsStore } from '../../../stores/terminalMetrics'
import Button from '../../UI/Button.vue'

const { t } = useI18n()
const metricsStore = useTerminalMetricsStore()

// Auto-refresh configuration (30 seconds)
const autoRefreshInterval = 30000
let refreshIntervalId: NodeJS.Timeout | null = null

onMounted(async () => {
  // Initial fetch
  await metricsStore.fetchMetrics()

  // Setup auto-refresh
  refreshIntervalId = setInterval(async () => {
    try {
      await metricsStore.fetchMetrics(false) // Use cache when auto-refreshing
    } catch (error) {
      console.error('Auto-refresh failed:', error)
    }
  }, autoRefreshInterval)
})

onBeforeUnmount(() => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
  }
})

async function handleRefresh() {
  await metricsStore.refreshMetrics() // Bypass cache on manual refresh
}

function getStatusIcon() {
  switch (metricsStore.serverStatus) {
    case 'healthy':
      return 'fas fa-check-circle'
    case 'warning':
      return 'fas fa-exclamation-triangle'
    case 'critical':
      return 'fas fa-exclamation-circle'
    default:
      return 'fas fa-question-circle'
  }
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
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}
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

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.metric-card {
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base);
}

.metric-card:hover {
  box-shadow: var(--shadow-md);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.metric-header i {
  font-size: 2rem;
  color: var(--color-primary);
}

.metric-header h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* Gauge */
.gauge-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.gauge {
  width: 100%;
  height: 40px;
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
  justify-content: center;
  gap: var(--spacing-xs);
}

.gauge-value .value {
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.gauge-value .unit {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

/* Large Value Display */
.metric-large-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) 0;
}

.metric-large-value .value {
  font-size: 3.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.metric-large-value .unit {
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
}

/* Metric Status */
.metric-status {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-semibold);
}

.status-healthy {
  color: var(--color-success-text);
  background-color: var(--color-success-bg);
}

.status-warning {
  color: var(--color-warning-text);
  background-color: var(--color-warning-bg);
}

.status-critical {
  color: var(--color-danger-text);
  background-color: var(--color-danger-bg);
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

  .metrics-grid {
    grid-template-columns: 1fr;
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
