<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <div class="terminal-session-view">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-section">
      <i class="fas fa-spinner fa-spin"></i>
      <span>{{ t('sessionView.loading') }}</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-section">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <div class="error-actions">
        <router-link :to="{ name: 'TerminalSessions' }" class="btn btn-secondary">
          <i class="fas fa-arrow-left"></i>
          {{ t('sessionView.backToSessions') }}
        </router-link>
      </div>
    </div>

    <!-- Session content -->
    <template v-else-if="sessionInfo">
      <!-- Back link -->
      <div class="session-view-nav">
        <router-link :to="{ name: 'TerminalSessions' }" class="back-link">
          <i class="fas fa-arrow-left"></i>
          {{ t('sessionView.backToSessions') }}
        </router-link>
      </div>

      <!-- Recording info notice -->
      <div v-if="isSessionActive && !recordingNoticeDismissed" class="recording-info-notice">
        <div class="recording-notice-content">
          <i class="fas fa-video"></i>
          <span>{{ t('sessionView.recordingNotice') }}</span>
          <router-link to="/privacy" class="recording-notice-link">{{ t('sessionView.learnMore') }}</router-link>
        </div>
        <button class="recording-notice-dismiss" @click="dismissRecordingNotice" :aria-label="t('sessionView.dismissNotice')">
          {{ t('sessionView.gotIt') }}
        </button>
      </div>

      <!-- Scenario start bar (when no scenario active) -->
      <ScenarioStartBar
        ref="scenarioStartBarRef"
        v-show="isSessionActive && !scenarioSessionId && !scenarioLoading && !terminalHadScenario"
        :terminal-session-id="sessionId"
        :terminal-instance-type="sessionInfo?.instance_type"
        :terminal-machine-size="sessionInfo?.machine_size"
        @scenario-started="handleScenarioStarted"
        @scenario-loading="handleScenarioLoading"
        @provisioning-phase="handleProvisioningPhase"
        @provisioning-session-id="handleProvisioningSessionId"
      />

      <!-- Scenario briefing card (full width, dismissible) -->
      <div v-if="scenarioBriefing && scenarioBriefingText" class="scenario-briefing" :class="{ collapsed: !showBriefing }">
        <div class="briefing-header" @click="toggleBriefing" style="cursor: pointer;">
          <div class="briefing-title">
            <i class="fas fa-book-open"></i>
            <span>{{ t('sessionView.scenarioBriefing') }}</span>
          </div>
          <button class="briefing-toggle" @click="toggleBriefing" :aria-expanded="showBriefing">
            <i :class="showBriefing ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </button>
        </div>
        <div v-if="showBriefing" ref="briefingContentRef" class="briefing-content markdown-content" :class="{ 'has-overflow': briefingHasOverflow }" v-html="renderedBriefingText" @click="handleBriefingExecClick" @scroll="checkBriefingScroll"></div>
        <div v-if="showBriefing" class="briefing-footer">
          <button class="briefing-collapse-btn" @click="toggleBriefing">
            <i class="fas fa-chevron-up"></i> {{ t('sessionView.collapseBriefing') }}
          </button>
        </div>
      </div>

      <!-- Terminal + Scenario Panel layout (active session with scenario, or review mode) -->
      <div v-if="scenarioSessionId" class="terminal-session-layout" :class="{ resizing: isPanelResizing }">
        <div class="terminal-main-area" style="position: relative;">
          <TerminalSessionPanel
            ref="scenarioTerminalRef"
            :session-info="sessionInfo"
            :is-active="isSessionActive"
            :is-recording="isRecording"
            :end-reason="terminalEndReason"
            :has-scenario="terminalHadScenario"
            :scenario-session-id="scenarioSessionId"
            :scenario-flags-enabled="scenarioBriefing?.flags_enabled ?? false"
            :show-stop-button="isPersistent"
            :is-stopping="isStopping"
            :show-destroy-button="true"
            :is-destroying="isDeleting"
            @stop="stopSession"
            @destroy="askDelete"
            @recording-detected="isRecording = true"
            @session-warning="handleSessionWarning"
            @session-expired="handleSessionExpired"
          />
        </div>
        <div v-show="!scenarioPanelCollapsed" class="panel-resize-handle" @mousedown.prevent="startPanelResize">
          <div class="resize-handle-bar"></div>
        </div>
        <ScenarioPanel
          ref="scenarioPanelRef"
          :scenario-session-id="scenarioSessionId"
          :is-active="isSessionActive"
          :session-status="scenarioSessionStatus"
          :style="scenarioPanelCollapsed ? undefined : scenarioPanelStyle"
          @session-completed="handleScenarioCompleted"
          @session-abandoned="handleScenarioAbandoned"
          @session-abandon-failed="handleScenarioAbandonFailed"
          @paste-command="handlePasteCommand"
          @scenario-info-loaded="handleScenarioInfoLoaded"
          @collapsed="scenarioPanelCollapsed = $event"
          @flag-validated="scenarioTerminalRef?.refreshFlags()"
        />
      </div>

      <!-- Terminal only (active session without scenario) -->
      <div v-else-if="isSessionActive" style="position: relative;">
        <TerminalSessionPanel
          ref="standaloneTerminalRef"
          :session-info="sessionInfo"
          :is-active="isSessionActive"
          :is-recording="isRecording"
          :end-reason="terminalEndReason"
          :has-scenario="terminalHadScenario"
          :show-history="!scenarioLoading"
          :show-stop-button="isPersistent"
          :is-stopping="isStopping"
          :show-destroy-button="true"
          :is-destroying="isDeleting"
          @stop="stopSession"
          @destroy="askDelete"
          @recording-detected="isRecording = true"
          @session-warning="handleSessionWarning"
          @session-expired="handleSessionExpired"
        />
      </div>

      <!-- Session ended: show state-aware banner + history -->
      <template v-else>
        <!-- Stopped: in-place resume / delete UI.
             Persistence guard: only persistent sessions have a resumable
             "stopped" state. Ephemeral sessions are destroyed at expiry —
             if one ever reaches state='stopped' (stale row, backend bug)
             we must NOT offer Resume; fall through to activeEndBanner. -->
        <div v-if="terminalEndReason === 'stopped' && isPersistent" class="session-paused-banner" role="status">
          <div class="paused-content">
            <i class="fas fa-pause-circle paused-icon" aria-hidden="true"></i>
            <div class="paused-text">
              <strong>{{ t('sessionView.pausedTitle') }}</strong>
              <span>{{ t('sessionView.pausedBody') }}</span>
            </div>
          </div>
          <div class="paused-actions">
            <button
              class="btn-resume"
              :disabled="isResuming || isDeleting"
              @click="resumeSession"
              data-testid="resume-session-cta"
            >
              <i class="fas" :class="isResuming ? 'fa-spinner fa-spin' : 'fa-play'"></i>
              {{ isResuming ? t('sessionView.resuming') : t('sessionView.resumeButton') }}
            </button>
            <button
              class="btn-trash"
              :disabled="isResuming || isDeleting"
              @click="askDelete"
              data-testid="delete-session-cta"
            >
              <i class="fas fa-trash"></i>
              {{ t('sessionView.deleteButton') }}
            </button>
          </div>
        </div>
        <!-- Other end states: navigation-only banner -->
        <div v-else-if="activeEndBanner" class="session-end-banner" :class="activeEndBanner.toneClass" role="status">
          <div class="end-banner-left">
            <i :class="activeEndBanner.icon" class="end-banner-icon" aria-hidden="true"></i>
            <div class="end-banner-text">
              <strong class="end-banner-title">{{ activeEndBanner.title }}</strong>
              <span class="end-banner-body">{{ activeEndBanner.body }}</span>
            </div>
          </div>
          <div class="end-banner-actions">
            <router-link v-if="activeEndBanner.primary.kind === 'route'" :to="activeEndBanner.primary.route" class="end-banner-btn-primary" :class="activeEndBanner.toneClass">
              {{ activeEndBanner.primary.label }}
            </router-link>
            <router-link v-if="activeEndBanner.secondary && activeEndBanner.secondary.kind === 'route'" :to="activeEndBanner.secondary.route" class="end-banner-btn-secondary">
              {{ activeEndBanner.secondary.label }}
            </router-link>
          </div>
        </div>
        <div v-else class="session-expired-notice">
          <i class="fas fa-clock"></i>
          <span>{{ t('sessionView.sessionEnded') }}</span>
        </div>
        <div class="command-history-panel">
          <CommandHistory :session-id="sessionInfo?.session_id" :is-active="false" />
        </div>
      </template>
    </template>

    <!-- Trash confirmation modal -->
    <BaseModal
      :visible="showDeleteConfirm"
      :title="t('sessionView.deleteConfirmTitle')"
      title-icon="fas fa-trash"
      size="small"
      @close="cancelDelete"
    >
      <p>{{ t('sessionView.deleteConfirmBody') }}</p>

      <template #footer>
        <button
          class="btn btn-danger"
          data-testid="confirm-delete-cta"
          :disabled="isDeleting"
          @click="deleteSession"
        >
          <i class="fas" :class="isDeleting ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
          {{ t('sessionView.deleteConfirmCta') }}
        </button>
        <button
          class="btn btn-secondary"
          data-testid="cancel-delete-cta"
          :disabled="isDeleting"
          @click="cancelDelete"
        >
          <i class="fas fa-times"></i>
          {{ t('sessionView.cancelCta') }}
        </button>
      </template>
    </BaseModal>

    <!-- Full-screen provisioning overlay (shared with ScenarioLauncher) -->
    <ScenarioProvisioningOverlay
      v-if="scenarioLoading"
      :phase="provisioningPhase"
      :cancellable="!!provisioningScenarioSessionId"
      @cancel="handleCancelProvisioning"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { renderKillercodaMarkdown, loadScenarioImages } from '../../utils/killercodaMarkdown'
