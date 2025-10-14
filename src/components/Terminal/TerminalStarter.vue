<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * Refactored version - split into smaller components
 */
-->

<template>
  <div class="terminal-starter">
    <!-- Debug info en mode développement -->
    <div v-if="showDebug" class="debug-panel">
      <h4>Debug Info</h4>
      <p>showStartPanel: {{ showStartPanel }}</p>
      <p>showInfoPanel: {{ showInfoPanel }}</p>
      <p>showTerminalPanel: {{ showTerminalPanel }}</p>
      <p>isStarting: {{ isStarting }}</p>
      <p>instanceTypes.length: {{ instanceTypes.length }}</p>
      <p>selectedInstanceType: {{ selectedInstanceType }}</p>
      <p>allowedMachineSizes: {{ allowedMachineSizes }}</p>
      <p>currentSubscription: {{ !!currentSubscription }}</p>
    </div>

    <!-- Panneau de démarrage -->
    <SettingsCard v-show="showStartPanel" :title="t('terminals.startNewSession')">
      <template #headerActions>
        <div class="header-actions-group">
          <!-- Compact Capacity Check -->
          <div v-if="selectedInstanceType" class="capacity-check-inline" :class="`status-${capacityStatusLevel}`">
            <i :class="capacityStatusIcon"></i>
            <span class="capacity-text">{{ capacityStatusText }}</span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            :icon="isStarting ? 'fas fa-spinner fa-spin' : 'fas fa-rocket'"
            :disabled="!selectedInstanceType || isStarting"
            :loading="isStarting"
            @click="startNewSession"
          >
            {{ isStarting ? t('terminalStarter.buttonStarting') : t('terminalStarter.launchTerminal') }}
          </Button>
        </div>
      </template>

      <!-- Instance Type Selection -->
      <InstanceTypeSelector
        v-model="selectedInstanceType"
        :instance-types="instanceTypes"
        :allowed-sizes="allowedMachineSizes"
        @select="selectInstance"
      />

      <!-- Progress indicator -->
      <div v-if="isStarting" class="progress-container">
        <div class="progress">
          <div class="progress-bar progress-bar-striped progress-bar-animated"
               role="progressbar"
               style="width: 100%">
          </div>
        </div>
        <p class="status-text">{{ startStatus }}</p>
      </div>

      <!-- Advanced Options -->
      <TerminalAdvancedOptions
        v-model="nameInput"
        :disabled="isStarting"
        @reset="resetForm"
      />

      <!-- Usage & Quota -->
      <TerminalUsagePanel
        :subscription="currentSubscription"
        :current-count="currentTerminalCount"
        :max-count="maxTerminals"
        :allowed-sizes="allowedMachineSizes"
        :loading="loadingUsage"
        :refreshing="refreshingUsage"
        :refresh-interval-minutes="refreshIntervalMinutes"
        @refresh="refreshUsage"
      />
    </SettingsCard>

    <!-- Session Info Panel -->
    <TerminalSessionInfo
      v-if="showInfoPanel && sessionInfo"
      :session-info="sessionInfo"
      :instance-info="selectedInstanceInfo"
      :time-remaining="timeRemaining"
      :is-stopping="isStopping"
      @stop="stopSession"
    />

    <!-- Terminal Console Panel -->
    <TerminalConsole
      v-if="showTerminalPanel"
      ref="terminalConsoleRef"
      :session-info="sessionInfo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import axios from 'axios'
import { terminalService } from '../../services/terminalService'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useTerminalMetricsStore } from '../../stores/terminalMetrics'
import { useNotification } from '../../composables/useNotification'
import { useTranslations } from '../../composables/useTranslations'
import SettingsCard from '../UI/SettingsCard.vue'
import Button from '../UI/Button.vue'
import InstanceTypeSelector from './InstanceTypeSelector.vue'
import TerminalAdvancedOptions from './TerminalAdvancedOptions.vue'
import TerminalUsagePanel from './TerminalUsagePanel.vue'
import TerminalSessionInfo from './TerminalSessionInfo.vue'
import TerminalConsole from './TerminalConsole.vue'
import type { InstanceType } from '../../types'

// Emit events
const emit = defineEmits(['session-started'])

// Stores
const subscriptionsStore = useSubscriptionsStore()
const metricsStore = useTerminalMetricsStore()

