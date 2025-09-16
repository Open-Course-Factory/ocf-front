<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */ 
-->

<template>
  <div class="usage-widget" :class="[size, variant]">
    <!-- Compact mode -->
    <div v-if="compact" class="usage-compact">
      <div class="compact-header">
        <i :class="getMetricIcon(metricType)"></i>
        <span class="metric-label">{{ getMetricDisplayName(metricType) }}</span>
        <span :class="['usage-status', getUsageClass(usagePercent)]">
          {{ getUsageStatusShort(usagePercent) }}
        </span>
      </div>
      
      <div class="compact-progress">
        <div class="progress-mini">
          <div 
            :class="['progress-bar-mini', getProgressBarClass(usagePercent)]"
            :style="{ width: `${Math.min(100, usagePercent)}%` }"
          ></div>
        </div>
        <span class="usage-text-mini">
          {{ formatValue(currentValue, metricType) }} / {{ formatLimit(limitValue, metricType) }}
        </span>
      </div>
    </div>

    <!-- Full mode -->
    <div v-else class="usage-full">
      <div class="usage-header">
        <div class="metric-info">
          <i :class="getMetricIcon(metricType)"></i>
          <div class="metric-details">
            <h4 class="metric-name">{{ getMetricDisplayName(metricType) }}</h4>
            <span class="metric-description" v-if="description">{{ description }}</span>
          </div>
        </div>
        <span :class="['usage-status', getUsageClass(usagePercent)]">
          {{ getUsageStatus(usagePercent) }}
        </span>
      </div>

      <div class="usage-progress">
        <div class="progress">
          <div 
            :class="['progress-bar', getProgressBarClass(usagePercent)]"
            :style="{ width: `${Math.min(100, usagePercent)}%` }"
          ></div>
        </div>
        
        <div class="usage-details">
          <div class="usage-text">
            <strong>{{ formatValue(currentValue, metricType) }}</strong> / 
            {{ formatLimit(limitValue, metricType) }}
            <span class="usage-percent">({{ usagePercent?.toFixed(1) }}%)</span>
          </div>
          
          <div v-if="showRemaining && getRemainingValue(currentValue, limitValue) !== -1" class="usage-remaining">
            <small class="text-muted">
              {{ formatValue(getRemainingValue(currentValue, limitValue), metricType) }}
              {{ t('usageWidget.remaining') }}
            </small>
          </div>
        </div>
      </div>

      <!-- Alerte si proche de la limite -->
      <div v-if="showAlert && usagePercent >= alertThreshold" class="usage-alert">
        <i class="fas fa-exclamation-triangle"></i>
        <span v-if="usagePercent >= 100">
          {{ t('usageWidget.limitExceeded') }}
        </span>
        <span v-else-if="usagePercent >= 90">
          {{ t('usageWidget.nearLimit') }}
        </span>
        <span v-else>
          {{ t('usageWidget.approachingLimit') }}
        </span>
      </div>

      <!-- Actions -->
      <div v-if="showActions" class="usage-actions">
        <button 
          v-if="canUpgrade"
          class="btn btn-primary btn-sm"
          @click="$emit('upgrade')"
        >
          <i class="fas fa-arrow-up"></i>
          {{ t('usageWidget.upgrade') }}
        </button>
        
        <button 
          v-if="canRefresh"
          class="btn btn-outline-secondary btn-sm"
          @click="$emit('refresh')"
          :disabled="isRefreshing"
        >
          <i :class="isRefreshing ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"></i>
          {{ t('usageWidget.refresh') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUsageMetricsStore } from '../../stores/usageMetrics'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  // Données de base
  metricType: string
  currentValue: number
  limitValue: number
  description?: string
  
  // Configuration d'affichage
  compact?: boolean
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'card' | 'inline'
  
  // Options d'affichage
  showRemaining?: boolean
  showAlert?: boolean
  showActions?: boolean
  alertThreshold?: number
  
  // Actions disponibles
  canUpgrade?: boolean
  canRefresh?: boolean
  isRefreshing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  size: 'medium',
  variant: 'default',
  showRemaining: true,
  showAlert: true,
  showActions: false,
  alertThreshold: 80,
  canUpgrade: false,
  canRefresh: false,
  isRefreshing: false
})

const emit = defineEmits<{
  upgrade: []
  refresh: []
}>()

