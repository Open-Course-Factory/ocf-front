<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */ 
-->

<template>
  <div class="terminal-viewer">
    <!-- Barre d'état minimale -->
    <div class="terminal-header" v-if="showHeader">
      <div class="session-info">
        <span class="session-id">
          <i class="fas fa-terminal"></i>
          {{ sessionId }}
        </span>
        <div class="connection-status">
          <span v-if="isConnected" class="status-connected">
            <i class="fas fa-circle"></i> {{ t('terminalViewer.connected') }}
          </span>
          <span v-else class="status-disconnected">
            <i class="fas fa-circle"></i>
            {{ isConnecting ? t('terminalViewer.connecting') : t('terminalViewer.disconnected') }}
          </span>
        </div>
      </div>
      <div class="terminal-controls" v-if="!hideControls">
        <button
          class="btn btn-sm btn-warning"
          @click="reconnect"
          v-if="!isConnected && !isConnecting"
          :title="t('terminalViewer.reconnect')"
        >
          <i class="fas fa-sync"></i>
        </button>
      </div>
    </div>

    <!-- Terminal principal -->
    <div class="terminal-container" ref="terminalRef">
      <div v-if="!terminal && !error" class="terminal-loading">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ loadingMessage }}</p>
      </div>
      
      <div v-if="error" class="terminal-error">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <h3>{{ t('terminals.connectionError') }}</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="retry">
          <i class="fas fa-redo"></i>
          {{ t('ui.retry') }}
        </button>
      </div>
    </div>

    <!-- Footer optionnel -->
    <div class="terminal-footer" v-if="showFooter">
      <small class="text-muted">
        Terminal OCF - Session: {{ sessionId }}
      </small>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useCurrentUserStore } from '../../stores/currentUser'
import { getTerminalTheme } from '../../utils/terminalTheme'
import { terminalService } from '../../services/domain/terminal/terminalService'
import { useTranslations } from '../../composables/useTranslations'

// Translations
const { t } = useTranslations({
  en: {
    terminalViewer: {
      connected: 'Connected',
      disconnected: 'Disconnected',
      connecting: 'Connecting...',
      reconnect: 'Reconnect',
      sessionMissing: 'Session ID missing',
      terminalInitError: 'Unable to initialize terminal',
      loadingModules: 'Loading terminal modules...',
      terminalInitialized: 'Terminal initialized, connecting...',
      xtermLoadError: 'Unable to load xterm.js: {message}',
      terminalNotInitialized: 'Terminal not initialized or session missing',
      connectionError: 'Connection Error',
      authenticationFailed: 'Authentication failed. Please log in again.',
      connectionClosed: 'Connection closed ({code}): {reason}',
      connectionClosedNoReason: 'Connection closed ({code}): Unknown reason',
      websocketError: 'WebSocket connection error. Check your authentication.',
      connectionFailed: 'Unable to connect: {message}',
      sessionExpired: 'This session has expired. Please start a new terminal session.',
      sessionInfoError: 'Unable to verify session: {message}',
      retry: 'Retry'
    },
    ui: {
      retry: 'Retry'
    },
    terminals: {
      connectionError: 'Connection Error'
    }
  },
  fr: {
    terminalViewer: {
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      connecting: 'Connexion...',
      reconnect: 'Reconnecter',
      sessionMissing: 'ID de session manquant',
      terminalInitError: 'Impossible d\'initialiser le terminal',
      loadingModules: 'Chargement des modules terminal...',
      terminalInitialized: 'Terminal initialisé, connexion en cours...',
      xtermLoadError: 'Impossible de charger xterm.js: {message}',
      terminalNotInitialized: 'Terminal non initialisé ou session manquante',
      connectionError: 'Erreur de connexion',
      authenticationFailed: 'Authentification échouée. Veuillez vous reconnecter.',
      connectionClosed: 'Connexion fermée ({code}): {reason}',
      connectionClosedNoReason: 'Connexion fermée ({code}): Raison inconnue',
      websocketError: 'Erreur de connexion WebSocket. Vérifiez votre authentification.',
      connectionFailed: 'Impossible de se connecter: {message}',
      sessionExpired: 'Cette session a expiré. Veuillez démarrer une nouvelle session de terminal.',
      sessionInfoError: 'Impossible de vérifier la session: {message}',
      retry: 'Réessayer'
    },
    ui: {
      retry: 'Réessayer'
    },
    terminals: {
      connectionError: 'Erreur de connexion'
    }
  }
})

