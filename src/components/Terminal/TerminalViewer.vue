<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <!-- SettingsCard wrapper mode -->
  <SettingsCard v-if="useSettingsCard" :title="title">
    <template #headerActions>
      <Button
        variant="warning"
        size="sm"
        icon="fas fa-sync"
        v-show="showReconnectButton"
        @click="reconnect"
      >
        {{ t('terminal.reconnect') }}
      </Button>

      <div class="connection-status">
        <span v-if="isConnected" class="status-connected">
          <i class="fas fa-circle"></i> {{ t('terminal.connected') }}
        </span>
        <span v-else class="status-disconnected">
          <i class="fas fa-circle"></i> {{ t('terminal.disconnected') }}
        </span>
      </div>
    </template>

    <div class="terminal-wrapper">
      <div ref="terminalRef" class="terminal-container" :class="{ 'terminal-full-height': fullHeight }"></div>
      <div v-if="!terminal" class="terminal-placeholder">
        <i class="fas fa-terminal fa-3x"></i>
        <p>{{ loadingMessage }}</p>
        <p v-if="error" class="text-danger">{{ error }}</p>
      </div>
    </div>

    <div class="terminal-footer" v-if="sessionInfo">
      <div class="terminal-info">
        <small class="text-muted">
          Session: {{ sessionInfo.session_id }} |
          {{ t('terminal.status') }}: {{ sessionInfo.status }} |
          <span v-if="isConnected" class="text-success">{{ t('terminal.websocketConnected') }}</span>
          <span v-else class="text-danger">{{ t('terminal.websocketDisconnected') }}</span>
        </small>
      </div>
    </div>
  </SettingsCard>

  <!-- Standalone mode (iframe/viewer) -->
  <div v-else class="terminal-viewer" :class="{ 'terminal-full-height': fullHeight }">
    <!-- Header -->
    <div class="terminal-header" v-if="showHeader">
      <div class="session-info">
        <span class="session-id">
          <i class="fas fa-terminal"></i>
          {{ displaySessionId }}
        </span>
        <div class="connection-status">
          <span v-if="isConnected" class="status-connected">
            <i class="fas fa-circle"></i> {{ t('terminal.connected') }}
          </span>
          <span v-else class="status-disconnected">
            <i class="fas fa-circle"></i>
            {{ isConnecting ? t('terminal.connecting') : t('terminal.disconnected') }}
          </span>
        </div>
      </div>
      <div class="terminal-controls" v-if="!hideControls">
        <button
          class="btn btn-sm btn-warning"
          @click="reconnect"
          v-if="!isConnected && !isConnecting"
          :title="t('terminal.reconnect')"
        >
          <i class="fas fa-sync"></i>
        </button>
      </div>
    </div>

    <!-- Terminal container -->
    <div class="terminal-container" ref="terminalRef">
      <div v-if="!terminal && !error" class="terminal-loading">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ loadingMessage }}</p>
      </div>

      <div v-if="error" class="terminal-error">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <h3>{{ t('terminal.connectionError') }}</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="retry">
          <i class="fas fa-redo"></i>
          {{ t('terminal.retry') }}
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="terminal-footer" v-if="showFooter">
      <small class="text-muted">
        Terminal OCF - Session: {{ displaySessionId }}
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { getTerminalTheme } from '../../utils/terminalTheme'
import { terminalService, type SharedTerminalInfo } from '../../services/domain/terminal/terminalService'
import SettingsCard from '../UI/SettingsCard.vue'
import Button from '../UI/Button.vue'

interface SessionInfo {
  session_id: string
  console_url?: string
  expires_at?: string
  status?: string
}

// Helper to convert SharedTerminalInfo to SessionInfo
function toSessionInfo(shared: SharedTerminalInfo): SessionInfo {
  return {
    session_id: shared.terminal.session_id,
    expires_at: shared.terminal.expires_at,
    status: shared.terminal.status
  }
}