import { scenarioSessionService } from '../../services/domain/scenario'
import type { ScenarioInfo } from '../../services/domain/scenario'
import { terminalService } from '../../services/domain/terminal/terminalService'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { useEndStateConfig, type EndStateReason } from '../../composables/useEndStateConfig'
import { useLimitReachedMessage } from '../../composables/useLimitReachedMessage'
import { useDunningRejection } from '../../composables/useDunningRejection'
import TerminalSessionPanel from '../Terminal/TerminalSessionPanel.vue'
import ScenarioPanel from '../Terminal/ScenarioPanel.vue'
import ScenarioStartBar from '../Terminal/ScenarioStartBar.vue'
import ScenarioProvisioningOverlay from '../Terminal/ScenarioProvisioningOverlay.vue'
import CommandHistory from '../Terminal/CommandHistory.vue'
import BaseModal from '../Modals/BaseModal.vue'
import { getEffectiveSessionState } from '../../utils/sessionState'

const route = useRoute()
const router = useRouter()
const { showSuccess, showWarning, showError: showErrorNotification, showInfo, showConfirm } = useNotification()

const { t } = useTranslations({
  en: {
    sessionView: {
      loading: 'Loading session...',
      backToSessions: 'Back to My Sessions',
      errorLoading: 'Unable to load session information.',
      errorNotFound: 'Session not found.',
      sessionExpired: 'Your terminal session has expired.',
      sessionExpiredTitle: 'Session Expired',
      sessionEnded: 'This session has ended. You can still view the command history below.',
      stopError: 'Failed to stop the session.',
      warningInfo: 'Your session expires in 10 minutes.',
      warningWarning: 'Session expiring soon. Save your work.',
      warningDanger: 'Session expires in less than 1 minute!',
      sessionExpiredNotice: 'Session expired',
      warningTitle: 'Session Expiry',
      scenarioCompleted: 'Scenario completed successfully!',
      scenarioCompletedTitle: 'Scenario Completed',
      scenarioAbandoned: 'Scenario session abandoned.',
      scenarioAbandonedTitle: 'Scenario Abandoned',
      expiresIn5min: 'Your session expires in 5 minutes. Save your work.',
      expiresIn1min: 'Your session expires in less than 1 minute!',
      expiryWarningTitle: 'Session Expiring',
      scenarioBriefing: 'Scenario Briefing',
      scenarioLoading: 'Preparing your environment...',
      scenarioLoadingDetail: 'Setting up the challenge. This may take a moment.',
      scenarioReady: 'Your environment is ready!',
      scenarioLaunch: 'Start!',
      scenarioLaunching: 'Starting...',
      collapseBriefing: 'Collapse briefing',
      collapseScenario: 'Collapse instructions',
      expandScenario: 'Expand instructions',
      recordingNotice: 'Your terminal commands are recorded for security and learning purposes.',
      learnMore: 'Learn more',
      gotIt: 'Got it',
      dismissNotice: 'Dismiss recording notice',
      pausedTitle: 'Session paused',
      pausedBody: "The container's disk is preserved. Resume to pick up where you left off.",
      resumeButton: 'Resume session',
      resuming: 'Resuming…',
      resumeFailed: 'Resume failed',
      deleteButton: 'Delete permanently',
      deleteFailed: 'Delete failed',
      deleteConfirmTitle: 'Delete this session?',
      deleteConfirmBody: 'The container disk and command history will be permanently lost.',
      deleteConfirmCta: 'Delete',
      cancelCta: 'Cancel'
    }
  },
  fr: {
    sessionView: {
      loading: 'Chargement de la session...',
      backToSessions: 'Retour aux sessions',
      errorLoading: 'Impossible de charger les informations de la session.',
      errorNotFound: 'Session introuvable.',
      sessionExpired: 'Votre session terminal a expiré.',
      sessionExpiredTitle: 'Session expirée',
      sessionEnded: 'Cette session est terminée. Vous pouvez consulter l\'historique des commandes ci-dessous.',
      stopError: 'Impossible d\'arrêter la session.',
      warningInfo: 'Votre session expire dans 10 minutes.',
      warningWarning: 'Session bientôt terminée. Sauvegardez votre travail.',
      warningDanger: 'La session expire dans moins d\'une minute !',
      sessionExpiredNotice: 'Session expirée',
      warningTitle: 'Expiration de session',
      scenarioCompleted: 'Scénario terminé avec succès !',
      scenarioCompletedTitle: 'Scénario terminé',
      scenarioAbandoned: 'Session de scénario abandonnée.',
      scenarioAbandonedTitle: 'Scénario abandonné',
      expiresIn5min: 'Votre session expire dans 5 minutes. Sauvegardez votre travail.',
      expiresIn1min: 'Votre session expire dans moins d\'une minute !',
      expiryWarningTitle: 'Expiration de la session',
      scenarioBriefing: 'Briefing du scénario',
      scenarioLoading: 'Préparation de votre environnement...',
      scenarioLoadingDetail: 'Configuration du challenge en cours. Cela peut prendre un moment.',
      scenarioReady: 'Votre environnement est prêt !',
      scenarioLaunch: 'Démarrer !',
      scenarioLaunching: 'Démarrage...',
      collapseBriefing: 'Réduire le briefing',
      collapseScenario: 'Réduire les instructions',
      expandScenario: 'Afficher les instructions',
      recordingNotice: 'Vos commandes terminal sont enregistrées à des fins de sécurité et d\'apprentissage.',
      learnMore: 'En savoir plus',
      gotIt: 'Compris',
      dismissNotice: 'Fermer la notification d\'enregistrement',
      pausedTitle: 'Session en pause',
      pausedBody: 'Le disque du conteneur est conservé. Reprenez où vous en étiez.',
      resumeButton: 'Reprendre la session',
      resuming: 'Reprise…',
      resumeFailed: 'Échec de la reprise',
      deleteButton: 'Supprimer définitivement',
      deleteFailed: 'Échec de la suppression',
      deleteConfirmTitle: 'Supprimer cette session ?',
      deleteConfirmBody: 'Le disque du conteneur et l\'historique des commandes seront perdus définitivement.',
      deleteConfirmCta: 'Supprimer',
      cancelCta: 'Annuler'
    }
  }
})

