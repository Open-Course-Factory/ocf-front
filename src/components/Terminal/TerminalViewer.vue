<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
  <SettingsCard v-if="useSettingsCard" :title="title" :icon="icon">
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
        <span v-else-if="showDisconnectedIndicator" class="status-disconnected">
          <i class="fas fa-circle"></i> {{ t('terminal.disconnected') }}
        </span>
      </div>

      <span
        class="network-indicator"
        :class="hasNetwork ? 'network-on' : 'network-off'"
        :title="hasNetwork ? t('terminal.networkOn') : t('terminal.networkOff')"
      >
        <i :class="hasNetwork ? 'fas fa-globe' : 'fas fa-ban'"></i>
      </span>

      <RecordingIndicator :isRecording="isRecording" />

      <SessionCountdown
        v-if="sessionInfo?.expires_at"
        :expires-at="sessionInfo.expires_at"
        @warning="handleSessionWarning"
        @expired="handleSessionExpired"
      />

      <Button
        v-if="showStopButton && isConnected"
        variant="danger"
        size="sm"
        :icon="isStopping ? 'fas fa-spinner fa-spin' : 'fas fa-stop'"
        :disabled="isStopping || !canStop"
        :title="canStop ? t('terminal.stop') : t('terminal.stopDisabledEphemeral')"
        @click="emit('stop')"
      >
        {{ t('terminal.stop') }}
      </Button>
      <Button
        v-if="showDestroyButton && isConnected"
        variant="danger"
        size="sm"
        :icon="isDestroying ? 'fas fa-spinner fa-spin' : 'fas fa-trash'"
        :disabled="isDestroying"
        :title="t('terminal.destroyTooltip')"
        @click="emit('destroy')"
      >
        {{ t('terminal.destroy') }}
      </Button>

      <SupervisionChip
        v-if="supervisionChip"
        :icon="supervisionChip.icon"
        :text="supervisionChip.text"
        :controlled="supervisionChip.controlled"
      />
    </template>

    <div class="terminal-wrapper">
      <div ref="terminalRef" class="terminal-container" :class="{ 'terminal-full-height': fullHeight }"></div>
      <TerminalEndStateOverlay v-if="activeEndState" :reason="(effectiveEndReason as EndStateReason)" :config="activeEndState" @action="handleEndStateAction" />
      <div v-else-if="error" class="terminal-error">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <h3>{{ t('terminal.connectionError') }}</h3>
        <p>{{ error }}</p>
        <div class="terminal-error-actions">
          <button v-if="showReconnectButton" class="btn btn-primary" @click="retry">
            <i class="fas fa-redo"></i>
            {{ t('terminal.retry') }}
          </button>
          <button class="btn btn-secondary" @click="reloadPage">
            <i class="fas fa-sync-alt"></i>
            {{ t('terminal.reloadPage') }}
          </button>
        </div>
      </div>
      <div v-if="!terminal && !error && !activeEndState" class="terminal-loading">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>

    <div class="terminal-footer" v-if="sessionInfo">
      <div class="terminal-info">
        <small class="text-muted">
          Session: {{ sessionInfo.session_id }} |
          {{ t('terminal.status') }}: {{ sessionInfo.state }} |
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
          <span v-else-if="showDisconnectedIndicator" class="status-disconnected">
            <i class="fas fa-circle"></i>
            {{ isConnecting ? t('terminal.connecting') : t('terminal.disconnected') }}
          </span>
        </div>
        <span
          class="network-indicator"
          :class="hasNetwork ? 'network-on' : 'network-off'"
          :title="hasNetwork ? t('terminal.networkOn') : t('terminal.networkOff')"
        >
          <i :class="hasNetwork ? 'fas fa-globe' : 'fas fa-ban'"></i>
        </span>
        <RecordingIndicator :isRecording="isRecording" />
        <SessionCountdown
          v-if="sessionInfo?.expires_at"
          :expires-at="sessionInfo.expires_at"
          @warning="handleSessionWarning"
          @expired="handleSessionExpired"
        />
        <SupervisionChip
          v-if="supervisionChip"
          :icon="supervisionChip.icon"
          :text="supervisionChip.text"
          :controlled="supervisionChip.controlled"
        />
      </div>
      <div class="terminal-controls" v-if="!hideControls">
        <button
          class="btn btn-sm btn-warning"
          @click="reconnect"
          v-if="showReconnectButton && !isConnected && !isConnecting"
          :title="t('terminal.reconnect')"
        >
          <i class="fas fa-sync"></i>
        </button>
        <button
          v-if="showStopButton && isConnected"
          class="btn btn-sm btn-danger"
          :disabled="isStopping || !canStop"
          :title="canStop ? t('terminal.stop') : t('terminal.stopDisabledEphemeral')"
          @click="emit('stop')"
        >
          <i :class="isStopping ? 'fas fa-spinner fa-spin' : 'fas fa-stop'"></i>
        </button>
        <button
          v-if="showDestroyButton && isConnected"
          class="btn btn-sm btn-danger"
          :disabled="isDestroying"
          :title="t('terminal.destroyTooltip')"
          @click="emit('destroy')"
        >
          <i :class="isDestroying ? 'fas fa-spinner fa-spin' : 'fas fa-trash'"></i>
        </button>
      </div>
    </div>

    <!-- Terminal container -->
    <div class="terminal-wrapper">
      <!-- With a header the chip lives in it; without one it overlays the terminal
           so the learner indicator survives without shifting the layout. -->
      <SupervisionChip
        v-if="supervisionChip && !showHeader"
        overlay
        :icon="supervisionChip.icon"
        :text="supervisionChip.text"
        :controlled="supervisionChip.controlled"
      />
      <div class="terminal-container" ref="terminalRef"></div>
      <TerminalEndStateOverlay v-if="activeEndState" :reason="(effectiveEndReason as EndStateReason)" :config="activeEndState" @action="handleEndStateAction" />
      <div v-else-if="error" class="terminal-error">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <h3>{{ t('terminal.connectionError') }}</h3>
        <p>{{ error }}</p>
        <div class="terminal-error-actions">
          <button v-if="showReconnectButton" class="btn btn-primary" @click="retry">
            <i class="fas fa-redo"></i>
            {{ t('terminal.retry') }}
          </button>
          <button class="btn btn-secondary" @click="reloadPage">
            <i class="fas fa-sync-alt"></i>
            {{ t('terminal.reloadPage') }}
          </button>
        </div>
      </div>
      <div v-if="!terminal && !error && !activeEndState" class="terminal-loading">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ loadingMessage }}</p>
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
import { useEndStateConfig, type EndStateReason, type EndStateActionKey } from '../../composables/useEndStateConfig'
import { getTerminalTheme } from '../../utils/terminalTheme'
import { canConnectToTerminal, preConnectError, sessionHasNetwork } from '../../utils/sessionState'
import { terminalService } from '../../services/domain/terminal/terminalService'
import {
  createSupervisionMessageHandler,
  initialSupervisionState,
  type SupervisionState
} from '../../services/domain/terminal/supervisionProtocol'
import SettingsCard from '../UI/SettingsCard.vue'
import Button from '../UI/Button.vue'
import RecordingIndicator from './RecordingIndicator.vue'
import SessionCountdown from './SessionCountdown.vue'
import TerminalEndStateOverlay from './TerminalEndStateOverlay.vue'
import SupervisionChip from './SupervisionChip.vue'

