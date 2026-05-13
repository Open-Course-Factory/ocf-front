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

      <!-- Persistence Toggle (paid tiers only) -->
      <fieldset
        v-if="persistentSessionsEnabled"
        class="persistence-toggle"
        data-testid="persistence-toggle"
      >
        <legend class="persistence-legend">
          <i class="fas fa-database"></i>
          {{ t('terminalStarter.persistenceLabel') }}
        </legend>
        <div class="persistence-options" :class="{ 'is-disabled': forcedEphemeral }">
          <label class="persistence-option">
            <input
              type="radio"
              name="persistence-mode"
              value="ephemeral"
              :checked="persistenceMode === 'ephemeral'"
              :disabled="forcedEphemeral || isStarting"
              data-testid="persistence-ephemeral"
              @change="setPersistenceMode('ephemeral')"
            />
            <span class="persistence-option-label">{{ t('terminalStarter.persistenceEphemeral') }}</span>
          </label>
          <label class="persistence-option">
            <input
              type="radio"
              name="persistence-mode"
              value="persistent"
              :checked="persistenceMode === 'persistent'"
              :disabled="forcedEphemeral || isStarting"
              data-testid="persistence-persistent"
              @change="setPersistenceMode('persistent')"
            />
            <span class="persistence-option-label">{{ t('terminalStarter.persistencePersistent') }}</span>
          </label>
        </div>
        <p v-if="forcedEphemeral" class="persistence-hint persistence-hint-locked" data-testid="persistence-locked-hint">
          <i class="fas fa-lock"></i>
          {{ t('terminalStarter.crashTrapsForcesEphemeral') }}
        </p>
        <p v-else class="persistence-hint" data-testid="persistence-hint">
          {{ persistenceMode === 'persistent'
            ? t('terminalStarter.persistencePersistentHint')
            : t('terminalStarter.persistenceEphemeralHint') }}
        </p>
      </fieldset>

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

import { useOrganizationsStore } from '../../stores/organizations'
import { useTerminalBackendsStore } from '../../stores/terminalBackends'
import { useUserSettingsStore } from '../../stores/userSettings'
import { useNotification } from '../../composables/useNotification'
import { useTranslations } from '../../composables/useTranslations'
import { useLimitReachedMessage } from '../../composables/useLimitReachedMessage'

import SettingsCard from '../UI/SettingsCard.vue'
import Button from '../UI/Button.vue'
import SessionComposer from './SessionComposer.vue'
import TerminalAdvancedOptions from './TerminalAdvancedOptions.vue'
import TerminalUsagePanel from './TerminalUsagePanel.vue'
import BaseModal from '../Modals/BaseModal.vue'
import type { StartComposedSessionData } from '../../types/terminal'

// Props
interface ActiveScenarioLike {
  crash_traps?: boolean
}
const props = withDefaults(defineProps<{
  activeScenario?: ActiveScenarioLike | null
}>(), {
  activeScenario: null
})

// Emit events
const emit = defineEmits(['session-started'])

// Stores
const subscriptionsStore = useSubscriptionsStore()
const organizationsStore = useOrganizationsStore()
const backendsStore = useTerminalBackendsStore()
const userSettingsStore = useUserSettingsStore()

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
      capacityTight: 'Tight capacity — launch not guaranteed',
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
      errorServerCapacityBody: 'The server has insufficient resources to start a new session. Try again later or pick a smaller distribution.',
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
      persistenceLabel: 'Save my work between sessions',
      persistenceEphemeral: 'Discard when done',
      persistencePersistent: 'Keep my work',
      persistenceEphemeralHint: 'The container is removed shortly after stop. No saved state.',
      persistencePersistentHint: 'The container disk is preserved for resumption (subject to your plan limits).',
      crashTrapsForcesEphemeral: 'This scenario forces ephemeral sessions — your work is reset between attempts.',
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
      capacityTight: 'Capacité limitée — lancement non garanti',
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
      errorServerCapacityBody: 'Le serveur n\'a pas assez de ressources pour démarrer une nouvelle session. Réessayez plus tard ou choisissez une distribution plus légère.',
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
      persistenceLabel: 'Conserver mon travail entre les sessions',
      persistenceEphemeral: 'Tout effacer à la fin',
      persistencePersistent: 'Conserver mon travail',
      persistenceEphemeralHint: 'Le conteneur est supprimé peu après l\'arrêt. Aucun état conservé.',
      persistencePersistentHint: 'Le disque du conteneur est conservé pour reprise (selon les limites de votre plan).',
      crashTrapsForcesEphemeral: 'Ce scénario impose des sessions éphémères — votre travail est réinitialisé entre les tentatives.',
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
const showRecordingAcknowledgement = ref(false)
const recordingAcknowledged = computed(() => !!userSettingsStore.settings.recording_acknowledged_at)

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