interface Props {
  // Session identification - provide either sessionId or sessionInfo
  sessionId?: string | null
  sessionInfo?: SessionInfo | null
  // Display options
  showHeader?: boolean
  showFooter?: boolean
  hideControls?: boolean
  autoConnect?: boolean
  // Layout options
  useSettingsCard?: boolean
  title?: string
  fullHeight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sessionId: null,
  sessionInfo: null,
  showHeader: true,
  showFooter: false,
  hideControls: false,
  autoConnect: true,
  useSettingsCard: false,
  title: 'Console Terminal',
  fullHeight: true
})

// Translations
const { t } = useTranslations({
  en: {
    terminal: {
      reconnect: 'Reconnect',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connecting: 'Connecting...',
      status: 'Status',
      websocketConnected: 'WebSocket connected',
      websocketDisconnected: 'WebSocket disconnected',
      initializingTerminal: 'Initializing terminal...',
      loadingModules: 'Loading xterm.js modules...',
      terminalInitialized: 'Terminal initialized, connecting...',
      sessionMissing: 'Session ID missing',
      terminalNotInitialized: 'Terminal not initialized or session missing',
      connectionError: 'Connection Error',
      errorInitialization: 'Initialization Error',
      errorInitializationMessage: 'Unable to load the terminal. Please check that xterm.js dependencies are installed.',
      xtermLoadError: 'Unable to load xterm.js: {message}',
      authenticationFailed: 'Authentication failed. Please log in again.',
      connectionClosed: 'Connection closed ({code}): {reason}',
      connectionClosedNoReason: 'Connection closed ({code}): Unknown reason',
      websocketError: 'WebSocket connection error. Check your authentication.',
      connectionFailed: 'Unable to connect: {message}',
      sessionExpired: 'This session has expired. Please start a new terminal session.',
      sessionInfoError: 'Unable to verify session: {message}',
      retry: 'Retry'
    }
  },
  fr: {
    terminal: {
      reconnect: 'Reconnecter',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      connecting: 'Connexion...',
      status: 'Statut',
      websocketConnected: 'WebSocket connecté',
      websocketDisconnected: 'WebSocket déconnecté',
      initializingTerminal: 'Initialisation du terminal...',
      loadingModules: 'Chargement des modules xterm.js...',
      terminalInitialized: 'Terminal initialisé, connexion en cours...',
      sessionMissing: 'ID de session manquant',
      terminalNotInitialized: 'Terminal non initialisé ou session manquante',
      connectionError: 'Erreur de connexion',
      errorInitialization: 'Erreur d\'initialisation',
      errorInitializationMessage: 'Impossible de charger le terminal. Vérifiez que les dépendances xterm.js sont installées.',
      xtermLoadError: 'Impossible de charger xterm.js: {message}',
      authenticationFailed: 'Authentification échouée. Veuillez vous reconnecter.',
      connectionClosed: 'Connexion fermée ({code}): {reason}',
      connectionClosedNoReason: 'Connexion fermée ({code}): Raison inconnue',
      websocketError: 'Erreur de connexion WebSocket. Vérifiez votre authentification.',
      connectionFailed: 'Impossible de se connecter: {message}',
      sessionExpired: 'Cette session a expiré. Veuillez démarrer une nouvelle session de terminal.',
      sessionInfoError: 'Impossible de vérifier la session: {message}',
      retry: 'Réessayer'
    }
  }
})

const { showError: showErrorNotification } = useNotification()
const route = useRoute()
const userStore = useCurrentUserStore()

// State
const terminal = ref<any>(null)
const terminalRef = ref<HTMLElement | null>(null)
const socket = ref<WebSocket | null>(null)
const isWsOpen = ref(false)
const isConnecting = ref(false)
const showReconnectButton = ref(false)
const error = ref('')
const loadingMessage = ref(t('terminal.initializingTerminal'))
const fetchedSessionInfo = ref<SessionInfo | null>(null)

// xterm.js modules (lazy loaded)
let Terminal: any = null
let FitAddon: any = null
let AttachAddon: any = null
let fitAddon: any = null
let attachAddon: any = null

// Resize observer
let resizeObserver: ResizeObserver | null = null
let sessionExpirationCheckInterval: ReturnType<typeof setInterval> | null = null

// Computed: active session info (prefer prop, fallback to fetched)
const sessionInfo = computed(() => props.sessionInfo || fetchedSessionInfo.value)

