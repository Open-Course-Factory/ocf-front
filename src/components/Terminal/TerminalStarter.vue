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

      <!-- Advanced Options (now hosts the persistence-mode toggle) -->
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
        :name-placeholder="prefilledName"
        :network-plan-enabled="!!composerRef?.networkAllowed"
        :network-enabled="networkEnabled"
        :persistence-plan-enabled="persistentSessionsEnabled"
        :persistence-mode="persistenceMode"
        :forced-ephemeral="forcedEphemeral"
        @update:exercise-ref="exerciseRef = $event"
        @update:hostname="handleHostnameUpdate($event)"
        @update:packages="packagesInput = $event"
        @update:selected-backend-id="selectedBackendId = $event"
        @update:network-enabled="setNetworkEnabled($event)"
        @update:persistence-mode="setPersistenceMode($event)"
        @reset="resetForm"
      />

      <!-- Usage & Quota -->
      <TerminalUsagePanel :organization-id="storeOrgId || undefined" />

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
import { useRouter } from 'vue-router'

import axios from 'axios'
import { terminalService } from '../../services/domain/terminal'
import { summarizeRemaining } from '../../utils/quotaFormatters'
import { useSubscriptionsStore } from '../../stores/subscriptions'

import { useOrganizationsStore } from '../../stores/organizations'
import { useTerminalBackendsStore } from '../../stores/terminalBackends'
import { useUserSettingsStore } from '../../stores/userSettings'
import { useNotification } from '../../composables/useNotification'
import { useTranslations } from '../../composables/useTranslations'
import { useComposeErrorMessage } from '../../composables/useComposeErrorMessage'

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
      sendingRequest: 'Sending request to server...',
      sessionCreated: 'Session created, initializing terminal...',
      errorValidationInstance: 'Please select a machine type',
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
      errorPersistencePlanDisabled: 'Persistent sessions are not available on your current plan. Choose ephemeral mode or upgrade.',
      budgetExhausted: "You've reached your plan's session limit",
      budgetExhaustedHint: 'You can still launch: {summary}. Stop a session to free capacity.',
      budgetExhaustedHintAll: 'Stop a running session to free capacity.',
      budgetExhaustedActionUsage: 'View my usage',
      planRestriction: "This size isn't included in your plan",
      planRestrictionTitle: 'Size not in plan',
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
      sendingRequest: 'Envoi de la requête au serveur...',
      sessionCreated: 'Session créée, initialisation du terminal...',
      errorValidationInstance: 'Veuillez sélectionner un type de machine',
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
      errorPersistencePlanDisabled: 'Les sessions persistantes ne sont pas disponibles sur votre offre actuelle. Choisissez le mode éphémère ou améliorez votre offre.',
      budgetExhausted: 'Vous avez atteint la limite de sessions de votre forfait',
      budgetExhaustedHint: 'Vous pouvez encore lancer : {summary}. Arrêtez une session pour libérer de la capacité.',
      budgetExhaustedHintAll: 'Arrêtez une session en cours pour libérer de la capacité.',
      budgetExhaustedActionUsage: 'Voir mon utilisation',
      planRestriction: 'Cette taille n\'est pas incluse dans votre forfait',
      planRestrictionTitle: 'Taille non incluse',
    }
  }
})

const { showConfirm, showError: showErrorNotification } = useNotification()
const router = useRouter()

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
const persistenceMode = ref<PersistenceMode>('ephemeral')

// Network (internet egress) toggle. Defaults ON when the active plan allows
// network (see the networkAllowed watcher below) and forced OFF otherwise.
// Custom startup packages require this ON (enforced server-side), so the
// packages input is gated on it in TerminalAdvancedOptions.
const networkEnabled = ref(false)

// Whether the active plan allows network. Sourced from the composer's
// per-distribution session-options resolution.
const networkAllowed = computed<boolean>(() => !!composerRef.value?.networkAllowed)

