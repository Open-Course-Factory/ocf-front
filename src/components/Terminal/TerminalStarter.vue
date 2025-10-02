<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="terminal-starter">
    <!-- Debug info en mode développement -->
    <div v-if="showDebug" class="debug-panel">
      <h4>{{ t('terminals.debugInfo') }}</h4>
      <p>showStartPanel: {{ showStartPanel }}</p>
      <p>showInfoPanel: {{ showInfoPanel }}</p>
      <p>showTerminalPanel: {{ showTerminalPanel }}</p>
      <p>showErrorPanel: {{ showErrorPanel }}</p>
      <p>isStarting: {{ isStarting }}</p>
      <p>terminal initialized: {{ !!terminal }}</p>
      <p>sessionInfo: {{ !!sessionInfo }}</p>
    </div>

    <!-- Panneau de démarrage -->
    <div class="panel panel-warning" v-show="showStartPanel">
      <div class="panel-body">
        <h4><i class="fas fa-play"></i> {{ t('terminals.startNewSession') }}</h4>
        
        <div class="form-group">
          <label for="terms">{{ t('terminals.termsRequired') }}</label>
          <textarea 
            id="terms"
            v-model="termsInput"
            class="form-control"
            rows="3"
            placeholder="J'accepte les conditions d'utilisation..."
            required
          ></textarea>
          <small class="form-text text-muted">
            Vous devez accepter les conditions d'utilisation pour démarrer une session terminal.
          </small>
        </div>
        
        <div class="form-group">
          <label for="expiry">{{ t('terminals.expirySeconds') }}</label>
          <input
            id="expiry"
            v-model.number="expiryInput"
            type="number"
            class="form-control"
            min="60"
            max="3600"
            placeholder="3600 (1 heure par défaut)"
          />
          <small class="form-text text-muted">
            Entre 60 secondes (1 min) et 3600 secondes (1h). Laissez vide pour la valeur par défaut.
          </small>
        </div>

        <div class="form-group">
          <label for="instanceType">{{ t('terminals.instanceType') }}</label>
          <select
            id="instanceType"
            v-model="selectedInstanceType"
            class="form-control"
            :disabled="loadingInstanceTypes"
          >
            <option v-if="loadingInstanceTypes" value="">{{ t('terminals.loading') }}</option>
            <option
              v-for="instance in instanceTypes"
              :key="instance.prefix"
              :value="instance.prefix"
            >
              {{ instance.name }} - {{ instance.description }}
            </option>
          </select>
          <small class="form-text text-muted">
            Sélectionnez le type d'environnement pour votre session terminal.
          </small>
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            class="btn btn-primary btn-lg" 
            @click="startNewSession" 
            :disabled="!termsInput.trim() || isStarting"
          >
            <i v-if="isStarting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-play"></i>
            {{ isStarting ? 'Démarrage...' : 'Démarrer le Terminal' }}
          </button>
          
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="resetForm" 
            :disabled="isStarting"
          >
            <i class="fas fa-undo"></i>
            Réinitialiser
          </button>
        </div>

        <div v-if="isStarting" class="progress-container">
          <div class="progress">
            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                 role="progressbar" 
                 style="width: 100%">
            </div>
          </div>
          <p class="status-text">{{ startStatus }}</p>
        </div>
      </div>
    </div>

    <!-- Panneau d'information de session -->
    <div class="panel panel-info" v-show="showInfoPanel && sessionInfo">
      <div class="panel-heading">
        <div class="session-header">
          <span>
            <i class="fas fa-terminal"></i>
            Session Terminal: {{ sessionInfo?.session_id }}
          </span>
          <div class="session-actions">
            <span class="time-remaining" v-if="timeRemaining > 0">
              <i class="fas fa-clock"></i>
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
      <div class="panel-body">
        <div class="session-details">
          <div class="detail-item" v-if="selectedInstanceInfo">
            <strong><i class="fas fa-server"></i> {{ t('terminals.instanceType') }}</strong>
            <span class="instance-info">
              {{ selectedInstanceInfo.name }} - {{ selectedInstanceInfo.description }}
              <small class="text-muted">({{ selectedInstanceInfo.prefix }})</small>
            </span>
          </div>
          <div class="detail-item">
            <strong><i class="fas fa-info-circle"></i> {{ t('terminals.status') }}</strong>
            <span :class="getStatusClass(sessionInfo?.status)">
              {{ sessionInfo?.status }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Panneau du terminal -->
    <div class="panel panel-primary" v-show="showTerminalPanel">
      <div class="panel-heading">
        <div class="terminal-header">
          <span>
            <i class="fas fa-terminal"></i>
            Console Terminal
          </span>
          <div class="terminal-controls">
            <button 
              class="btn btn-warning btn-sm" 
              @click="reconnectTerminal" 
              v-show="showReconnectButton"
            >
              <i class="fas fa-sync"></i>
              Reconnecter
            </button>
            
            <div class="connection-status">
              <span v-if="isConnected" class="status-connected">
                <i class="fas fa-circle"></i> Connecté
              </span>
              <span v-else class="status-disconnected">
                <i class="fas fa-circle"></i> Déconnecté
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="terminal-wrapper">
        <div ref="terminalRef" class="terminal-container"></div>
        <div v-if="!terminal" class="terminal-placeholder">
          <i class="fas fa-terminal fa-3x"></i>
          <p>{{ t('terminals.initializingTerminal') }}</p>
          <p v-if="terminalError" class="text-danger">{{ terminalError }}</p>
        </div>
      </div>
      
      <div class="terminal-footer">
        <div class="terminal-info">
          <small class="text-muted">
            Session: {{ sessionInfo?.session_id }} |
            Statut: {{ sessionInfo?.status }} |
            <span v-if="selectedInstanceInfo">Instance: {{ selectedInstanceInfo.name }} ({{ selectedInstanceInfo.prefix }}) | </span>
            <span v-if="isConnected" class="text-success">{{ t('terminals.websocketConnected') }}</span>
            <span v-else class="text-danger">{{ t('terminals.websocketDisconnected') }}</span>
          </small>
        </div>
      </div>
    </div>

    <!-- Panneau d'erreur -->
    <div class="panel panel-danger" v-show="showErrorPanel">
      <div class="panel-heading">
        <i class="fas fa-exclamation-triangle"></i>
        Erreur
      </div>
      <div class="panel-body">
        <div class="error-message">
          <p>{{ errorMessage }}</p>
        </div>
        <div class="error-actions">
          <button class="btn btn-warning" @click="resetToStart">
            <i class="fas fa-home"></i>
            Recommencer
          </button>
          <button class="btn btn-info" @click="showDebug = !showDebug">
            <i class="fas fa-bug"></i>
            {{ showDebug ? 'Masquer' : 'Afficher' }} Debug
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { terminalService } from '../../services/terminalService'

// Définir les émissions
const emit = defineEmits(['session-started'])

// i18n setup
const { t } = useI18n()

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
//const showDebug = ref(process.env.NODE_ENV === 'development')
const showDebug = false

// État de l'application
const isStarting = ref(false)
const isStopping = ref(false)
const isConnected = ref(false)
const startStatus = ref('Préparation...')
const errorMessage = ref('')
const terminalError = ref('')

// Informations de session
const sessionInfo = ref(null)
const timeRemaining = ref(0)
let timerInterval = null

// Formulaire
const termsInput = ref('J\'accepte les conditions d\'utilisation du service terminal.')
const expiryInput = ref(3600) // 1 heure par défaut
const selectedInstanceType = ref('')

// Instance types
const instanceTypes = ref([])
const loadingInstanceTypes = ref(false)

// Références DOM
const terminalRef = ref(null)

// Computed properties
const selectedInstanceInfo = computed(() => {
  if (!selectedInstanceType.value || !instanceTypes.value.length) {
    return null
  }
  return instanceTypes.value.find(instance => instance.prefix === selectedInstanceType.value)
})

// Helper functions
function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'active':
      return 'text-success'
    case 'stopped':
    case 'inactive':
      return 'text-danger'
    case 'starting':
    case 'pending':
      return 'text-warning'
    default:
      return 'text-muted'
  }
}

