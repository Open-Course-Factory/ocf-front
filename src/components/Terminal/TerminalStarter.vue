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
          <!-- Session Count Badge -->
          <div v-if="currentTerminalCount > 0" class="session-count-badge">
            <i class="fas fa-terminal"></i>
            <span>{{ t('terminalStarter.activeSessions', { count: currentTerminalCount }) }}</span>
          </div>

          <!-- Compact Capacity Check -->
          <div v-if="selectedInstanceType" class="capacity-check-inline" :class="`status-${capacityStatusLevel}`">
            <i :class="capacityStatusIcon"></i>
            <span class="capacity-text">{{ capacityStatusText }}</span>
          </div>

        </div>
      </template>

      <!-- Instance Type Selection -->
      <div v-if="isLoadingInstanceTypes" class="instance-types-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>{{ t('terminalStarter.loadingInstanceTypes') }}</span>
      </div>
      <InstanceTypeSelector
        v-else
        v-model="selectedInstanceType"
        :instance-types="instanceTypes"
        :allowed-sizes="allowedMachineSizes"
        @select="selectInstance"
        @preselect="preselectInstance"
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
        :show-backend-selector="backendsStore.hasMultipleBackends"
        :backends="backends"
        :selected-backend-id="selectedBackendId"
        :show-bulk-mode="canUseGroups"
        :creation-mode="creationMode"
        :available-groups="availableGroups"
        :selected-group-id="selectedGroupId"
        :selected-group-member-count="selectedGroupMemberCount"
        @update:selected-backend-id="selectedBackendId = $event"
        @update:creation-mode="creationMode = $event"
        @update:selected-group-id="selectedGroupId = $event"
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
          :icon="isStarting ? 'fas fa-spinner fa-spin' : 'fas fa-rocket'"
          :disabled="!isFormValid || isStarting"
          :loading="isStarting"
          @click="startNewSession"
        >
          {{ isStarting ? t('terminalStarter.buttonStarting') : t('terminalStarter.launchTerminal') }}
        </Button>
      </div>
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
    <TerminalViewer
      v-if="showTerminalPanel"
      ref="terminalConsoleRef"
      :session-info="sessionInfo"
      :is-recording="recordingConsentResult === 1"
      use-settings-card
      title="Console Terminal"
      :full-height="false"
    />

    <!-- Command History Panel -->
    <div v-if="showHistoryPanel" class="command-history-panel">
      <CommandHistory :session-id="sessionInfo?.session_id" :is-active="showTerminalPanel" />
    </div>

    <!-- Recording Consent Modal -->
    <BaseModal
      :visible="showRecordingConsent"
      :title="t('terminalStarter.recordingConsentTitle')"
      title-icon="fas fa-circle-dot"
      size="medium"
      :show-close="true"
      @close="cancelRecordingConsent"
    >
      <p class="recording-consent-message">
        {{ t('terminalStarter.recordingConsentMessage', { days: retentionDays }) }}
      </p>
      <label class="remember-choice-label">
        <input type="checkbox" v-model="rememberConsent" />
        {{ t('terminalStarter.rememberChoice') }}
      </label>
      <template #footer>
        <button class="btn btn-primary" @click="handleRecordingConsent(true)">
          <i class="fas fa-check"></i>
          {{ t('terminalStarter.recordingAccept') }}
        </button>
        <button class="btn btn-secondary" @click="handleRecordingConsent(false)">
          {{ t('terminalStarter.recordingDecline') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { terminalService, instanceUtils } from '../../services/domain/terminal'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useTerminalMetricsStore } from '../../stores/terminalMetrics'
import { useClassGroupsStore } from '../../stores/classGroups'
import { useOrganizationsStore } from '../../stores/organizations'
import { useTerminalBackendsStore } from '../../stores/terminalBackends'
import { useNotification } from '../../composables/useNotification'
import { useTranslations } from '../../composables/useTranslations'
import { useFeatureFlags } from '../../composables/useFeatureFlags'
import SettingsCard from '../UI/SettingsCard.vue'
import Button from '../UI/Button.vue'
import InstanceTypeSelector from './InstanceTypeSelector.vue'
import TerminalAdvancedOptions from './TerminalAdvancedOptions.vue'
import TerminalUsagePanel from './TerminalUsagePanel.vue'
import TerminalSessionInfo from './TerminalSessionInfo.vue'
import TerminalViewer from './TerminalViewer.vue'
import CommandHistory from './CommandHistory.vue'
import BaseModal from '../Modals/BaseModal.vue'
import type { InstanceType } from '../../types'

// Router
const route = useRoute()

// Emit events
const emit = defineEmits(['session-started'])

// Stores
const subscriptionsStore = useSubscriptionsStore()
const metricsStore = useTerminalMetricsStore()
const groupsStore = useClassGroupsStore()
const organizationsStore = useOrganizationsStore()
const backendsStore = useTerminalBackendsStore()

// Feature flags
const { isEnabled } = useFeatureFlags()

// i18n setup
const { t } = useTranslations({
  en: {
    terminals: {
      startNewSession: 'Start New Session'
    },
    terminalStarter: {
      launchTerminal: 'Create session',
      buttonStarting: 'Starting...',
      readyToLaunch: 'Ready to Launch',
      capacityIssue: 'Capacity Issue',
      checkingCapacity: 'Checking...',
      creationMode: 'Creation Mode',
      singleTerminal: 'Single Terminal',
      bulkForGroup: 'Bulk for Group',
      selectGroup: 'Select Group',
      chooseGroup: 'Choose a group...',
      members: 'members',
      willCreate: 'Will create {count} terminals (1 per member)',
      startingSession: 'Starting terminal session...',
      startingBulkSessions: 'Creating terminals for group members...',
      checkingLimits: 'Checking usage limits...',
      sendingRequest: 'Sending request to server...',
      sessionCreated: 'Session created, initializing terminal...',
      bulkSessionsCreated: '{count} terminals created successfully',
      bulkSessionsPartial: '{successCount} of {totalCount} terminals created ({failedCount} failed)',
      sessionExpired: 'Your terminal session has expired',
      sessionExpiredTitle: 'Session Expired',
      errorValidationInstance: 'Please select an instance type',
      errorValidationGroup: 'Please select a group for bulk creation',
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
      errorServerCapacityMessage: 'The server does not have enough resources to create a new terminal session. Please try again in a few minutes or stop an existing terminal.',
      activeSessions: '{count} active session | {count} active sessions',
      backendOffline: 'Backend "{name}" is offline. Please select another backend or try again later.',
      loadingInstanceTypes: 'Loading instance types...',
      noInstanceTypesForBackend: 'No instance types available for this backend.',
      recordingConsentTitle: 'Command Recording',
      recordingConsentMessage: 'Recording your commands helps you review your work later and enables your trainer to give personalized feedback on your progress.\n\nYour terminal commands will be recorded and retained for {days} days. Your trainer and platform admins can view your command history. You can export or delete your history at any time.\n\nWarning: avoid typing passwords or tokens directly in the terminal — they may be captured in your command history.',
      recordingAccept: 'Accept recording',
      recordingDecline: 'Continue without recording',
      commandHistory: 'Command History',
      rememberChoice: 'Remember my choice',
      resetConsentPreference: 'Reset saved preference',
      termsAcceptance: 'I accept the terms of use for the terminal service.'
    }
  },
  fr: {
    terminals: {
      startNewSession: 'Démarrer une Nouvelle Session'
    },
    terminalStarter: {
      launchTerminal: 'Créer une session',
      buttonStarting: 'Démarrage...',
      readyToLaunch: 'Prêt à Lancer',
      capacityIssue: 'Problème de Capacité',
      checkingCapacity: 'Vérification...',
      creationMode: 'Mode de Création',
      singleTerminal: 'Terminal Unique',
      bulkForGroup: 'En Masse pour Groupe',
      selectGroup: 'Sélectionner un Groupe',
      chooseGroup: 'Choisir un groupe...',
      members: 'membres',
      willCreate: '{count} terminaux seront créés (1 par membre)',
      startingSession: 'Démarrage de la session terminal...',
      startingBulkSessions: 'Création des terminaux pour les membres du groupe...',
      checkingLimits: 'Vérification des limites d\'utilisation...',
      sendingRequest: 'Envoi de la requête au serveur...',
      sessionCreated: 'Session créée, initialisation du terminal...',
      bulkSessionsCreated: '{count} terminaux créés avec succès',
      bulkSessionsPartial: '{successCount} sur {totalCount} terminaux créés ({failedCount} échecs)',
      sessionExpired: 'Votre session terminal a expiré',
      sessionExpiredTitle: 'Session expirée',
      errorValidationInstance: 'Veuillez sélectionner un type d\'instance',
      errorValidationGroup: 'Veuillez sélectionner un groupe pour la création en masse',
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
      errorServerCapacityMessage: 'Le serveur n\'a pas suffisamment de ressources pour créer une nouvelle session terminal. Veuillez réessayer dans quelques minutes ou arrêter un terminal existant.',
      activeSessions: '{count} session active | {count} sessions actives',
      backendOffline: 'Le backend « {name} » est hors ligne. Veuillez sélectionner un autre backend ou réessayer plus tard.',
      loadingInstanceTypes: 'Chargement des types d\'instances...',
      noInstanceTypesForBackend: 'Aucun type d\'instance disponible sur ce backend.',
      recordingConsentTitle: 'Enregistrement des commandes',
      recordingConsentMessage: 'L\'enregistrement de vos commandes vous permet de revoir votre travail ultérieurement et aide votre formateur à vous donner un retour personnalisé sur votre progression.\n\nVos commandes de terminal seront enregistrées et conservées pendant {days} jours. Votre formateur et les administrateurs de la plateforme pourront consulter votre historique de commandes. Vous pouvez exporter ou supprimer votre historique à tout moment.\n\nAttention : évitez de saisir des mots de passe ou des jetons directement dans le terminal — ils pourraient être capturés dans votre historique de commandes.',
      recordingAccept: 'Accepter l\'enregistrement',
      recordingDecline: 'Continuer sans enregistrement',
      commandHistory: 'Historique des commandes',
      rememberChoice: 'Se souvenir de mon choix',
      resetConsentPreference: 'Réinitialiser la préférence',
      termsAcceptance: "J'accepte les conditions d'utilisation du service terminal."
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

// Recording consent state:
// - null: not yet asked (retentionDays=0 or dialog not shown yet)
// - 0: user declined recording, or consent not applicable
// - 1: user accepted recording
// Note: 0 covers both "declined" and "not applicable" — the backend
// treats both as "no recording". If RGPD audit requires distinguishing
// these cases, a separate value (e.g. 2) should be introduced.
const showRecordingConsent = ref(false)
const recordingConsentResult = ref<number | null>(null)
const rememberConsent = ref(false)
const CONSENT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function loadConsentPreference(): number | null {
  try {
    const raw = localStorage.getItem(RECORDING_CONSENT_KEY)
    if (raw === null) return null

    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && 'timestamp' in parsed) {
        if (Date.now() - parsed.timestamp > CONSENT_EXPIRY_MS) {
          localStorage.removeItem(RECORDING_CONSENT_KEY)
          return null
        }
        return parsed.value
      }
    } catch {
      // Not valid JSON — old format (plain "accepted"/"declined"), treat as expired
    }

    localStorage.removeItem(RECORDING_CONSENT_KEY)
    return null
  } catch {
    return null
  }
}

function saveConsentPreference(value: number) {
  try {
    localStorage.setItem(RECORDING_CONSENT_KEY, JSON.stringify({
      value,
      timestamp: Date.now()
    }))
  } catch {
    // localStorage may be unavailable
  }
}

// Session information
const sessionInfo = ref<any>(null)
const timeRemaining = ref(0)
let timerInterval: NodeJS.Timeout | null = null
let usageRefreshInterval: NodeJS.Timeout | null = null

// Usage refresh configuration
const USAGE_REFRESH_INTERVAL = 600000 // 10 minutes

// localStorage key for last selected instance
const LAST_INSTANCE_KEY = 'terminal_last_instance_type'
const RECORDING_CONSENT_KEY = 'terminal_recording_consent_preference'

// Form
const selectedInstanceType = ref('')
const userManuallySelected = ref(false)
const restoredFromStorage = ref(false)
const nameInput = ref('')
const creationMode = ref<'single' | 'bulk'>('single')
const selectedGroupId = ref('')
// Organizations & Backends
const { currentOrganizationId: storeOrgId } = storeToRefs(organizationsStore)
const selectedOrganizationId = computed(() => organizationsStore.currentOrganization?.id || '')
const backends = computed(() => backendsStore.backends)
const selectedBackendId = computed({
  get: () => backendsStore.selectedBackendId || '',
  set: (val: string) => backendsStore.selectBackend(val)
})

// Instance types
const instanceTypes = ref<InstanceType[]>([])
const isLoadingInstanceTypes = ref(false)
const instanceTypeCache = new Map<string, InstanceType[]>()

// Groups
const availableGroups = computed(() => groupsStore.entities)
const canUseGroups = computed(() => isEnabled('class_groups'))
const selectedGroupMemberCount = ref(0)

// Subscription and usage state
const currentSubscription = computed(() => subscriptionsStore.currentSubscription)
const currentTerminalCount = ref(0)
const terminalLimitFromMetrics = ref<number | null>(null)
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
  // Prefer limit from usage metrics (works with org subscriptions too)
  if (terminalLimitFromMetrics.value !== null) {
    return terminalLimitFromMetrics.value
  }
  // Fallback to subscription plan_features if available
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

// Command history panel visibility
const showHistoryPanel = computed(() => {
  return sessionInfo.value && recordingConsentResult.value === 1
})

const retentionDays = computed(() => {
  return currentSubscription.value?.subscription_plan?.command_history_retention_days || 0
})

// Form validation
const isFormValid = computed(() => {
  if (isLoadingInstanceTypes.value) return false
  if (!selectedInstanceType.value) return false
  if (creationMode.value === 'bulk' && !selectedGroupId.value) return false
  // Check if user has reached terminal limit
  if (creationMode.value === 'single' && currentTerminalCount.value >= maxTerminals.value) return false
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

async function loadInstanceTypes(backendId?: string) {
  const cacheKey = backendId || '__default__'

  // Serve from cache if available
  const cached = instanceTypeCache.get(cacheKey)
  if (cached) {
    instanceTypes.value = cached
    return
  }

  isLoadingInstanceTypes.value = true
  try {
    const loadedTypes = await terminalService.getInstanceTypes(backendId)

    if (!Array.isArray(loadedTypes)) {
      instanceTypes.value = []
      showErrorNotification('Invalid data format for instance types.', 'Loading Error')
      return
    }

    instanceTypes.value = loadedTypes
    instanceTypeCache.set(cacheKey, loadedTypes)

    if (instanceTypes.value.length === 0) {
      showWarning(t('terminalStarter.noInstanceTypesForBackend'), t('terminalStarter.noInstanceTypesForBackend'))
      return
    }
  } catch (error: any) {
    console.error('Failed to load instance types:', error)
    showErrorNotification(`Invalid data format for instance types: ${error.message || error}`, 'Loading Error')
    instanceTypes.value = []
    selectedInstanceType.value = ''
  } finally {
    isLoadingInstanceTypes.value = false
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
      if (terminalMetric.limit_value > 0) {
        terminalLimitFromMetrics.value = terminalMetric.limit_value
      }
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

function selectInstance(instance: InstanceType) {
  userManuallySelected.value = true
  selectedInstanceType.value = instance.prefix
  try {
    localStorage.setItem(LAST_INSTANCE_KEY, instance.prefix)
  } catch {
    // localStorage may be unavailable
  }
}

function preselectInstance(instance: InstanceType) {
  // Only preselect if user hasn't manually clicked on an instance
  if (userManuallySelected.value) return

  // Try to restore from localStorage on first preselect call
  if (!restoredFromStorage.value) {
    restoredFromStorage.value = true
    try {
      const stored = localStorage.getItem(LAST_INSTANCE_KEY)
      if (stored) {
        const storedInstance = instanceTypes.value.find(i => i.prefix === stored)
        if (storedInstance) {
          const availability = instanceUtils.checkAvailability(storedInstance, allowedMachineSizes.value)
          if (availability.available) {
            selectedInstanceType.value = stored
            return
          }
        }
      }
    } catch {
      // localStorage may be unavailable
    }
  }

  selectedInstanceType.value = instance.prefix
}

function resetForm() {
  nameInput.value = ''
  creationMode.value = 'single'
  selectedGroupId.value = ''
  userManuallySelected.value = false
  restoredFromStorage.value = false
  selectedInstanceType.value = ''
  instanceTypeCache.clear()
  recordingConsentResult.value = null
}

function handleRecordingConsent(accepted: boolean) {
  recordingConsentResult.value = accepted ? 1 : 0
  if (rememberConsent.value) {
    saveConsentPreference(recordingConsentResult.value)
  }
  showRecordingConsent.value = false
  startNewSession()
}

function cancelRecordingConsent() {
  showRecordingConsent.value = false
  // Don't set recordingConsentResult — leave null so next attempt re-prompts
  // Don't call startSingleSession() or startNewSession()
}

async function loadGroupMembers(groupId: string) {
  try {
    const response = await axios.get(`/group-members`, {
      params: { group_id: groupId }
    })
    return response.data?.data || response.data || []
  } catch (error) {
    console.error('Failed to load group members:', error)
    return []
  }
}

// Watch for global organization changes to re-fetch backends
watch(storeOrgId, async (newOrgId) => {
  instanceTypeCache.clear()
  if (newOrgId) {
    try {
      await backendsStore.fetchBackends(newOrgId)
    } catch {
      // Error is stored in backendsStore.error
    }
  }
})

// Watch for backend changes to re-fetch instance types
watch(selectedBackendId, async (newBackendId) => {
  selectedInstanceType.value = ''
  userManuallySelected.value = false
  restoredFromStorage.value = false
  await loadInstanceTypes(newBackendId || undefined)
})

// Watch for group selection changes to update member count
watch(selectedGroupId, async (newGroupId) => {
  if (newGroupId) {
    const members = await loadGroupMembers(newGroupId)
    selectedGroupMemberCount.value = members.length
  } else {
    selectedGroupMemberCount.value = 0
  }
})

async function startNewSession() {
  // Route to appropriate creation method
  if (creationMode.value === 'bulk') {
    return await startBulkSessions()
  } else {
    return await startSingleSession()
  }
}

async function startSingleSession() {
  if (!selectedInstanceType.value) {
    showErrorNotification(t('terminalStarter.errorValidationInstance'), t('terminalStarter.errorStarting'))
    return
  }

  // Check if recording consent is needed
  if (retentionDays.value > 0 && recordingConsentResult.value === null) {
    const saved = loadConsentPreference()
    if (saved !== null) {
      recordingConsentResult.value = saved
    } else {
      showRecordingConsent.value = true
      return // Wait for user response
    }
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
      terms: t('terminalStarter.termsAcceptance'),
      expiry: sessionDurationCap.value,
      recording_consent: recordingConsentResult.value ?? 0,
      ...(selectedInstanceType.value && { instance_type: selectedInstanceType.value }),
      ...(nameInput.value.trim() && { name: nameInput.value.trim() }),
      ...(backendsStore.selectedBackendId && { backend: backendsStore.selectedBackendId }),
      ...(selectedOrganizationId.value && { organization_id: selectedOrganizationId.value })
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

async function startBulkSessions() {
  if (!selectedInstanceType.value) {
    showErrorNotification(t('terminalStarter.errorValidationInstance'), t('terminalStarter.errorStarting'))
    return
  }

  if (!selectedGroupId.value) {
    showErrorNotification(t('terminalStarter.errorValidationGroup'), t('terminalStarter.errorStarting'))
    return
  }

  // Check if recording consent is needed (same as single session)
  if (retentionDays.value > 0 && recordingConsentResult.value === null) {
    const saved = loadConsentPreference()
    if (saved !== null) {
      recordingConsentResult.value = saved
    } else {
      showRecordingConsent.value = true
      return
    }
  }

  isStarting.value = true
  startStatus.value = t('terminalStarter.startingBulkSessions')

  try {
    const bulkData = {
      terms: t('terminalStarter.termsAcceptance'),
      expiry: sessionDurationCap.value,
      instance_type: selectedInstanceType.value,
      recording_consent: recordingConsentResult.value ?? 0,
      ...(backendsStore.selectedBackendId && { backend: backendsStore.selectedBackendId }),
      ...(selectedOrganizationId.value && { organization_id: selectedOrganizationId.value })
    }

    const response = await axios.post(
      `/class-groups/${selectedGroupId.value}/bulk-create-terminals`,
      bulkData
    )

    const result = response.data
    const successCount = result.created_count || result.success_count || 0
    const failedCount = result.failed_count || 0
    const totalCount = result.total_count || successCount + failedCount

    if (failedCount === 0 && successCount > 0) {
      showWarning(
        t('terminalStarter.bulkSessionsCreated', { count: successCount }),
        'Success'
      )
    } else if (successCount > 0) {
      showWarning(
        t('terminalStarter.bulkSessionsPartial', {
          successCount,
          totalCount,
          failedCount
        }),
        'Partial Success'
      )
    } else {
      showErrorNotification(
        result.error_message || 'Failed to create terminals',
        t('terminalStarter.errorStarting')
      )
    }

    // Refresh terminal count
    await loadCurrentTerminalUsage()

    // Emit event
    emit('session-started')

  } catch (error: any) {
    console.error('Error starting bulk sessions:', error)
    showErrorNotification(
      error.response?.data?.error_message || error.message || 'Error creating bulk terminals',
      t('terminalStarter.errorStarting')
    )
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
  instanceTypeCache.clear()

  const promises: Promise<any>[] = [
    subscriptionsStore.getCurrentSubscription(),
    loadCurrentTerminalUsage()
  ]

  // Load groups if feature is enabled
  if (canUseGroups.value) {
    promises.push(groupsStore.loadEntities())
  }

  await Promise.all(promises)

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

  // Fetch instance types after backends are loaded (pass selected backend if any)
  await loadInstanceTypes(backendsStore.selectedBackendId || undefined)

  // Check for query parameters to set bulk mode and group
  if (route.query.mode === 'bulk' && route.query.groupId) {
    console.log('[TerminalStarter] Detected bulk mode query params:', {
      mode: route.query.mode,
      groupId: route.query.groupId,
      availableGroupsCount: availableGroups.value.length
    })

    creationMode.value = 'bulk'
    selectedGroupId.value = route.query.groupId as string

    // Manually trigger the member count load since watcher might not fire in time
    await nextTick(async () => {
      if (selectedGroupId.value) {
        const members = await loadGroupMembers(selectedGroupId.value)
        selectedGroupMemberCount.value = members.length

        console.log('[TerminalStarter] Bulk mode configured:', {
          creationMode: creationMode.value,
          selectedGroupId: selectedGroupId.value,
          memberCount: selectedGroupMemberCount.value
        })
      }
    })
  }

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
    if (selectedInstanceType.value) {
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

.remember-choice-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  margin-top: var(--spacing-sm);
}

.remember-choice-label input[type="checkbox"] {
  cursor: pointer;
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
