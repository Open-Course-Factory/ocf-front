<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
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
  <div
    class="supervision-viewer"
    :class="{ 'supervision-viewer-compact': compact, 'supervision-viewer-maximized': isMaximized }"
    :role="compact ? 'button' : undefined"
    :tabindex="compact ? 0 : undefined"
    :aria-label="compact ? t('supervisionViewer.focusAria', { name: learnerName || sessionId }) : undefined"
    @click="compact ? emit('expand') : undefined"
    @keydown.enter="onActivationKey"
    @keydown.space="onActivationKey"
  >
    <!-- Header: learner + observer/control status + take-hand button -->
    <div class="supervision-viewer-header">
      <div class="supervision-viewer-identity">
        <i class="fas fa-user-graduate"></i>
        <span class="supervision-viewer-name">{{ learnerName || sessionId }}</span>
      </div>

      <div class="supervision-viewer-status">
        <!-- The host's status marks (non-interactive), ahead of the viewer's own. -->
        <slot name="status" />
        <span
          v-if="hasControl"
          class="supervision-chip supervision-chip-danger"
          :title="t('supervisionViewer.controlledTooltip')"
        >
          <i class="fas fa-hand-paper"></i>
          {{ t('supervisionViewer.controlled') }}
        </span>
        <span
          v-else-if="isControlledByOther"
          class="supervision-chip supervision-chip-muted"
          :title="t('supervisionViewer.controlledByOtherTooltip')"
        >
          <i class="fas fa-hand-paper"></i>
          {{ t('supervisionViewer.controlledByOther') }}
        </span>
        <span
          v-if="controlState.observers > 1"
          class="supervision-chip supervision-chip-info"
          :title="t('supervisionViewer.observersTooltip')"
        >
          <i class="fas fa-eye"></i>
          {{ controlState.observers }}
        </span>
        <span v-if="controlState.ended" class="supervision-chip supervision-chip-muted">
          {{ t('supervisionViewer.ended') }}
        </span>

        <TerminalZoomControl v-if="!compact" />
        <button
          v-if="!compact"
          type="button"
          class="ocf-btn ocf-btn-sm ocf-btn-secondary"
          data-testid="supervision-fullscreen"
          :title="isMaximized ? t('supervisionViewer.restore') : t('supervisionViewer.maximize')"
          :aria-label="isMaximized ? t('supervisionViewer.restore') : t('supervisionViewer.maximize')"
          :aria-pressed="isMaximized"
          @click.stop="isMaximized = !isMaximized"
        >
          <i :class="isMaximized ? 'fas fa-compress' : 'fas fa-expand'" aria-hidden="true"></i>
        </button>
        <button
          v-if="!compact"
          class="ocf-btn ocf-btn-sm"
          :class="hasControl ? 'ocf-btn-danger' : 'ocf-btn-primary'"
          :disabled="!isConnected || controlState.ended || isControlledByOther"
          :title="isControlledByOther ? t('supervisionViewer.controlledByOtherTooltip') : undefined"
          @click.stop="toggleControl"
        >
          <i :class="hasControl ? 'fas fa-hand-rock' : 'fas fa-hand-paper'"></i>
          {{ t(`supervisionViewer.${controlActionKey}`) }}
        </button>
      </div>
    </div>

    <!-- Terminal -->
    <div class="supervision-viewer-wrapper">
      <div ref="terminalRef" class="supervision-viewer-terminal"></div>
      <!-- No console on any server to watch: the machine is in the learner's tab. -->
      <div v-if="inLearnersBrowser" class="supervision-viewer-overlay" data-testid="supervision-in-browser">
        <i class="fas fa-laptop"></i>
        <p>{{ t('supervisionViewer.inLearnersBrowser') }}</p>
      </div>
      <div v-else-if="error" class="supervision-viewer-overlay supervision-viewer-error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
      </div>
      <div v-else-if="!isConnected" class="supervision-viewer-overlay">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ t('supervisionViewer.connecting') }}</p>
      </div>
      <!-- Compact tiles are click-to-expand; a hint keeps that discoverable -->
      <div v-if="compact" class="supervision-viewer-expand-hint">
        <i class="fas fa-expand"></i>
        {{ t('supervisionViewer.expand') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import '@xterm/xterm/css/xterm.css'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'
import { getTerminalTheme } from '../../utils/terminalTheme'
import { terminalKeyHandler } from '../../utils/terminalShortcuts'
import { buildSuperviseWsUrl } from '../../services/domain/terminal/supervisionService'
import { isLocalSessionId } from '../../services/domain/terminal/localMachine'
import { webSocketAuthProtocols } from '../../utils/webSocketAuth'
import {
  createSupervisionMessageHandler,
  initialSupervisionState,
  sendResize,
  type SupervisionState
} from '../../services/domain/terminal/supervisionProtocol'
import { useSupervisionControl } from '../../composables/useSupervisionControl'
import { useTerminalZoom } from '../../composables/useTerminalZoom'
import TerminalZoomControl from './TerminalZoomControl.vue'
import { fontSizeToFit } from '../../utils/terminalFit'

interface Props {
  sessionId: string
  learnerName?: string
  // Compact tile mode for the class wall: smaller, read-only, click-to-expand.
  compact?: boolean
  autoConnect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  learnerName: '',
  compact: false,
  autoConnect: true
})

const emit = defineEmits<{
  expand: []
  // Emitted when live output arrives — lets the wall highlight active tiles.
  activity: []
}>()

const { t } = useTranslations({
  en: {
    supervisionViewer: {
      inLearnersBrowser: 'This machine runs in the learner\'s browser: there is no live view of it.',
      takeHand: 'Type in the terminal',
      maximize: 'Fill the window (F11 for the whole screen)',
      restore: 'Back to normal size',
      releaseHand: 'Stop typing',
      connecting: 'Connecting to session…',
      controlled: 'You are in control',
      controlledTooltip: 'You currently control this session',
      controlledByOther: 'Controlled by another trainer',
      controlledByOtherTooltip: 'Another trainer currently holds the hand on this session',
      observersTooltip: 'Number of trainers watching this session',
      ended: 'Session ended',
      expand: 'Click to focus',
      focusAria: 'Focus {name}’s session',
      connectionError: 'Unable to connect to this session'
    }
  },
  fr: {
    supervisionViewer: {
      inLearnersBrowser: 'Cette machine tourne dans le navigateur de l\'apprenant : il n\'y a pas de vue en direct.',
      takeHand: 'Écrire dans le terminal',
      maximize: 'Agrandir à toute la fenêtre (F11 pour tout l’écran)',
      restore: 'Revenir à la taille normale',
      releaseHand: 'Arrêter d’écrire',
      connecting: 'Connexion à la session…',
      controlled: 'Vous avez le contrôle',
      controlledTooltip: 'Vous contrôlez actuellement cette session',
      controlledByOther: 'Sous contrôle d\'un autre formateur',
      controlledByOtherTooltip: 'Un autre formateur a actuellement la main sur cette session',
      observersTooltip: 'Nombre de formateurs observant cette session',
      ended: 'Session terminée',
      expand: 'Cliquer pour agrandir',
      focusAria: 'Agrandir la session de {name}',
      connectionError: 'Impossible de se connecter à cette session'
    }
  }
})

const userStore = useCurrentUserStore()

const terminalRef = ref<HTMLElement | null>(null)
const socket = ref<WebSocket | null>(null)
const isConnected = ref(false)
const error = ref('')
const controlState = ref<SupervisionState>(initialSupervisionState())

// xterm modules (lazy loaded)
let terminal: any = null
let FitAddon: any = null
let fitAddon: any = null
let dataDisposable: { dispose: () => void } | null = null
let resizeObserver: ResizeObserver | null = null

// Read-only-by-default control gate. Keystrokes are only forwarded once the
// supervisor explicitly takes the hand.
const { hasControl, takeHand, releaseHand, forwardKeystroke, controlActionKey, isControlledByOther } =
  useSupervisionControl(() => socket.value, () => controlState.value.controlled)

// Only the compact tile is keyboard-activatable. Guarding on `compact` here (not
// via `.prevent`, which fires unconditionally) keeps space/enter bubbling up from
// the focused viewer's xterm from being cancelled — otherwise supervisor-typed
// spaces never reach the shell.
function onActivationKey(event: KeyboardEvent) {
  if (!props.compact) return
  event.preventDefault()
  emit('expand')
}

function toggleControl() {
  if (hasControl.value) {
    releaseHand()
  } else {
    takeHand()
  }
}

async function initTerminal() {
  const [xtermModule, fitModule] = await Promise.all([
    import('@xterm/xterm'),
    import('@xterm/addon-fit')
  ])
  const Terminal = xtermModule.Terminal
  FitAddon = fitModule.FitAddon

  terminal = new Terminal({
    cursorBlink: false,
    fontFamily: '"Cascadia Code", "Fira Code", "SF Mono", Monaco, "Roboto Mono", monospace',
    fontSize: baseFontSize() * zoomFactor(),
    rows: props.compact ? 12 : 24,
    cols: 80,
    theme: getTerminalTheme(),
    scrollback: 1000,
    // No convertEol: the shell's PTY already sends CRLF. Turning a bare LF into
    // CRLF breaks full-screen programs that move down a row with LF — tmux split
    // panes lost their first column and could not be cleared.
    convertEol: false,
    // stdin stays enabled so xterm still emits onData once the hand is taken;
    // read-only-by-default is enforced in forwardKeystroke (a no-op until then),
    // not by disabling stdin (which would also block typing after taking control).
    disableStdin: false
  })

  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  const term = terminal
  term.attachCustomKeyEventHandler(terminalKeyHandler(() => term.getSelection()))

  if (terminalRef.value) {
    terminal.open(terminalRef.value)
    fitAddon.fit()
    setupResizeObserver()
  }

  // Learner keystrokes are forwarded only after the hand is taken (no-op otherwise).
  dataDisposable = terminal.onData((data: string) => forwardKeystroke(data))
}

// While this trainer holds the hand, their view sizes the learner's terminal, as
// the learner's own window does: the grid fits the tile at the zoomed font, and
// tt-backend resizes the PTY (vim and top redraw on the resize). Only once
// tt-backend confirmed the hand: before that, it ignores a resize.
const drivesLearnerSize = computed(() => hasControl.value && controlState.value.controlled && !props.compact)

function driveLearnerSize() {
  if (!fitAddon || !terminal || !socket.value) return
  terminal.options.fontSize = baseFontSize() * zoomFactor()
  try { fitAddon.fit() } catch { return /* container not measured yet */ }
  sendResize(socket.value, terminal.cols, terminal.rows)
}

// Drive the learner's size while holding the hand; otherwise follow the learner's
// grid when tt-backend reports it, else fit the grid to the tile.
function refit() {
  if (!fitAddon || !terminal) return
  if (drivesLearnerSize.value) {
    driveLearnerSize()
    return
  }
  if (controlState.value.cols) {
    scaleToTile()
    return
  }
  try { fitAddon.fit() } catch { /* container not measured yet */ }
}

function setupResizeObserver() {
  if (terminalRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(refit)
    resizeObserver.observe(terminalRef.value)
  }
}

// The learner's PTY output only renders correctly on the learner's own grid:
// vim, top and friends address the cursor by absolute row/column. So once
// tt-backend reports the PTY size, the grid follows it and the font shrinks until
// the grid fits the tile, instead of the grid being fitted to the tile. An older
// tt-backend reports no size; the grid then keeps fitting the tile.
function applyLearnerSize() {
  const { cols, rows } = controlState.value
  // While driving, the reported size is the one this view just sent.
  if (!terminal || !cols || !rows || drivesLearnerSize.value) return
  if (terminal.cols !== cols || terminal.rows !== rows) terminal.resize(cols, rows)
  scaleToTile()
}

// The font never grows past the base size times the trainer's zoom, and never
// past what fits the tile: a bigger font would push the line ends and the last
// rows out of sight. Taking the hand is how the zoom gets past that.
function scaleToTile() {
  if (!terminal) return
  const size = fontSizeToFit(terminal, baseFontSize() * zoomFactor())
  if (size !== null && size !== terminal.options.fontSize) terminal.options.fontSize = size
}

function baseFontSize() {
  return props.compact ? 11 : 14
}

// Wall thumbnails stay unzoomed: clicking one already opens the focused view.
const { zoom } = useTerminalZoom()
function zoomFactor() {
  return props.compact ? 1 : zoom.value
}

watch(zoom, () => {
  if (!terminal || props.compact) return
  // Fit mode sizes the grid from the font, so the font is set first; scale mode
  // derives the font from the grid and overwrites this.
  terminal.options.fontSize = baseFontSize() * zoomFactor()
  refit()
})

watch(() => [controlState.value.cols, controlState.value.rows], applyLearnerSize)
// On release the learner's window takes its size back, and the next reported
// size is theirs again.
watch(drivesLearnerSize, (driving) => (driving ? refit() : applyLearnerSize()))

// Filling the window gives the learner's grid the biggest font that fits; the
// resize observer refits on the way in and out. Not the browser's full screen:
// browsers keep Esc to leave it, so vim's Esc threw the trainer out (F11 still
// gives the whole screen, and Esc does not leave that one).
const isMaximized = ref(false)

// A machine in the learner's browser has no console on a server (ocf-core
// refuses to supervise it): nothing to connect to.
const inLearnersBrowser = isLocalSessionId(props.sessionId)

function connect() {
  if (inLearnersBrowser) return
  const url = buildSuperviseWsUrl(props.sessionId)

  controlState.value = initialSupervisionState()

  try {
    socket.value = new WebSocket(url, webSocketAuthProtocols(userStore.secretToken))
    // Control frames arrive as binary; deliver them as ArrayBuffer so they can be
    // told apart from text output synchronously.
    socket.value.binaryType = 'arraybuffer'

    socket.value.onopen = () => {
      isConnected.value = true
      error.value = ''
      terminal?.reset()
    }

    socket.value.onmessage = createSupervisionMessageHandler({
      getState: () => controlState.value,
      setState: (state) => { controlState.value = state },
      onTerminal: (text) => {
        terminal?.write(text)
        emit('activity')
      }
    })

    socket.value.onclose = () => {
      isConnected.value = false
    }

    socket.value.onerror = () => {
      isConnected.value = false
      error.value = t('supervisionViewer.connectionError')
    }
  } catch (err: any) {
    error.value = t('supervisionViewer.connectionError')
  }
}

function cleanup() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (dataDisposable) {
    try { dataDisposable.dispose() } catch { /* not loaded */ }
    dataDisposable = null
  }
  if (socket.value) {
    // Release the hand before leaving so the learner is not left "controlled".
    if (hasControl.value) releaseHand()
    socket.value.close()
    socket.value = null
  }
  if (fitAddon) {
    try { fitAddon.dispose() } catch { /* not loaded */ }
    fitAddon = null
  }
  if (terminal) {
    try { terminal.dispose() } catch { /* already disposed */ }
    terminal = null
  }
  isConnected.value = false
}