// State
const isLoading = ref(true)
const error = ref('')
const sessionInfo = ref<any>(null)
const isStopping = ref(false)
const isRecording = ref(false)
const timeRemaining = ref(0)
let timerInterval: NodeJS.Timeout | null = null
// All pending expiry-refresh setTimeout IDs. Tracked as a Set because the
// post-expiry polling schedules multiple sequential timeouts; onBeforeUnmount
// must clear every one to avoid post-unmount axios calls.
const expiryRefreshTimeouts = new Set<ReturnType<typeof setTimeout>>()
// Flag set the moment the in-page countdown reaches zero and we apply the
// optimistic local state transition (persistent → 'stopped', otherwise →
// 'deleted'). Used by the silent refresh path to ignore a stale 'running'
// response while ocf-core's auto-sync is still catching up — otherwise the
// optimistic state would regress and the page would flash the wrong banner.
// Cleared when the backend confirms a terminal state, when the user
// explicitly resumes, and on unmount.
let optimisticExpired = false
let warned5min = false
let warned1min = false
let scenarioSyncInterval: ReturnType<typeof setInterval> | null = null

// Recording notice dismissal
const RECORDING_NOTICE_KEY = 'recording-notice-dismissed'
const recordingNoticeDismissed = ref(localStorage.getItem(RECORDING_NOTICE_KEY) === '1')

function dismissRecordingNotice() {
  recordingNoticeDismissed.value = true
  localStorage.setItem(RECORDING_NOTICE_KEY, '1')
}

// Get session ID from route
const sessionId = route.params.sessionId as string

// Scenario briefing (full-width card above the terminal layout)
const scenarioBriefing = ref<ScenarioInfo | null>(null)
const showBriefing = ref(true)
const briefingContentRef = ref<HTMLElement | null>(null)
const briefingHasOverflow = ref(false)

function checkBriefingScroll() {
  const el = briefingContentRef.value
  if (!el) return
  // Hide the fade when scrolled near the bottom (within 10px)
  briefingHasOverflow.value = el.scrollHeight - el.scrollTop - el.clientHeight > 10
}

watch(showBriefing, (visible) => {
  if (visible) {
    nextTick(() => checkBriefingScroll())
  }
})

