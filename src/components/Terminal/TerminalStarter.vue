<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Refactored version - split into smaller components
 */
-->

<template>
  <div class="terminal-starter">
    <!-- Debug info en mode développement -->
    <div v-if="showDebug" class="debug-panel">
      <h4>Debug Info</h4>
      <p>isStarting: {{ isStarting }}</p>
      <p>composerReady: {{ composerRef?.isReady }}</p>
      <p>selectedDistribution: {{ composerRef?.selectedDistribution?.name }}</p>
      <p>selectedSize: {{ composerRef?.selectedSize?.key }}</p>
      <p>currentSubscription: {{ !!currentSubscription }}</p>
    </div>

    <!-- Panneau de démarrage -->
    <SettingsCard :title="t('terminals.startNewSession')">
      <template #headerActions>
        <div class="header-actions-group">
          <!-- Session Count Badge -->
          <div v-if="currentTerminalCount > 0" class="session-count-badge">
            <i class="fas fa-terminal"></i>
            <span>{{ t('terminalStarter.activeSessions', { count: currentTerminalCount }) }}</span>
          </div>

          <!-- Compact Capacity Check -->
          <div v-if="composerRef?.selectedDistribution" class="capacity-check-inline" :class="`status-${capacityStatusLevel}`">
            <i :class="capacityStatusIcon"></i>
            <span class="capacity-text">{{ capacityStatusText }}</span>
          </div>

        </div>
      </template>

      <!-- Session Composer: Distribution / Size / Features -->
      <SessionComposer
        ref="composerRef"
        :backend-id="selectedBackendId || undefined"
        :organization-id="selectedOrganizationId || undefined"
        :disabled="isStarting"
        :is-assigned-subscription="isAssignedSubscription"
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
        :exercise-ref="exerciseRef"
        :hostname="hostnameInput"
        :packages="packagesInput"
        :default-packages="selectedInstanceDefaultPackages"
        :disabled="isStarting"
        :show-backend-selector="backendsStore.hasMultipleBackends"
        :backends="backends"
        :selected-backend-id="selectedBackendId"
        @update:exercise-ref="exerciseRef = $event"
        @update:hostname="handleHostnameUpdate($event)"
        @update:packages="packagesInput = $event"
        @update:selected-backend-id="selectedBackendId = $event"
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

      <!-- Launch CTA -->
      <div class="launch-section">
        <Button
          type="button"
          variant="primary"
          size="lg"
          class="launch-button"
          :icon="isStarting ? 'fas fa-spinner fa-spin' : composerRef?.loadingOptions ? 'fas fa-spinner fa-spin' : 'fas fa-rocket'"
          :disabled="!isFormValid || isStarting || !!composerRef?.loadingOptions"
          :loading="isStarting || !!composerRef?.loadingOptions"
          @click="startNewSession"
        >
          {{ isStarting ? t('terminalStarter.buttonStarting') : composerRef?.loadingOptions ? t('terminalStarter.loadingOptions') : t('terminalStarter.launchTerminal') }}
        </Button>
      </div>
    </SettingsCard>

    <!-- Recording Acknowledgement Modal -->
    <BaseModal
      :visible="showRecordingAcknowledgement"
      :title="t('terminalStarter.recordingAcknowledgementTitle')"
      title-icon="fas fa-circle-dot"
      size="medium"
      :show-close="true"
      @close="handleRecordingAcknowledgement()"
    >
      <p class="recording-consent-message">
        {{ t('terminalStarter.recordingAcknowledgementMessage') }}
      </p>
      <p class="recording-privacy-link">
        <router-link to="/privacy" target="_blank">
          <i class="fas fa-shield-alt"></i> {{ t('terminalStarter.privacyPolicyLink') }}
        </router-link>
      </p>
      <template #footer>
        <button class="btn btn-primary" @click="handleRecordingAcknowledgement()">
          <i class="fas fa-check"></i>
          {{ t('terminalStarter.recordingUnderstood') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'

import axios from 'axios'
import { terminalService } from '../../services/domain/terminal'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useTerminalMetricsStore } from '../../stores/terminalMetrics'

import { useOrganizationsStore } from '../../stores/organizations'
import { useTerminalBackendsStore } from '../../stores/terminalBackends'
import { usePermissionsStore } from '../../stores/permissions'
import { useNotification } from '../../composables/useNotification'
import { useTranslations } from '../../composables/useTranslations'

import SettingsCard from '../UI/SettingsCard.vue'
import Button from '../UI/Button.vue'
import SessionComposer from './SessionComposer.vue'
import TerminalAdvancedOptions from './TerminalAdvancedOptions.vue'
import TerminalUsagePanel from './TerminalUsagePanel.vue'
import BaseModal from '../Modals/BaseModal.vue'
import type { StartComposedSessionData } from '../../types/terminal'

// Emit events
const emit = defineEmits(['session-started'])

// Stores
const subscriptionsStore = useSubscriptionsStore()
const metricsStore = useTerminalMetricsStore()
const organizationsStore = useOrganizationsStore()
const backendsStore = useTerminalBackendsStore()
const permissionsStore = usePermissionsStore()

// i18n setup
const { t } = useTranslations({
  en: {
    terminals: {
      startNewSession: 'Start New Session'
    },
    terminalStarter: {
      launchTerminal: 'Create session',
      loadingOptions: 'Loading options...',
      buttonStarting: 'Starting...',
      readyToLaunch: 'Ready to Launch',
      capacityIssue: 'Capacity Issue',
      checkingCapacity: 'Checking...',
      startingSession: 'Starting terminal session...',
      checkingLimits: 'Checking usage limits...',
      sendingRequest: 'Sending request to server...',
      sessionCreated: 'Session created, initializing terminal...',
      errorValidationInstance: 'Please select a machine type',
      errorLimitReached: 'You have reached your limit of concurrent terminals. Please stop an existing terminal or upgrade your plan.',
      errorLimitReachedOrg: 'You have reached the concurrent terminal limit provided by your organization\'s plan. You can upgrade to a personal plan for more, or contact your organization administrator.',
      errorLimitReachedAssigned: 'You have used all your available terminals. Please close an existing terminal to start a new one.',
      errorLimitReachedTitle: 'Limit Reached',
      errorInstanceNotAvailable: 'The selected machine is not available with your current plan. Please choose another machine or upgrade your plan.',
      errorInstanceNotAvailableOrg: 'The selected machine is not available with your organization\'s plan. You can upgrade to a personal plan, or contact your organization administrator.',
      errorInstanceNotAvailableTitle: 'Machine Not Available',
      errorInstanceRestricted: 'Machine Not Allowed',
      errorInstanceRestrictedMessage: 'Machine "{name}" requires sizes: {required}\nYour plan allows: {allowed}\n\nPlease choose another machine or upgrade your plan.',
      errorInstanceRestrictedMessageOrg: 'Machine "{name}" requires sizes: {required}\nYour organization\'s plan allows: {allowed}\n\nYou can upgrade to a personal plan for more, or contact your organization administrator.',
      errorUpgradePrompt: 'Would you like to view available plans to unlock this instance?',
      errorUpgradePromptTitle: 'Upgrade Plan',
      errorViewPlans: 'View Plans',
      errorDismiss: 'Dismiss',
      errorStarting: 'Startup Error',
      errorServerCapacity: 'Server at Capacity',
      errorServerCapacityMessage: 'The server does not have enough resources to create a new terminal session. Please try again in a few minutes or stop an existing terminal.',
      activeSessions: '{count} active session | {count} active sessions',
      backendOffline: 'Server "{name}" is offline. Please select another server or try again later.',
      loadingInstanceTypes: 'Loading machine types...',
      noInstanceTypesForBackend: 'No machine types available for this server.',
      recordingAcknowledgementTitle: 'Command Recording',
      recordingAcknowledgementMessage: 'Your terminal commands are recorded for security and learning purposes. Administrators and instructors can view your command history. You can export or delete your history at any time.\n\nAvoid typing passwords or tokens directly in the terminal — they may be captured in your command history.',
      recordingUnderstood: 'I understand',
      commandHistory: 'Command History',
      privacyPolicyLink: 'Learn more about how your data is handled',
      termsAcceptance: "J'accepte les conditions d'utilisation du service terminal.",
      errorStartingSession: 'Error starting session',
    }
  },
  fr: {
    terminals: {
      startNewSession: 'Démarrer une Nouvelle Session'
    },
    terminalStarter: {
      launchTerminal: 'Créer une session',
      loadingOptions: 'Chargement des options...',
      buttonStarting: 'Démarrage...',
      readyToLaunch: 'Prêt à Lancer',
      capacityIssue: 'Problème de Capacité',
      checkingCapacity: 'Vérification...',
      startingSession: 'Démarrage de la session terminal...',
      checkingLimits: 'Vérification des limites d\'utilisation...',
      sendingRequest: 'Envoi de la requête au serveur...',
      sessionCreated: 'Session créée, initialisation du terminal...',
      errorValidationInstance: 'Veuillez sélectionner un type de machine',
      errorLimitReached: 'Vous avez atteint votre limite de terminaux simultanés. Veuillez arrêter un terminal existant ou mettre à niveau votre plan.',
      errorLimitReachedOrg: 'Vous avez atteint la limite de terminaux simultanés fournie par le plan de votre organisation. Vous pouvez souscrire un plan personnel pour en avoir plus, ou contacter l\'administrateur de votre organisation.',
      errorLimitReachedAssigned: 'Vous avez utilisé tous vos terminaux disponibles. Veuillez fermer un terminal existant pour en démarrer un nouveau.',
      errorLimitReachedTitle: 'Limite atteinte',
      errorInstanceNotAvailable: 'La machine sélectionnée n\'est pas disponible avec votre plan actuel. Veuillez choisir une autre machine ou mettre à niveau votre plan.',
      errorInstanceNotAvailableOrg: 'La machine sélectionnée n\'est pas disponible avec le plan de votre organisation. Vous pouvez souscrire un plan personnel, ou contacter l\'administrateur de votre organisation.',
      errorInstanceNotAvailableTitle: 'Machine non disponible',
      errorInstanceRestricted: 'Machine non autorisée',
      errorInstanceRestrictedMessage: 'La machine "{name}" nécessite les tailles: {required}\nVotre plan autorise: {allowed}\n\nVeuillez choisir une autre machine ou mettre à niveau votre plan.',
      errorInstanceRestrictedMessageOrg: 'La machine "{name}" nécessite les tailles: {required}\nLe plan de votre organisation autorise: {allowed}\n\nVous pouvez souscrire un plan personnel pour en avoir plus, ou contacter l\'administrateur de votre organisation.',
      errorUpgradePrompt: 'Souhaitez-vous voir les plans disponibles pour débloquer cette instance ?',
      errorUpgradePromptTitle: 'Mettre à niveau le plan',
      errorViewPlans: 'Voir les plans',
      errorDismiss: 'Fermer',
      errorStarting: 'Erreur de démarrage',
      errorServerCapacity: 'Serveur à Capacité Maximale',
      errorServerCapacityMessage: 'Le serveur n\'a pas suffisamment de ressources pour créer une nouvelle session terminal. Veuillez réessayer dans quelques minutes ou arrêter un terminal existant.',
      activeSessions: '{count} session active | {count} sessions actives',
      backendOffline: 'Le serveur « {name} » est hors ligne. Veuillez sélectionner un autre serveur ou réessayer plus tard.',
      loadingInstanceTypes: 'Chargement des types de machines...',
      noInstanceTypesForBackend: 'Aucun type de machine disponible sur ce serveur.',
      recordingAcknowledgementTitle: 'Enregistrement des commandes',
      recordingAcknowledgementMessage: 'Vos commandes terminal sont enregistrées à des fins de sécurité et d\'apprentissage. Les administrateurs et encadrants peuvent consulter votre historique de commandes. Vous pouvez exporter ou supprimer votre historique à tout moment.\n\nÉvitez de saisir des mots de passe ou des jetons directement dans le terminal — ils pourraient être capturés dans votre historique de commandes.',
      recordingUnderstood: 'J\'ai compris',
      commandHistory: 'Historique des commandes',
      privacyPolicyLink: 'En savoir plus sur le traitement de vos données',
      termsAcceptance: "J'accepte les conditions d'utilisation du service terminal.",
      errorStartingSession: 'Erreur lors du démarrage de la session',
    }
  }
})

const { showConfirm, showError: showErrorNotification } = useNotification()

// Panel state
const showDebug = ref(false)

// Application state
const isStarting = ref(false)
const startStatus = ref('')

// Recording acknowledgement: recording always happens (RGPD Art. 6.1.f — legitimate interest).
// The modal informs the user; it does not gate recording.
const RECORDING_ACK_KEY = 'terminal-recording-acknowledged'
const showRecordingAcknowledgement = ref(false)
const recordingAcknowledged = ref(localStorage.getItem(RECORDING_ACK_KEY) === '1')

// Session information
const sessionInfo = ref<any>(null)
let usageRefreshInterval: NodeJS.Timeout | null = null

// Usage refresh configuration
const USAGE_REFRESH_INTERVAL = 600000 // 10 minutes

// Session Composer ref
const composerRef = ref<InstanceType<typeof SessionComposer>>()

// Form
const nameInput = ref('')
const exerciseRef = ref('')
const hostnameInput = ref('')
const packagesInput = ref('')
const userManuallySetHostname = ref(false)
const autoGeneratedHostname = ref('')
// Organizations & Backends
const { currentOrganizationId: storeOrgId } = storeToRefs(organizationsStore)
const selectedOrganizationId = computed(() => organizationsStore.currentOrganization?.id || '')
const backends = computed(() => backendsStore.backends)
const selectedBackendId = computed({
  get: () => backendsStore.selectedBackendId || '',
  set: (val: string) => backendsStore.selectBackend(val)
})

// Default packages (not used with composer, kept for backward compat in TerminalAdvancedOptions)
const selectedInstanceDefaultPackages = computed(() => [] as string[])

// Subscription and usage state
const currentSubscription = computed(() => subscriptionsStore.currentSubscription)
const isAssignedSubscription = computed(() => {
  const sub = currentSubscription.value
  return sub?.subscription_type === 'assigned' || !!sub?.subscription_batch_id
})
const currentTerminalCount = ref(0)
const loadingUsage = ref(false)
const refreshingUsage = ref(false)

// Computed properties
const allowedMachineSizes = computed(() => {
  const sizes = currentSubscription.value?.subscription_plan?.allowed_machine_sizes || []
  if (sizes.length === 0) {
    return ['XS']
  }
  return sizes
})

const maxTerminals = computed(() => {
  // Use permissions store as single source of truth (same as nav menu and other components)
  // This reads from effectiveFeatures which is org-scoped and refreshed on org switch
  return permissionsStore.getMaxConcurrentTerminals || 1
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
  const dist = composerRef.value?.selectedDistribution
  if (!dist || !serverMetrics.value) return null

  // Check CPU - must be under 95%
  if (serverMetrics.value.cpu_percent > 95) {
    return false
  }

  // Check RAM
  const requiredRAM = getInstanceRAMRequirement(dist.name)
  const totalRequired = requiredRAM + SYSTEM_RESERVE_GB

  return serverMetrics.value.ram_available_gb >= totalRequired
})

const capacityStatusLevel = computed(() => {
  if (!composerRef.value?.selectedDistribution) return 'neutral'
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
  if (!composerRef.value?.selectedDistribution) return ''
  if (canLaunchInstance.value === null) return t('terminalStarter.checkingCapacity')
  return canLaunchInstance.value
    ? t('terminalStarter.readyToLaunch')
    : t('terminalStarter.capacityIssue')
})

// Form validation
const isFormValid = computed(() => {
  if (!composerRef.value?.isReady) return false
  // Check if user has reached terminal limit
  if (currentTerminalCount.value >= maxTerminals.value) return false
  return true
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

function sanitizeHostname(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
}

function resetForm() {
  nameInput.value = ''
  exerciseRef.value = ''
  hostnameInput.value = ''
  packagesInput.value = ''
  userManuallySetHostname.value = false
  autoGeneratedHostname.value = ''
}

// Auto-fill hostname when distribution changes in the composer
watch(() => composerRef.value?.selectedDistribution, (dist) => {
  if (dist && !userManuallySetHostname.value) {
    const hostname = sanitizeHostname(dist.name || dist.prefix)
    autoGeneratedHostname.value = hostname
    hostnameInput.value = hostname
  }
})

function getLimitReachedMessage(source?: string): string {
  if (source === 'organization') {
    return t('terminalStarter.errorLimitReachedOrg')
  }
  if (isAssignedSubscription.value) {
    return t('terminalStarter.errorLimitReachedAssigned')
  }
  return t('terminalStarter.errorLimitReached')
}

function handleHostnameUpdate(value: string) {
  hostnameInput.value = value
  if (value === '') {
    userManuallySetHostname.value = false
  } else if (value !== autoGeneratedHostname.value) {
    userManuallySetHostname.value = true
  }
}

function handleRecordingAcknowledgement() {
  recordingAcknowledged.value = true
  localStorage.setItem(RECORDING_ACK_KEY, '1')
  showRecordingAcknowledgement.value = false
  startNewSession()
}

// Watch for global organization changes — reload org-dependent data
watch(storeOrgId, async (newOrgId) => {
  currentTerminalCount.value = 0
  if (newOrgId) {
    // Reload current usage count and backends for new org context
    // Limits come from permissionsStore (reactive, already refreshed by setCurrentOrganization)
    await loadCurrentTerminalUsage().catch(() => {})
    await backendsStore.fetchBackends(newOrgId).catch(() => {})
  }
  // Reload distributions in composer (backend may have changed)
  composerRef.value?.loadDistributions()
})

// Watch for backend changes to reload distributions in composer
watch(selectedBackendId, () => {
  composerRef.value?.loadDistributions()
})

async function startNewSession() {
  const composer = composerRef.value
  if (!composer?.selectedDistribution || !composer?.selectedSize) {
    showErrorNotification(t('terminalStarter.errorValidationInstance'), t('terminalStarter.errorStarting'))
    return
  }

  // Show recording acknowledgement if user hasn't seen it yet
  if (!recordingAcknowledged.value) {
    showRecordingAcknowledgement.value = true
    return // Wait for user acknowledgement
  }

  // Sync sessions first to ensure finished sessions are updated
  try {
    await syncAllSessions()
    // Refresh usage count after syncing
    await loadCurrentTerminalUsage()
  } catch (syncError) {
    console.error('Failed to sync sessions before launch:', syncError)
    // Continue anyway - this is a best-effort sync
  }

  // Check usage limits
  startStatus.value = t('terminalStarter.checkingLimits')

  try {
    const usageResult = await subscriptionsStore.checkUsageLimit('concurrent_terminals', 1)

    if (!usageResult.allowed) {
      const limitMsg = getLimitReachedMessage(usageResult.source)
      showErrorNotification(
        limitMsg,
        t('terminalStarter.errorLimitReachedTitle')
      )
      return
    }
  } catch (error: any) {
    console.error('Error checking usage limits:', error)
    if (error.response?.status === 403 && error.response?.data?.error_message?.includes('Maximum concurrent terminals')) {
      const source = error.response?.data?.source || (isAssignedSubscription.value ? 'organization' : 'personal')
      const limitMsg = getLimitReachedMessage(source)
      showErrorNotification(
        error.response.data.error_message + ' ' + limitMsg,
        t('terminalStarter.errorLimitReachedTitle')
      )
      return
    }
  }

  isStarting.value = true
  startStatus.value = t('terminalStarter.startingSession')

  try {
    const parsedPackages = packagesInput.value.trim()
      ? packagesInput.value.split(',').map(p => p.trim()).filter(Boolean)
      : []

    const sessionData: StartComposedSessionData = {
      distribution: composer.selectedDistribution.name,
      size: composer.selectedSize.key,
      features: composer.enabledFeatures,
      terms: t('terminalStarter.termsAcceptance'),
      recording_enabled: 1,
      ...(nameInput.value.trim() && { name: nameInput.value.trim() }),
      ...(hostnameInput.value.trim() && { hostname: hostnameInput.value.trim() }),
      ...(backendsStore.selectedBackendId && { backend: backendsStore.selectedBackendId }),
      ...(selectedOrganizationId.value && { organization_id: selectedOrganizationId.value }),
      ...(parsedPackages.length > 0 && { packages: parsedPackages })
    }

    startStatus.value = t('terminalStarter.sendingRequest')

    const response = await terminalService.startComposedSession(sessionData)

    sessionInfo.value = {
      session_id: response.session_id,
      console_url: response.console_url,
      expires_at: response.expires_at,
      status: response.status
    }

    startStatus.value = t('terminalStarter.sessionCreated')

    // Save last config for "repeat last session" feature
    composerRef.value?.saveLastConfig()

    // Emit event — parent redirects to session view
    emit('session-started', sessionInfo.value.session_id)

  } catch (error: any) {
    console.error('Error starting session:', error)

    const errorMsg = error.response?.data?.error_message || error.message || t('terminalStarter.errorStartingSession')

    if (error.response?.status === 503) {
      const backendName = error.response?.data?.backend_name || backendsStore.selectedBackend?.name
      if (backendName) {
        showErrorNotification(
          t('terminalStarter.backendOffline', { name: backendName }),
          t('terminalStarter.errorServerCapacity')
        )
      } else {
        showErrorNotification(errorMsg, t('terminalStarter.errorServerCapacity'))
      }
    } else if (error.response?.status === 400 && errorMsg.includes('not allowed in your plan')) {
      const confirmed = await showConfirm(
        errorMsg + '\n\n' + t('terminalStarter.errorUpgradePrompt'),
        t('terminalStarter.errorInstanceRestricted'),
        {
          confirmButtonText: t('terminalStarter.errorViewPlans'),
          cancelButtonText: t('terminalStarter.errorDismiss')
        }
      )
      if (confirmed) {
        window.open('/subscription-plans', '_blank')
      }
    } else {
      showErrorNotification(errorMsg, t('terminalStarter.errorStarting'))
    }
  } finally {
    isStarting.value = false
    startStatus.value = ''
  }
}

function cleanup() {
  if (usageRefreshInterval) {
    clearInterval(usageRefreshInterval)
    usageRefreshInterval = null
  }
}

onMounted(async () => {
  await Promise.all([
    subscriptionsStore.getCurrentSubscription(),
    loadCurrentTerminalUsage()
  ])

  // Load organizations separately (must not break Promise.all if it fails)
  try {
    await organizationsStore.loadOrganizations()
  } catch {
    // Non-critical: org loading failure should not block terminal creation
  }

  // Fetch backends for the current org (selected globally via store)
  if (selectedOrganizationId.value) {
    try {
      await backendsStore.fetchBackends(selectedOrganizationId.value)
    } catch {
      // Non-critical: backend loading failure should not block terminal creation
    }
  }

  // SessionComposer loads distributions on its own mount (via onMounted)

  // Start periodic refresh of usage metrics
  usageRefreshInterval = setInterval(async () => {
    try {
      await loadCurrentTerminalUsage()
    } catch (error) {
      // Silently handle errors
    }
  }, USAGE_REFRESH_INTERVAL)

  // Load initial metrics for capacity check
  metricsStore.refreshMetrics(backendsStore.selectedBackendId || undefined)

  // Periodic refresh of metrics (every 30 seconds)
  const metricsRefreshInterval = setInterval(() => {
    if (composerRef.value?.selectedDistribution) {
      metricsStore.refreshMetrics(backendsStore.selectedBackendId || undefined)
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

.session-count-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.session-count-badge i {
  color: var(--color-info);
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

.instance-types-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}

.instance-types-loading i {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
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

/* Launch CTA */
.launch-section {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: var(--border-width-thin) solid var(--color-border-light);
  display: flex;
  justify-content: center;
}

.launch-button {
  width: 100%;
  max-width: 400px;
  font-size: var(--font-size-lg);
}

.recording-consent-message {
  color: var(--color-text-primary);
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

.recording-privacy-link {
  margin-top: var(--spacing-sm);
  margin-bottom: 0;
}

.recording-privacy-link a {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-primary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: opacity 0.3s ease;
}

.recording-privacy-link a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.command-history-panel {
  margin-top: var(--spacing-lg);
}

@media (max-width: 768px) {
  .header-actions-group {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
    width: 100%;
  }

  .session-count-badge {
    justify-content: center;
  }

  .capacity-check-inline {
    justify-content: center;
  }
}
</style>