// Computed: session ID for display and connection
const displaySessionId = computed(() => {
  const id = sessionInfo.value?.session_id || props.sessionId || route.params.sessionId || route.query.sessionId
  // Handle case where route params might be an array
  return Array.isArray(id) ? id[0] : id
})

// Computed: true connection status (WebSocket open AND session not expired)
const isConnected = computed(() => {
  if (!isWsOpen.value) return false

  // If no sessionInfo, can't verify expiration - trust WebSocket state
  if (!sessionInfo.value) return true

  // Check session status
  const validStatuses = ['running', 'active', 'starting']
  if (sessionInfo.value.status && !validStatuses.includes(sessionInfo.value.status.toLowerCase())) {
    return false
  }

  // Check expiration date if available
  if (sessionInfo.value.expires_at) {
    const expiresAt = new Date(sessionInfo.value.expires_at)
    const now = new Date()
    if (expiresAt <= now) return false
  }

  return true
})

// Initialize xterm.js modules
async function initXterm(): Promise<boolean> {
  if (terminal.value) return true

  loadingMessage.value = t('terminal.loadingModules')

  try {
    const [xtermModule, fitModule, attachModule] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('xterm-addon-attach')
    ])

    Terminal = xtermModule.Terminal
    FitAddon = fitModule.FitAddon
    AttachAddon = attachModule.AttachAddon

    // Create terminal instance
    terminal.value = new Terminal({
      cursorBlink: true,
      fontFamily: '"Cascadia Code", "Fira Code", "SF Mono", Monaco, "Inconsolata", "Roboto Mono", "Source Code Pro", Menlo, "DejaVu Sans Mono", "Lucida Console", monospace',
      fontSize: 14,
      rows: 24,
      cols: 80,
      theme: getTerminalTheme(),
      scrollback: 1000,
      convertEol: true
    })

    fitAddon = new FitAddon()
    terminal.value.loadAddon(fitAddon)

    error.value = ''
    return true
  } catch (err: any) {
    console.error('Error initializing xterm.js:', err)
    error.value = t('terminal.xtermLoadError', { message: err.message })
    if (props.useSettingsCard) {
      showErrorNotification(
        t('terminal.errorInitializationMessage'),
        t('terminal.errorInitialization')
      )
    }
    return false
  }
}

// Initialize terminal in the DOM
async function initializeTerminal() {
  // Ensure xterm is initialized
  if (!terminal.value) {
    const success = await initXterm()
    if (!success) return
  }

  // Fetch session info if not provided
  if (!props.sessionInfo && displaySessionId.value) {
    try {
      const sharedInfo = await terminalService.getTerminalInfo(displaySessionId.value)
      fetchedSessionInfo.value = toSessionInfo(sharedInfo)
    } catch (err: any) {
      console.error('Error fetching session info:', err)
      // Continue anyway - we can still try to connect
    }
  }

  if (!displaySessionId.value) {
    error.value = t('terminal.sessionMissing')
    return
  }

  await nextTick()

  if (!terminalRef.value) return

  // Close existing WebSocket if any
  if (socket.value) {
    socket.value.close()
    socket.value = null
  }

  // Open terminal in the DOM (only once)
  if (!terminal.value.element) {
    terminal.value.open(terminalRef.value)

    // Fit terminal after delay
    setTimeout(() => {
      if (fitAddon && terminal.value) {
        fitAddon.fit()
      }
    }, props.useSettingsCard ? 200 : 100)

    // Setup resize observer
    setupResizeObserver()
  }

  loadingMessage.value = t('terminal.terminalInitialized')

  // Establish WebSocket connection
  await connectToTerminal()
}

// Setup resize observer
function setupResizeObserver() {
  if (!window.ResizeObserver || !terminalRef.value) return

  resizeObserver = new ResizeObserver(() => {
    if (fitAddon && terminal.value) {
      fitAddon.fit()
    }
  })

  resizeObserver.observe(terminalRef.value)
}