interface SessionInfo {
  session_id: string
  console_url?: string
  expires_at?: string
  state?: string
  // JSON string of enabled features (e.g. `{"network":true}`). Drives the
  // internet-access indicator via sessionHasNetwork().
  composed_features?: string
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
  isRecording?: boolean
  showStopButton?: boolean
  isStopping?: boolean
  // When false, the Stop button is rendered but disabled, with a tooltip
  // explaining why (e.g., ephemeral session — Stop is meaningless because
  // there is no persistent disk to preserve). Defaults true to preserve
  // existing call sites that don't care about ephemeral semantics.
  canStop?: boolean
  // Destroy = irreversible removal of the container + disk. Available for
  // any active session (ephemeral OR persistent) so the user can terminate
  // early instead of waiting for expiry.
  showDestroyButton?: boolean
  isDestroying?: boolean
  // Layout options
  useSettingsCard?: boolean
  title?: string
  icon?: string
  fullHeight?: boolean
  // End-of-session state (when set, shows state-aware overlay instead of error)
  endReason?: 'completed' | 'abandoned' | 'expired' | 'stopped' | 'revoked' | 'setup_failed' | ''
  // Whether this terminal was part of a scenario (affects navigation in end-state)
  hasScenario?: boolean
  // Supervision-aware console: when true, the console connection carries control
  // frames (a trainer may watch or take control of this learner's terminal). The
  // socket is wired through the shared supervision message handler instead of the
  // plain AttachAddon so control metadata never leaks into the shell, and a banner is
  // shown while watched/controlled. Default false keeps the normal console path
  // byte-for-byte unchanged.
  supervisionEnabled?: boolean
}

