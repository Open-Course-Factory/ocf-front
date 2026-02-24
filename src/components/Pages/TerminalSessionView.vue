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

      <!-- Terminal + Command History (active session) -->
      <TerminalSessionPanel
        v-if="isSessionActive"
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
import { terminalService } from '../../services/domain/terminal'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import TerminalSessionPanel from '../Terminal/TerminalSessionPanel.vue'
import CommandHistory from '../Terminal/CommandHistory.vue'

const route = useRoute()
const { showWarning, showError: showErrorNotification, showInfo } = useNotification()

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
      warningTitle: 'Session Expiry'
    }
  },
  fr: {
    sessionView: {
      loading: 'Chargement de la session...',
      backToSessions: 'Retour aux sessions',
      errorLoading: 'Impossible de charger les informations de la session.',
      errorNotFound: 'Session introuvable.',
      sessionExpired: 'Votre session terminal a expire.',
      sessionExpiredTitle: 'Session expiree',
      sessionEnded: 'Cette session est terminee. Vous pouvez consulter l\'historique des commandes ci-dessous.',
      stopError: 'Impossible d\'arrêter la session.',
      warningInfo: 'Votre session expire dans 10 minutes.',
      warningWarning: 'Session bientot terminee. Sauvegardez votre travail.',
      warningDanger: 'La session expire dans moins d\'une minute !',
      sessionExpiredNotice: 'Session expiree',
      warningTitle: 'Expiration de session'
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

// Get session ID from route
const sessionId = route.params.sessionId as string

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

onMounted(() => {
  loadSession()
})

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
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
</style>