function toggleBriefing() {
  showBriefing.value = !showBriefing.value
  if (scenarioSessionId.value) {
    const key = 'briefing-dismissed-' + scenarioSessionId.value
    if (!showBriefing.value) {
      localStorage.setItem(key, '1')
    } else {
      localStorage.removeItem(key)
    }
  }
}

const scenarioBriefingText = computed(() =>
  scenarioBriefing.value?.intro_text || scenarioBriefing.value?.description || ''
)

const renderedBriefingText = computed(() => {
  if (!scenarioBriefingText.value) return ''
  return renderKillercodaMarkdown(scenarioBriefingText.value)
})

watch(renderedBriefingText, () => {
  nextTick(() => {
    checkBriefingScroll()
    // Load scenario images in briefing text
    if (briefingContentRef.value && scenarioBriefing.value?.id) {
      loadScenarioImages(briefingContentRef.value, scenarioBriefing.value.id)
    }
  })
})

function handleScenarioInfoLoaded(info: ScenarioInfo) {
  scenarioBriefing.value = info
}

// Scenario session ID: auto-detected from terminal, or manual override via query parameter
const scenarioSessionId = ref<string | null>(null)
const scenarioSessionStatus = ref<string | null>(null)
const scenarioTerminalRef = ref<InstanceType<typeof TerminalSessionPanel> | null>(null)
const standaloneTerminalRef = ref<InstanceType<typeof TerminalSessionPanel> | null>(null)
const scenarioPanelRef = ref<InstanceType<typeof ScenarioPanel> | null>(null)
const scenarioStartBarRef = ref<InstanceType<typeof ScenarioStartBar> | null>(null)
const scenarioLoading = ref(false)
const provisioningPhase = ref('')
const provisioningScenarioSessionId = ref('')
const terminalHadScenario = ref(false)

function handleProvisioningPhase(phase: string) {
  provisioningPhase.value = phase
}

function handleProvisioningSessionId(sessionId: string) {
  provisioningScenarioSessionId.value = sessionId
}

async function handleCancelProvisioning() {
  const sessionId = provisioningScenarioSessionId.value

  // Abort the polling in ScenarioStartBar
  scenarioStartBarRef.value?.abortProvisioning()

  // Reset UI state
  scenarioLoading.value = false
  provisioningPhase.value = ''
  provisioningScenarioSessionId.value = ''

  // Abandon the session on the backend
  if (sessionId) {
    try {
      await scenarioSessionService.abandonSession(sessionId)
    } catch {
      // Best-effort — session may already be cleaned up
    }
  }
}

// Restore briefing dismissed state from localStorage when scenario session is known
watch(scenarioSessionId, (id) => {
  if (id && localStorage.getItem('briefing-dismissed-' + id)) {
    showBriefing.value = false
  }
})

function handlePasteCommand(command: string) {
  scenarioTerminalRef.value?.pasteText(command)
}

function handleBriefingExecClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.classList.contains('exec-command')) {
    const command = target.textContent?.trim()
    if (command) {
      handlePasteCommand(command)
    }
  }
  if (target.classList.contains('copy-command')) {
    const text = target.textContent?.trim()
    if (text) {
      navigator.clipboard.writeText(text)
      target.classList.add('copied')
      setTimeout(() => target.classList.remove('copied'), 1500)
    }
  }
}

// Allow manual override via query parameter for testing
const queryScenarioSession = route.query.scenario_session as string | undefined
if (queryScenarioSession) {
  scenarioSessionId.value = queryScenarioSession
  terminalHadScenario.value = true
}

function startScenarioSync() {
  if (scenarioSessionId.value || scenarioSyncInterval) return

  scenarioSyncInterval = setInterval(async () => {
    // Don't auto-set scenarioSessionId while scenario is loading — let handleScenarioStarted control it
    if (scenarioSessionId.value || !isSessionActive.value || scenarioLoading.value) {
      if (scenarioSessionId.value || !isSessionActive.value) stopScenarioSync()
      return
    }
    try {
      const scenarioSession = await scenarioSessionService.getSessionByTerminal(sessionId)
      if (scenarioSession) {
        scenarioSessionId.value = scenarioSession.id
        scenarioSessionStatus.value = scenarioSession.status
        terminalHadScenario.value = true
        stopScenarioSync()
      }
    } catch {
      // Silently ignore — will retry next interval
    }
  }, 10000)
}

function stopScenarioSync() {
  if (scenarioSyncInterval) {
    clearInterval(scenarioSyncInterval)
    scenarioSyncInterval = null
  }
}

const effectiveState = computed(() => getEffectiveSessionState(sessionInfo.value))

// SSOT for the persistent-vs-ephemeral gate. Mirrors the backend's
// persistence_mode field (set at launch time by TerminalStarter's
// persistence-toggle, gated on the plan's data_persistence_enabled).
// Used to hide the Stop button for ephemeral sessions (they only support
// Destroy) and to gate the "Session arrêtée" Resume banner.
const isPersistent = computed(() => sessionInfo.value?.persistence_mode === 'persistent')

const isSessionActive = computed(() => {
  if (!sessionInfo.value) return false
  if (effectiveState.value !== 'running') return false
  // timeRemaining is a UI-only countdown; if it underflows, treat as inactive.
  // (effectiveState already covers the expires_at invariant, but countdown
  // may run for a bit before the next fetch — keep this as a belt-and-suspenders.)
  return timeRemaining.value > 0
})

// Determine the end-of-session reason using priority resolution
const terminalEndReason = computed<'completed' | 'abandoned' | 'expired' | 'stopped' | 'revoked' | 'setup_failed' | ''>(() => {
  // Scenario end-states take priority (may fire before terminal status updates)
  if (scenarioSessionStatus.value === 'completed') return 'completed'
  if (scenarioSessionStatus.value === 'abandoned') return 'abandoned'
  if (scenarioSessionStatus.value === 'setup_failed') return 'setup_failed'

  // Terminal end-states only when session is no longer active
  if (isSessionActive.value) return ''

  // Map effective state -> end reason. 'deleted' here means "TTL or trash" —
  // display as expired for the banner to preserve existing user-facing copy.
  // 'revoked' is a billing/entitlement stop, kept distinct from a TTL expiry
  // so the banner can show honest copy instead of "time limit reached".
  if (effectiveState.value === 'stopped') return 'stopped'
  if (effectiveState.value === 'revoked') return 'revoked'
  if (effectiveState.value === 'deleted') return 'expired'

  // Fallback: no specific end reason (keep existing reconnect behavior)
  return ''
})

