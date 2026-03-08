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

      <!-- Scenario start bar (when no scenario active) -->
      <ScenarioStartBar
        v-if="isSessionActive && !scenarioSessionId"
        :terminal-session-id="sessionId"
        @scenario-started="handleScenarioStarted"
      />

      <!-- Scenario briefing card (full width, dismissible) -->
      <div v-if="scenarioBriefing && scenarioBriefingText" class="scenario-briefing" :class="{ collapsed: !showBriefing }">
        <div class="briefing-header">
          <div class="briefing-title">
            <i class="fas fa-book-open"></i>
            <span>{{ t('sessionView.scenarioBriefing') }}</span>
          </div>
          <button class="briefing-toggle" @click="showBriefing = !showBriefing" :aria-expanded="showBriefing">
            <i :class="showBriefing ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </button>
        </div>
        <div v-if="showBriefing" class="briefing-content markdown-content" v-html="renderedBriefingText" @click="handleBriefingExecClick"></div>
      </div>

      <!-- Terminal + Scenario Panel layout (active session with scenario) -->
      <div v-if="isSessionActive && scenarioSessionId" class="terminal-session-layout">
        <div class="terminal-main-area">
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
        <ScenarioPanel
          :scenario-session-id="scenarioSessionId"
          :is-active="isSessionActive"
          @session-completed="handleScenarioCompleted"
          @session-abandoned="handleScenarioAbandoned"
          @paste-command="handlePasteCommand"
          @scenario-info-loaded="handleScenarioInfoLoaded"
        />
      </div>

      <!-- Terminal only (active session without scenario) -->
      <TerminalSessionPanel
        v-else-if="isSessionActive"
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
      scenarioBriefing: 'Scenario Briefing'
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
      scenarioBriefing: 'Briefing du scénario'
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

// Get session ID from route
const sessionId = route.params.sessionId as string

// Scenario briefing (full-width card above the terminal layout)
const scenarioBriefing = ref<ScenarioInfo | null>(null)
const showBriefing = ref(true)

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
    if (scenarioSessionId.value || !isSessionActive.value) {
      stopScenarioSync()
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

    // Auto-detect linked scenario session (unless already set via query parameter)
    if (!scenarioSessionId.value && status !== 'expired' && status !== 'stopped') {
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

function handleScenarioStarted(newScenarioSessionId: string) {
  scenarioSessionId.value = newScenarioSessionId
  stopScenarioSync()
}

function handleScenarioCompleted() {
  showSuccess(t('sessionView.scenarioCompleted'), t('sessionView.scenarioCompletedTitle'))
}

function handleScenarioAbandoned() {
  scenarioSessionId.value = null
  showInfo(t('sessionView.scenarioAbandoned'), t('sessionView.scenarioAbandonedTitle'))
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

.command-history-panel {
  margin-top: var(--spacing-md);
}

.terminal-session-layout {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-md);
  flex: 1;
  min-height: 0;
}

.terminal-main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
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
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast);
}

.briefing-toggle:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.briefing-content {
  padding: 0 var(--spacing-md) var(--spacing-md);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
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
