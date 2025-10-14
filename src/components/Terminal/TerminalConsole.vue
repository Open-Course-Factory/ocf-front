<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <SettingsCard title="Console Terminal">
    <template #headerActions>
      <Button
        variant="warning"
        size="sm"
        icon="fas fa-sync"
        v-show="showReconnectButton"
        @click="reconnect"
      >
        {{ t('terminalStarter.reconnect') }}
      </Button>

      <div class="connection-status">
        <span v-if="isConnected" class="status-connected">
          <i class="fas fa-circle"></i> {{ t('terminalStarter.connected') }}
        </span>
        <span v-else class="status-disconnected">
          <i class="fas fa-circle"></i> {{ t('terminalStarter.disconnected') }}
        </span>
      </div>
    </template>

    <div class="terminal-wrapper">
      <div ref="terminalRef" class="terminal-container"></div>
      <div v-if="!terminal" class="terminal-placeholder">
        <i class="fas fa-terminal fa-3x"></i>
        <p>{{ t('terminalStarter.initializingTerminal') }}</p>
        <p v-if="error" class="text-danger">{{ error }}</p>
      </div>
    </div>

    <div class="terminal-footer">
      <div class="terminal-info">
        <small class="text-muted">
          Session: {{ sessionInfo?.session_id }} |
          Statut: {{ sessionInfo?.status }} |
          <span v-if="isConnected" class="text-success">{{ t('terminalStarter.websocketConnected') }}</span>
          <span v-else class="text-danger">{{ t('terminalStarter.websocketDisconnected') }}</span>
        </small>
      </div>
    </div>
  </SettingsCard>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import SettingsCard from '../UI/SettingsCard.vue'
import Button from '../UI/Button.vue'

interface SessionInfo {
  session_id: string
  console_url?: string
  expires_at?: string
  status?: string
}

interface Props {
  sessionInfo: SessionInfo | null
}

const props = defineProps<Props>()

const { t } = useTranslations({
  en: {
    terminalStarter: {
      reconnect: 'Reconnect',
      connected: 'Connected',
      disconnected: 'Disconnected',
      initializingTerminal: 'Initializing terminal...',
      websocketConnected: 'WebSocket connected',
      websocketDisconnected: 'WebSocket disconnected',
      loadingModules: 'Loading xterm.js modules...',
      errorInitialization: 'Initialization Error',
      errorInitializationMessage: 'Unable to load the terminal. Please check that xterm.js dependencies are installed.',
      errorWebsocket: 'Connection Error',
      errorWebsocketMessage: 'Unable to connect to the terminal: {message}'
    }
  },
  fr: {
    terminalStarter: {
      reconnect: 'Reconnecter',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      initializingTerminal: 'Initialisation du terminal...',
      websocketConnected: 'WebSocket connecté',
      websocketDisconnected: 'WebSocket déconnecté',
      loadingModules: 'Chargement des modules xterm.js...',
      errorInitialization: 'Erreur d\'initialisation',
      errorInitializationMessage: 'Impossible de charger le terminal. Vérifiez que les dépendances xterm.js sont installées.',
      errorWebsocket: 'Erreur de connexion',
      errorWebsocketMessage: 'Impossible de se connecter au terminal: {message}'
    }
  }
})

const { showError: showErrorNotification } = useNotification()

// xterm.js modules (lazy loaded)
let Terminal: any = null
let FitAddon: any = null
let AttachAddon: any = null

// Terminal instances
const terminal = ref<any>(null)
let fitAddon: any = null
let attachAddon: any = null
let socket: WebSocket | null = null

// Component state
const terminalRef = ref<HTMLElement | null>(null)
const isConnected = ref(false)
const showReconnectButton = ref(false)
const error = ref('')