// Persistence mode toggle
type PersistenceMode = 'ephemeral' | 'persistent'
const LAST_CONFIG_KEY = 'ocf-last-session-config'
const persistenceMode = ref<PersistenceMode>('ephemeral')
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

// Single source of truth for "what's my concurrent_terminals usage?" is the
// `/user-subscriptions/usage?organization_id=...` endpoint exposed by the
// subscriptions store as `usageMetrics`. The launcher reads BOTH the current
// count (above, via `currentTerminalCount`) AND the limit from the same metric
// so the badge, the form-validity gate, and the backend `/usage/check` gate
// all agree by construction. -1 in `limit_value` means unlimited.
const maxTerminals = computed(() => {
  const metric = subscriptionsStore.usageMetrics?.find((m: any) =>
    m.metric_type === 'concurrent_terminals' || m.name === 'concurrent_terminals'
  )
  if (!metric) return 0
  const limit = metric.limit_value
  if (limit === -1) return Infinity
  return typeof limit === 'number' ? limit : 0
})

const refreshIntervalMinutes = computed(() => {
  return Math.floor(USAGE_REFRESH_INTERVAL / 60000)
})

// Capacity check — single source of truth is the backend.
// We call GET /terminals/capacity-check whenever distribution or size changes
// (debounced 300ms) and render whatever the backend says. The same function
// powers the launch middleware, so the indicator can never disagree with the
// real launch decision.
const capacityCheck = ref<{ status: 'ok' | 'warning' | 'critical' | 'unknown', reason: string } | null>(null)
const isCheckingCapacity = ref(false)
let capacityCheckTimer: ReturnType<typeof setTimeout> | null = null

function scheduleCapacityCheck(distribution: string, size: string) {
  if (capacityCheckTimer) clearTimeout(capacityCheckTimer)
  capacityCheckTimer = setTimeout(async () => {
    isCheckingCapacity.value = true
    try {
      capacityCheck.value = await terminalService.checkCapacity(distribution, size)
    } catch {
      // Hint only — don't bother the user with a toast. The real verdict comes
      // from the launch endpoint.
      capacityCheck.value = { status: 'unknown', reason: 'check_failed' }
    } finally {
      isCheckingCapacity.value = false
    }
  }, 300)
}

watch(
  () => [composerRef.value?.selectedDistribution?.name, composerRef.value?.selectedSize?.key] as const,
  ([dist, size]) => {
    if (!dist || !size) {
      capacityCheck.value = null
      if (capacityCheckTimer) {
        clearTimeout(capacityCheckTimer)
        capacityCheckTimer = null
      }
      return
    }
    scheduleCapacityCheck(dist, size)
  }
)

const capacityHint = computed<'ok' | 'warning' | 'critical' | 'unknown'>(() => {
  if (!composerRef.value?.selectedDistribution) return 'unknown'
  if (isCheckingCapacity.value) return 'unknown'
  return capacityCheck.value?.status ?? 'unknown'
})

