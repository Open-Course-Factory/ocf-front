<!--
  The place of the run's desktop, where the console would be. The desktop's
  iframe stays a child of <body> (moving an iframe reloads its page): this
  keeps it laid over the slot, and hides it while something covers the slot
  (the build overlay, a banner).
-->
<template>
  <div ref="slotEl" class="ocf-desktop-slot" data-testid="desktop-slot">
    <div v-if="failed" class="ocf-desktop-waiting ocf-desktop-failed" role="alert" data-testid="desktop-failed">
      <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>
      <p>{{ t('desktopSlot.failed') }}</p>
    </div>
    <div v-else-if="!frame" class="ocf-desktop-waiting" role="status">
      <i class="fas fa-desktop" aria-hidden="true"></i>
      <span class="visually-hidden">{{ t('desktopSlot.starting') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { desktopFailures, desktopFrames, onDesktopFrames } from '../../services/domain/terminal/localMachine'
import { useTranslations } from '../../composables/useTranslations'

const props = defineProps<{ terminal: string; covered: boolean }>()

const { t } = useTranslations({
  en: { desktopSlot: {
    starting: 'The desktop is starting.',
    failed: 'The desktop did not start. Reload the page to try again.'
  } },
  fr: { desktopSlot: {
    starting: 'Le bureau démarre.',
    failed: "Le bureau n'a pas démarré. Rechargez la page pour réessayer."
  } }
})

const slotEl = ref<HTMLElement | null>(null)
const frame = ref<HTMLIFrameElement | null>(null)
const failed = ref(false)

function read() {
  frame.value = desktopFrames.get(props.terminal) ?? null
  failed.value = desktopFailures.has(props.terminal)
}

function place() {
  const f = frame.value
  const el = slotEl.value
  if (!f || !el) return
  const r = el.getBoundingClientRect()
  f.style.left = `${r.left}px`
  f.style.top = `${r.top}px`
  f.style.width = `${r.width}px`
  f.style.height = `${r.height}px`
  f.style.visibility = props.covered || r.width === 0 ? 'hidden' : 'visible'
}

let raf = 0
// The slot moves and resizes with the page around it (the panel's width, a
// scroll, the window): follow it every frame, one getBoundingClientRect each.
function follow() {
  place()
  raf = requestAnimationFrame(follow)
}

const stopListening = onDesktopFrames(read)
onMounted(() => {
  read()
  follow()
})
onBeforeUnmount(() => {
  stopListening()
  cancelAnimationFrame(raf)
  if (frame.value) frame.value.style.visibility = 'hidden'
})
</script>

<style scoped>
.ocf-desktop-slot {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 480px;
  background: var(--terminal-bg);
  border-radius: var(--border-radius-md);
}
.ocf-desktop-waiting {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.75rem;
  color: var(--color-text-muted);
  font-size: 2rem;
}
.ocf-desktop-failed p {
  margin: 0;
  font-size: 1rem;
  max-width: 28rem;
  text-align: center;
}
</style>
