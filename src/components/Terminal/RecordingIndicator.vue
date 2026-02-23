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
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.recording-dot {
  font-size: 0.5rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