// Props
const props = defineProps({
  sessionId: {
    type: String,
    default: null
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: false
  },
  hideControls: {
    type: Boolean,
    default: false
  },
  autoConnect: {
    type: Boolean,
    default: true
  }
})

// Route pour récupérer les paramètres
const route = useRoute()
const userStore = useCurrentUserStore()

// État
const terminal = ref(null)
const terminalRef = ref(null)
const socket = ref(null)
const isConnected = ref(false)
const isConnecting = ref(false)
const error = ref('')
const loadingMessage = ref('Initialisation du terminal...')

// Modules xterm
let Terminal, FitAddon, AttachAddon
let fitAddon = null
let attachAddon = null

// ID de session (depuis props ou route)
const sessionId = ref(props.sessionId || route.params.sessionId || route.query.sessionId)

// Gestion du redimensionnement
let resizeObserver = null

onMounted(async () => {
  console.log('TerminalViewer monté, sessionId:', sessionId.value)

  if (!sessionId.value) {
    error.value = t('terminalViewer.sessionMissing')
    return
  }

  try {
    await initXterm()
    if (props.autoConnect) {
      await connectToTerminal()
    }
  } catch (err) {
    console.error('Erreur lors de l\'initialisation:', err)
    error.value = t('terminalViewer.terminalInitError')
  }
})

onBeforeUnmount(() => {
  cleanup()
})

// Initialisation de xterm.js
async function initXterm() {
  if (terminal.value) return

  loadingMessage.value = t('terminalViewer.loadingModules')

  try {
    const [xtermModule, fitModule, attachModule] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('xterm-addon-attach')
    ])

    Terminal = xtermModule.Terminal
    FitAddon = fitModule.FitAddon
    AttachAddon = attachModule.AttachAddon

    // Configuration du terminal optimisée pour iframe
    terminal.value = new Terminal({
      cursorBlink: true,
      fontFamily: '"Cascadia Code", "Fira Code", "SF Mono", Monaco, monospace',
      fontSize: 14,
      theme: getTerminalTheme(),
      scrollback: 1000,
      convertEol: true
    })

    fitAddon = new FitAddon()
    terminal.value.loadAddon(fitAddon)

    await nextTick()

    if (terminalRef.value) {
      terminal.value.open(terminalRef.value)

      // Ajustement initial
      setTimeout(() => {
        if (fitAddon && terminal.value) {
          fitAddon.fit()
        }
      }, 100)

      // Observer les changements de taille
      setupResizeObserver()
    }

    loadingMessage.value = t('terminalViewer.terminalInitialized')

  } catch (err) {
    console.error('Erreur lors du chargement xterm:', err)
    throw new Error(t('terminalViewer.xtermLoadError', { message: err.message }))
  }
}

// Configuration de l'observer de redimensionnement
function setupResizeObserver() {
  if (!window.ResizeObserver || !terminalRef.value) return
  
  resizeObserver = new ResizeObserver(() => {
    if (fitAddon && terminal.value) {
      fitAddon.fit()
    }
  })
  
  resizeObserver.observe(terminalRef.value)
}