// Initialisation dynamique des modules xterm
async function initXterm() {
  if (terminal) return // Déjà initialisé
  
  try {
    console.log('Initialisation de xterm.js...')
    startStatus.value = 'Chargement des modules xterm.js...'
    
    // Import dynamique pour éviter les erreurs SSR
    const [xtermModule, fitModule, attachModule] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('xterm-addon-attach')
    ])
    
    Terminal = xtermModule.Terminal
    FitAddon = fitModule.FitAddon
    AttachAddon = attachModule.AttachAddon
    
    console.log('Modules xterm.js chargés, création du terminal...')
    
    // Créer le terminal
    terminal = new Terminal({
      cursorBlink: true,
      fontFamily: '"Cascadia Code", "Fira Code", "SF Mono", Monaco, "Inconsolata", "Roboto Mono", "Source Code Pro", Menlo, "DejaVu Sans Mono", "Lucida Console", monospace',
      fontSize: 14,
      rows: 24,
      cols: 80,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78',
        black: '#1e1e1e',
        red: '#f44747',
        green: '#6a9955',
        yellow: '#dcdcaa',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#4ec9b0',
        white: '#d4d4d4',
        brightBlack: '#6a6a6a',
        brightRed: '#f44747',
        brightGreen: '#6a9955',
        brightYellow: '#dcdcaa',
        brightBlue: '#569cd6',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff'
      }
    })
    
    fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    
    console.log('Terminal xterm.js initialisé avec succès')
    terminalError.value = ''
    return true
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de xterm.js:', error)
    terminalError.value = `Impossible de charger xterm.js: ${error.message}`
    errorMessage.value = 'Impossible de charger le terminal. Vérifiez que les dépendances xterm.js sont installées.'
    showErrorPanel.value = true
    return false
  }
}