// i18n setup
const { t } = useTranslations({
  en: {
    terminals: {
      startNewSession: 'Start New Session'
    },
    terminalStarter: {
      launchTerminal: 'Launch Terminal',
      buttonStarting: 'Starting...',
      readyToLaunch: 'Ready to Launch',
      capacityIssue: 'Capacity Issue',
      checkingCapacity: 'Checking...',
      startingSession: 'Starting terminal session...',
      checkingLimits: 'Checking usage limits...',
      sendingRequest: 'Sending request to server...',
      sessionCreated: 'Session created, initializing terminal...',
      sessionExpired: 'Your terminal session has expired',
      sessionExpiredTitle: 'Session Expired',
      errorValidationInstance: 'Please select an instance type',
      errorLimitReached: 'You have reached your limit of concurrent terminals. Please stop an existing terminal or upgrade your plan.',
      errorLimitReachedTitle: 'Limit Reached',
      errorInstanceNotAvailable: 'The selected instance is not available with your current plan. Please choose another instance or upgrade your plan.',
      errorInstanceNotAvailableTitle: 'Instance Not Available',
      errorInstanceRestricted: 'Instance Not Allowed',
      errorInstanceRestrictedMessage: 'Instance "{name}" requires sizes: {required}\nYour plan allows: {allowed}\n\nPlease choose another instance or upgrade your plan.',
      errorUpgradePrompt: 'Would you like to view available plans to unlock this instance?',
      errorUpgradePromptTitle: 'Upgrade Plan',
      errorStarting: 'Startup Error',
      errorStopping: 'Error stopping',
      errorStoppingMessage: 'Error stopping the session',
      errorServerCapacity: 'Server at Capacity',
      errorServerCapacityMessage: 'The server does not have enough resources to create a new terminal session. Please try again in a few minutes or stop an existing terminal.'
    }
  },
  fr: {
    terminals: {
      startNewSession: 'Démarrer une Nouvelle Session'
    },
    terminalStarter: {
      launchTerminal: 'Lancer le Terminal',
      buttonStarting: 'Démarrage...',
      readyToLaunch: 'Prêt à Lancer',
      capacityIssue: 'Problème de Capacité',
      checkingCapacity: 'Vérification...',
      startingSession: 'Démarrage de la session terminal...',
      checkingLimits: 'Vérification des limites d\'utilisation...',
      sendingRequest: 'Envoi de la requête au serveur...',
      sessionCreated: 'Session créée, initialisation du terminal...',
      sessionExpired: 'Votre session terminal a expiré',
      sessionExpiredTitle: 'Session expirée',
      errorValidationInstance: 'Veuillez sélectionner un type d\'instance',
      errorLimitReached: 'Vous avez atteint votre limite de terminaux simultanés. Veuillez arrêter un terminal existant ou mettre à niveau votre plan.',
      errorLimitReachedTitle: 'Limite atteinte',
      errorInstanceNotAvailable: 'L\'instance sélectionnée n\'est pas disponible avec votre plan actuel. Veuillez choisir une autre instance ou mettre à niveau votre plan.',
      errorInstanceNotAvailableTitle: 'Instance non disponible',
      errorInstanceRestricted: 'Instance non autorisée',
      errorInstanceRestrictedMessage: 'L\'instance "{name}" nécessite les tailles: {required}\nVotre plan autorise: {allowed}\n\nVeuillez choisir une autre instance ou mettre à niveau votre plan.',
      errorUpgradePrompt: 'Souhaitez-vous voir les plans disponibles pour débloquer cette instance ?',
      errorUpgradePromptTitle: 'Mettre à niveau le plan',
      errorStarting: 'Erreur de démarrage',
      errorStopping: 'Erreur d\'arrêt',
      errorStoppingMessage: 'Erreur lors de l\'arrêt de la session',
      errorServerCapacity: 'Serveur à Capacité Maximale',
      errorServerCapacityMessage: 'Le serveur n\'a pas suffisamment de ressources pour créer une nouvelle session terminal. Veuillez réessayer dans quelques minutes ou arrêter un terminal existant.'
    }
  }
})

const { showConfirm, showError: showErrorNotification, showWarning } = useNotification()

// Panel state
const showStartPanel = ref(true)
const showInfoPanel = ref(false)
const showTerminalPanel = ref(false)
const showDebug = ref(false)

// Application state
const isStarting = ref(false)
const isStopping = ref(false)
const startStatus = ref('')

// Session information
const sessionInfo = ref<any>(null)
const timeRemaining = ref(0)
let timerInterval: NodeJS.Timeout | null = null
let usageRefreshInterval: NodeJS.Timeout | null = null

// Usage refresh configuration
const USAGE_REFRESH_INTERVAL = 600000 // 10 minutes