// Connexion au terminal via WebSocket
async function connectToTerminal() {
  if (!sessionId.value || !terminal.value) {
    error.value = t('terminalViewer.terminalNotInitialized')
    return
  }

  isConnecting.value = true
  error.value = ''

  try {
    // Fetch session info to check if session is expired BEFORE attempting connection
    let sessionInfo
    try {
      sessionInfo = await terminalService.getTerminalInfo(sessionId.value)
    } catch (err) {
      console.error('Error fetching session info:', err)
      error.value = t('terminalViewer.sessionInfoError', {
        message: err.response?.data?.error_message || err.message
      })
      isConnecting.value = false
      return
    }

    // Check if session is expired
    if (sessionInfo.expires_at) {
      const expiresAt = new Date(sessionInfo.expires_at)
      const now = new Date()

      if (expiresAt <= now) {
        console.log('Session expired:', {
          expiresAt: expiresAt.toISOString(),
          now: now.toISOString()
        })
        error.value = t('terminalViewer.sessionExpired')
        isConnecting.value = false
        return
      }
    }

    // Check session status
    const validStatuses = ['running', 'active', 'starting']
    if (sessionInfo.status && !validStatuses.includes(sessionInfo.status.toLowerCase())) {
      console.log('Invalid session status:', sessionInfo.status)
      error.value = t('terminalViewer.sessionExpired')
      isConnecting.value = false
      return
    }

    // Fermer la connexion existante
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }

    // Construire l'URL WebSocket vers le backend (proxy)
    const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
    const apiUrl = import.meta.env.VITE_API_URL

    // Build WebSocket URL with token in query parameter
    // ✅ SECURE: Backend allows query param ONLY for WebSocket upgrade requests
    // This is safe because:
    // 1. Only works when Upgrade: websocket header is present
    // 2. Not logged in standard HTTP access logs
    // 3. Token consumed immediately during upgrade handshake
    // 4. Doesn't appear in browser history like regular HTTP URLs

    // Get authentication token
    const token = userStore.secretToken

    // Build URL with token query parameter (backend expects ?token=, not ?Authorization=)
    let wsUrl = `${protocol}://${apiUrl}/api/v1/terminals/${sessionId.value}/console?width=${terminal.value.cols}&height=${terminal.value.rows}`
    if (token) {
      wsUrl += `&token=${encodeURIComponent(token)}`
    } else {
      console.warn('No authentication token available for WebSocket connection')
    }

    console.log('Connexion WebSocket vers backend proxy (secure auth):', wsUrl.replace(/token=[^&]+/, 'token=***'))

    // Create WebSocket connection
    socket.value = new WebSocket(wsUrl)
    
    socket.value.onopen = () => {
      console.log('Terminal WebSocket connecté')
      isConnected.value = true
      isConnecting.value = false
      error.value = ''
      
      // Attacher le socket au terminal
      if (attachAddon) {
        terminal.value.dispose()
        attachAddon = null
      }
      
      attachAddon = new AttachAddon(socket.value)
      terminal.value.loadAddon(attachAddon)
      
      // Focus sur le terminal
      terminal.value.focus()
    }
    
    socket.value.onclose = (event) => {
      console.log('Terminal WebSocket fermé:', event.code, event.reason)
      isConnected.value = false
      isConnecting.value = false

      // Handle authentication failures specifically
      if (event.code === 1008) {
        // Policy violation (likely auth failure)
        error.value = t('terminalViewer.authenticationFailed')
      } else if (event.code !== 1000) {
        // Not a normal closure
        error.value = t('terminalViewer.connectionClosed', {
          code: event.code,
          reason: event.reason || t('terminalViewer.connectionClosedNoReason', { code: event.code })
        })
      }
    }

    socket.value.onerror = (err) => {
      console.error('Erreur WebSocket:', err)
      isConnected.value = false
      isConnecting.value = false
      error.value = t('terminalViewer.websocketError')
    }

  } catch (err) {
    console.error('Erreur lors de la connexion:', err)
    isConnecting.value = false
    error.value = t('terminalViewer.connectionFailed', { message: err.message })
  }
}

// Reconnexion
async function reconnect() {
  console.log('Reconnexion du terminal...')
  await connectToTerminal()
}

// Retry en cas d'erreur
async function retry() {
  error.value = ''
  if (!terminal.value) {
    await initXterm()
  }
  await connectToTerminal()
}

// Nettoyage
function cleanup() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  
  if (socket.value) {
    socket.value.close()
    socket.value = null
  }
  
  if (terminal.value) {
    terminal.value.dispose()
    terminal.value = null
  }
  
  fitAddon = null
  attachAddon = null
}

// Exposition des méthodes pour usage externe
defineExpose({
  connect: connectToTerminal,
  disconnect: () => {
    if (socket.value) {
      socket.value.close()
    }
  },
  reconnect,
  isConnected: () => isConnected.value,
  getSessionId: () => sessionId.value
})
</script>

<style scoped>
.terminal-viewer {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--terminal-bg);
  color: var(--terminal-fg);
  font-family: monospace;
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

.terminal-container {
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

.terminal-footer {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-top: var(--border-width-thin) solid var(--color-border-medium);
  text-align: center;
  flex-shrink: 0;
}

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

/* Responsive pour iframe */
@media (max-width: 600px) {
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

/* Assurer que le terminal prend toute la place disponible */
.terminal-viewer :deep(.xterm) {
  height: 100% !important;
}

.terminal-viewer :deep(.xterm-viewport) {
  overflow-y: auto;
}
</style>