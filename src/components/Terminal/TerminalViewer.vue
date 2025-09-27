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
            <i class="fas fa-circle"></i> Connecté
          </span>
          <span v-else class="status-disconnected">
            <i class="fas fa-circle"></i> 
            {{ isConnecting ? 'Connexion...' : 'Déconnecté' }}
          </span>
        </div>
      </div>
      <div class="terminal-controls" v-if="!hideControls">
        <button 
          class="btn btn-sm btn-warning" 
          @click="reconnect" 
          v-if="!isConnected && !isConnecting"
          :title="'Reconnecter'"
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
        <h3>Erreur de connexion</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="retry">
          <i class="fas fa-redo"></i>
          Réessayer
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
    error.value = 'ID de session manquant'
    return
  }

  try {
    await initXterm()
    if (props.autoConnect) {
      await connectToTerminal()
    }
  } catch (err) {
    console.error('Erreur lors de l\'initialisation:', err)
    error.value = 'Impossible d\'initialiser le terminal'
  }
})

onBeforeUnmount(() => {
  cleanup()
})

// Initialisation de xterm.js
async function initXterm() {
  if (terminal.value) return
  
  loadingMessage.value = 'Chargement des modules terminal...'
  
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
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78'
      },
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
    
    loadingMessage.value = 'Terminal initialisé, connexion en cours...'
    
  } catch (err) {
    console.error('Erreur lors du chargement xterm:', err)
    throw new Error(`Impossible de charger xterm.js: ${err.message}`)
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
    error.value = 'Terminal non initialisé ou session manquante'
    return
  }
  
  isConnecting.value = true
  error.value = ''
  
  try {
    // Fermer la connexion existante
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    
    // Construire l'URL WebSocket vers le backend (proxy)
    const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
    const apiUrl = import.meta.env.VITE_API_URL
    
    // Construire l'URL de base
    let wsUrl = `${protocol}://${apiUrl}/api/v1/terminal-sessions/${sessionId.value}/console?width=${terminal.value.cols}&height=${terminal.value.rows}`
    
    // Ajouter le token d'authentification en query parameter "Authorization"
    // Le backend a déjà un hack pour récupérer l'auth depuis ctx.Query("Authorization")
    const token = userStore.secretToken
    if (token) {
      wsUrl += `&Authorization=${encodeURIComponent(token)}`
    }
    
    console.log('Connexion WebSocket vers backend proxy:', wsUrl.replace(/Authorization=[^&]+/, 'Authorization=***'))
    
    // Créer le WebSocket avec le token dans l'URL
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
      
      if (event.code !== 1000) { // Pas une fermeture normale
        error.value = `Connexion fermée (${event.code}): ${event.reason || 'Raison inconnue'}`
      }
    }
    
    socket.value.onerror = (err) => {
      console.error('Erreur WebSocket:', err)
      isConnected.value = false
      isConnecting.value = false
      error.value = 'Erreur de connexion WebSocket'
    }
    
  } catch (err) {
    console.error('Erreur lors de la connexion:', err)
    isConnecting.value = false
    error.value = `Impossible de se connecter: ${err.message}`
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
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: monospace;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.session-id {
  font-size: 14px;
  font-weight: 500;
  color: #cccccc;
  display: flex;
  align-items: center;
  gap: 6px;
}

.connection-status {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-connected {
  color: #4caf50;
}

.status-disconnected {
  color: #f44336;
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
  color: #cccccc;
}

.terminal-loading p,
.terminal-error p {
  margin: 15px 0;
  font-size: 16px;
}

.terminal-error {
  color: #f44336;
}

.terminal-error h3 {
  margin: 15px 0;
  color: #f44336;
}

.terminal-footer {
  padding: 8px 12px;
  background-color: #2d2d30;
  border-top: 1px solid #3e3e42;
  text-align: center;
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-sm {
  padding: 3px 6px;
  font-size: 11px;
}

.btn-primary {
  background-color: #007acc;
  color: white;
  border-color: #007acc;
}

.btn-warning {
  background-color: #ff9800;
  color: white;
  border-color: #ff9800;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.text-muted {
  color: #888888;
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