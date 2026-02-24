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
      title="Console Terminal"
      :full-height="false"
      :show-stop-button="showStopButton"
      :is-stopping="isStopping"
      @stop="$emit('stop')"
      @session-warning="$emit('session-warning', $event)"
      @session-expired="$emit('session-expired')"
    />

    <!-- Command History -->
    <div v-if="showHistory" class="command-history-panel">
      <CommandHistory
        :session-id="sessionInfo?.session_id"
        :is-active="isActive"
        @command-click="handleCommandClick"
        @recording-detected="$emit('recording-detected')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TerminalViewer from './TerminalViewer.vue'
import CommandHistory from './CommandHistory.vue'

interface SessionInfo {
  session_id: string
  console_url?: string
  expires_at?: string
  status?: string
}

interface Props {
  sessionInfo: SessionInfo
  isActive: boolean
  isRecording?: boolean
  showStopButton?: boolean
  isStopping?: boolean
  showHistory?: boolean
}

withDefaults(defineProps<Props>(), {
  isRecording: false,
  showStopButton: false,
  isStopping: false,
  showHistory: true
})

defineEmits<{
  stop: []
  'recording-detected': []
  'session-warning': [level: 'info' | 'warning' | 'danger']
  'session-expired': []
}>()

const terminalRef = ref<InstanceType<typeof TerminalViewer> | null>(null)

function handleCommandClick(text: string) {
  terminalRef.value?.pasteText(text)
}

defineExpose({
  terminalRef
})
</script>

<style scoped>
.command-history-panel {
  margin-top: var(--spacing-md);
}
</style>