// Initialize xterm.js modules
async function initXterm(): Promise<boolean> {
  if (terminal.value) return true // Already initialized

  try {
    // Dynamic import to avoid SSR errors
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
    terminal.value.loadAddon(fitAddon)

    error.value = ''
    return true
  } catch (err: any) {
    console.error('Error initializing xterm.js:', err)
    error.value = `${t('terminalStarter.errorInitializationMessage')}: ${err.message}`
    showErrorNotification(
      t('terminalStarter.errorInitializationMessage'),
      t('terminalStarter.errorInitialization')
    )
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

  if (!props.sessionInfo) return

  await nextTick()

  if (!terminalRef.value) return

  // Close existing WebSocket if any
  if (socket) {
    socket.close()
    socket = null
  }

  // Open terminal in the DOM (only once)
  if (!terminal.value.element) {
    terminal.value.open(terminalRef.value)

    // Fit terminal after delay
    setTimeout(() => {
      if (fitAddon && terminal.value) {
        fitAddon.fit()
      }
    }, 200)
  }

  // Establish WebSocket connection
  await connectWebSocket()
}

// Connect to WebSocket
async function connectWebSocket() {
  if (!props.sessionInfo || !props.sessionInfo.session_id) {
    return
  }

  try {
    const sessionId = props.sessionInfo.session_id

    // Build WebSocket URL
    const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
    const apiUrl = import.meta.env.VITE_API_URL
    const width = terminal.value ? terminal.value.cols : 80
    const height = terminal.value ? terminal.value.rows : 24
    const wsUrl = `${protocol}://${apiUrl}/api/v1/terminals/${sessionId}/console?width=${width}&height=${height}`

    socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      isConnected.value = true
      showReconnectButton.value = false

      // Attach socket to terminal
      if (terminal.value && AttachAddon) {
        attachAddon = new AttachAddon(socket!)
        terminal.value.loadAddon(attachAddon)
      }
    }

    socket.onclose = () => {
      isConnected.value = false
      showReconnectButton.value = true
    }

    socket.onerror = (err) => {
      console.error('WebSocket error:', err)
      isConnected.value = false
      showReconnectButton.value = true
    }

  } catch (err: any) {
    console.error('Error connecting to WebSocket:', err)
    showErrorNotification(
      t('terminalStarter.errorWebsocketMessage', { message: err.message }),
      t('terminalStarter.errorWebsocket')
    )
    isConnected.value = false
    showReconnectButton.value = true
  }
}

// Reconnect terminal
function reconnect() {
  if (socket) {
    socket.close()
  }
  connectWebSocket()
}

// Cleanup function
function cleanup() {
  // Close WebSocket first
  if (socket) {
    socket.close()
    socket = null
  }

  // Dispose terminal and its addons
  if (terminal.value) {
    try {
      // Dispose terminal (this will also dispose loaded addons)
      terminal.value.dispose()
    } catch (err) {
      console.error('Error disposing terminal:', err)
    }
    terminal.value = null
  }

  // Clear addon references
  fitAddon = null
  attachAddon = null
}

// Watch for sessionInfo changes
watch(() => props.sessionInfo, async (newSessionInfo, oldSessionInfo) => {
  // Only initialize if we have a new session (not just a status update)
  if (newSessionInfo && newSessionInfo.session_id !== oldSessionInfo?.session_id) {
    await initializeTerminal()
  }
}, { immediate: false })

onMounted(async () => {
  // Pre-load xterm.js and initialize terminal
  await initXterm()

  // Initialize terminal immediately since component only mounts when ready
  if (props.sessionInfo) {
    await initializeTerminal()
  }
})

onBeforeUnmount(() => {
  cleanup()
})

// Expose methods for parent component
defineExpose({
  connect: connectWebSocket,
  disconnect: cleanup,
  reconnect
})
</script>

<style scoped>
.terminal-wrapper {
  min-height: 500px;
  background-color: #1e1e1e;
  position: relative;
  border: var(--border-width-medium) solid #333;
  border-radius: var(--border-radius-md);
  overflow: hidden;
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

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.status-connected {
  color: var(--color-success);
}

.status-disconnected {
  color: var(--color-danger);
}

.text-success {
  color: var(--color-success);
}

.text-danger {
  color: var(--color-danger);
}

.text-muted {
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .terminal-wrapper {
    min-height: 300px;
  }

  .terminal-container {
    min-height: 300px;
  }

  .terminal-placeholder {
    height: 300px;
  }
}
</style>