// End banner config (shared composable)
const { getEndStateConfig } = useEndStateConfig()

// Localized quota-class error messages (shared with TerminalStarter).
// Used by resumeSession's catch block to translate backend 403-with-source
// responses instead of surfacing the raw English `error_message`.
const { getLimitReachedMessage } = useLimitReachedMessage()

// Dunning (past-due) rejection detection + copy, shared across terminal flows.
const { isDunningRejection, getDunningCopy } = useDunningRejection()

const activeEndBanner = computed(() => {
  const reason = terminalEndReason.value
  if (!reason) return null
  const config = getEndStateConfig(reason as EndStateReason, { hasScenario: terminalHadScenario.value })
  if (!config) return null
  return {
    ...config,
    toneClass: 'end-banner--' + config.tone
  }
})

async function stopSession() {
  if (!sessionInfo.value || isStopping.value) return

  isStopping.value = true
  try {
    await axios.post(`/terminals/${sessionInfo.value.session_id}/stop`)
    // Refetch — backend has updated state='stopped' and may have other side effects.
    // loadSession() does not call startExpirationTimer when status is 'stopped',
    // so we still clear the stale countdown interval locally here.
    await loadSession()
    timeRemaining.value = 0
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  } catch (err: any) {
    console.error('Error stopping session:', err)
    showErrorNotification(
      err.response?.data?.error_message || err.message || t('sessionView.stopError')
    )
  } finally {
    isStopping.value = false
  }
}

// Resume + delete (shown in the "stopped" end-state UI)
const isResuming = ref(false)
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

async function resumeSession() {
  if (!sessionInfo.value || isResuming.value) return
  isResuming.value = true
  try {
    await terminalService.startSession(sessionInfo.value.session_id)
    // User explicitly resumed — drop the post-expiry guard so the next
    // refresh accepts 'running' from the backend (that IS the truth now).
    optimisticExpired = false
    // Refetch — backend has updated status='active', new expires_at, possibly new IP.
    // After loadSession() resolves, isSessionActive flips back to true and the
    // terminal panel re-mounts (WebSocket reconnects naturally).
    await loadSession()
  } catch (err: any) {
    console.error('Error resuming session:', err)
    // Dunning (past-due) 402: detect BEFORE the source→limit mapping below,
    // which would otherwise emit the wrong "concurrent terminal limit" copy.
    // Offer the subscription dashboard so the user can settle the invoice.
    if (isDunningRejection(err)) {
      const copy = getDunningCopy()
      const confirmed = await showConfirm(copy.message, copy.title, {
        confirmButtonText: copy.action,
        cancelButtonText: copy.dismiss
      })
      if (confirmed) {
        Promise.resolve(router.push('/subscription-dashboard')).catch(() => {})
      }
      return
    }
    // Localize quota-class 403s using the `source` returned by the backend.
    // CheckLimit was removed from POST /:id/start (see ocf-core fix for slot-
    // neutral resume), but other paths can still return a 403-with-source —
    // and any future quota-gated surface that touches the resume flow gets
    // the same UX for free. Fall back to the raw error_message for non-quota
    // failures (RAM, network, ownership flap).
    const source = err.response?.data?.source
    const msg = source
      ? getLimitReachedMessage({ source })
      : (err.response?.data?.error_message || err.message || t('sessionView.resumeFailed'))
    showErrorNotification(msg)
  } finally {
    isResuming.value = false
  }
}

function askDelete() {
  showDeleteConfirm.value = true
}

function cancelDelete() {
  if (isDeleting.value) return
  showDeleteConfirm.value = false
}

async function deleteSession() {
  if (!sessionInfo.value || isDeleting.value) return
  isDeleting.value = true
  try {
    await terminalService.deleteSession(sessionInfo.value.session_id)
    showDeleteConfirm.value = false
    router.push({ name: 'TerminalSessions' })
  } catch (err: any) {
    console.error('Error deleting session:', err)
    showErrorNotification(
      err.response?.data?.error_message || err.message || t('sessionView.deleteFailed')
    )
  } finally {
    isDeleting.value = false
  }
}

async function loadSession() {
  isLoading.value = true
  error.value = ''

  try {
    // NOTE: We fetch all user sessions and find the target by ID because no
    // single-session GET endpoint exists on the backend yet.
    // TODO: replace with GET /terminals/:id once that endpoint is added.
    const sessions = await axios.get('/terminals/user-sessions')
    const terminal = (sessions.data || []).find((s: any) => s.session_id === sessionId || s.id === sessionId)

    if (!terminal) {
      throw { response: { status: 404 } }
    }

    sessionInfo.value = {
      session_id: terminal.session_id,
      expires_at: terminal.expires_at,
      name: terminal.name,
      instance_type: terminal.instance_type,
      machine_size: terminal.machine_size,
      // SSOT — getEffectiveSessionState() reads `state` (running/stopped/
      // deleted). The legacy parallel `status` field was removed from the
      // API contract; dropping `state` here silently forces every downstream
      // reader (effectiveState, terminalEndReason, the stopped banner) onto
      // the default-deleted branch and hides the Resume + Delete CTAs.
      // Keep this explicit list in sync with the API contract — see
      // src/utils/sessionState.ts.
      state: terminal.state,
      persistence_mode: terminal.persistence_mode,
      idle_until: terminal.idle_until,
      // JSON string of enabled features (e.g. `{"network":true}`) — carried so
      // TerminalViewer's status bar can render the internet-access indicator.
      composed_features: terminal.composed_features
    }

    // Start expiration timer only for running sessions
    const state = terminal.state
    if (terminal.expires_at && state === 'running') {
      startExpirationTimer(terminal.expires_at)
    }

    // Auto-detect linked scenario session (unless already set via query parameter or loading)
    if (!scenarioSessionId.value && !scenarioLoading.value) {
      try {
        const scenarioSession = await scenarioSessionService.getSessionByTerminal(sessionId)
        if (scenarioSession) {
          scenarioSessionId.value = scenarioSession.id
          scenarioSessionStatus.value = scenarioSession.status
          terminalHadScenario.value = true
        }
      } catch {
        // Silently ignore - no scenario linked is fine
      }
    }

    // Start polling for scenario if none was detected yet
    if (!scenarioSessionId.value && state === 'running') {
      startScenarioSync()
    }
  } catch (err: any) {
    console.error('Failed to load session:', err)
    if (err.response?.status === 404) {
      error.value = t('sessionView.errorNotFound')
    } else {
      error.value = err.response?.data?.error_message ||
                    err.response?.data?.message ||
                    t('sessionView.errorLoading')
    }
  } finally {
    isLoading.value = false
  }
}

