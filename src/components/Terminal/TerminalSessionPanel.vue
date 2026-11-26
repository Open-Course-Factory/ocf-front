<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 *
 * Shared terminal session panel: TerminalViewer + CommandHistory + stop
 * Used by TerminalStarter (just created) and TerminalSessionView (dedicated page)
 */
-->

<template>
  <div class="terminal-session-panel">
    <!-- Terminal Console. Whatever the parent lays over it (the paused banner)
         covers the console alone and makes it inert; history and flags below
         stay usable. -->
    <div class="ocf-console-area">
      <!-- Popped out: the console lives in its own window, so this one stays
           unmounted rather than fighting it over the terminal size. -->
      <div v-if="isPoppedOut" class="ocf-console-popped-out" data-testid="terminal-popped-out">
        <i class="fas fa-up-right-from-square"></i>
        <p>{{ t('terminalPanel.poppedOut') }}</p>
        <button type="button" class="btn btn-primary btn-sm" data-testid="terminal-pop-in" @click="popIn">
          <i class="fas fa-down-left-and-up-right-to-center"></i>
          {{ t('terminalPanel.bringBack') }}
        </button>
      </div>
      <!-- unkernel's desktop in the console's place, for a scenario that offers apps. -->
      <DesktopSlot
        v-else-if="desktop && sessionInfo?.session_id"
        :terminal="sessionInfo.session_id"
        :covered="!!$slots['console-overlay']"
        :hold="holdConsole"
      />
      <TerminalViewer
        v-else
        ref="terminalRef"
        :inert="!!$slots['console-overlay']"
        :auto-connect="!holdConsole"
        :session-info="sessionInfo"
        :is-recording="isRecording"
        :end-reason="endReason"
        :has-scenario="hasScenario"
        :scenario-crash-traps="scenarioCrashTraps"
        :exposed-ports-enabled="showExposedPorts"
        :machine="machine"
        use-settings-card
        :title="sessionInfo?.name || ('Terminal ' + (sessionInfo?.session_id?.substring(0, 8) || ''))"
        icon="fas fa-terminal"
        :full-height="false"
        :show-stop-button="showStopButton"
        :is-stopping="isStopping"
        :can-stop="canStop"
        :show-destroy-button="showDestroyButton"
        :is-destroying="isDestroying"
        pop-mode="out"
        @pop="popOutConsole"
        @stop="$emit('stop')"
        @destroy="$emit('destroy')"
        @session-warning="$emit('session-warning', $event)"
        @session-expired="$emit('session-expired')"
        @session-stopped="$emit('session-stopped')"
      />
      <div v-if="$slots['console-overlay']" class="ocf-console-overlay">
        <slot name="console-overlay" />
      </div>
    </div>

    <!-- Sub-panels: Command History + Validated Flags side by side -->
    <div class="sub-panels" :class="{ 'has-flags': scenarioSessionId && scenarioFlagsEnabled }">
      <div v-if="showHistory && machine !== 'local'" class="command-history-panel">
        <CommandHistory
          :session-id="sessionInfo?.session_id"
          :is-active="isActive"
          @command-click="handleCommandClick"
          @recording-detected="$emit('recording-detected')"
        />
      </div>

      <div v-if="scenarioSessionId && scenarioFlagsEnabled" class="validated-flags-panel">
        <ValidatedFlags
          ref="validatedFlagsRef"
          :scenario-session-id="scenarioSessionId"
          :is-active="isActive"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TerminalViewer from './TerminalViewer.vue'
import DesktopSlot from './DesktopSlot.vue'
import { useTerminalPopout } from '../../composables/useTerminalPopout'
import { useTranslations } from '../../composables/useTranslations'
import CommandHistory from './CommandHistory.vue'
import ValidatedFlags from './ValidatedFlags.vue'

interface SessionInfo {
  session_id: string
  console_url?: string
  expires_at?: string
  status?: string
  name?: string
  // JSON string of enabled features (e.g. `{"network":true}`). Forwarded to
  // TerminalViewer so it can render the internet-access indicator.
  composed_features?: string
}