async function loadInstanceTypes() {
  try {
    loadingInstanceTypes.value = true
    instanceTypes.value = await terminalService.getInstanceTypes()
    // Set default selection to first available instance type
    if (instanceTypes.value.length > 0) {
      selectedInstanceType.value = instanceTypes.value[0].prefix
    }
    console.log('Instance types loaded:', instanceTypes.value)
  } catch (error) {
    console.error('Failed to load instance types:', error)
    // Set a fallback if loading fails
    instanceTypes.value = [{ name: 'default', prefix: 'default', description: 'Default instance' }]
    selectedInstanceType.value = 'default'
  } finally {
    loadingInstanceTypes.value = false
  }
}

onMounted(async () => {
  console.log('TerminalStarter monté')
  // Pré-charger xterm.js
  await initXterm()
  // Charger les types d'instances
  await loadInstanceTypes()
})

onBeforeUnmount(() => {
  console.log('TerminalStarter démontage - nettoyage')
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

function resetForm() {
  termsInput.value = 'J\'accepte les conditions d\'utilisation du service terminal.'
  expiryInput.value = 3600
  // Reset to first available instance type or empty if none loaded
  if (instanceTypes.value.length > 0) {
    selectedInstanceType.value = instanceTypes.value[0].prefix
  } else {
    selectedInstanceType.value = ''
  }
  errorMessage.value = ''
  terminalError.value = ''
  showErrorPanel.value = false
}

async function startNewSession() {
  if (!termsInput.value.trim()) {
    errorMessage.value = 'Veuillez accepter les conditions d\'utilisation'
    showErrorPanel.value = true
    return
  }
  
  console.log('Démarrage d\'une nouvelle session...')
  isStarting.value = true
  startStatus.value = 'Démarrage de la session terminal...'
  
  try {
    const sessionData = {
      terms: termsInput.value.trim(),
      ...(expiryInput.value && { expiry: expiryInput.value }),
      ...(selectedInstanceType.value && { instance_type: selectedInstanceType.value })
    }
    
    console.log('Données de session:', sessionData)
    startStatus.value = 'Envoi de la requête au serveur...'
    
    const response = await axios.post('/terminal-sessions/start-session', sessionData)
    console.log('Réponse serveur:', response.data)
    
    sessionInfo.value = {
      session_id: response.data.session_id,
      console_url: response.data.console_url,
      expires_at: response.data.expires_at,
      status: response.data.status
    }
    
    startStatus.value = 'Session créée, initialisation du terminal...'
    
    // Cacher le panneau de démarrage et afficher les panneaux de session
    showStartPanel.value = false
    showInfoPanel.value = true
    showTerminalPanel.value = true
    
    // Démarrer le timer d'expiration
    if (response.data.expires_at) {
      startExpirationTimer(response.data.expires_at)
    }
    
    // Émettre l'événement pour informer le parent
    emit('session-started')
    
    // Initialiser le terminal
    await initializeTerminal()
    
  } catch (error) {
    console.error('Erreur lors du démarrage:', error)
    errorMessage.value = error.response?.data?.error_message || 
                         error.message || 
                         'Erreur lors du démarrage de la session'
    showErrorPanel.value = true
    showStartPanel.value = true
    showInfoPanel.value = false
    showTerminalPanel.value = false
  } finally {
    isStarting.value = false
    startStatus.value = ''
  }
}

async function initializeTerminal() {
  console.log('Initialisation du terminal...')
  
  if (!terminal) {
    console.log('Terminal non initialisé, tentative d\'initialisation...')
    const success = await initXterm()
    if (!success) {
      console.error('Impossible d\'initialiser xterm.js')
      return
    }
  }
  
  if (!sessionInfo.value) {
    console.error('Informations de session manquantes')
    return
  }
  
  await nextTick()
  
  if (!terminalRef.value) {
    console.error('Élément terminal DOM non trouvé')
    return
  }
  
  console.log('Ouverture du terminal dans le DOM...')
  // Ouvrir le terminal dans le DOM
  if (!terminal.element) {
    terminal.open(terminalRef.value)
    
    // Ajuster la taille après un délai
    setTimeout(() => {
      if (fitAddon && terminal) {
        console.log('Ajustement de la taille du terminal')
        fitAddon.fit()
      }
    }, 200)
  }
  
  // Établir la connexion WebSocket
  await connectWebSocket()
}

async function connectWebSocket() {
  console.log('Connexion WebSocket...')
  if (!sessionInfo.value || !sessionInfo.value.session_id) {
    console.error('Informations de session manquantes pour la connexion WebSocket')
    return
  }
  
  try {
    // Extraire l'ID de session
    const sessionId = sessionInfo.value.session_id
    
    // Construire l'URL WebSocket
    const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
    const apiUrl = import.meta.env.VITE_API_URL
    const wsUrl = `${protocol}://${apiUrl}/api/v1/terminal-sessions/${sessionId}/console?width=${terminal ? terminal.cols : 80}&height=${terminal ? terminal.rows : 24}`
    
    console.log('Connexion WebSocket:', wsUrl)
    
    socket = new WebSocket(wsUrl)
    
    socket.onopen = () => {
      console.log('WebSocket connecté avec succès')
      isConnected.value = true
      showReconnectButton.value = false
      
      // Attacher le socket au terminal
      if (terminal && AttachAddon) {
        if (attachAddon) {
          // Supprimer l'ancien addon
          console.log('Suppression de l\'ancien attachAddon')
        }
        
        attachAddon = new AttachAddon(socket)
        terminal.loadAddon(attachAddon)
        console.log('AttachAddon chargé et connecté')
      }
    }
    
    socket.onclose = (event) => {
      console.log('WebSocket fermé:', event.code, event.reason)
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
    errorMessage.value = `Impossible de se connecter au terminal: ${error.message}`
    showErrorPanel.value = true
    isConnected.value = false
    showReconnectButton.value = true
  }
}

async function stopSession() {
  if (!sessionInfo.value) return
  
  console.log('Arrêt de la session...')
  isStopping.value = true
  
  try {
    const sessionId = sessionInfo.value.session_id
    await axios.post(`/terminal-sessions/${sessionId}/stop`)
    
    console.log('Session arrêtée avec succès')
    // Reset de l'interface
    resetToStart()
    
  } catch (error) {
    console.error('Erreur lors de l\'arrêt:', error)
    errorMessage.value = error.response?.data?.error_message || 
                         error.message || 
                         'Erreur lors de l\'arrêt de la session'
    showErrorPanel.value = true
  } finally {
    isStopping.value = false
  }
}

function reconnectTerminal() {
  console.log('Reconnexion du terminal...')
  if (socket) {
    socket.close()
  }
  connectWebSocket()
}

function resetToStart() {
  console.log('Reset vers l\'état initial')
  cleanup()
  
  // Reset de l'état
  sessionInfo.value = null
  timeRemaining.value = 0
  isConnected.value = false
  errorMessage.value = ''
  terminalError.value = ''
  
  // Reset des panneaux
  showStartPanel.value = true
  showInfoPanel.value = false
  showTerminalPanel.value = false
  showErrorPanel.value = false
  showReconnectButton.value = false
  
  // Reset du formulaire
  resetForm()
}

function startExpirationTimer(expiresAt) {
  console.log('Démarrage du timer d\'expiration:', expiresAt)
  const expirationTime = new Date(expiresAt).getTime()
  
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  
  timerInterval = setInterval(() => {
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000))
    
    timeRemaining.value = remaining
    
    if (remaining <= 0) {
      console.log('Session expirée')
      clearInterval(timerInterval)
      errorMessage.value = 'Session expirée'
      showErrorPanel.value = true
      showTerminalPanel.value = false
      showInfoPanel.value = false
    }
  }, 1000)
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}
</script>

<style scoped>
.terminal-starter {
  max-width: 100%;
  margin: 0 auto;
}

.debug-panel {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  font-family: monospace;
  font-size: 12px;
}

.debug-panel h4 {
  margin-top: 0;
  color: #495057;
}

.panel {
  margin-bottom: 20px;
  background-color: #fff;
  border: 1px solid transparent;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,.1);
  overflow: hidden;
}

