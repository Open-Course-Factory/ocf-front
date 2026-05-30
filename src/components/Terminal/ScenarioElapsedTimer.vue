<template>
  <span v-if="label" class="elapsed-timer" :title="t('scenarioPanel.elapsed')">
    <i class="fas fa-clock"></i>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, type Ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: { scenarioPanel: { elapsed: 'Elapsed' } },
  fr: { scenarioPanel: { elapsed: 'Temps écoulé' } }
})

const props = withDefaults(defineProps<{ startedAt?: string | null }>(), {
  startedAt: null
})

const label = ref('')
const timerInterval: Ref<ReturnType<typeof setInterval> | null> = ref(null)

function tick() {
  if (!props.startedAt) {
    label.value = ''
    return
  }
  const startMs = new Date(props.startedAt).getTime()
  const totalSeconds = Math.floor((Date.now() - startMs) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  label.value = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`
}

function stop() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function start() {
  stop()
  tick()
  if (props.startedAt) {
    timerInterval.value = setInterval(tick, 1000)
  }
}

watch(() => props.startedAt, start, { immediate: true })

onBeforeUnmount(stop)
</script>

<style scoped>
.elapsed-timer {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.elapsed-timer i {
  font-size: 0.7em;
  opacity: 0.8;
}
</style>