// Form
const selectedInstanceType = ref('')
const nameInput = ref('')

// Instance types
const instanceTypes = ref<InstanceType[]>([])

// Subscription and usage state
const currentSubscription = computed(() => subscriptionsStore.currentSubscription)
const currentTerminalCount = ref(0)
const loadingUsage = ref(false)
const refreshingUsage = ref(false)

// Refs
const terminalConsoleRef = ref<any>(null)

// Computed properties
const selectedInstanceInfo = computed(() => {
  if (!selectedInstanceType.value || !instanceTypes.value.length) {
    return null
  }
  return instanceTypes.value.find(instance => instance.prefix === selectedInstanceType.value)
})

const allowedMachineSizes = computed(() => {
  const sizes = currentSubscription.value?.subscription_plan?.allowed_machine_sizes || []
  if (sizes.length === 0) {
    return ['XS']
  }
  return sizes
})

const sessionDurationCap = computed(() => {
  return currentSubscription.value?.plan_features?.session_duration_hours ?
    currentSubscription.value.plan_features.session_duration_hours * 3600 :
    3600
})

const maxTerminals = computed(() => {
  return currentSubscription.value?.plan_features?.concurrent_terminals || 1
})

const refreshIntervalMinutes = computed(() => {
  return Math.floor(USAGE_REFRESH_INTERVAL / 60000)
})

// Server capacity check
const INSTANCE_RAM_REQUIREMENTS: Record<string, number> = {
  'alpine': 0.5,
  'debian': 1.0,
  'ubuntu': 1.0,
  'default': 1.0
}
const SYSTEM_RESERVE_GB = 0.6

const serverMetrics = computed(() => metricsStore.metrics)

const canLaunchInstance = computed(() => {
  if (!selectedInstanceType.value || !serverMetrics.value) return null

  // Check CPU - must be under 95%
  if (serverMetrics.value.cpu_percent > 95) {
    return false
  }

  // Check RAM
  const requiredRAM = getInstanceRAMRequirement(selectedInstanceType.value)
  const totalRequired = requiredRAM + SYSTEM_RESERVE_GB

  return serverMetrics.value.ram_available_gb >= totalRequired
})

const capacityStatusLevel = computed(() => {
  if (!selectedInstanceType.value) return 'neutral'
  if (canLaunchInstance.value === null) return 'checking'
  return canLaunchInstance.value ? 'ok' : 'error'
})

const capacityStatusIcon = computed(() => {
  switch (capacityStatusLevel.value) {
    case 'ok':
      return 'fas fa-check-circle'
    case 'error':
      return 'fas fa-exclamation-circle'
    case 'checking':
      return 'fas fa-spinner fa-spin'
    default:
      return 'fas fa-info-circle'
  }
})

const capacityStatusText = computed(() => {
  if (!selectedInstanceType.value) return ''
  if (canLaunchInstance.value === null) return t('terminalStarter.checkingCapacity')
  return canLaunchInstance.value
    ? t('terminalStarter.readyToLaunch')
    : t('terminalStarter.capacityIssue')
})

// Helper functions
function getInstanceRAMRequirement(instancePrefix: string): number {
  const lowerPrefix = instancePrefix.toLowerCase()
  for (const key in INSTANCE_RAM_REQUIREMENTS) {
    if (lowerPrefix.includes(key)) {
      return INSTANCE_RAM_REQUIREMENTS[key]
    }
  }
  return INSTANCE_RAM_REQUIREMENTS['default']
}

async function loadInstanceTypes() {
  try {
    const loadedTypes = await terminalService.getInstanceTypes()

    if (!Array.isArray(loadedTypes)) {
      instanceTypes.value = []
      showErrorNotification('Invalid data format for instance types.', 'Loading Error')
      return
    }

    instanceTypes.value = loadedTypes

    if (instanceTypes.value.length === 0) {
      showWarning('No instance types available. Contact the administrator.', 'No instances available')
      return
    }

    setDefaultInstanceSelection()
  } catch (error: any) {
    console.error('Failed to load instance types:', error)
    showErrorNotification(`Invalid data format for instance types: ${error.message || error}`, 'Loading Error')
    instanceTypes.value = []
    selectedInstanceType.value = ''
  }
}