.panel-warning {
  border-color: #ffc107;
}

.panel-info {
  border-color: #17a2b8;
}

.panel-primary {
  border-color: #007bff;
}

.panel-danger {
  border-color: #dc3545;
}

.panel-heading {
  padding: 15px 20px;
  border-bottom: 1px solid transparent;
  border-top-left-radius: 7px;
  border-top-right-radius: 7px;
  font-weight: 600;
}

.panel-warning > .panel-heading {
  background-color: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}

.panel-info > .panel-heading {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.panel-primary > .panel-heading {
  background-color: #cce7ff;
  border-color: #b3d7ff;
  color: #004085;
}

.panel-danger > .panel-heading {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.panel-body {
  padding: 20px;
}

.session-header, .terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.session-actions, .terminal-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.time-remaining {
  font-weight: bold;
  color: #0c5460;
  display: flex;
  align-items: center;
  gap: 5px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}

.form-control {
  display: block;
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  border: 2px solid #ced4da;
  border-radius: 6px;
  box-sizing: border-box;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: 0;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-text {
  display: block;
  margin-top: 5px;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.terminal-wrapper {
  min-height: 500px;
  background-color: #1e1e1e;
  position: relative;
  border: 2px solid #333;
}

.terminal-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.terminal-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 500px;
  color: #6c757d;
}

.terminal-placeholder i {
  margin-bottom: 20px;
  opacity: 0.5;
}

.terminal-footer {
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.terminal-info {
  font-family: monospace;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.status-connected {
  color: #28a745;
}

.status-disconnected {
  color: #dc3545;
}

.progress-container {
  margin-top: 20px;
}

.progress {
  height: 20px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
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
  margin-top: 10px;
  font-style: italic;
  color: #6c757d;
}

.error-message {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}

.error-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 18px;
  border-radius: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.btn-info {
  background-color: #17a2b8;
  border-color: #17a2b8;
  color: #fff;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

.text-muted {
  color: #6c757d;
}

.text-warning {
  color: #ffc107;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #17a2b8;
}

.detail-item strong {
  min-width: 140px;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 6px;
}

.instance-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.instance-info small {
  background-color: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

/* Responsive */
@media (max-width: 768px) {
  .session-header, .terminal-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .terminal-wrapper {
    min-height: 300px;
  }
  
  .terminal-container {
    min-height: 300px;
  }
  
  .terminal-placeholder {
    height: 300px;
  }
  
  .form-actions, .error-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>