// Silent refresh: re-fetch sessionInfo from the backend WITHOUT touching
// isLoading or error. Used by the post-expiry polling so the page does not
// flash the loading spinner over the existing content. Skips the scenario
// auto-detect side effects — only the canonical session state matters here,
// and a failure during silent refresh should be invisible to the user (the
// next poll attempt will try again, and at worst the existing UI stays).
async function refreshSessionInfo(): Promise<string | null> {
  try {
    const sessions = await axios.get('/terminals/user-sessions')
    const terminal = (sessions.data || []).find(
      (s: any) => s.session_id === sessionId || s.id === sessionId
    )
    if (!terminal) return null

    // Guard against regression: if we've already applied the optimistic
    // post-expiry state and the backend hasn't caught up (still reports
    // 'running'), keep the optimistic state. Otherwise the page would
    // flash the wrong banner each time a poll lands while the auto-stop /
    // auto-sync race is still in flight. We still refresh the other
    // fields (expires_at, idle_until) since those are advisory.
    const optimisticState =
      optimisticExpired && terminal.state === 'running'
        ? sessionInfo.value?.state ?? terminal.state
        : terminal.state

    sessionInfo.value = {
      session_id: terminal.session_id,
      expires_at: terminal.expires_at,
      name: terminal.name,
      instance_type: terminal.instance_type,
      machine_size: terminal.machine_size,
      state: optimisticState,
      persistence_mode: terminal.persistence_mode,
      idle_until: terminal.idle_until,
      composed_features: terminal.composed_features
    }

    // Backend has confirmed a terminal state — the optimistic guard is
    // no longer needed. (A later regression to 'running' from the BE
    // would be a real change, not a stale-cache artifact.)
    if (terminal.state === 'stopped' || terminal.state === 'deleted') {
      optimisticExpired = false
    }

    return terminal.state || null
  } catch (err) {
    // Silent — surfacing this would defeat the purpose. Caller decides
    // whether to keep polling.
    console.warn('Silent session refresh failed:', err)
    return null
  }
}

// Backoff schedule for post-expiry polling. Reasoning: BE persistent
// auto-stop fires immediately, but ocf-core's auto-sync to surface
// state='stopped' on a subsequent GET can take 5+ seconds (observed
// during manual testing). A single 2s tick lands too early. We back off
// to 8s by the last attempt so the worst-case race is well covered, with
// a total cap of ~28s — beyond that the user can manually refresh, and
// we don't want to poll indefinitely.
const EXPIRY_REFRESH_DELAYS_MS = [2000, 3000, 4000, 5000, 6000, 8000]

function cancelExpiryRefreshTimeouts() {
  for (const id of expiryRefreshTimeouts) {
    clearTimeout(id)
  }
  expiryRefreshTimeouts.clear()
}

function scheduleExpiryRefresh(attempt: number) {
  if (attempt >= EXPIRY_REFRESH_DELAYS_MS.length) {
    // Cap reached — stop polling. The UI renders whatever the last
    // refresh produced; the user can manually refresh if needed.
    return
  }
  const delay = EXPIRY_REFRESH_DELAYS_MS[attempt]
  const id = setTimeout(async () => {
    expiryRefreshTimeouts.delete(id)
    const state = await refreshSessionInfo()
    if (state && state !== 'running') {
      // Backend has caught up — done.
      return
    }
    scheduleExpiryRefresh(attempt + 1)
  }, delay)
  expiryRefreshTimeouts.add(id)
}

function startExpirationTimer(expiresAt: string) {
  const expirationTime = new Date(expiresAt).getTime()

  if (timerInterval) {
    clearInterval(timerInterval)
  }

  // Set initial value immediately (don't wait for first interval tick)
  const initialRemaining = Math.max(0, Math.floor((expirationTime - Date.now()) / 1000))
  timeRemaining.value = initialRemaining

  if (initialRemaining <= 0) {
    return
  }

  timerInterval = setInterval(() => {
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000))

    timeRemaining.value = remaining

    if (remaining <= 300 && remaining > 60 && !warned5min) {
      warned5min = true
      showWarning(t('sessionView.expiresIn5min'), t('sessionView.expiryWarningTitle'))
    }

    if (remaining <= 60 && remaining > 0 && !warned1min) {
      warned1min = true
      showErrorNotification(t('sessionView.expiresIn1min'), t('sessionView.expiryWarningTitle'))
    }

    if (remaining <= 0) {
      clearInterval(timerInterval!)
      timerInterval = null
      // Optimistically transition the local state to what the backend WILL
      // be. Without this, getEffectiveSessionState({state:'running',
      // expires_at:past}) falls into its zombie branch and returns 'deleted'
      // — which renders the "Session expirée" banner for ~2s until the
      // first silent poll resolves. For persistent sessions the correct
      // banner is "Session arrêtée — Resume / Delete", so the flash is a
      // visible UX bug. Predict the backend transition based on
      // persistence_mode (persistent → auto-stop → 'stopped'; ephemeral →
      // destroy → 'deleted') and apply it locally now. The silent poll
      // remains as a backstop: if the backend confirms, the UI does not
      // change; if it disagrees, the poll corrects.
      if (sessionInfo.value) {
        sessionInfo.value.state =
          sessionInfo.value.persistence_mode === 'persistent'
            ? 'stopped'
            : 'deleted'
        optimisticExpired = true
      }
      // The in-page countdown is a UI approximation — only the backend knows
      // whether the session was auto-stopped (persistent) or destroyed
      // (ephemeral) at expiry. Poll silently with backoff so downstream
      // computeds (effectiveState, terminalEndReason) read fresh truth
      // instead of the stale state='running' sessionInfo + past expires_at
      // combination, which mis-renders "Session expirée" for persistent
      // sessions that should show "Session arrêtée" with Resume + Delete
      // CTAs. Backoff lets the BE auto-stop + ocf-core auto-sync race
      // settle without flashing the page spinner.
      cancelExpiryRefreshTimeouts()
      scheduleExpiryRefresh(0)
    }
  }, 1000)
}