/**
 * Default name suggestion when the user leaves the name input empty.
 * Format: `<distroSlug>-<sizeKey>-<YYMMDD>` (e.g. `alpine-m-260528`). Shown as
 * the placeholder and used as the `name` payload when the field is blank, so
 * the persisted session label carries the size + creation day without
 * forcing the user to type anything.
 *
 * Returns an empty string until both distribution and size are selected, so
 * the child component falls back to the generic localized placeholder.
 */
const prefilledName = computed<string>(() => {
  const distName = composerRef.value?.selectedDistribution?.name
  const sizeKey = composerRef.value?.selectedSize?.key
  if (!distName || !sizeKey) return ''
  const distroSlug = distName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const shortSize = sizeKey.toLowerCase()
  const shortDate = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  return `${distroSlug}-${shortSize}-${shortDate}`
})
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

// Note: there is no front-end slot-count gate. The CPU/RAM budget engine on
// the backend is the sole authoritative cap for terminals. The launcher lets
// the user click and surfaces the backend's structured 403 (`source=budget`)
// via the budget confirm dialog wired below.

// Usage panel state is owned by TerminalUsagePanel itself — it fetches and
// auto-refreshes /terminals/my-usage internally. The starter only needs to
// keep `syncAllSessions()` available so the launch path can flush stale
// session state before submitting (see startNewSession() below).

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

// Persistence mode is intentionally NOT persisted to localStorage.
// We always start each launcher mount from the plan-aware default
// ('persistent' when the plan allows it, 'ephemeral' otherwise) so a
// one-off 'ephemeral' choice never silently carries over to the next run.
function setPersistenceMode(mode: PersistenceMode) {
  if (forcedEphemeral.value) {
    persistenceMode.value = 'ephemeral'
    return
  }
  persistenceMode.value = mode
}

// Network toggle handler. When the user turns internet off, clear any startup
// packages they had typed — the packages input is hidden while network is off,
// and the server rejects packages without network. Clearing here keeps the
// payload consistent with what the user can see.
function setNetworkEnabled(enabled: boolean) {
  networkEnabled.value = enabled
  if (!enabled) {
    packagesInput.value = ''
  }
}

// Apply the plan-aware network default: ON when the plan allows network, OFF
// (forced) otherwise. Mirrors the persistence default. The watcher fires only
// when networkAllowed actually changes value (e.g. switching distribution or
// the plan resolving on mount), so a manual toggle the user made for the
// current distribution survives unrelated re-renders.
watch(networkAllowed, (allowed) => {
  networkEnabled.value = allowed
  if (!allowed) {
    packagesInput.value = ''
  }
}, { immediate: true })

// Watch forcedEphemeral: if it flips to true, reset the choice to ephemeral.
watch(forcedEphemeral, (forced) => {
  if (forced && persistenceMode.value !== 'ephemeral') {
    persistenceMode.value = 'ephemeral'
  }
})

// Form validation
// The composer must be ready (distribution + size selected, options loaded).
// We deliberately do NOT gate the form on capacity-check status or any derived
// slot limit: the backend's launch endpoint owns the final decision (budget
// engine + plan validity) and surfaces structured rejections that the catch
// block below turns into actionable copy (the `budgetExhausted` confirm
// dialog, the plan-restriction toast, etc.).
const isFormValid = computed(() => {
  if (!composerRef.value?.isReady) return false
  return true
})