async function loadCurrentTerminalUsage() {
  try {
    loadingUsage.value = true

    const usageMetrics = await subscriptionsStore.getUsageMetrics()

    const terminalMetric = usageMetrics.find(metric =>
      metric.metric_type === 'concurrent_terminals' ||
      metric.name === 'concurrent_terminals'
    )

    if (terminalMetric) {
      currentTerminalCount.value = terminalMetric.current_value || 0
    } else {
      currentTerminalCount.value = 0
    }
  } catch (error) {
    console.error('Failed to load terminal usage:', error)
    currentTerminalCount.value = 0
  } finally {
    loadingUsage.value = false
  }
}

async function syncAllSessions() {
  try {
    const response = await axios.post('/terminals/sync-all')
    console.log('All sessions synchronized:', response.data)
    return response.data
  } catch (error) {
    console.error('Failed to sync sessions:', error)
    throw error
  }
}

async function refreshUsage() {
  try {
    refreshingUsage.value = true

    try {
      await syncAllSessions()
    } catch (syncError) {
      console.error('Failed to sync sessions:', syncError)
    }

    await loadCurrentTerminalUsage()
  } catch (error) {
    console.error('Failed to refresh usage:', error)
  } finally {
    refreshingUsage.value = false
  }
}

function setDefaultInstanceSelection() {
  if (instanceTypes.value.length > 0) {
    selectedInstanceType.value = instanceTypes.value[0].prefix
  } else {
    selectedInstanceType.value = ''
  }
}

function selectInstance(instance: InstanceType) {
  selectedInstanceType.value = instance.prefix
}

function resetForm() {
  nameInput.value = ''
  setDefaultInstanceSelection()
}

async function startNewSession() {
  if (!selectedInstanceType.value) {
    showErrorNotification(t('terminalStarter.errorValidationInstance'), t('terminalStarter.errorStarting'))
    return
  }

  // Check usage limits
  startStatus.value = t('terminalStarter.checkingLimits')

  try {
    const canCreateTerminal = await subscriptionsStore.checkUsageLimit('concurrent_terminals', 1)

    if (!canCreateTerminal) {
      showErrorNotification(
        t('terminalStarter.errorLimitReached'),
        t('terminalStarter.errorLimitReachedTitle')
      )
      return
    }
  } catch (error: any) {
    console.error('Error checking usage limits:', error)
    if (error.response?.status === 403 && error.response?.data?.error_message?.includes('Maximum concurrent terminals')) {
      showErrorNotification(
        error.response.data.error_message + ' ' + t('terminalStarter.errorLimitReached'),
        t('terminalStarter.errorLimitReachedTitle')
      )
      return
    }
  }

  isStarting.value = true
  startStatus.value = t('terminalStarter.startingSession')

  try {
    const sessionData = {
      terms: 'J\'accepte les conditions d\'utilisation du service terminal.',
      expiry: sessionDurationCap.value,
      ...(selectedInstanceType.value && { instance_type: selectedInstanceType.value }),
      ...(nameInput.value.trim() && { name: nameInput.value.trim() })
    }

    startStatus.value = t('terminalStarter.sendingRequest')

    const response = await axios.post('/terminals/start-session', sessionData)

    sessionInfo.value = {
      session_id: response.data.session_id,
      console_url: response.data.console_url,
      expires_at: response.data.expires_at,
      status: response.data.status
    }

    startStatus.value = t('terminalStarter.sessionCreated')

    // Hide start panel and show session panels
    showStartPanel.value = false
    showInfoPanel.value = true
    showTerminalPanel.value = true

    // Start expiration timer
    if (response.data.expires_at) {
      startExpirationTimer(response.data.expires_at)
    }

    // Emit event
    emit('session-started')

    // Refresh terminal count
    await loadCurrentTerminalUsage()

  } catch (error: any) {
    console.error('Error starting session:', error)

    const errorMsg = error.response?.data?.error_message || error.message || 'Error starting session'

    if (error.response?.status === 503) {
      showErrorNotification(errorMsg, t('terminalStarter.errorServerCapacity'))
    } else if (error.response?.status === 400 && errorMsg.includes('not allowed in your plan')) {
      const instanceMatch = errorMsg.match(/instance '([^']+)'/)
      const sizesMatch = errorMsg.match(/sizes \[([^\]]+)\]/)
      const allowedMatch = errorMsg.match(/Allowed sizes: \[([^\]]+)\]/)

      let enhancedError = errorMsg

      if (instanceMatch && sizesMatch && allowedMatch) {
        const instanceName = instanceMatch[1]
        const requiredSizes = sizesMatch[1].split('|').map(s => s.trim())
        const allowedSizes = allowedMatch[1].split(',').map(s => s.trim())

        enhancedError = t('terminalStarter.errorInstanceRestrictedMessage', {
          name: instanceName,
          required: requiredSizes.join(', '),
          allowed: allowedSizes.join(', ')
        })
      }

      showErrorNotification(enhancedError, t('terminalStarter.errorInstanceRestricted'))

      setTimeout(async () => {
        const confirmed = await showConfirm(
          t('terminalStarter.errorUpgradePrompt'),
          t('terminalStarter.errorUpgradePromptTitle')
        )
        if (confirmed) {
          window.open('/subscription-plans', '_blank')
        }
      }, 2000)
    } else {
      showErrorNotification(errorMsg, t('terminalStarter.errorStarting'))
    }

    showStartPanel.value = true
    showInfoPanel.value = false
    showTerminalPanel.value = false
  } finally {
    isStarting.value = false
    startStatus.value = ''
  }
}