const capacityStatusLevel = computed(() => {
  if (!composerRef.value?.selectedDistribution) return 'neutral'
  const hint = capacityHint.value
  if (hint === 'unknown') return 'checking'
  if (hint === 'critical') return 'error'
  if (hint === 'warning') return 'warning'
  return 'ok'
})

const capacityStatusIcon = computed(() => {
  switch (capacityStatusLevel.value) {
    case 'ok':
      return 'fas fa-check-circle'
    case 'warning':
      return 'fas fa-exclamation-triangle'
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
  const hint = capacityHint.value
  if (hint === 'unknown') return t('terminalStarter.checkingCapacity')
  if (hint === 'critical') return t('terminalStarter.capacityIssue')
  if (hint === 'warning') return t('terminalStarter.capacityTight')
  return t('terminalStarter.readyToLaunch')
})

// Persistence toggle: visible only when the user's plan supports persistent sessions.
// Free tier (Découverte) and unknown plans → toggle hidden entirely.
const persistentSessionsEnabled = computed<boolean>(() => {
  return currentSubscription.value?.subscription_plan?.data_persistence_enabled === true
})

// When the active scenario has crash_traps=true, persistence is meaningless
// (the run is the point) — force ephemeral and disable the toggle.
const forcedEphemeral = computed<boolean>(() => {
  return props.activeScenario?.crash_traps === true
})

function readLastPersistenceMode(): PersistenceMode {
  try {
    const stored = localStorage.getItem(LAST_CONFIG_KEY)
    if (!stored) return 'ephemeral'
    const parsed = JSON.parse(stored)
    return parsed?.persistence_mode === 'persistent' ? 'persistent' : 'ephemeral'
  } catch {
    return 'ephemeral'
  }
}

function writeLastPersistenceMode(mode: PersistenceMode) {
  try {
    let existing: Record<string, unknown> = {}
    const stored = localStorage.getItem(LAST_CONFIG_KEY)
    if (stored) {
      try { existing = JSON.parse(stored) || {} } catch { existing = {} }
    }
    existing.persistence_mode = mode
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(existing))
  } catch {
    // localStorage unavailable / quota exceeded — silently ignore
  }
}

function setPersistenceMode(mode: PersistenceMode) {
  if (forcedEphemeral.value) {
    persistenceMode.value = 'ephemeral'
    return
  }
  persistenceMode.value = mode
  writeLastPersistenceMode(mode)
}

// Watch forcedEphemeral: if it flips to true, reset the choice to ephemeral.
watch(forcedEphemeral, (forced) => {
  if (forced && persistenceMode.value !== 'ephemeral') {
    persistenceMode.value = 'ephemeral'
  }
})

// Form validation
const isFormValid = computed(() => {
  if (!composerRef.value?.isReady) return false
  // Check if user has reached terminal limit
  if (currentTerminalCount.value >= maxTerminals.value) return false
  return true
})

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

// Localization for backend 403 quota responses — delegates to the shared
// composable so the resume path (TerminalSessionView) and any future
// quota-gated surface produce identical wording for the same source.
const { getLimitReachedMessage: getLocalizedLimitMessage } = useLimitReachedMessage()
function getLimitReachedMessage(source?: string): string {
  return getLocalizedLimitMessage({ source, isAssignedSubscription: isAssignedSubscription.value })
}

function handleHostnameUpdate(value: string) {
  hostnameInput.value = value
  if (value === '') {
    userManuallySetHostname.value = false
  } else if (value !== autoGeneratedHostname.value) {
    userManuallySetHostname.value = true
  }
}

async function handleRecordingAcknowledgement() {
  const now = new Date().toISOString()
  try {
    await userSettingsStore.updateSettings({ recording_acknowledged_at: now })
  } catch (err) {
    // Non-fatal: user can still proceed, but we log the failure. The ack dialog
    // will reappear on next launch until the backend record succeeds.
    console.warn('Failed to persist recording acknowledgement:', err)
  }
  showRecordingAcknowledgement.value = false
  startNewSession()
}

