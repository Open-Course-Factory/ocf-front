<template>
  <div class="usage-overview">
    <h3>
      <i class="fas fa-chart-bar"></i>
      {{ t('subscriptions.usageOverview') }}
      <button
        class="btn btn-sm btn-outline-secondary"
        @click="$emit('refresh')"
        :disabled="isRefreshing"
      >
        <i :class="isRefreshing ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"></i>
      </button>
    </h3>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="usage-grid">
      <div v-for="n in 3" :key="n" class="usage-card skeleton-card">
        <div class="skeleton-content">
          <LoadingSkeleton variant="text" width="60%" height="20px" />
          <LoadingSkeleton variant="text" width="100%" height="8px" style="margin-top: 15px" />
          <LoadingSkeleton variant="text" width="80%" height="16px" style="margin-top: 10px" />
        </div>
      </div>
    </div>

    <div v-else-if="visibleMetrics.length > 0" class="usage-grid">
      <div
        v-for="metric in visibleMetrics"
        :key="metric.metric_type"
        class="usage-card"
      >
        <div class="usage-header">
          <div class="metric-info">
            <i :class="getMetricIcon(metric.metric_type)"></i>
            <span class="metric-name">{{ getMetricDisplayName(metric.metric_type) }}</span>
          </div>
          <span :class="['usage-status', getUsageClass(metric.usage_percent)]">
            {{ getUsageStatus(metric.usage_percent) }}
          </span>
        </div>

        <div class="usage-progress">
          <div class="progress">
            <div 
              :class="['progress-bar', getProgressBarClass(metric.usage_percent)]"
              :style="{ width: `${Math.min(100, metric.usage_percent)}%` }"
            ></div>
          </div>
          <div class="usage-text">
            {{ formatValue(metric.current_value, metric.metric_type) }} / 
            {{ formatLimit(metric.limit_value, metric.metric_type) }}
            <span class="usage-percent">({{ metric.usage_percent?.toFixed(1) }}%)</span>
          </div>
        </div>

        <div v-if="getRemainingValue(metric.current_value, metric.limit_value) !== -1" class="usage-remaining">
          <small class="text-muted">
            {{ formatValue(getRemainingValue(metric.current_value, metric.limit_value), metric.metric_type) }}
            {{ t('subscriptions.remaining') }}
          </small>
        </div>
      </div>
    </div>

    <div v-else class="no-usage-data">
      <i class="fas fa-chart-line fa-2x text-muted"></i>
      <p class="text-muted">{{ t('subscriptions.noUsageData') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUsageMetricsStore } from '../../../stores/usageMetrics'
import { useSubscriptionTranslations } from '../composables/useSubscriptionTranslations'
import { useFeatureFlags } from '../../../composables/useFeatureFlags'
import LoadingSkeleton from './LoadingSkeleton.vue'

const { t } = useSubscriptionTranslations()
const { filterByFeatureFlags } = useFeatureFlags()

interface Props {
  metrics: any[]
  isRefreshing?: boolean
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isRefreshing: false,
  isLoading: false
})

const emit = defineEmits<{
  refresh: []
}>()

const usageMetricsStore = useUsageMetricsStore()

// Filter metrics based on feature flags
const visibleMetrics = computed(() => {
  return filterByFeatureFlags(props.metrics, 'metric_type')
})

// Méthodes utilitaires (délégation vers le store)
function getMetricIcon(metricType: string) {
  return usageMetricsStore.getMetricIcon(metricType)
}

function getUsageClass(usagePercent: number) {
  return usageMetricsStore.getUsageClass(usagePercent)
}

function getUsageStatus(usagePercent: number) {
  return usageMetricsStore.getUsageStatus(usagePercent)
}

function getProgressBarClass(usagePercent: number) {
  return usageMetricsStore.getProgressBarClass(usagePercent)
}

function formatValue(value: number, metricType: string) {
  return usageMetricsStore.formatValue(value, metricType)
}

function formatLimit(limit: number, metricType: string) {
  return usageMetricsStore.formatLimit(limit, metricType)
}

function getRemainingValue(current: number, limit: number) {
  return usageMetricsStore.getRemainingValue(current, limit)
}

function getMetricDisplayName(metricType: string) {
  return t(`usageMetrics.${metricType}`) || metricType
}
</script>

<style scoped>
.usage-overview {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-gray-200);
}

.usage-overview h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 20px 0;
  color: var(--color-gray-700);
  font-size: 1.25rem;
  gap: 10px;
}

.usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
}

.usage-card {
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 15px;
  background: var(--color-bg-secondary);
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--color-gray-700);
}

.usage-status {
  font-size: 0.8rem;
  font-weight: 500;
}

.usage-progress {
  margin-bottom: 10px;
}

.progress {
  height: 8px;
  background-color: var(--color-gray-200);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.bg-success { background-color: var(--color-success); }
.bg-info { background-color: var(--color-info); }
.bg-warning { background-color: var(--color-warning); }
.bg-danger { background-color: var(--color-danger); }

.usage-text {
  font-size: 0.9rem;
  color: var(--color-gray-700);
}

.usage-percent {
  color: var(--color-gray-600);
  font-weight: 500;
}

.usage-remaining {
  margin-top: 5px;
}

.no-usage-data {
  text-align: center;
  padding: 30px 15px;
  color: var(--color-gray-600);
}

.no-usage-data i {
  margin-bottom: 15px;
}

/* Loading skeleton styles */
.skeleton-card {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skeleton-content {
  width: 100%;
  padding: 10px;
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-outline-secondary {
  color: var(--color-gray-600);
  border-color: var(--color-gray-600);
  background-color: transparent;
}

.btn-outline-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-600);
  color: white;
}

/* Text utilities */
.text-success { color: var(--color-success) !important; }
.text-info { color: var(--color-info) !important; }
.text-warning { color: var(--color-warning) !important; }
.text-danger { color: var(--color-danger) !important; }
.text-muted { color: var(--color-gray-600) !important; }

/* Responsive */
@media (max-width: 768px) {
  .usage-grid {
    grid-template-columns: 1fr;
  }
  
  .usage-overview h3 {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}
</style>