// Reconnect when the observed session changes (tile reuse).
watch(() => props.sessionId, async () => {
  cleanup()
  await initTerminal()
  if (props.autoConnect) connect()
})

onMounted(async () => {
  await initTerminal()
  if (props.autoConnect) connect()
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style scoped>
.supervision-viewer {
  display: flex;
  flex-direction: column;
  background-color: var(--terminal-bg);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

/* Two classes: the hosts give the viewer a height (70vh), which would otherwise
   win over inset and leave it short of the window. Above the app bar
   (--z-index-modal), which hid the viewer's own toolbar and so the way back;
   still under toasts and Element Plus overlays. */
.supervision-viewer.supervision-viewer-maximized {
  position: fixed;
  inset: 0;
  height: auto;
  z-index: var(--z-index-popover);
  border: none;
  border-radius: 0;
}

.supervision-viewer-compact {
  cursor: pointer;
  transition: border-color var(--transition-base), transform var(--transition-fast);
}

.supervision-viewer-compact:hover,
.supervision-viewer-compact:focus,
.supervision-viewer-compact:focus-within {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.supervision-viewer-compact:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.supervision-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-medium);
  flex-shrink: 0;
}

.supervision-viewer-identity {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  min-width: 0;
}

.supervision-viewer-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.supervision-viewer-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.supervision-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 1px var(--spacing-xs);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.supervision-chip-info {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.supervision-chip-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.supervision-chip-muted {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}

.supervision-viewer-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  background-color: var(--terminal-bg);
}

.supervision-viewer-compact .supervision-viewer-wrapper {
  height: 180px;
}

.supervision-viewer-terminal {
  width: 100%;
  height: 100%;
}

.supervision-viewer-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-bg-primary);
}

.supervision-viewer-error {
  color: var(--color-danger);
}

.supervision-viewer-expand-hint {
  position: absolute;
  bottom: var(--spacing-xs);
  right: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  color: var(--color-white);
  background: color-mix(in srgb, var(--color-black) 55%, transparent);
  opacity: 0;
  transition: opacity var(--transition-fast);
  pointer-events: none;
}

.supervision-viewer-compact:hover .supervision-viewer-expand-hint,
.supervision-viewer-compact:focus .supervision-viewer-expand-hint,
.supervision-viewer-compact:focus-within .supervision-viewer-expand-hint {
  opacity: 1;
}

/* Button styles are shared via assets/styles/supervision-buttons.css (.ocf-btn*). */

.supervision-viewer :deep(.xterm) {
  height: 100% !important;
  padding: var(--spacing-xs);
}
</style>