// Watch for global organization changes — reload org-dependent data
watch(storeOrgId, async (newOrgId) => {
  currentTerminalCount.value = 0
  if (newOrgId) {
    // Reload usage metrics for the new org context. Both current count and
    // the concurrent_terminals limit are read from the same usageMetrics array
    // (see `currentTerminalCount` and `maxTerminals` above), so a single fetch
    // refreshes both reactively.
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

    // Resolve persistence mode for the payload:
    // - Hidden toggle (free tier) → omit entirely (backend default applies).
    // - Crash-traps scenario → force ephemeral regardless of UI state.
    // - Otherwise → user's chosen mode.
    const effectivePersistenceMode: PersistenceMode | undefined = persistentSessionsEnabled.value
      ? (forcedEphemeral.value ? 'ephemeral' : persistenceMode.value)
      : undefined

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
      ...(parsedPackages.length > 0 && { packages: parsedPackages }),
      ...(effectivePersistenceMode && { persistence_mode: effectivePersistenceMode })
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
      const backendMsg = error.response?.data?.error_message
      // Only treat 503 as "offline" when the backend message actually indicates
      // a connectivity problem. RAM exhaustion and quota also use 503 — those
      // need a different message so the user understands the real cause.
      const looksOffline = !backendMsg ||
        /offline|unreachable|connection|n'est pas accessible/i.test(backendMsg)

      if (looksOffline && backendName) {
        showErrorNotification(
          t('terminalStarter.backendOffline', { name: backendName }),
          t('terminalStarter.errorServerCapacity')
        )
      } else {
        // Real capacity issue — surface the backend's actual reason if present,
        // fall back to a generic capacity message otherwise.
        showErrorNotification(
          backendMsg || t('terminalStarter.errorServerCapacityBody'),
          t('terminalStarter.errorServerCapacity')
        )
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
  if (capacityCheckTimer) {
    clearTimeout(capacityCheckTimer)
    capacityCheckTimer = null
  }
}

onMounted(async () => {
  // Restore last-used persistence preference from localStorage. If the scenario
  // forces ephemeral, the watcher will normalize it back when the prop is set.
  persistenceMode.value = readLastPersistenceMode()
  if (forcedEphemeral.value) {
    persistenceMode.value = 'ephemeral'
  }

  await Promise.all([
    subscriptionsStore.getCurrentSubscription(),
    loadCurrentTerminalUsage(),
    userSettingsStore.loadSettings()
  ])

  // Graceful migration: if user had the legacy localStorage flag but no server-side record yet,
  // persist it server-side and clear the local key.
  const legacyAck = localStorage.getItem('terminal-recording-acknowledged')
  if (legacyAck === '1' && !userSettingsStore.settings.recording_acknowledged_at) {
    try {
      await userSettingsStore.updateSettings({ recording_acknowledged_at: new Date().toISOString() })
      localStorage.removeItem('terminal-recording-acknowledged')
    } catch { /* silently retry next time */ }
  }

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

.capacity-check-inline.status-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.capacity-check-inline.status-warning i {
  color: var(--color-warning);
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

.persistence-toggle {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
}

.persistence-legend {
  padding: 0 var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.persistence-legend i {
  color: var(--color-primary);
}

.persistence-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xs);
}

.persistence-options.is-disabled {
  opacity: 0.6;
}

.persistence-option {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.persistence-option input[type="radio"]:disabled {
  cursor: not-allowed;
}

.persistence-option input[type="radio"]:disabled + .persistence-option-label {
  cursor: not-allowed;
  color: var(--color-text-muted);
}

.persistence-option-label {
  user-select: none;
}

.persistence-hint {
  margin: var(--spacing-sm) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.persistence-hint-locked {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  color: var(--color-warning-text, var(--color-text-secondary));
}

.persistence-hint-locked i {
  margin-top: 2px;
  color: var(--color-warning, var(--color-text-muted));
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
