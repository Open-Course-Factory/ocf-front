<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Shared terminal session panel: TerminalViewer + CommandHistory + stop
 * Used by TerminalStarter (just created) and TerminalSessionView (dedicated page)
 */
-->

<template>
  <div class="terminal-session-panel">
    <!-- Terminal Console -->
    <TerminalViewer
      ref="terminalRef"
      :session-info="sessionInfo"
      :is-recording="isRecording"
      :end-reason="endReason"
      :has-scenario="hasScenario"
      :scenario-crash-traps="scenarioCrashTraps"
      supervision-enabled
      use-settings-card
      :title="sessionInfo?.name || ('Terminal ' + (sessionInfo?.session_id?.substring(0, 8) || ''))"
      icon="fas fa-terminal"
      :full-height="false"
      :show-stop-button="showStopButton"
      :is-stopping="isStopping"
      :can-stop="canStop"
      :show-destroy-button="showDestroyButton"
      :is-destroying="isDestroying"
      @stop="$emit('stop')"
      @destroy="$emit('destroy')"
      @session-warning="$emit('session-warning', $event)"
      @session-expired="$emit('session-expired')"
    />

    <!-- Sub-panels: Command History + Validated Flags side by side -->
    <div class="sub-panels" :class="{ 'has-flags': scenarioSessionId && scenarioFlagsEnabled }">
      <div v-if="showHistory" class="command-history-panel">
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
  // when false, showing the ephemeral tooltip instead of hiding the affordance.
  canStop?: boolean
  // Forwarded to TerminalViewer — adds a Destroy button (irreversible removal).
  showDestroyButton?: boolean
  isDestroying?: boolean
  showHistory?: boolean
  scenarioSessionId?: string
  scenarioFlagsEnabled?: boolean
  // Whether the running scenario arms crash traps. Passed through to the
  // viewer, which needs it to tell a fatal trap from an ordinary shell exit.
  scenarioCrashTraps?: boolean
  endReason?: 'completed' | 'abandoned' | 'expired' | 'stopped' | 'revoked' | 'setup_failed' | ''
  hasScenario?: boolean
}

withDefaults(defineProps<Props>(), {
  isRecording: false,
  showStopButton: false,
  isStopping: false,
  canStop: true,
  showDestroyButton: false,
  isDestroying: false,
  showHistory: true,
  scenarioSessionId: undefined,
  scenarioFlagsEnabled: false,
  scenarioCrashTraps: false,
  endReason: '',
  hasScenario: false
})

defineEmits<{
  stop: []
  destroy: []
  'recording-detected': []
  'session-warning': [level: 'info' | 'warning' | 'danger']
  'session-expired': []
}>()

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