function handleSessionWarning(level: 'info' | 'warning' | 'danger') {
  const messages: Record<string, () => void> = {
    info: () => showInfo(t('sessionView.warningInfo'), t('sessionView.warningTitle')),
    warning: () => showWarning(t('sessionView.warningWarning'), t('sessionView.warningTitle')),
    danger: () => showErrorNotification(t('sessionView.warningDanger'), t('sessionView.warningTitle'))
  }
  messages[level]?.()
}

function handleSessionExpired() {
  timeRemaining.value = 0
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  showWarning(t('sessionView.sessionExpiredNotice'), t('sessionView.sessionExpiredTitle'))
}

function handleScenarioLoading(loading: boolean) {
  scenarioLoading.value = loading
  if (loading) stopScenarioSync()
}

function handleScenarioStarted(newScenarioSessionId: string) {
  scenarioSessionId.value = newScenarioSessionId
  terminalHadScenario.value = true
  provisioningScenarioSessionId.value = ''
  stopScenarioSync()
  scenarioLoading.value = false
}

function handleScenarioCompleted() {
  showSuccess(t('sessionView.scenarioCompleted'), t('sessionView.scenarioCompletedTitle'))
}

function handleScenarioAbandoned() {
  scenarioSessionStatus.value = 'abandoned'
  showInfo(t('sessionView.scenarioAbandoned'), t('sessionView.scenarioAbandonedTitle'))
}

function handleScenarioAbandonFailed() {
  // Revert the optimistic abandon state — session is still active
  scenarioSessionStatus.value = 'active'
}

// Resizable scenario panel
const PANEL_WIDTH_KEY = 'scenario-panel-width'
const MIN_PANEL_WIDTH = 250
const MAX_PANEL_WIDTH = 600
const DEFAULT_PANEL_WIDTH = MAX_PANEL_WIDTH

const scenarioPanelWidth = ref(DEFAULT_PANEL_WIDTH)
const isPanelResizing = ref(false)
const scenarioPanelCollapsed = ref(localStorage.getItem('scenario_panel_collapsed') === 'true')

// Restore saved width
const savedPanelWidth = localStorage.getItem(PANEL_WIDTH_KEY)
if (savedPanelWidth !== null) {
  const parsed = parseInt(savedPanelWidth, 10)
  if (!isNaN(parsed) && parsed >= MIN_PANEL_WIDTH && parsed <= MAX_PANEL_WIDTH) {
    scenarioPanelWidth.value = parsed
  }
}

const scenarioPanelStyle = computed(() => ({
  width: `${scenarioPanelWidth.value}px`,
  minWidth: `${scenarioPanelWidth.value}px`
}))

function startPanelResize(event: MouseEvent) {
  isPanelResizing.value = true
  const startX = event.clientX
  const startWidth = scenarioPanelWidth.value

  function onMouseMove(e: MouseEvent) {
    const deltaX = startX - e.clientX
    scenarioPanelWidth.value = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, startWidth + deltaX))
  }

  function onMouseUp() {
    isPanelResizing.value = false
    localStorage.setItem(PANEL_WIDTH_KEY, String(scenarioPanelWidth.value))
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

onMounted(() => {
  loadSession()
})

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  cancelExpiryRefreshTimeouts()
  optimisticExpired = false
  stopScenarioSync()
})
</script>

<style scoped>
.terminal-session-view {
  max-width: 100%;
  margin: 0 auto;
  position: relative;
  min-height: 300px;
}

.loading-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}

.loading-section i {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

.error-section {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-danger);
}

.error-section i {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-md);
}

.error-section p {
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-md);
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

.session-view-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-primary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: var(--border-width-medium) solid transparent;
  border-radius: var(--border-radius-md);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-secondary {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-white);
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.session-expired-notice {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  background-color: var(--color-warning-bg, var(--color-bg-secondary));
  border: var(--border-width-medium) solid var(--color-warning, var(--color-border));
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.session-expired-notice i {
  color: var(--color-warning, var(--color-text-muted));
}

/* State-aware end banner */
.session-end-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border: var(--border-width-medium) solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-secondary);
}

.session-end-banner.end-banner--success { border-color: var(--color-success); }
.session-end-banner.end-banner--info { border-color: var(--color-info); }
.session-end-banner.end-banner--warning { border-color: var(--color-warning); }
.session-end-banner.end-banner--danger { border-color: var(--color-danger); }

.end-banner-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 0;
}

.end-banner-icon {
  font-size: var(--font-size-xl);
  flex-shrink: 0;
}

.end-banner--success .end-banner-icon { color: var(--color-success); }
.end-banner--info .end-banner-icon { color: var(--color-info); }
.end-banner--warning .end-banner-icon { color: var(--color-warning); }
.end-banner--danger .end-banner-icon { color: var(--color-danger); }

.end-banner-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.end-banner-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.end-banner-body {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.end-banner-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.end-banner-btn-primary {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  color: var(--color-white);
  white-space: nowrap;
  transition: opacity var(--transition-fast);
}

.end-banner-btn-primary:hover { opacity: 0.9; }

.end-banner-btn-primary.end-banner--success { background-color: var(--color-success); }
.end-banner-btn-primary.end-banner--info { background-color: var(--color-info); }
.end-banner-btn-primary.end-banner--warning { background-color: var(--color-warning); }
.end-banner-btn-primary.end-banner--danger { background-color: var(--color-danger); }

.end-banner-btn-secondary {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  white-space: nowrap;
}

.end-banner-btn-secondary:hover {
  color: var(--color-text-primary);
}

@media (max-width: 768px) {
  .session-end-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .end-banner-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

/* Paused (stopped) banner with in-place resume / delete */
.session-paused-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border: var(--border-width-medium) solid var(--color-warning);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-secondary);
}

