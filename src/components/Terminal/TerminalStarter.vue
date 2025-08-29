<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
 */
-->

<template>
  <div class="terminal-starter">
    <!-- Panneau de démarrage -->
    <div class="panel panel-warning" v-show="showStartPanel">
      <div class="panel-body">
        <h4>Démarrer une nouvelle session terminal</h4>
        
        <div class="form-group">
          <label for="terms">Conditions d'utilisation (obligatoire):</label>
          <textarea 
            id="terms"
            v-model="termsInput"
            class="form-control"
            rows="3"
            placeholder="J'accepte les conditions d'utilisation..."
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="expiry">Durée d'expiration (secondes, optionnel):</label>
          <input 
            id="expiry"
            v-model.number="expiryInput"
            type="number"
            class="form-control"
            min="60"
            max="3600"
            placeholder="3600 (1 heure par défaut)"
          />
        </div>

        <button 
          type="button" 
          class="btn btn-primary btn-lg" 
          @click="startNewSession" 
          :disabled="!termsInput.trim() || isStarting"
        >
          <i v-if="isStarting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-play"></i>
          Démarrer le Terminal
        </button>

        <div v-if="isStarting" class="progress-container">
          <div class="spinner-container">
            <div class="spinner"></div>
          </div>
          <p>{{ startStatus }}</p>
        </div>
      </div>
    </div>

    <!-- Panneau d'information de session -->
    <div class="panel panel-info" v-show="showInfoPanel && sessionInfo">
      <div class="panel-heading">
        <div class="session-header">
          <span>Session Terminal</span>
          <div class="session-actions">
            <span class="time-remaining" v-if="timeRemaining > 0">
              Temps restant: {{ formatTime(timeRemaining) }}
            </span>
            <button 
              type="button" 
              class="btn btn-danger btn-sm" 
              @click="stopSession"
              :disabled="isStopping"
            >
              <i v-if="isStopping" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-stop"></i>
              Arrêter
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Panneau du terminal -->
    <div class="panel panel-primary" v-show="showTerminalPanel">
      <div class="terminal-wrapper">
        <div ref="terminalRef" class="terminal-container"></div>
      </div>
      
      <div class="terminal-footer" v-if="showTerminalPanel">
        <button 
          class="btn btn-warning btn-sm" 
          @click="reconnectTerminal" 
          v-show="showReconnectButton"
        >
          <i class="fas fa-sync"></i>
          Reconnecter
        </button>
        
        <div class="connection-status">
          <span v-if="isConnected" class="text-success">
            <i class="fas fa-circle"></i> Connecté
          </span>
          <span v-else class="text-danger">
            <i class="fas fa-circle"></i> Déconnecté
          </span>
        </div>
      </div>
    </div>

    <!-- Panneau d'erreur -->
    <div class="panel panel-danger" v-show="showErrorPanel">
      <div class="panel-heading">Erreur</div>
      <div class="panel-body">
        <p>{{ errorMessage }}</p>
        <button class="btn btn-default" @click="resetToStart">
          <i class="fas fa-home"></i>
          Recommencer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import axios from 'axios'

// Importation différée de xterm.js pour éviter les erreurs SSR
let Terminal, FitAddon, AttachAddon
let terminal = null
let fitAddon = null
let attachAddon = null
let socket = null

// État des panneaux
const showStartPanel = ref(true)
const showInfoPanel = ref(false)
const showTerminalPanel = ref(false)
const showErrorPanel = ref(false)
const showReconnectButton = ref(false)

// État de l'application
const isStarting = ref(false)
const isStopping = ref(false)
const isConnected = ref(false)
const startStatus = ref('Préparation...')
const errorMessage = ref('')

// Informations de session
const sessionInfo = ref(null)
const timeRemaining = ref(0)
let timerInterval = null

// Formulaire
const termsInput = ref('J\'accepte les conditions d\'utilisation du service terminal.')
const expiryInput = ref(3600) // 1 heure par défaut

// Références DOM
const terminalRef = ref(null)

