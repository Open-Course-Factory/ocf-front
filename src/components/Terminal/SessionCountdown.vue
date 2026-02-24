<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Session countdown micro-component for terminal sessions
 * Displays remaining time with urgency-based styling and emits threshold warnings
 */
-->

<template>
  <span v-if="expiresAt" class="session-countdown" :class="urgencyClass" :title="t('countdown.tooltip')">
    <i class="fas fa-clock countdown-icon" :class="{ 'countdown-pulse': urgency === 'danger' }"></i>
    {{ formattedTime }}
  </span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

interface Props {
  expiresAt: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  warning: [level: 'info' | 'warning' | 'danger']
  expired: []
}>()

const { t } = useTranslations({
  en: {
    countdown: {
      tooltip: 'Time remaining in this session'
    }
  },
  fr: {
    countdown: {
      tooltip: 'Temps restant dans cette session'
    }
  }
})

const remainingSeconds = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null
const emittedThresholds = new Set<string>()

type Urgency = 'neutral' | 'info' | 'warning' | 'danger' | 'expired'

const urgency = computed<Urgency>(() => {
  const s = remainingSeconds.value
  if (s <= 0) return 'expired'
  if (s <= 60) return 'danger'
  if (s <= 300) return 'warning'
  if (s <= 600) return 'info'
  return 'neutral'
})

const urgencyClass = computed(() => `urgency-${urgency.value}`)

const formattedTime = computed(() => {
  const s = remainingSeconds.value
  if (s <= 0) return '0:00'

  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60

  if (hours >= 1) {
    return `${hours}h ${minutes}m`
  }
  if (s >= 300) {
    return `${minutes}m`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

function updateCountdown() {
  const expiresAtMs = new Date(props.expiresAt).getTime()
  const nowMs = Date.now()
  const diff = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000))
  remainingSeconds.value = diff

  if (diff <= 0) {
    if (!emittedThresholds.has('expired')) {
      emittedThresholds.add('expired')
      emit('expired')
    }
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    return
  }

  if (diff <= 60 && !emittedThresholds.has('danger')) {
    emittedThresholds.add('danger')
    emit('warning', 'danger')
  } else if (diff <= 300 && !emittedThresholds.has('warning')) {
    emittedThresholds.add('warning')
    emit('warning', 'warning')
  } else if (diff <= 600 && !emittedThresholds.has('info')) {
    emittedThresholds.add('info')
    emit('warning', 'info')
  }
}

onMounted(() => {
  updateCountdown()
  intervalId = setInterval(updateCountdown, 1000)
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
})
</script>

<style scoped>
.session-countdown {
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.urgency-neutral {
  color: var(--color-info, var(--color-text-secondary));
}

.urgency-info {
  color: var(--color-warning, #e6a23c);
}

.urgency-warning {
  color: var(--color-warning, #e6a23c);
  font-weight: var(--font-weight-semibold, 600);
}

.urgency-danger {
  color: var(--color-danger);
  font-weight: var(--font-weight-bold, 700);
}

.urgency-expired {
  color: var(--color-danger);
  font-weight: var(--font-weight-bold, 700);
}

.countdown-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .countdown-pulse {
    animation: none;
  }
}
</style>