const emit = defineEmits<{
  stop: []
  destroy: []
  'session-warning': [level: 'info' | 'warning' | 'danger']
  'session-expired': []
}>()

const props = withDefaults(defineProps<Props>(), {
  sessionId: null,
  sessionInfo: null,
  showHeader: true,
  showFooter: false,
  hideControls: false,
  autoConnect: true,
  isRecording: false,
  showStopButton: false,
  isStopping: false,
  canStop: true,
  showDestroyButton: false,
  isDestroying: false,
  useSettingsCard: false,
  title: 'Console Terminal',
  icon: undefined,
  fullHeight: true,
  endReason: '',
  hasScenario: false,
  supervisionEnabled: false
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
      websocketConnected: 'Connected',
      websocketDisconnected: 'Disconnected',
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
      websocketError: 'Connection error. Check your authentication.',
      connectionFailed: 'Unable to connect: {message}',
      sessionExpired: 'This session has expired. Please start a new terminal session.',
      sessionEnded: 'This session has ended. Please start a new terminal session.',
      commandNotFound: 'The terminal shell could not start: the command was not found inside the container. The container image may be missing the required shell (e.g., bash). Please contact an administrator.',
      permissionDenied: 'The terminal shell could not start: permission denied. The command exists but is not executable. Please contact an administrator.',
      execFailed: 'The terminal shell encountered an error (code {code}). Please try again or contact an administrator.',
      sessionInfoError: 'Unable to verify session: {message}',
      retry: 'Retry',
      reloadPage: 'Reload Page',
      stop: 'Stop',
      stopDisabledEphemeral: 'This is an ephemeral session — use Destroy to terminate it (Stop preserves a disk that does not exist here).',
      destroy: 'Destroy',
      destroyTooltip: 'Destroy this session permanently (container and data will be lost).',
      networkOn: 'Internet access: on',
      networkOff: 'Internet access: off',
      supervisionWatched: 'A trainer is watching this session',
      supervisionControlled: 'A trainer has taken control of this session',
    }
  },
  fr: {
    terminal: {
      reconnect: 'Reconnecter',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      connecting: 'Connexion...',
      status: 'Statut',
      websocketConnected: 'Connecté',
      websocketDisconnected: 'Déconnecté',
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
      websocketError: 'Erreur de connexion. Vérifiez votre authentification.',
      connectionFailed: 'Impossible de se connecter: {message}',
      sessionExpired: 'Cette session a expiré. Veuillez démarrer une nouvelle session de terminal.',
      sessionEnded: 'Cette session est terminée. Veuillez démarrer une nouvelle session de terminal.',
      commandNotFound: 'Le terminal n\'a pas pu démarrer : la commande est introuvable dans le conteneur. L\'image du conteneur ne contient peut-être pas le shell requis (ex: bash). Veuillez contacter un administrateur.',
      permissionDenied: 'Le terminal n\'a pas pu démarrer : permission refusée. La commande existe mais n\'est pas exécutable. Veuillez contacter un administrateur.',
      execFailed: 'Le terminal a rencontré une erreur (code {code}). Veuillez réessayer ou contacter un administrateur.',
      sessionInfoError: 'Impossible de vérifier la session: {message}',
      retry: 'Réessayer',
      reloadPage: 'Recharger la Page',
      stop: 'Arrêter',
      stopDisabledEphemeral: 'Cette session est éphémère — utilisez Détruire pour la terminer (Arrêter conserverait un disque qui n\'existe pas ici).',
      destroy: 'Détruire',
      destroyTooltip: 'Détruire définitivement cette session (le conteneur et ses données seront perdus).',
      networkOn: 'Accès internet : activé',
      networkOff: 'Accès internet : désactivé',
      recording: 'REC',
      recordingTooltip: 'Les commandes sont enregistrées',
      supervisionWatched: 'Un formateur observe cette session',
      supervisionControlled: 'Un formateur a pris le contrôle de cette session',
    }
  }
})

const { showError: showErrorNotification } = useNotification()
const route = useRoute()
const userStore = useCurrentUserStore()

// End state configuration (shared composable)
const { getEndStateConfig } = useEndStateConfig()