.paused-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 0;
}

.paused-icon {
  font-size: var(--font-size-xl);
  color: var(--color-warning);
  flex-shrink: 0;
}

.paused-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.paused-text strong {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.paused-text span {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.paused-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.btn-resume,
.btn-trash {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: var(--border-width-medium) solid transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.btn-resume {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.btn-resume:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn-trash {
  background-color: transparent;
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.btn-trash:hover:not(:disabled) {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.btn-resume:disabled,
.btn-trash:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .session-paused-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .paused-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

.recording-info-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-md);
  background-color: var(--color-info-bg, var(--color-bg-secondary));
  border: var(--border-width-thin) solid var(--color-info, var(--color-border));
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.recording-notice-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
}

.recording-notice-content i {
  color: var(--color-info, var(--color-primary));
  flex-shrink: 0;
}

.recording-notice-link {
  color: var(--color-primary);
  text-decoration: underline;
  white-space: nowrap;
}

.recording-notice-link:hover {
  color: var(--color-primary-hover);
}

.recording-notice-dismiss {
  background: none;
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.recording-notice-dismiss:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
  border-color: var(--color-border-medium);
}

.command-history-panel {
  margin-top: var(--spacing-md);
}

.terminal-session-layout {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
}

.terminal-session-layout.resizing {
  user-select: none;
}

.panel-resize-handle {
  width: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  transition: background-color var(--transition-fast);
}

.panel-resize-handle:hover,
.resizing .panel-resize-handle {
  background-color: var(--color-primary-light);
}

.resize-handle-bar {
  width: 3px;
  height: 40px;
  border-radius: var(--border-radius-full);
  background: var(--color-border-light);
  transition: background-color var(--transition-fast), height var(--transition-fast);
}

.panel-resize-handle:hover .resize-handle-bar,
.resizing .resize-handle-bar {
  background-color: var(--color-primary);
  height: 56px;
}


.terminal-main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

/* Scenario briefing card */
.scenario-briefing {
  margin-bottom: var(--spacing-md);
  max-height: 50vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  transition: all var(--transition-base);
}

.briefing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  flex-shrink: 0;
}

.scenario-briefing.collapsed .briefing-header {
  border-bottom: none;
}

.briefing-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.briefing-title i {
  color: var(--color-primary);
  font-size: var(--font-size-md);
}

.briefing-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast);
}

.briefing-toggle:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border-color: var(--color-border-medium);
}

.briefing-content {
  padding: 0 var(--spacing-md) var(--spacing-md);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  position: relative;
}

.briefing-content.has-overflow {
  mask-image: linear-gradient(to bottom, black calc(100% - 3rem), transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 3rem), transparent 100%);
}

.briefing-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  flex-shrink: 0;
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

.briefing-collapse-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  background: none;
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.briefing-collapse-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border-medium);
}

.briefing-collapse-btn i {
  margin-right: var(--spacing-xs);
}

/* Markdown content styles (v-html requires :deep for scoped styles) */
.markdown-content :deep(p) {
  margin: var(--spacing-xs) 0;
}

.markdown-content :deep(p:first-child) {
  margin-top: 0;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(pre) {
  background: var(--color-bg-tertiary, rgba(0, 0, 0, 0.2));
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  overflow-x: auto;
  margin: var(--spacing-sm) 0;
}

.markdown-content :deep(code) {
  font-family: var(--font-family-monospace, monospace);
  font-size: var(--font-size-xs);
}

.markdown-content :deep(.exec-command) {
  cursor: pointer;
  border-bottom: 1px dashed var(--color-primary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.markdown-content :deep(.exec-command:hover) {
  background-color: var(--color-primary-light, rgba(0, 123, 255, 0.15));
  color: var(--color-primary);
}

.markdown-content :deep(p code),
.markdown-content :deep(li code) {
  background: var(--color-bg-tertiary, rgba(0, 0, 0, 0.2));
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin: var(--spacing-sm) 0 var(--spacing-xs);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.markdown-content :deep(h1) { font-size: var(--font-size-lg); }
.markdown-content :deep(h2) { font-size: var(--font-size-md); }
.markdown-content :deep(h3) { font-size: var(--font-size-sm); }
.markdown-content :deep(h4) { font-size: var(--font-size-sm); }

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: var(--spacing-xs) 0;
  padding-left: var(--spacing-lg);
}

.markdown-content :deep(li) {
  margin: var(--spacing-xs) 0;
}

.markdown-content :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.markdown-content :deep(a:hover) {
  color: var(--color-primary-hover);
}

.markdown-content :deep(strong) {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(blockquote) {
  margin: var(--spacing-sm) 0;
  padding: var(--spacing-xs) var(--spacing-md);
  border-left: 3px solid var(--color-primary);
  background: var(--color-bg-tertiary, rgba(0, 0, 0, 0.1));
  border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: var(--spacing-sm) 0;
  font-size: var(--font-size-xs);
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-light);
  text-align: left;
}

.markdown-content :deep(th) {
  background: var(--color-bg-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.markdown-content :deep(hr) {
  border: none;
  border-top: var(--border-width-thin) solid var(--color-border-light);
  margin: var(--spacing-sm) 0;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius-sm);
}

/* Responsive: hide resize handle on tablet and mobile (no room to drag) */
@media (max-width: 768px) {
  .panel-resize-handle {
    display: none;
  }

  .terminal-session-layout {
    gap: 0;
  }
}

/* Responsive: stack layout on mobile (scenario panel becomes full overlay) */
@media (max-width: 480px) {
  .terminal-session-layout {
    position: relative;
  }

  .terminal-main-area {
    width: 100%;
  }
}
</style>
