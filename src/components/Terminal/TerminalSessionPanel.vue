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
      use-settings-card
      :title="sessionInfo?.name || ('Terminal ' + (sessionInfo?.session_id?.substring(0, 8) || ''))"
      icon="fas fa-terminal"
      :full-height="false"
      :show-stop-button="showStopButton"
      :is-stopping="isStopping"
      @stop="$emit('stop')"
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
}

interface Props {
  sessionInfo: SessionInfo
  isActive: boolean
  isRecording?: boolean
  showStopButton?: boolean
  isStopping?: boolean
  showHistory?: boolean
  scenarioSessionId?: string
  scenarioFlagsEnabled?: boolean
}

withDefaults(defineProps<Props>(), {
  isRecording: false,
  showStopButton: false,
  isStopping: false,
  showHistory: true,
  scenarioSessionId: undefined,
  scenarioFlagsEnabled: false
})

defineEmits<{
  stop: []
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

.terminal-session-panel :deep(.card) {
  flex: 1;
  min-height: 0;
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

.sub-panels {
  margin-top: var(--spacing-md);
  flex-shrink: 0;
}

.sub-panels.has-flags {
  display: flex;
  gap: var(--spacing-md);
}

.sub-panels.has-flags > .command-history-panel {
  flex: 3;
  min-width: 0;
}

.sub-panels.has-flags > .validated-flags-panel {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .sub-panels.has-flags {
    flex-direction: column;
  }
}
</style>