// Connect to terminal via WebSocket
async function connectToTerminal() {
  if (!displaySessionId.value || !terminal.value) {
    error.value = t('terminal.terminalNotInitialized')
    return
  }

  isConnecting.value = true
  error.value = ''

  try {
    // Check if session is expired BEFORE attempting connection
    if (sessionInfo.value) {
      // Check expiration
      if (sessionInfo.value.expires_at) {
        const expiresAt = new Date(sessionInfo.value.expires_at)
        const now = new Date()

        if (expiresAt <= now) {
          error.value = t('terminal.sessionExpired')
          isConnecting.value = false
          return
        }
      }

      // Check status
      const validStatuses = ['running', 'active', 'starting']
      if (sessionInfo.value.status && !validStatuses.includes(sessionInfo.value.status.toLowerCase())) {
        error.value = t('terminal.sessionExpired')
        isConnecting.value = false
        return
      }
    }

    // Close existing connection
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }

    // Build WebSocket URL
    const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
    const apiUrl = import.meta.env.VITE_API_URL
    const token = userStore.secretToken

    let wsUrl = `${protocol}://${apiUrl}/api/v1/terminals/${displaySessionId.value}/console?width=${terminal.value.cols}&height=${terminal.value.rows}`
    if (token) {
      wsUrl += `&token=${encodeURIComponent(token)}`
    } else {
      console.warn('No authentication token available for WebSocket connection')
    }

    console.log('Connexion WebSocket (secure auth):', wsUrl.replace(/token=[^&]+/, 'token=***'))

    // Create WebSocket connection
    socket.value = new WebSocket(wsUrl)

    socket.value.onopen = () => {
      console.log('Terminal WebSocket opened')
      isWsOpen.value = true
      isConnecting.value = false
      showReconnectButton.value = false
      error.value = ''

      // Attach socket to terminal
      if (attachAddon) {
        attachAddon.dispose()
        attachAddon = null
      }

      attachAddon = new AttachAddon(socket.value!)
      terminal.value.loadAddon(attachAddon)

      // Focus terminal
      terminal.value.focus()
    }

    socket.value.onclose = (event) => {
      console.log('Terminal WebSocket closed:', event.code, event.reason)
      isWsOpen.value = false
      isConnecting.value = false
      showReconnectButton.value = true

      // Handle authentication failures
      if (event.code === 1008) {
        error.value = t('terminal.authenticationFailed')
        if (props.useSettingsCard) {
          showErrorNotification(
            t('terminal.authenticationFailed'),
            t('terminal.connectionError')
          )
        }
      } else if (event.code !== 1000) {
        // Not a normal closure
        error.value = event.reason
          ? t('terminal.connectionClosed', { code: event.code, reason: event.reason })
          : t('terminal.connectionClosedNoReason', { code: event.code })
      }
    }

    socket.value.onerror = (err) => {
      console.error('WebSocket error:', err)
      isWsOpen.value = false
      isConnecting.value = false
      showReconnectButton.value = true
      error.value = t('terminal.websocketError')
    }

  } catch (err: any) {
    console.error('Error connecting:', err)
    isConnecting.value = false
    error.value = t('terminal.connectionFailed', { message: err.message })
    if (props.useSettingsCard) {
      showErrorNotification(
        t('terminal.connectionFailed', { message: err.message }),
        t('terminal.connectionError')
      )
    }
  }
}

// Reconnect terminal
async function reconnect() {
  console.log('Reconnecting terminal...')
  if (socket.value) {
    socket.value.close()
  }
  await connectToTerminal()
}

// Retry on error
async function retry() {
  error.value = ''
  if (!terminal.value) {
    await initXterm()
  }
  await connectToTerminal()
}

// Cleanup
function cleanup() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  if (sessionExpirationCheckInterval) {
    clearInterval(sessionExpirationCheckInterval)
    sessionExpirationCheckInterval = null
  }

  if (socket.value) {
    socket.value.close()
    socket.value = null
  }

  if (terminal.value) {
    try {
      terminal.value.dispose()
    } catch (err) {
      console.error('Error disposing terminal:', err)
    }
    terminal.value = null
  }

  fitAddon = null
  attachAddon = null
}

// Watch for sessionInfo changes
watch(() => props.sessionInfo, async (newSessionInfo, oldSessionInfo) => {
  if (newSessionInfo && newSessionInfo.session_id !== oldSessionInfo?.session_id) {
    await initializeTerminal()
  }
}, { immediate: false })

