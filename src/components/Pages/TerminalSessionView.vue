<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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

      <!-- Session Info Panel -->
      <TerminalSessionInfo
        :session-info="sessionInfo"
        :instance-info="instanceInfo"
        :time-remaining="timeRemaining"
        :is-stopping="isStopping"
        @stop="stopSession"
      />

      <!-- Terminal Console Panel -->
      <TerminalViewer
        :session-info="sessionInfo"
        use-settings-card
        title="Console Terminal"
        :full-height="false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { terminalService } from '../../services/domain/terminal'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import TerminalSessionInfo from '../Terminal/TerminalSessionInfo.vue'
import TerminalViewer from '../Terminal/TerminalViewer.vue'
import type { InstanceType } from '../../types'

const route = useRoute()
const router = useRouter()
const { showWarning } = useNotification()

const { t } = useTranslations({
  en: {
    sessionView: {
      loading: 'Loading session...',
      backToSessions: 'Back to My Sessions',
      errorLoading: 'Unable to load session information.',
      errorNotFound: 'Session not found.',
      errorStopping: 'Error stopping the session.',
      sessionExpired: 'Your terminal session has expired.',
      sessionExpiredTitle: 'Session Expired',
      sessionStopped: 'Session stopped successfully.'
    }
  },
  fr: {
    sessionView: {
      loading: 'Chargement de la session...',
      backToSessions: 'Retour aux sessions',
      errorLoading: 'Impossible de charger les informations de la session.',
      errorNotFound: 'Session introuvable.',
      errorStopping: 'Erreur lors de l\'arret de la session.',
      sessionExpired: 'Votre session terminal a expire.',
      sessionExpiredTitle: 'Session expiree',
      sessionStopped: 'Session arretee avec succes.'
    }
  }
})

// State
const isLoading = ref(true)
const error = ref('')
const isStopping = ref(false)
const sessionInfo = ref<any>(null)
const instanceInfo = ref<InstanceType | null>(null)
const timeRemaining = ref(0)
let timerInterval: NodeJS.Timeout | null = null

// Get session ID from route
const sessionId = route.params.sessionId as string

async function loadSession() {
  isLoading.value = true
  error.value = ''

  try {
    // Fetch session info and instance types in parallel
    const [terminalInfo, instanceTypes] = await Promise.all([
      terminalService.getTerminalInfo(sessionId),
      terminalService.getInstanceTypes()
    ])

    sessionInfo.value = {
      session_id: terminalInfo.terminal.session_id,
      expires_at: terminalInfo.terminal.expires_at,
      status: terminalInfo.terminal.status
    }

    // Resolve instance info
    if (terminalInfo.terminal.instance_type && instanceTypes.length) {
      instanceInfo.value = instanceTypes.find(
        (it: InstanceType) => it.prefix === terminalInfo.terminal.instance_type
      ) || null
    }

    // Start expiration timer
    if (terminalInfo.terminal.expires_at) {
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

  timerInterval = setInterval(() => {
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000))

    timeRemaining.value = remaining

    if (remaining <= 0) {
      clearInterval(timerInterval!)
      timerInterval = null
      showWarning(t('sessionView.sessionExpired'), t('sessionView.sessionExpiredTitle'))
    }
  }, 1000)
}

async function stopSession() {
  if (!sessionInfo.value) return

  isStopping.value = true

  try {
    await axios.post(`/terminals/${sessionId}/stop`)
    router.push({ name: 'TerminalSessions' })
  } catch (err: any) {
    console.error('Error stopping session:', err)
    error.value = err.response?.data?.error_message ||
                  err.response?.data?.message ||
                  t('sessionView.errorStopping')
  } finally {
    isStopping.value = false
  }
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
</style>