// Traductions
useI18n().mergeLocaleMessage('en', {
  usageWidget: {
    remaining: 'remaining',
    limitExceeded: 'Limit exceeded',
    nearLimit: 'Near limit',
    approachingLimit: 'Approaching limit',
    upgrade: 'Upgrade',
    refresh: 'Refresh',
    ok: 'OK',
    warning: 'Warning',
    danger: 'Danger'
  }
})

useI18n().mergeLocaleMessage('fr', {
  usageWidget: {
    remaining: 'restant',
    limitExceeded: 'Limite dépassée',
    nearLimit: 'Proche de la limite',
    approachingLimit: 'Approche de la limite',
    upgrade: 'Améliorer',
    refresh: 'Actualiser',
    ok: 'OK',
    warning: 'Attention',
    danger: 'Danger'
  }
})

const usageMetricsStore = useUsageMetricsStore()

// Computed
const usagePercent = computed(() => {
  if (props.limitValue === -1) return 0 // Illimité
  if (props.limitValue === 0) return 100
  return Math.min(100, (props.currentValue / props.limitValue) * 100)
})

// Méthodes délégation vers le store
function getMetricIcon(metricType: string) {
  return usageMetricsStore.getMetricIcon(metricType)
}

function getUsageClass(usagePercent: number) {
  return usageMetricsStore.getUsageClass(usagePercent)
}

function getUsageStatus(usagePercent: number) {
  if (usagePercent >= 100) return t('usageWidget.danger')
  if (usagePercent >= 80) return t('usageWidget.warning')
  return t('usageWidget.ok')
}

function getUsageStatusShort(usagePercent: number) {
  if (usagePercent >= 100) return '!'
  if (usagePercent >= 80) return '⚠'
  return '✓'
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
.usage-widget {
  transition: all 0.3s ease;
}

/* Tailles */
.usage-widget.small {
  font-size: 0.875rem;
}

.usage-widget.medium {
  font-size: 1rem;
}

.usage-widget.large {
  font-size: 1.125rem;
}

/* Variantes */
.usage-widget.card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.usage-widget.inline {
  display: inline-block;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 10px 15px;
}

/* Mode compact */
.usage-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compact-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
}

.compact-header i {
  width: 16px;
  text-align: center;
  color: #6c757d;
}

.metric-label {
  flex: 1;
  font-weight: 500;
  color: #495057;
}

.usage-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
}

.compact-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-mini {
  flex: 1;
  height: 4px;
  background-color: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-mini {
  height: 100%;
  transition: width 0.3s ease;
}

.usage-text-mini {
  font-size: 0.75rem;
  color: #6c757d;
  white-space: nowrap;
}

/* Mode complet */
.usage-full {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.metric-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.metric-info i {
  font-size: 1.5rem;
  color: #6c757d;
  width: 24px;
  text-align: center;
}

.metric-details {
  flex: 1;
}

.metric-name {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.metric-description {
  font-size: 0.875rem;
  color: #6c757d;
  line-height: 1.3;
}

.usage-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.usage-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.usage-text {
  font-size: 0.9rem;
  color: #495057;
}

.usage-percent {
  color: #6c757d;
  font-weight: 500;
}

.usage-remaining {
  text-align: right;
}

/* Alertes */
.usage-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.usage-alert.text-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.usage-alert.text-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

/* Actions */
.usage-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* Classes d'état */
.text-success { color: #28a745; background-color: #d4edda; }
.text-info { color: #17a2b8; background-color: #d1ecf1; }
.text-warning { color: #856404; background-color: #fff3cd; }
.text-danger { color: #721c24; background-color: #f8d7da; }
.text-muted { color: #6c757d; }

/* Classes de barre de progression */
.bg-success { background-color: #28a745; }
.bg-info { background-color: #17a2b8; }
.bg-warning { background-color: #ffc107; }
.bg-danger { background-color: #dc3545; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 0.875rem;
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
  font-size: 0.75rem;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
  background-color: transparent;
}

.btn-outline-secondary:hover:not(:disabled) {
  background-color: #6c757d;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .usage-details {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .usage-remaining {
    text-align: left;
  }
  
  .usage-actions {
    justify-content: stretch;
  }
  
  .usage-actions .btn {
    flex: 1;
  }
}

/* Animation pour les changements de valeur */
@keyframes value-change {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.usage-text strong {
  animation: value-change 0.3s ease-in-out;
}
</style>