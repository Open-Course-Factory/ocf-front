<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="server-resource-gauge" :class="`status-${statusLevel}`">
    <div class="gauge-header">
      <div class="gauge-title">
        <i class="fas fa-server"></i>
        <span>{{ t('serverResourceGauge.title') }}</span>
      </div>
      <Button
        v-if="showRefreshButton"
        size="sm"
        variant="ghost"
        :icon="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
        :disabled="isLoading"
        @click="refresh"
        :title="t('serverResourceGauge.refresh')"
      />
    </div>

    <div v-if="metrics && !isLoading" class="gauge-content">
      <!-- Status Indicator -->
      <div class="status-indicator">
        <div class="status-dot" :class="`status-${statusLevel}`"></div>
        <span class="status-text">{{ statusMessage }}</span>
      </div>

      <!-- Compact Metrics Display -->
      <div class="metrics-compact">
        <div class="metric-item">
          <div class="metric-label">
            <i class="fas fa-microchip"></i>
            {{ t('serverResourceGauge.cpu') }}
          </div>
          <div class="metric-bar-container">
            <div class="metric-bar" :style="getBarStyle(metrics.cpu_percent, 'cpu')">
              <div class="metric-bar-fill" :style="`width: ${metrics.cpu_percent}%`"></div>
            </div>
            <span class="metric-value">{{ metrics.cpu_percent.toFixed(0) }}%</span>
          </div>
        </div>

        <div class="metric-item">
          <div class="metric-label">
            <i class="fas fa-memory"></i>
            {{ t('serverResourceGauge.ram') }}
          </div>
          <div class="metric-bar-container">
            <div class="metric-bar" :style="getBarStyle(metrics.ram_percent, 'ram')">
              <div class="metric-bar-fill" :style="`width: ${metrics.ram_percent}%`"></div>
            </div>
            <span class="metric-value">{{ metrics.ram_percent.toFixed(0) }}%</span>
          </div>
        </div>

        <div class="metric-item">
          <div class="metric-label">
            <i class="fas fa-hdd"></i>
            {{ t('serverResourceGauge.available') }}
          </div>
          <div class="metric-value-large" :class="getRamAvailableClass(metrics.ram_available_gb)">
            {{ metrics.ram_available_gb.toFixed(2) }} GB
          </div>
        </div>
      </div>

      <!-- Warning/Error Messages -->
      <div v-if="statusLevel !== 'healthy'" class="status-message" :class="`alert-${statusLevel}`">
        <i :class="getStatusIcon()"></i>
        <span>{{ getStatusDescription() }}</span>
      </div>
    </div>

    <div v-else-if="isLoading" class="gauge-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>{{ t('serverResourceGauge.loading') }}</span>
    </div>

    <div v-else-if="error" class="gauge-error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTerminalMetricsStore } from '../../stores/terminalMetrics'
import Button from './Button.vue'

interface Props {
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
  showRefreshButton?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 30000, // 30 seconds
  showRefreshButton: true,
  compact: true
})

const { t } = useI18n()
const metricsStore = useTerminalMetricsStore()

let refreshIntervalId: NodeJS.Timeout | null = null

// Add translations
const i18n = useI18n()
onMounted(() => {
  i18n.mergeLocaleMessage('en', {
    serverResourceGauge: {
      title: 'Server Resources',
      cpu: 'CPU',
      ram: 'RAM',
      available: 'Available',
      refresh: 'Refresh',
      loading: 'Loading metrics...',
      healthy: 'Resources Available',
      warning: 'Resources Running Low',
      critical: 'Server at Capacity',
      criticalDescription: 'Server resources are critically low. Terminal creation may fail.',
      warningDescription: 'Server resources are running low. Consider waiting before creating terminals.',
      lowRAM: 'Low RAM available',
      highCPU: 'High CPU usage'
    }
  })

  i18n.mergeLocaleMessage('fr', {
    serverResourceGauge: {
      title: 'Ressources du Serveur',
      cpu: 'CPU',
      ram: 'RAM',
      available: 'Disponible',
      refresh: 'Actualiser',
      loading: 'Chargement des métriques...',
      healthy: 'Ressources Disponibles',
      warning: 'Ressources Faibles',
      critical: 'Serveur à Capacité',
      criticalDescription: 'Les ressources du serveur sont critiquement faibles. La création de terminal peut échouer.',
      warningDescription: 'Les ressources du serveur sont faibles. Envisagez d\'attendre avant de créer des terminaux.',
      lowRAM: 'RAM disponible faible',
      highCPU: 'Utilisation CPU élevée'
    }
  })

  // Initial fetch
  fetchMetrics()

  // Setup auto-refresh if enabled
  if (props.autoRefresh) {
    refreshIntervalId = setInterval(() => {
      fetchMetrics()
    }, props.refreshInterval)
  }
})