// Runtime end-state, driven by events inside this component rather than by the
// parent's props.endReason (which reflects backend status). Set to 'disconnected'
// when the WebSocket closes after a successful connection (shell exit /
// connection lost) — a recoverable state offering Reconnect / End Session — and
// to 'stopped' once the user ends the session from that overlay. Cleared on a
// successful (re)connect.
const runtimeEndReason = ref<EndStateReason | ''>('')

// The reason actually rendered by the overlay: the runtime end-state takes
// precedence over the prop-driven end reason.
const effectiveEndReason = computed<EndStateReason | ''>(() =>
  runtimeEndReason.value || props.endReason
)

const activeEndState = computed(() => {
  const reason = effectiveEndReason.value
  if (!reason) return null
  return getEndStateConfig(reason as EndStateReason, { hasScenario: props.hasScenario }) ?? null
})

// State
const terminal = ref<any>(null)
const terminalRef = ref<HTMLElement | null>(null)
const socket = ref<WebSocket | null>(null)
const isWsOpen = ref(false)
const isConnecting = ref(false)
const showReconnectButton = ref(false)
const isEndingSession = ref(false)
const error = ref('')
const loadingMessage = ref(t('terminal.initializingTerminal'))
const fetchedSessionInfo = ref<SessionInfo | null>(null)

// Supervision indicator state (only meaningful when props.supervisionEnabled).
// Driven by binary control frames routed through routeSupervisionFrame.
const supervisionState = ref<SupervisionState>(initialSupervisionState())
const supervisionChip = computed(() => {
  if (!props.supervisionEnabled) return null
  if (supervisionState.value.controlled) {
    return { icon: '✋', text: t('terminal.supervisionControlled'), controlled: true }
  }
  if (supervisionState.value.watched) {
    return { icon: '👁', text: t('terminal.supervisionWatched'), controlled: false }
  }
  return null
})

// Disposable for the learner's outgoing-keystroke listener in supervised mode
// (re-created on each (re)connect; disposed to avoid double-sending on reconnect).
let supervisedDataDisposable: { dispose: () => void } | null = null

// xterm.js modules (lazy loaded)
let Terminal: any = null
let FitAddon: any = null
let AttachAddon: any = null
let fitAddon: any = null
let attachAddon: any = null

// Resize observer
let resizeObserver: ResizeObserver | null = null

// Computed: active session info (prefer prop, fallback to fetched)
const sessionInfo = computed(() => props.sessionInfo || fetchedSessionInfo.value)

// Computed: whether this session has internet access (single source of truth)
const hasNetwork = computed(() => sessionHasNetwork(sessionInfo.value))

// Computed: session ID for display and connection
const displaySessionId = computed(() => {
  const id = sessionInfo.value?.session_id || props.sessionId || route.params.sessionId || route.query.sessionId
  // Handle case where route params might be an array
  return Array.isArray(id) ? id[0] : id
})

// Computed: true connection status (WebSocket open AND session running per SSOT)
const isConnected = computed(() =>
  canConnectToTerminal(sessionInfo.value, isWsOpen.value)
)

// Suppress the "Déconnecté" status pill when the user intentionally stopped the
// session (props.isStopping) or when an end-state overlay is already rendered.
// In those windows the disconnect is expected — showing it as a red error
// indicator is noise. Real disconnects (network drop, server crash) still
// surface because isStopping=false and endReason='' in those cases.
const showDisconnectedIndicator = computed(() => {
  if (isConnected.value) return false
  if (props.isStopping) return false
  if (activeEndState.value) return false
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
      import('@xterm/addon-attach')
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

    // Wait for the container to receive its final dimensions from CSS
    await new Promise<void>(resolve => {
      const ro = new ResizeObserver(() => { ro.disconnect(); resolve() })
      ro.observe(terminalRef.value!)
    })
    fitTerminal()

    // Setup resize observer
    setupResizeObserver()
  }

  loadingMessage.value = t('terminal.terminalInitialized')

  // Establish WebSocket connection
  await connectToTerminal()
}

// Resize handling
let resizeTimeout: ReturnType<typeof setTimeout> | null = null

function fitTerminal() {
  if (fitAddon && terminal.value) {
    fitAddon.fit()
  }
}

function handleResize() {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(fitTerminal, 100)
}

function setupResizeObserver() {
  if (terminalRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      if (fitAddon && terminal.value) {
        fitAddon.fit()
      }
    })
    resizeObserver.observe(terminalRef.value)
  }
  window.addEventListener('resize', handleResize)
}

