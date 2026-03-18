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
        v-if="isSessionActive && !scenarioSessionId"
        :terminal-session-id="sessionId"
        @scenario-started="handleScenarioStarted"
        @scenario-loading="handleScenarioLoading"
      />

      <!-- Scenario briefing card (full width, dismissible) -->
      <div v-if="scenarioBriefing && scenarioBriefingText" class="scenario-briefing" :class="{ collapsed: !showBriefing }">
        <div class="briefing-header">
          <div class="briefing-title">
            <i class="fas fa-book-open"></i>
            <span>{{ t('sessionView.scenarioBriefing') }}</span>
          </div>
          <button class="briefing-toggle" @click="toggleBriefing" :aria-expanded="showBriefing">
            <i :class="showBriefing ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </button>
        </div>
        <div v-if="showBriefing" class="briefing-content markdown-content" v-html="renderedBriefingText" @click="handleBriefingExecClick"></div>
        <div v-if="showBriefing" class="briefing-footer">
          <button class="briefing-collapse-btn" @click="toggleBriefing">
            <i class="fas fa-chevron-up"></i> {{ t('sessionView.collapseBriefing') }}
          </button>
        </div>
      </div>

      <!-- Terminal + Scenario Panel layout (active session with scenario) -->
      <div v-if="isSessionActive && scenarioSessionId" class="terminal-session-layout" :class="{ resizing: isPanelResizing }">
        <div class="terminal-main-area" style="position: relative;">
          <!-- Loading overlay (covers terminal during scenario setup) -->
          <div v-if="scenarioLoading" class="scenario-loading-overlay">
            <div class="scenario-loading-content">
              <i class="fas fa-cog fa-spin"></i>
              <p>{{ t('sessionView.scenarioLoading') }}</p>
              <p class="scenario-loading-detail">{{ t('sessionView.scenarioLoadingDetail') }}</p>
            </div>
          </div>
          <TerminalSessionPanel
            ref="scenarioTerminalRef"
            :session-info="sessionInfo"
            :is-active="isSessionActive"
            :is-recording="isRecording"
            show-stop-button
            :is-stopping="isStopping"
            @stop="stopSession"
            @recording-detected="isRecording = true"
            @session-warning="handleSessionWarning"
            @session-expired="handleSessionExpired"
          />
        </div>
        <div class="panel-resize-handle" @mousedown.prevent="startPanelResize">
          <div class="resize-handle-bar"></div>
        </div>
        <ScenarioPanel
          :scenario-session-id="scenarioSessionId"
          :is-active="isSessionActive"
          :style="scenarioPanelStyle"
          @session-completed="handleScenarioCompleted"
          @session-abandoned="handleScenarioAbandoned"
          @paste-command="handlePasteCommand"
          @scenario-info-loaded="handleScenarioInfoLoaded"
        />
      </div>

      <!-- Terminal only (active session without scenario) -->
      <div v-else-if="isSessionActive" style="position: relative;">
        <!-- Loading overlay (covers terminal during scenario setup) -->
        <div v-if="scenarioLoading" class="scenario-loading-overlay">
          <div class="scenario-loading-content">
            <div class="scenario-loading-icon">
              <i v-if="!scenarioReady" class="fas fa-cog fa-spin"></i>
              <i v-else class="fas fa-check-circle"></i>
            </div>
            <h3>{{ scenarioReady ? t('sessionView.scenarioReady') : t('sessionView.scenarioLoading') }}</h3>
            <p v-if="!scenarioReady" class="scenario-loading-detail">{{ t('sessionView.scenarioLoadingDetail') }}</p>
            <button v-if="scenarioReady" class="btn btn-success btn-lg" :disabled="scenarioLaunching" @click="launchScenario">
              <i :class="scenarioLaunching ? 'fas fa-spinner fa-spin' : 'fas fa-play'"></i>
              {{ scenarioLaunching ? t('sessionView.scenarioLaunching') : t('sessionView.scenarioLaunch') }}
            </button>
          </div>
        </div>
        <TerminalSessionPanel
          ref="standaloneTerminalRef"
          :session-info="sessionInfo"
          :is-active="isSessionActive"
          :is-recording="isRecording"
          show-stop-button
          :is-stopping="isStopping"
          @stop="stopSession"
          @recording-detected="isRecording = true"
          @session-warning="handleSessionWarning"
          @session-expired="handleSessionExpired"
        />
      </div>

      <!-- Session expired: show notice + history only -->
      <template v-else>
        <div class="session-expired-notice">
          <i class="fas fa-clock"></i>
          <span>{{ t('sessionView.sessionEnded') }}</span>
        </div>
        <div class="command-history-panel">
          <CommandHistory :session-id="sessionInfo?.session_id" :is-active="false" />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { terminalService } from '../../services/domain/terminal'
import { scenarioSessionService } from '../../services/domain/scenario'
import type { ScenarioInfo } from '../../services/domain/scenario'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import TerminalSessionPanel from '../Terminal/TerminalSessionPanel.vue'
import ScenarioPanel from '../Terminal/ScenarioPanel.vue'
import ScenarioStartBar from '../Terminal/ScenarioStartBar.vue'
import CommandHistory from '../Terminal/CommandHistory.vue'

const route = useRoute()
const { showSuccess, showWarning, showError: showErrorNotification, showInfo } = useNotification()

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

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
      recordingNotice: 'Your terminal commands are recorded for security and learning purposes.',
      learnMore: 'Learn more',
      gotIt: 'Got it',
      dismissNotice: 'Dismiss recording notice'
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
      recordingNotice: 'Vos commandes terminal sont enregistrées à des fins de sécurité et d\'apprentissage.',
      learnMore: 'En savoir plus',
      gotIt: 'Compris',
      dismissNotice: 'Fermer la notification d\'enregistrement'
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