onMounted(async () => {
  console.log('TerminalViewer mounted, sessionId:', displaySessionId.value)

  if (!displaySessionId.value) {
    error.value = t('terminal.sessionMissing')
    return
  }

  try {
    await initXterm()
    if (props.autoConnect) {
      await initializeTerminal()
    }
  } catch (err) {
    console.error('Error during initialization:', err)
    error.value = t('terminal.errorInitializationMessage')
  }

  // Check session expiration every 5 seconds
  sessionExpirationCheckInterval = setInterval(() => {
    if (sessionInfo.value?.expires_at && isWsOpen.value) {
      const expiresAt = new Date(sessionInfo.value.expires_at)
      const now = new Date()

      if (expiresAt <= now) {
        showReconnectButton.value = true
        if (socket.value) {
          socket.value.close()
        }
      }
    }
  }, 5000)
})

onBeforeUnmount(() => {
  cleanup()
})

// Expose methods for parent component
defineExpose({
  connect: connectToTerminal,
  disconnect: cleanup,
  reconnect,
  isConnected: () => isConnected.value,
  getSessionId: () => displaySessionId.value
})
</script>

<style scoped>
/* ========================================
   Standalone Viewer Mode Styles
   ======================================== */
.terminal-viewer {
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--terminal-bg);
  color: var(--terminal-fg);
  font-family: monospace;
}

.terminal-viewer.terminal-full-height {
  height: 100vh;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-medium);
  flex-shrink: 0;
}

.session-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.session-id {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.connection-status {
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-connected {
  color: var(--color-success);
}

.status-disconnected {
  color: var(--color-danger);
}

.terminal-controls {
  display: flex;
  gap: 5px;
}

.terminal-viewer .terminal-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.terminal-loading,
.terminal-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--color-text-secondary);
}

.terminal-loading p,
.terminal-error p {
  margin: var(--spacing-md) 0;
  font-size: var(--font-size-md);
}

.terminal-error {
  color: var(--color-danger);
}

.terminal-error h3 {
  margin: var(--spacing-md) 0;
  color: var(--color-danger);
}

.terminal-viewer .terminal-footer {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-top: var(--border-width-thin) solid var(--color-border-medium);
  text-align: center;
  flex-shrink: 0;
}

/* ========================================
   SettingsCard Mode Styles
   ======================================== */
.terminal-wrapper {
  min-height: 500px;
  background-color: #1e1e1e;
  position: relative;
  border: var(--border-width-medium) solid #333;
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.terminal-wrapper .terminal-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.terminal-wrapper .terminal-container.terminal-full-height {
  height: 100vh;
}

.terminal-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 500px;
  color: var(--color-text-muted);
}

.terminal-placeholder i {
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.terminal-footer {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-top: var(--border-width-thin) solid var(--color-border-medium);
  margin-top: var(--spacing-md);
  border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
}

.terminal-info {
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-sm);
}

/* ========================================
   Shared Styles
   ======================================== */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  border: var(--border-width-thin) solid transparent;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.btn-sm {
  padding: 3px 6px;
  font-size: 11px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.btn-warning {
  background-color: var(--color-warning);
  color: var(--color-white);
  border-color: var(--color-warning);
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.text-muted {
  color: var(--color-text-muted);
}

.text-success {
  color: var(--color-success);
}

.text-danger {
  color: var(--color-danger);
}

/* ========================================
   Responsive
   ======================================== */
@media (max-width: 768px) {
  .terminal-wrapper {
    min-height: 300px;
  }

  .terminal-wrapper .terminal-container {
    min-height: 300px;
  }

  .terminal-placeholder {
    height: 300px;
  }

  .terminal-header {
    padding: 6px 8px;
  }

  .session-info {
    gap: 10px;
  }

  .session-id {
    font-size: 12px;
  }

  .connection-status {
    font-size: 11px;
  }
}

/* ========================================
   XTerm Integration
   ======================================== */
.terminal-viewer :deep(.xterm),
.terminal-wrapper :deep(.xterm) {
  height: 100% !important;
}

.terminal-viewer :deep(.xterm-viewport),
.terminal-wrapper :deep(.xterm-viewport) {
  overflow-y: auto;
}
</style>