// Initialisation dynamique des modules xterm
async function initXterm() {
  if (terminal) return // Déjà initialisé
  
  try {
    // Import dynamique pour éviter les erreurs SSR
    const xtermModule = await import('@xterm/xterm')
    const fitModule = await import('@xterm/addon-fit')
    const attachModule = await import('xterm-addon-attach')
    
    Terminal = xtermModule.Terminal
    FitAddon = fitModule.FitAddon
    AttachAddon = attachModule.AttachAddon
    
    // Créer le terminal
    terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'monospace',
      fontSize: 14,
      rows: 24,
      cols: 80,
      theme: {
        background: '#000000',
        foreground: '#ffffff'
      }
    })
    
    fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    
    console.log('Terminal xterm.js initialisé')
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de xterm.js:', error)
    errorMessage.value = 'Impossible de charger le terminal. Vérifiez que xterm.js est installé.'
    showErrorPanel.value = true
  }
}

onMounted(async () => {
  await initXterm()
})

onBeforeUnmount(() => {
  cleanup()
})

function cleanup() {
  if (socket) {
    socket.close()
    socket = null
  }
  
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  
  if (terminal) {
    terminal.dispose()
    terminal = null
  }
  
  fitAddon = null
  attachAddon = null
}

async function startNewSession() {
  if (!termsInput.value.trim()) {
    errorMessage.value = 'Veuillez accepter les conditions d\'utilisation'
    showErrorPanel.value = true
    return
  }
  
  isStarting.value = true
  startStatus.value = 'Démarrage de la session terminal...'
  
  try {
    const sessionData = {
      terms: termsInput.value.trim(),
      ...(expiryInput.value && { expiry: expiryInput.value })
    }
    
    const response = await axios.post('/terminals/start-session', sessionData)
    
    sessionInfo.value = {
      session_id: response.data.session_id,
      console_url: response.data.console_url,
      expires_at: response.data.expires_at,
      status: response.data.status
    }
    
    // Cacher le panneau de démarrage et afficher les panneaux de session
    showStartPanel.value = false
    showInfoPanel.value = true
    showTerminalPanel.value = true
    
    // Démarrer le timer d'expiration
    if (response.data.expires_at) {
      startExpirationTimer(response.data.expires_at)
    }
    
    // Initialiser le terminal
    await initializeTerminal()
    
  } catch (error) {
    console.error('Erreur lors du démarrage:', error)
    errorMessage.value = error.response?.data?.error_message || 'Erreur lors du démarrage de la session'
    showErrorPanel.value = true
  } finally {
    isStarting.value = false
  }
}

async function initializeTerminal() {
  if (!terminal || !sessionInfo.value) return
  
  await nextTick()
  
  if (!terminalRef.value) {
    console.error('Élément terminal DOM non trouvé')
    return
  }
  
  // Ouvrir le terminal dans le DOM
  if (!terminal.element) {
    terminal.open(terminalRef.value)
    
    setTimeout(() => {
      if (fitAddon) {
        fitAddon.fit()
      }
    }, 100)
  }
  
  // Établir la connexion WebSocket
  await connectWebSocket()
}

async function connectWebSocket() {
  console.log('connectWebSocket')
  if (!sessionInfo.value || !sessionInfo.value.session_id) {
    console.error('Informations de session manquantes pour la connexion WebSocket')
    return
  }
  
  try {
    // Extraire l'ID de session depuis l'URL de console ou utiliser d'autres moyens
    const sessionId = sessionInfo.value.session_id
    
    // Construire l'URL WebSocket
    const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
    const apiUrl = import.meta.env.VITE_API_URL
    const wsUrl = `${protocol}://${apiUrl}/api/v1/terminals/${sessionId}/console?width=${terminal ? terminal.cols : 80}&height=${terminal ? terminal.rows : 24}`
    
    console.log('Connexion WebSocket:', wsUrl)
    
    socket = new WebSocket(wsUrl)
    
    socket.onopen = () => {
      console.log('WebSocket connecté')
      isConnected.value = true
      showReconnectButton.value = false
      
      if (attachAddon) {
        terminal.loadAddon(attachAddon)
      }
      
      attachAddon = new AttachAddon(socket)
      terminal.loadAddon(attachAddon)
    }
    
    socket.onclose = (event) => {
      console.log('WebSocket fermé:', event)
      isConnected.value = false
      showReconnectButton.value = true
    }
    
    socket.onerror = (error) => {
      console.error('Erreur WebSocket:', error)
      isConnected.value = false
      showReconnectButton.value = true
    }
    
  } catch (error) {
    console.error('Erreur lors de la connexion WebSocket:', error)
    errorMessage.value = 'Impossible de se connecter au terminal'
    showErrorPanel.value = true
  }
}