// Process KillerCoda {{exec}} syntax: `command`{{exec}} → clickable inline command
function processExecSyntax(html: string): string {
  return html.replace(/<code>([^<]+)<\/code>\{\{exec\}\}/g, '<code class="exec-command">$1</code>')
}

const renderedBriefingText = computed(() => {
  if (!scenarioBriefingText.value) return ''
  const html = marked.parse(scenarioBriefingText.value) as string
  return DOMPurify.sanitize(processExecSyntax(html))
})

function handleScenarioInfoLoaded(info: ScenarioInfo) {
  scenarioBriefing.value = info
}

// Scenario session ID: auto-detected from terminal, or manual override via query parameter
const scenarioSessionId = ref<string | null>(null)
const scenarioTerminalRef = ref<InstanceType<typeof TerminalSessionPanel> | null>(null)
const standaloneTerminalRef = ref<InstanceType<typeof TerminalSessionPanel> | null>(null)
const scenarioLoading = ref(false)
const scenarioLaunching = ref(false)

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
}

// Allow manual override via query parameter for testing
const queryScenarioSession = route.query.scenario_session as string | undefined
if (queryScenarioSession) {
  scenarioSessionId.value = queryScenarioSession
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

const isSessionActive = computed(() => {
  if (!sessionInfo.value) return false
  if (sessionInfo.value.status === 'expired' || sessionInfo.value.status === 'stopped') return false
  return timeRemaining.value > 0
})

async function stopSession() {
  if (!sessionInfo.value || isStopping.value) return

  isStopping.value = true
  try {
    await axios.post(`/terminals/${sessionInfo.value.session_id}/stop`)
    sessionInfo.value.status = 'stopped'
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

async function loadSession() {
  isLoading.value = true
  error.value = ''

  try {
    const terminalInfo = await terminalService.getTerminalInfo(sessionId)

    sessionInfo.value = {
      session_id: terminalInfo.terminal.session_id,
      expires_at: terminalInfo.terminal.expires_at,
      status: terminalInfo.terminal.status
    }

    // Start expiration timer only for active sessions
    const status = terminalInfo.terminal.status
    if (terminalInfo.terminal.expires_at && status !== 'expired' && status !== 'stopped') {
      startExpirationTimer(terminalInfo.terminal.expires_at)
    }

    // Auto-detect linked scenario session (unless already set via query parameter or loading)
    if (!scenarioSessionId.value && !scenarioLoading.value && status !== 'expired' && status !== 'stopped') {
      try {
        const scenarioSession = await scenarioSessionService.getSessionByTerminal(sessionId)
        if (scenarioSession) {
          scenarioSessionId.value = scenarioSession.id
        }
      } catch {
        // Silently ignore - no scenario linked is fine
      }
    }

    // Start polling for scenario if none was detected yet
    if (!scenarioSessionId.value && status !== 'expired' && status !== 'stopped') {
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
  scenarioReady.value = false
  if (loading) stopScenarioSync()
}

const scenarioReady = ref(false)
const pendingScenarioSessionId = ref<string | null>(null)

function handleScenarioStarted(newScenarioSessionId: string) {
  // Setup is done — show the "Start!" button on the loading overlay
  pendingScenarioSessionId.value = newScenarioSessionId
  scenarioReady.value = true
}

function launchScenario() {
  if (!pendingScenarioSessionId.value || scenarioLaunching.value) return

  scenarioLaunching.value = true

  // Send user switch to the standalone terminal (still mounted behind overlay)
  standaloneTerminalRef.value?.pasteText('exec bash\r')

  // Wait for bash restart + su, then switch to scenario layout
  setTimeout(() => {
    scenarioSessionId.value = pendingScenarioSessionId.value
    pendingScenarioSessionId.value = null
    stopScenarioSync()
    scenarioLoading.value = false
    scenarioReady.value = false
    scenarioLaunching.value = false
  }, 2000)
}

function handleScenarioCompleted() {
  showSuccess(t('sessionView.scenarioCompleted'), t('sessionView.scenarioCompletedTitle'))
}

function handleScenarioAbandoned() {
  scenarioSessionId.value = null
  showInfo(t('sessionView.scenarioAbandoned'), t('sessionView.scenarioAbandonedTitle'))
}

// Resizable scenario panel
const PANEL_WIDTH_KEY = 'scenario-panel-width'
const MIN_PANEL_WIDTH = 250
const MAX_PANEL_WIDTH = 600
const DEFAULT_PANEL_WIDTH = 350

const scenarioPanelWidth = ref(DEFAULT_PANEL_WIDTH)
const isPanelResizing = ref(false)

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
  stopScenarioSync()
})
</script>

<style scoped>
.terminal-session-view {
  max-width: 100%;
  margin: 0 auto;
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

.scenario-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
}

.scenario-loading-content {
  text-align: center;
  color: var(--color-text-secondary);
}

.scenario-loading-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-primary);
}

.scenario-loading-icon .fa-check-circle {
  color: var(--color-success);
}

.scenario-loading-content h3 {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
}

.scenario-loading-content .scenario-loading-detail {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.scenario-loading-content .btn {
  margin-top: var(--spacing-lg);
}

.scenario-loading-content .btn i {
  margin-right: var(--spacing-xs);
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
  /* Keep terminal visible while scenario panel scrolls */
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: calc(100vh - 60px);
  overflow: hidden;
}

/* Scenario briefing card */
.scenario-briefing {
  margin-bottom: var(--spacing-md);
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
}

.briefing-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.briefing-title i {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
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
}

.briefing-footer {
  display: flex;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
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
</style>
