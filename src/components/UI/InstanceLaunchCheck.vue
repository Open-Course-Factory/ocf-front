<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div v-if="instanceType" class="instance-launch-check" :class="`status-${statusLevel}`">
    <div class="check-content">
      <div class="check-icon">
        <i :class="getStatusIcon()"></i>
      </div>
      <div class="check-message">
        <strong>{{ statusMessage }}</strong>
        <p v-if="showDetails" class="details">{{ statusDetails }}</p>
      </div>
      <Button
        v-if="showRefreshButton"
        size="sm"
        variant="outline-secondary"
        :icon="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
        :disabled="isLoading"
        @click="checkCapacity"
        :title="t('instanceLaunchCheck.refresh')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useTerminalMetricsStore } from '../../stores/terminalMetrics'
import Button from './Button.vue'

interface Props {
  instanceType?: string | null
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
  showRefreshButton?: boolean
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  instanceType: null,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  showRefreshButton: false,
  showDetails: true
})

const { t } = useTranslations({
  en: {
    instanceLaunchCheck: {
      canLaunch: 'Ready to Launch',
      cannotLaunch: 'Cannot Launch',
      checking: 'Checking...',
      sufficientResources: 'Server has sufficient resources for this instance.',
      insufficientRAM: 'Insufficient RAM available. Need {required}GB, only {available}GB available.',
      highCPU: 'Server CPU is critically high ({cpu}%). Please wait before launching.',
      selectInstance: 'Select an instance to check server capacity.',
      refresh: 'Check again',
      capacityOK: 'Server capacity OK',
      capacityIssue: 'Server capacity issue'
    }
  },
  fr: {
    instanceLaunchCheck: {
      canLaunch: 'Prêt à Lancer',
      cannotLaunch: 'Impossible de Lancer',
      checking: 'Vérification...',
      sufficientResources: 'Le serveur dispose de ressources suffisantes pour cette instance.',
      insufficientRAM: 'RAM insuffisante. Besoin de {required}GB, seulement {available}GB disponible.',
      highCPU: 'Le CPU du serveur est critique ({cpu}%). Veuillez attendre avant de lancer.',
      selectInstance: 'Sélectionnez une instance pour vérifier la capacité du serveur.',
      refresh: 'Vérifier à nouveau',
      capacityOK: 'Capacité du serveur OK',
      capacityIssue: 'Problème de capacité du serveur'
    }
  }
})

const metricsStore = useTerminalMetricsStore()

const isLoading = ref(false)
let refreshIntervalId: NodeJS.Timeout | null = null

// Estimated RAM requirements per instance (in GB)
// These are conservative estimates - adjust based on your actual instance requirements
const INSTANCE_RAM_REQUIREMENTS: Record<string, number> = {
  'alpine': 0.5,   // Alpine is very lightweight
  'debian': 1.0,   // Debian standard
  'ubuntu': 1.0,   // Ubuntu standard
  'default': 1.0   // Default for unknown instances
}

// Reserve buffer for system (in GB)
const SYSTEM_RESERVE_GB = 0.6

onMounted(() => {
  // Initial check
  if (props.instanceType) {
    checkCapacity()
  }

  // Setup auto-refresh if enabled
  if (props.autoRefresh) {
    refreshIntervalId = setInterval(() => {
      if (props.instanceType) {
        checkCapacity()
      }
    }, props.refreshInterval)
  }
})

onBeforeUnmount(() => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
  }
})

// Watch for instance type changes
watch(() => props.instanceType, (newInstance) => {
  if (newInstance) {
    checkCapacity()
  }
})

const metrics = computed(() => metricsStore.metrics)

// Calculate if the selected instance can be launched
const canLaunch = computed(() => {
  if (!props.instanceType || !metrics.value) return null

  // Check CPU - must be under 95%
  if (metrics.value.cpu_percent > 95) {
    return false
  }

  // Check RAM - must have enough for instance + system reserve
  const requiredRAM = getInstanceRAMRequirement(props.instanceType)
  const totalRequired = requiredRAM + SYSTEM_RESERVE_GB

  return metrics.value.ram_available_gb >= totalRequired
})