// Supervision-aware socket wiring (used instead of AttachAddon when
// props.supervisionEnabled). Incoming TEXT frames are written to xterm; incoming
// BINARY frames are parsed as control metadata and update the learner indicator
// (never written to the shell). Outgoing keystrokes are forwarded as TEXT frames.
function attachSupervisedSocket() {
  if (!socket.value || socket.value.readyState !== WebSocket.OPEN) return

  // Deliver binary control frames as ArrayBuffer so we can distinguish them from
  // text output synchronously in onmessage.
  socket.value.binaryType = 'arraybuffer'
  supervisionState.value = initialSupervisionState()

  socket.value.onmessage = createSupervisionMessageHandler({
    getState: () => supervisionState.value,
    setState: (state) => { supervisionState.value = state },
    onTerminal: (text) => { terminal.value?.write(text) }
  })

  // Forward the learner's keystrokes to the shell as TEXT frames. Re-created on
  // each (re)connect; dispose the previous listener to avoid double-sending.
  if (supervisedDataDisposable) {
    try { supervisedDataDisposable.dispose() } catch { /* not yet loaded */ }
    supervisedDataDisposable = null
  }
  supervisedDataDisposable = terminal.value.onData((data: string) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(data)
    }
  })
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
    // Check if session is connectable BEFORE attempting connection
    const errKey = preConnectError(sessionInfo.value)
    if (errKey) {
      error.value = t(`terminal.${errKey}`)
      isConnecting.value = false
      return
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
    // Opt the console into supervision control frames so the learner indicator
    // can react to a trainer watching / taking control.
    if (props.supervisionEnabled) {
      wsUrl += `&control=1`
    }
    if (token) {
      wsUrl += `&token=${encodeURIComponent(token)}`
    } else {
      console.warn('No authentication token available for WebSocket connection')
    }

    // Create WebSocket connection
    socket.value = new WebSocket(wsUrl)

    socket.value.onopen = () => {
      isWsOpen.value = true
      isConnecting.value = false
      showReconnectButton.value = false
      runtimeEndReason.value = ''
      error.value = ''

      // Clear old terminal content before attaching new session
      terminal.value.reset()

      // Attach socket to terminal
      if (attachAddon) {
        try {
          attachAddon.dispose()
        } catch {
          // Addon may not be fully loaded yet
        }
        attachAddon = null
      }

      if (props.supervisionEnabled) {
        // Supervision-aware wiring: control frames must never reach the shell, so we
        // bypass AttachAddon and route every frame through the shared handler instead.
        attachSupervisedSocket()
      } else if (socket.value && socket.value.readyState === WebSocket.OPEN) {
        attachAddon = new AttachAddon(socket.value)
        try {
          terminal.value.loadAddon(attachAddon)
        } catch {
          // xterm may throw "Could not dispose an addon that has not been loaded"
          // when the socket's onclose fires during activate() — this is a benign
          // race condition, the addon still works after loadAddon completes
        }
      }

      // Send resize events to backend as binary WebSocket frames
      // so the container PTY dimensions stay in sync with the browser
      terminal.value.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        if (socket.value && socket.value.readyState === WebSocket.OPEN) {
          const msg = JSON.stringify({ type: 'resize', cols, rows })
          socket.value.send(new TextEncoder().encode(msg))
        }
      })

      // Focus terminal
      terminal.value.focus()
    }

    socket.value.onclose = (event) => {
      const wasConnected = isWsOpen.value
      isWsOpen.value = false
      isConnecting.value = false

      // Handle container exec errors from tt-backend (custom close codes 4000-4999)
      if (event.code === 4127) {
        error.value = t('terminal.commandNotFound')
        showReconnectButton.value = false
      } else if (event.code === 4126) {
        error.value = t('terminal.permissionDenied')
        showReconnectButton.value = false
      } else if (event.code >= 4000 && event.code <= 4999) {
        error.value = t('terminal.execFailed', { code: event.code - 4000 })
        showReconnectButton.value = false
      // Handle authentication failures
      } else if (event.code === 1008) {
        error.value = t('terminal.authenticationFailed')
        showReconnectButton.value = true
        if (props.useSettingsCard) {
          showErrorNotification(
            t('terminal.authenticationFailed'),
            t('terminal.connectionError')
          )
        }
      } else if (wasConnected) {
        // WebSocket closed while session was active = shell exited or connection
        // lost. The environment is usually still running, so surface the
        // recoverable "disconnected" end-state (Reconnect / End Session) instead
        // of a dead-end error.
        runtimeEndReason.value = 'disconnected'
        showReconnectButton.value = false
        error.value = ''
      } else {
        // Connection failed before session was established - offer reconnect
        error.value = event.reason
          ? t('terminal.connectionClosed', { code: event.code, reason: event.reason })
          : t('terminal.connectionClosedNoReason', { code: event.code })
        showReconnectButton.value = true
      }

      // Sync session status with backend after WebSocket closes
      const sessionId = displaySessionId.value
      if (sessionId) {
        setTimeout(async () => {
          try {
            await terminalService.syncSession(sessionId)
          } catch (syncErr) {
            console.warn('Failed to sync session after close:', syncErr)
          }
        }, 2000)
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

// Reload the page
function reloadPage() {
  window.location.reload()
}

// Handle an action button emitted by the end-state overlay (Reconnect / End Session).
function handleEndStateAction(key: EndStateActionKey) {
  if (key === 'reconnect') {
    runtimeEndReason.value = ''
    reconnect()
  } else if (key === 'endSession') {
    endSession()
  }
}

// End the still-running environment from the disconnect end-state, then show the
// standard "stopped" end-state. Best-effort: we transition to 'stopped' even if
// the stop request fails, so the user is never stuck on the disconnect overlay.
async function endSession() {
  if (isEndingSession.value) return
  const sessionId = displaySessionId.value
  isEndingSession.value = true
  try {
    if (sessionId) {
      await terminalService.stopSession(sessionId)
    }
  } catch (err) {
    console.error('Error ending session from disconnect overlay:', err)
  } finally {
    isEndingSession.value = false
    runtimeEndReason.value = 'stopped'
  }
}

// Reconnect terminal
async function reconnect() {
  if (socket.value) {
    socket.value.close()
  }

  // Sync and re-fetch session info to get current backend status
  if (displaySessionId.value) {
    try {
      await terminalService.syncSession(displaySessionId.value)
    } catch (err: any) {
      console.warn('Could not sync session:', err)
    }
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

// Session countdown event handlers
function handleSessionWarning(level: 'info' | 'warning' | 'danger') {
  emit('session-warning', level)
}

function handleSessionExpired() {
  if (socket.value) {
    socket.value.close()
  }
  emit('session-expired')
}

// Cleanup
function cleanup() {
  window.removeEventListener('resize', handleResize)
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
    resizeTimeout = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  if (socket.value) {
    socket.value.close()
    socket.value = null
  }

  if (supervisedDataDisposable) {
    try {
      supervisedDataDisposable.dispose()
    } catch {
      // Listener may not be fully loaded yet
    }
    supervisedDataDisposable = null
  }

  // Dispose addons before terminal to avoid "addon not loaded" errors
  if (attachAddon) {
    try {
      attachAddon.dispose()
    } catch {
      // Addon may not be fully loaded yet
    }
    attachAddon = null
  }

  if (fitAddon) {
    try {
      fitAddon.dispose()
    } catch {
      // Addon may not be fully loaded yet
    }
    fitAddon = null
  }

  if (terminal.value) {
    try {
      terminal.value.dispose()
    } catch (err) {
      console.error('Error disposing terminal:', err)
    }
    terminal.value = null
  }
}

// Watch for sessionInfo changes
watch(() => props.sessionInfo, async (newSessionInfo, oldSessionInfo) => {
  if (newSessionInfo && newSessionInfo.session_id !== oldSessionInfo?.session_id) {
    await initializeTerminal()
  }
}, { immediate: false })

onMounted(async () => {
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
  getSessionId: () => displaySessionId.value,
  pasteText: (text: string) => { terminal.value?.paste(text); terminal.value?.focus() }
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  z-index: 100;
  background: var(--color-bg-primary);
}

.terminal-error-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
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
  flex: 1;
  min-height: 0;
  background-color: var(--terminal-bg);
  position: relative;
  border: var(--border-width-thin) solid var(--terminal-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.terminal-wrapper .terminal-container {
  width: 100%;
  height: 100%;
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
  flex-shrink: 0;
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

/* The learner-facing supervision indicator now lives in the title bar as a chip
   (see SupervisionChip.vue) so it never shifts the terminal's layout box. */

/* Internet-access indicator in the status bar. Globe = on (success),
   crossed = off (muted). Sits alongside the recording / countdown badges. */
.network-indicator {
  display: inline-flex;
  align-items: center;
  font-size: var(--font-size-sm);
  line-height: 1;
  cursor: default;
}

.network-indicator.network-on {
  color: var(--color-success);
}

.network-indicator.network-off {
  color: var(--color-text-muted);
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