async function stopSession() {
  if (!sessionInfo.value) return

  isStopping.value = true

  try {
    const sessionId = sessionInfo.value.session_id
    await axios.post(`/terminals/${sessionId}/stop`)

    await loadCurrentTerminalUsage()

    resetToStart()

  } catch (error: any) {
    console.error('Error stopping session:', error)
    const errorMsg = error.response?.data?.error_message || error.message || t('terminalStarter.errorStoppingMessage')
    showErrorNotification(errorMsg, t('terminalStarter.errorStopping'))
  } finally {
    isStopping.value = false
  }
}

function resetToStart() {
  cleanup()

  sessionInfo.value = null
  timeRemaining.value = 0

  showStartPanel.value = true
  showInfoPanel.value = false
  showTerminalPanel.value = false

  resetForm()
}

function startExpirationTimer(expiresAt: string) {
  const expirationTime = new Date(expiresAt).getTime()

  if (timerInterval) {
    clearInterval(timerInterval)
  }

  timerInterval = setInterval(() => {
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000))

    timeRemaining.value = remaining

    if (remaining <= 0) {
      clearInterval(timerInterval!)
      showWarning(t('terminalStarter.sessionExpired'), t('terminalStarter.sessionExpiredTitle'))
      showTerminalPanel.value = false
      showInfoPanel.value = false
    }
  }, 1000)
}

function cleanup() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  if (usageRefreshInterval) {
    clearInterval(usageRefreshInterval)
    usageRefreshInterval = null
  }
}

onMounted(async () => {
  await Promise.all([
    loadInstanceTypes(),
    subscriptionsStore.getCurrentSubscription(),
    loadCurrentTerminalUsage()
  ])

  await nextTick(() => {
    setDefaultInstanceSelection()
  })

  // Start periodic refresh of usage metrics
  usageRefreshInterval = setInterval(async () => {
    try {
      await loadCurrentTerminalUsage()
    } catch (error) {
      // Silently handle errors
    }
  }, USAGE_REFRESH_INTERVAL)

  // Load initial metrics for capacity check
  metricsStore.refreshMetrics()

  // Periodic refresh of metrics (every 30 seconds)
  const metricsRefreshInterval = setInterval(() => {
    if (selectedInstanceType.value) {
      metricsStore.refreshMetrics()
    }
  }, 30000)

  onBeforeUnmount(() => {
    clearInterval(metricsRefreshInterval)
  })
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style scoped>
.terminal-starter {
  max-width: 100%;
  margin: 0 auto;
}

.debug-panel {
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-sm);
}

.debug-panel h4 {
  margin-top: 0;
  color: var(--color-text-secondary);
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.capacity-check-inline {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.capacity-check-inline.status-ok {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.capacity-check-inline.status-ok i {
  color: var(--color-success);
}

.capacity-check-inline.status-error {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.capacity-check-inline.status-error i {
  color: var(--color-danger);
}

.capacity-check-inline.status-checking {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.capacity-check-inline.status-checking i {
  color: var(--color-info);
}

.capacity-check-inline .capacity-text {
  white-space: nowrap;
}

.progress-container {
  margin-top: var(--spacing-lg);
}

.progress {
  height: 20px;
  background-color: var(--color-gray-200);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--color-primary);
  transition: width var(--transition-slow);
}

.progress-bar-striped {
  background-image: linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent);
  background-size: 1rem 1rem;
}

.progress-bar-animated {
  animation: progress-bar-stripes 1s linear infinite;
}

@keyframes progress-bar-stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}

.status-text {
  text-align: center;
  margin-top: var(--spacing-sm);
  font-style: italic;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .header-actions-group {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
    width: 100%;
  }

  .capacity-check-inline {
    justify-content: center;
  }
}
</style>