async function stopSession() {
  if (!sessionInfo.value) return
  
  isStopping.value = true
  
  try {
    // Extraire l'ID depuis les données de session
    const sessionId = sessionInfo.value.session_id
    await axios.post(`/terminals/${sessionId}/stop`)
    
    // Reset de l'interface
    resetToStart()
    
  } catch (error) {
    console.error('Erreur lors de l\'arrêt:', error)
    errorMessage.value = error.response?.data?.error_message || 'Erreur lors de l\'arrêt de la session'
    showErrorPanel.value = true
  } finally {
    isStopping.value = false
  }
}

function reconnectTerminal() {
  if (socket) {
    socket.close()
  }
  connectWebSocket()
}

function resetToStart() {
  cleanup()
  
  // Reset de l'état
  sessionInfo.value = null
  timeRemaining.value = 0
  isConnected.value = false
  
  // Reset des panneaux
  showStartPanel.value = true
  showInfoPanel.value = false
  showTerminalPanel.value = false
  showErrorPanel.value = false
  showReconnectButton.value = false
}

function startExpirationTimer(expiresAt) {
  const expirationTime = new Date(expiresAt).getTime()
  
  timerInterval = setInterval(() => {
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000))
    
    timeRemaining.value = remaining
    
    if (remaining <= 0) {
      clearInterval(timerInterval)
      errorMessage.value = 'Session expirée'
      showErrorPanel.value = true
      showTerminalPanel.value = false
      showInfoPanel.value = false
    }
  }, 1000)
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.terminal-starter {
  max-width: 100%;
  margin: 0 auto;
}

.panel {
  margin-bottom: 20px;
  background-color: #fff;
  border: 1px solid transparent;
  border-radius: 4px;
  box-shadow: 0 1px 1px rgba(0,0,0,.05);
}

.panel-warning {
  border-color: #faebcc;
}

.panel-info {
  border-color: #bce8f1;
}

.panel-primary {
  border-color: #bce8f1;
}

.panel-danger {
  border-color: #ebccd1;
}

.panel-heading {
  padding: 10px 15px;
  border-bottom: 1px solid transparent;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  background-color: #f5f5f5;
}

.panel-warning > .panel-heading {
  background-color: #fcf8e3;
  border-color: #faebcc;
  color: #8a6d3b;
}

.panel-info > .panel-heading {
  background-color: #d9edf7;
  border-color: #bce8f1;
  color: #31708f;
}

.panel-danger > .panel-heading {
  background-color: #f2dede;
  border-color: #ebccd1;
  color: #a94442;
}

.panel-body {
  padding: 15px;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.session-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.time-remaining {
  font-weight: bold;
  color: #31708f;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-control {
  display: block;
  width: 100%;
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.42857143;
  color: #555;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.terminal-wrapper {
  min-height: 400px;
  background-color: #000;
  position: relative;
}

.terminal-container {
  width: 100%;
  height: 100%;
}

.terminal-footer {
  padding: 10px;
  background-color: #f5f5f5;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.connection-status {
  font-size: 0.9rem;
}

.progress-container {
  margin-top: 20px;
  text-align: center;
}

.spinner-container {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn {
  display: inline-block;
  padding: 6px 12px;
  margin-bottom: 0;
  font-size: 14px;
  font-weight: normal;
  line-height: 1.42857143;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
  background-color: #fff;
  border-color: #ccc;
}

.btn:hover:not(:disabled) {
  background-color: #e6e6e6;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-lg {
  padding: 10px 16px;
  font-size: 18px;
  border-radius: 6px;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
  border-radius: 3px;
}

.btn-primary {
  background-color: #337ab7;
  border-color: #2e6da4;
  color: #fff;
}

.btn-danger {
  background-color: #d9534f;
  border-color: #d43f3a;
  color: #fff;
}

.btn-warning {
  background-color: #f0ad4e;
  border-color: #eea236;
  color: #fff;
}

.text-success {
  color: #3c763d;
}

.text-danger {
  color: #a94442;
}

/* Responsive */
@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .terminal-wrapper {
    min-height: 300px;
  }
  
  .terminal-footer {
    flex-direction: column;
    gap: 10px;
  }
}
</style>