interface Props {
  sessionInfo: SessionInfo
  isActive: boolean
  isRecording?: boolean
  showStopButton?: boolean
  isStopping?: boolean
  // Forwarded to TerminalViewer — disables the Stop button (renders grayed)
  // when false instead of hiding the affordance.
  canStop?: boolean
  // Forwarded to TerminalViewer — adds a Destroy button (irreversible removal).
  showDestroyButton?: boolean
  isDestroying?: boolean
  showHistory?: boolean
  // Opt-in "expose a session port publicly" chip in the terminal header
  // (ExposedPortsChip.vue). Off by default: the parent turns it on for plain
  // terminals, and for scenario runs only when the scenario allows exposure.
  showExposedPorts?: boolean
  scenarioSessionId?: string
  scenarioFlagsEnabled?: boolean
  // Whether the running scenario arms crash traps. Passed through to the
  // viewer, which needs it to tell a fatal trap from an ordinary shell exit.
  scenarioCrashTraps?: boolean
  endReason?: 'completed' | 'abandoned' | 'expired' | 'stopped' | 'revoked' | 'setup_failed' | ''
  hasScenario?: boolean
  // Keep the console unconnected: tt-backend starts the shell on the first
  // connection, and a shell started during a scenario's setup misses the
  // environment the setup builds.
  holdConsole?: boolean
  // Where the shell runs. A machine in the learner's browser has no command
  // history (tt-backend records it); popped out, its window reaches it through
  // this tab.
  machine?: 'incus' | 'local'
  // The run's machine is unkernel's desktop (localMachine.ts setMachineRun).
  desktop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isRecording: false,
  showStopButton: false,
  isStopping: false,
  canStop: true,
  showDestroyButton: false,
  isDestroying: false,
  showHistory: true,
  showExposedPorts: false,
  scenarioSessionId: undefined,
  scenarioFlagsEnabled: false,
  scenarioCrashTraps: false,
  endReason: '',
  hasScenario: false,
  holdConsole: false,
  machine: 'incus',
  desktop: false
})

defineEmits<{
  stop: []
  destroy: []
  'recording-detected': []
  'session-warning': [level: 'info' | 'warning' | 'danger']
  'session-expired': []
  'session-stopped': []
}>()

const { t } = useTranslations({
  en: {
    terminalPanel: {
      poppedOut: 'The terminal is open in its own window.',
      bringBack: 'Bring it back here'
    }
  },
  fr: {
    terminalPanel: {
      poppedOut: 'Le terminal est ouvert dans une fenêtre séparée.',
      bringBack: 'Le remettre ici'
    }
  }
})

const { isPoppedOut, popOut, popIn } = useTerminalPopout()

function popOutConsole() {
  popOut(props.sessionInfo.session_id)
}

const terminalRef = ref<InstanceType<typeof TerminalViewer> | null>(null)
const validatedFlagsRef = ref<InstanceType<typeof ValidatedFlags> | null>(null)

function handleCommandClick(text: string) {
  terminalRef.value?.pasteText(text)
}

function pasteText(text: string) {
  terminalRef.value?.pasteText(text)
}

function refreshFlags() {
  validatedFlagsRef.value?.refresh()
}

defineExpose({
  terminalRef,
  pasteText,
  refreshFlags
})
</script>

<style scoped>
.terminal-session-panel :deep(.card-header) {
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: var(--panel-header-min-height);
  align-items: center;
}

.terminal-session-panel :deep(.header-actions) {
  align-items: center;
}

.terminal-session-panel :deep(.card-header h2) {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.terminal-session-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.ocf-console-popped-out {
  flex: 1 1 0;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  border: var(--border-width-thin) dashed var(--color-border-medium);
  border-radius: var(--border-radius-lg);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.ocf-console-popped-out > i {
  font-size: var(--font-size-xl);
  color: var(--color-text-muted);
}

.ocf-console-popped-out p {
  margin: 0;
}

/* The console never moves.
 *
 * It is a plain flex child of a column whose height is fixed by the viewport,
 * so it holds one position and one size for the whole session — no scrolling
 * happens above it or around it, and nothing the learner types can shift it.
 * `min-height` is the floor: on a screen too short to satisfy everyone, the
 * panels below give way rather than the console.
 *
 * `flex-basis: 0` is what makes the free space land here rather than being
 * split with the panels below. */
.terminal-session-panel :deep(.card) {
  flex: 1 1 0;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.terminal-session-panel :deep(.card-body) {
  padding: var(--spacing-sm);
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* The console's slot in the column, and the anchor for what is laid over it. */
.ocf-console-area {
  position: relative;
  flex: 1 1 0;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.ocf-console-overlay {
  position: absolute;
  inset: 0;
  z-index: 60;
  padding: var(--spacing-lg);
  overflow-y: auto;
  background-color: var(--color-bg-primary);
}

/* History and flags are reference material, so they yield to the console rather
 * than compete with it: a quarter of the column at most, and the console takes
 * everything else. Uncapped, their natural ~340px left a 200px console on a
 * 1440x700 screen — measured.
 *
 * They are laid out as flex boxes rather than plain blocks so each panel gets
 * this height and scrolls its own list inside it. The overflow here is only a
 * valve for a column too short even for that. */
.sub-panels {
  margin-top: var(--spacing-md);
  flex: 0 1 auto;
  min-height: 0;
  max-height: 25%;
  display: flex;
  gap: var(--spacing-md);
  overflow-y: auto;
}

.sub-panels > .command-history-panel,
.sub-panels > .validated-flags-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
}

.sub-panels > .command-history-panel {
  flex: 3;
}

.sub-panels.has-flags > .validated-flags-panel {
  flex: 1;
}


@media (max-width: 768px) {
  .sub-panels.has-flags {
    flex-direction: column;
  }
}
</style>