const statusLevel = computed(() => {
  if (!props.instanceType) return 'neutral'
  if (canLaunch.value === null) return 'checking'
  return canLaunch.value ? 'ok' : 'error'
})

const statusMessage = computed(() => {
  if (!props.instanceType) return t('instanceLaunchCheck.selectInstance')
  if (isLoading.value) return t('instanceLaunchCheck.checking')
  if (canLaunch.value === null) return t('instanceLaunchCheck.checking')
  return canLaunch.value
    ? t('instanceLaunchCheck.canLaunch')
    : t('instanceLaunchCheck.cannotLaunch')
})

const statusDetails = computed(() => {
  if (!props.instanceType || !metrics.value || canLaunch.value === null) return ''

  if (canLaunch.value) {
    return t('instanceLaunchCheck.sufficientResources')
  }

  // Determine the specific issue
  if (metrics.value.cpu_percent > 95) {
    return t('instanceLaunchCheck.highCPU', { cpu: metrics.value.cpu_percent.toFixed(0) })
  }

  const requiredRAM = getInstanceRAMRequirement(props.instanceType)
  const totalRequired = requiredRAM + SYSTEM_RESERVE_GB

  return t('instanceLaunchCheck.insufficientRAM', {
    required: totalRequired.toFixed(1),
    available: metrics.value.ram_available_gb.toFixed(1)
  })
})

function getInstanceRAMRequirement(instancePrefix: string): number {
  // Try to match the instance prefix (e.g., 'alpine', 'debian', 'ubuntu')
  const lowerPrefix = instancePrefix.toLowerCase()

  for (const key in INSTANCE_RAM_REQUIREMENTS) {
    if (lowerPrefix.includes(key)) {
      return INSTANCE_RAM_REQUIREMENTS[key]
    }
  }

  return INSTANCE_RAM_REQUIREMENTS['default']
}

function getStatusIcon() {
  switch (statusLevel.value) {
    case 'ok':
      return 'fas fa-check-circle'
    case 'error':
      return 'fas fa-exclamation-circle'
    case 'checking':
      return 'fas fa-spinner fa-spin'
    default:
      return 'fas fa-info-circle'
  }
}

async function checkCapacity() {
  if (!props.instanceType) return

  isLoading.value = true
  try {
    // Bypass cache for real-time check
    await metricsStore.refreshMetrics()
  } catch (err) {
    console.error('Failed to check capacity:', err)
  } finally {
    isLoading.value = false
  }
}

// Expose canLaunch for parent component
defineExpose({
  canLaunch,
  checkCapacity
})
</script>

<style scoped>
.instance-launch-check {
  border: var(--border-width-medium) solid;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  transition: all var(--transition-base);
}

.instance-launch-check.status-ok {
  border-color: var(--color-success);
  background-color: var(--color-success-bg);
}

.instance-launch-check.status-error {
  border-color: var(--color-danger);
  background-color: var(--color-danger-bg);
}

.instance-launch-check.status-checking {
  border-color: var(--color-info);
  background-color: var(--color-info-bg);
}

.instance-launch-check.status-neutral {
  border-color: var(--color-border-medium);
  background-color: var(--color-bg-secondary);
}

.check-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.check-icon {
  font-size: var(--font-size-2xl);
  flex-shrink: 0;
}

.status-ok .check-icon {
  color: var(--color-success);
}

.status-error .check-icon {
  color: var(--color-danger);
}

.status-checking .check-icon {
  color: var(--color-info);
}

.status-neutral .check-icon {
  color: var(--color-text-secondary);
}

.check-message {
  flex: 1;
}

.check-message strong {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.check-message .details {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .check-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .check-icon {
    font-size: var(--font-size-xl);
  }
}
</style>
