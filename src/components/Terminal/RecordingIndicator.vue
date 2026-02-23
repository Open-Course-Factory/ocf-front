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
  <span v-if="isRecording" class="recording-indicator" :title="t('recording.tooltip')">
    <i class="fas fa-circle recording-dot"></i> {{ t('recording.label') }}
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
      label: 'ENR',
      tooltip: 'Les commandes sont enregistrées'
    }
  }
})
</script>

<style scoped>
.recording-indicator {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.recording-dot {
  font-size: var(--font-size-xs);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .recording-dot {
    animation: none;
  }
}
</style>