onBeforeUnmount(() => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
  }
})

const metrics = computed(() => metricsStore.metrics)
const isLoading = computed(() => metricsStore.isLoading)
const error = computed(() => metricsStore.error)

const statusLevel = computed(() => {
  if (!metrics.value) return 'unknown'

  // Critical: RAM < 1GB or CPU > 95%
  if (metrics.value.ram_available_gb < 1.0 || metrics.value.cpu_percent > 95) {
    return 'critical'
  }

  // Warning: RAM < 2GB or CPU > 80%
  if (metrics.value.ram_available_gb < 2.0 || metrics.value.cpu_percent > 80) {
    return 'warning'
  }

  return 'healthy'
})

const statusMessage = computed(() => {
  return t(`serverResourceGauge.${statusLevel.value}`)
})

function getBarStyle(percentage: number, type: 'cpu' | 'ram') {
  let color = 'var(--color-success)'

  if (type === 'cpu') {
    if (percentage > 95) color = 'var(--color-danger)'
    else if (percentage > 80) color = 'var(--color-warning)'
  } else if (type === 'ram') {
    if (percentage > 95) color = 'var(--color-danger)'
    else if (percentage > 80) color = 'var(--color-warning)'
  }

  return { '--bar-color': color }
}

function getRamAvailableClass(availableGb: number) {
  if (availableGb < 1.0) return 'text-danger'
  if (availableGb < 2.0) return 'text-warning'
  return 'text-success'
}

function getStatusIcon() {
  switch (statusLevel.value) {
    case 'critical':
      return 'fas fa-exclamation-circle'
    case 'warning':
      return 'fas fa-exclamation-triangle'
    case 'healthy':
      return 'fas fa-check-circle'
    default:
      return 'fas fa-question-circle'
  }
}

function getStatusDescription() {
  const issues = []

  if (metrics.value) {
    if (metrics.value.ram_available_gb < 1.0) {
      issues.push(t('serverResourceGauge.lowRAM'))
    }
    if (metrics.value.cpu_percent > 90) {
      issues.push(t('serverResourceGauge.highCPU'))
    }
  }

  if (issues.length > 0) {
    return issues.join(', ')
  }

  return t(`serverResourceGauge.${statusLevel.value}Description`)
}

async function fetchMetrics() {
  try {
    await metricsStore.fetchMetrics(false)
  } catch (err) {
    console.error('Failed to fetch metrics:', err)
  }
}

async function refresh() {
  try {
    await metricsStore.refreshMetrics()
  } catch (err) {
    console.error('Failed to refresh metrics:', err)
  }
}

// Expose methods for parent component
defineExpose({
  refresh,
  fetchMetrics
})
</script>

<style scoped>
.server-resource-gauge {
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  border-left-width: var(--border-width-thick);
}

.server-resource-gauge.status-healthy {
  border-left-color: var(--color-success);
  background-color: var(--color-success-bg);
}

.server-resource-gauge.status-warning {
  border-left-color: var(--color-warning);
  background-color: var(--color-warning-bg);
}

.server-resource-gauge.status-critical {
  border-left-color: var(--color-danger);
  background-color: var(--color-danger-bg);
}

.gauge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.gauge-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.gauge-title i {
  font-size: var(--font-size-lg);
}

.gauge-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-dot.status-healthy {
  background-color: var(--color-success);
}

.status-dot.status-warning {
  background-color: var(--color-warning);
}

.status-dot.status-critical {
  background-color: var(--color-danger);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.metrics-compact {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.metric-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  min-width: 80px;
}

.metric-bar-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

.metric-bar {
  flex: 1;
  height: 20px;
  background-color: var(--color-gray-200);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  position: relative;
  min-width: 100px;
}

.metric-bar-fill {
  height: 100%;
  background-color: var(--bar-color, var(--color-primary));
  transition: width var(--transition-base);
  border-radius: var(--border-radius-full);
}

.metric-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  min-width: 45px;
  text-align: right;
  color: var(--color-text-primary);
}

.metric-value-large {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.text-success {
  color: var(--color-success);
}

.text-warning {
  color: var(--color-warning);
}

.text-danger {
  color: var(--color-danger);
}

.status-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.status-message.alert-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: var(--border-width-thin) solid var(--color-warning);
}

.status-message.alert-critical {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: var(--border-width-thin) solid var(--color-danger);
}

.gauge-loading,
.gauge-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.gauge-error {
  color: var(--color-danger-text);
}

/* Responsive */
@media (max-width: 768px) {
  .metric-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .metric-bar-container {
    width: 100%;
  }

  .metric-label {
    min-width: unset;
  }
}
</style>
