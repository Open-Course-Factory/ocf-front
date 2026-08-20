<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Recording indicator micro-component for terminal sessions
 * Displays a pulsing REC badge when command recording is active
 */
-->

<template>
  <!--
    Always rendered, hidden when idle.

    Recording is detected by a history poll, so this pill appeared mid-session
    in the terminal toolbar. Inserting it into a flex row that is already close
    to wrapping pushes the row — and the terminal below it — down, which is the
    screen "jumping" on a history refresh. Reserving the slot costs the width
    of a pill and keeps the toolbar still.
  -->
  <span
    class="recording-indicator"
    :class="{ 'is-idle': !isRecording }"
    :title="isRecording ? t('recording.tooltip') : undefined"
    :aria-hidden="!isRecording"
  >
    <span class="recording-dot"></span>
    <span class="recording-label">{{ t('recording.label') }}</span>
  </span>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'

interface Props {
  isRecording: boolean
}

defineProps<Props>()

const { t } = useTranslations({
  en: {
    recording: {
      label: 'REC',
      tooltip: 'Commands are being recorded'
    }
  },
  fr: {
    recording: {
      label: 'REC',
      tooltip: 'Les commandes sont enregistrées'
    }
  }
})
</script>

<style scoped>
/* Hidden, but still occupying its slot — see the template comment. */
.recording-indicator.is-idle {
  visibility: hidden;
}

.recording-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1;
  cursor: default;
  user-select: none;
}

.recording-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-warning);
  flex-shrink: 0;
  animation: breathe 3s ease-in-out infinite;
}

.recording-label {
  font-weight: 500;
  letter-spacing: 0.04em;
}

@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@media (prefers-reduced-motion: reduce) {
  .recording-dot {
    animation: none;
  }
}
</style>