async function syncAllSessions() {
  try {
    const response = await axios.post('/terminals/sync-all')
    return response.data
  } catch (error) {
    console.error('Failed to sync sessions:', error)
    throw error
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
  // Restore the plan-aware default: ON when the plan allows network, OFF otherwise.
  networkEnabled.value = networkAllowed.value
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

// Localization for backend compose-session error wrapper — translates the
// English `(status=N, name=X)` marker produced by ocf-core's FormatError.
const { getComposeErrorMessage } = useComposeErrorMessage()

/**
 * Detect a backend rejection caused by the plan not allowing persistent
 * sessions. ocf-core wraps the error like:
 *   "persistence_mode is not allowed: plan_disabled: persistence not available on your plan"
 * It returns 400/403 depending on the layer. We match on the structured
 * 'plan_disabled' marker plus a 'persistence' substring so this stays narrow
 * and doesn't swallow unrelated plan_disabled rejections (e.g. machine size).
 */
function isPersistencePlanDisabledError(err: any): boolean {
  const status = err?.response?.status
  if (status !== 400 && status !== 403) return false
  const data = err?.response?.data
  const haystacks = [
    typeof data === 'string' ? data : '',
    data?.error_message,
    data?.error,
    data?.message,
    err?.message
  ].filter(Boolean).join(' ').toLowerCase()
  return haystacks.includes('plan_disabled') && haystacks.includes('persistence')
}

/**
 * Detect a budget-mode 403 rejection from POST /terminals/start-composed-session.
 * The backend marks these with `source: "budget"` so we can show a more
 * specific toast instead of the generic launch-error path.
 */
function isBudgetRejection(err: any): boolean {
  if (err?.response?.status !== 403) return false
  const data = err?.response?.data
  return data?.source === 'budget'
}

/**
 * Handle a budget-mode 403 from the launcher. Shows a budget-specific
 * notification and refreshes the composer's session-options so the remaining
 * counts on the pills reflect the latest server state.
 */
async function handleBudgetRejection(err: any): Promise<void> {
  const data = err?.response?.data ?? {}
  const reason: string | undefined = data.reason

  // plan_restriction (D8): the size is gated by the plan, not by the live
  // budget. Different copy: it's a permission issue, not a "stop a session"
  // issue.
  if (reason === 'plan_restriction') {
    showErrorNotification(t('terminalStarter.planRestriction'), t('terminalStarter.planRestrictionTitle'))
    return
  }

  // Refresh session-options so the composer's per-size badges reflect the
  // current remaining counts (the user may now see "0 L" on the pill they
  // tried to launch). We use the currently selected distribution if any.
  const composer = composerRef.value
  let summary = ''
  try {
    const distName = composer?.selectedDistribution?.name
    if (distName) {
      const freshOptions = await terminalService.getSessionOptions(
        distName,
        backendsStore.selectedBackendId || undefined,
        selectedOrganizationId.value || undefined
      )
      summary = summarizeRemaining(freshOptions.allowed_sizes, t('sessionComposer.or'))
    }
  } catch {
    // Non-critical: fall back to the empty-summary copy.
  }

  const hint = summary
    ? t('terminalStarter.budgetExhaustedHint', { summary })
    : t('terminalStarter.budgetExhaustedHintAll')

  const confirmed = await showConfirm(
    hint,
    t('terminalStarter.budgetExhausted'),
    {
      confirmButtonText: t('terminalStarter.budgetExhaustedActionUsage'),
      cancelButtonText: t('terminalStarter.errorDismiss')
    }
  )
  if (confirmed) {
    router.push('/subscription-dashboard').catch(() => {})
  }
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
  if (newOrgId) {
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
  } catch (syncError) {
    console.error('Failed to sync sessions before launch:', syncError)
    // Continue anyway - this is a best-effort sync
  }

  isStarting.value = true
  startStatus.value = t('terminalStarter.startingSession')

  try {
    // Packages require network ON (server-enforced). When network is off the
    // input is hidden and already cleared, but guard here too so a stale value
    // can never produce a 4xx.
    const parsedPackages = networkEnabled.value && packagesInput.value.trim()
      ? packagesInput.value.split(',').map(p => p.trim()).filter(Boolean)
      : []

    // Resolve persistence mode for the payload:
    // - Hidden toggle (free tier) → omit entirely (backend default applies).
    // - Crash-traps scenario → force ephemeral regardless of UI state.
    // - Otherwise → user's chosen mode.
    const effectivePersistenceMode: PersistenceMode | undefined = persistentSessionsEnabled.value
      ? (forcedEphemeral.value ? 'ephemeral' : persistenceMode.value)
      : undefined

    // If the user left the name field blank, send the contextual prefilled
    // name (distroSlug-size-date) so tt-backend persists it instead of
    // autogenerating one. Trimmed user input always wins.
    const trimmedName = nameInput.value.trim()
    const effectiveName = trimmedName || prefilledName.value

    const sessionData: StartComposedSessionData = {
      distribution: composer.selectedDistribution.name,
      size: composer.selectedSize.key,
      // Merge the composer's chip features with the dedicated network toggle.
      // network is opt-in and owned by the launcher, not the composer chips.
      features: { ...composer.enabledFeatures, network: networkEnabled.value },
      terms: t('terminalStarter.termsAcceptance'),
      recording_enabled: 1,
      ...(effectiveName && { name: effectiveName }),
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
      status: response.status,
      // Mirror the network toggle the user just submitted so the post-create
      // viewer's status bar shows the correct internet-access state. The backend
      // omits composed_features for no-network sessions (omitempty), so we only
      // set it when network was enabled; sessionHasNetwork() reads it the same
      // way it reads the API value on the list/detail pages.
      ...(networkEnabled.value && { composed_features: JSON.stringify({ network: true }) })
    }

    startStatus.value = t('terminalStarter.sessionCreated')

    // Save last config for "repeat last session" feature
    composerRef.value?.saveLastConfig()

    // Emit event — parent redirects to session view
    emit('session-started', sessionInfo.value.session_id)

  } catch (error: any) {
    console.error('Error starting session:', error)

    const errorMsg = error.response?.data?.error_message || error.message || t('terminalStarter.errorStartingSession')

    if (isBudgetRejection(error)) {
      // Budget-mode rejection (CPU/RAM budget exhausted, or plan-restricted
      // size in advanced mode). Handled here BEFORE the generic 403/limit
      // branches so the more informative copy wins.
      await handleBudgetRejection(error)
    } else if (error.response?.status === 503) {
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
    } else if (isPersistencePlanDisabledError(error)) {
      // Defence-in-depth: the radio is only rendered when the plan allows
      // persistence, but the backend may still reject if the plan changed
      // mid-session. Translate the English BE message rather than leaking it.
      showErrorNotification(
        t('terminalStarter.errorPersistencePlanDisabled'),
        t('terminalStarter.errorStarting')
      )
    } else {
      // ocf-core wraps tt-backend failures via FormatError as:
      //   "Failed to start composed session: <description> (status=N, name=X)"
      // Translate the wrapper if the marker is present; otherwise fall back
      // to the raw message (preserves any unwrapped backend text).
      const composeMsg = getComposeErrorMessage(errorMsg)
      showErrorNotification(composeMsg ?? errorMsg, t('terminalStarter.errorStarting'))
    }
  } finally {
    isStarting.value = false
    startStatus.value = ''
  }
}

function cleanup() {
  if (capacityCheckTimer) {
    clearTimeout(capacityCheckTimer)
    capacityCheckTimer = null
  }
}

onMounted(async () => {
  // If the scenario forces ephemeral, normalize immediately so the radio
  // doesn't flash 'persistent' before the subscription loads.
  if (forcedEphemeral.value) {
    persistenceMode.value = 'ephemeral'
  }

  await Promise.all([
    subscriptionsStore.getCurrentSubscription(),
    userSettingsStore.loadSettings()
  ])

  // Plan-aware default applied every mount — we deliberately do NOT remember
  // the last-used mode, so a one-off 'ephemeral' choice never carries over to
  // the next session. crash_traps still wins (and the watcher below keeps it
  // normalised if the prop flips later).
  if (!forcedEphemeral.value) {
    persistenceMode.value = persistentSessionsEnabled.value ? 'persistent' : 'ephemeral'
  }

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

/* Persistence-toggle styles relocated to TerminalAdvancedOptions alongside the markup. */

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
