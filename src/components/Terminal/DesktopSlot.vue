<!--
  The place of the run's desktop, where the console would be. The desktop's
  iframe stays a child of <body> (moving an iframe reloads its page): this
  keeps it laid over the slot, and hides it while something covers the slot
  (the build overlay, a banner). Its header is the console's (TerminalViewer):
  the run's name, the network, the countdown, Stop, with Full screen where the
  console has pop out: the desktop cannot pop out, since moving its iframe to
  another window would reload it and lose the machine.
-->
<template>
  <SettingsCard class="ocf-desktop-card" :title="title" icon="fas fa-desktop" single-line-title data-testid="desktop-slot">
    <template #headerActions>
      <NetworkIndicator :on="hasNetwork" />
      <button
        type="button"
        class="ocf-desktop-fullscreen"
        :disabled="!frame"
        :title="t('desktopSlot.fullScreen')"
        :aria-label="t('desktopSlot.fullScreen')"
        data-testid="desktop-fullscreen"
        @click="fullScreen"
      >
        <i class="fas fa-expand" aria-hidden="true"></i>
      </button>
      <SessionCountdown
        v-if="sessionInfo?.expires_at"
        :expires-at="sessionInfo.expires_at"
        @warning="emit('session-warning', $event)"
        @expired="emit('session-expired')"
      />
      <Button
        v-if="showStopButton && frame"
        variant="danger"
        size="sm"
        :icon="isStopping ? 'fas fa-spinner fa-spin' : 'fas fa-stop'"
        :disabled="isStopping || !canStop"
        :title="sessionControls.stopTitle(canStop)"
        @click="emit('stop')"
      >
        {{ sessionControls.stop() }}
      </Button>
      <Button
        v-if="showDestroyButton && frame"
        variant="danger"
        size="sm"
        :icon="isDestroying ? 'fas fa-spinner fa-spin' : 'fas fa-trash'"
        :disabled="isDestroying"
        :title="sessionControls.destroyTooltip()"
        @click="emit('destroy')"
      >
        {{ sessionControls.destroy() }}
      </Button>
    </template>

    <div ref="areaEl" class="ocf-desktop-area">
      <div v-if="failed" class="ocf-desktop-waiting ocf-desktop-failed" role="alert" data-testid="desktop-failed">
        <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>
        <p>{{ t('desktopSlot.failed') }}</p>
      </div>
      <div v-else-if="!frame" class="ocf-desktop-waiting" role="status">
        <i class="fas fa-desktop" aria-hidden="true"></i>
        <span class="visually-hidden">{{ t('desktopSlot.starting') }}</span>
      </div>
    </div>
  </SettingsCard>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import SettingsCard from '../UI/SettingsCard.vue'
import Button from '../UI/Button.vue'
import SessionCountdown from './SessionCountdown.vue'
import NetworkIndicator from './NetworkIndicator.vue'
import { sessionHasNetwork } from '../../utils/sessionState'
import { desktopLearnerTerminal } from '../../services/domain/terminal/localMachine'
import { desktopFailures, desktopFrames, onDesktopFrames } from '../../services/domain/terminal/localMachineDesktop'
import { useTranslations } from '../../composables/useTranslations'
import { useSessionControlTexts } from '../../composables/useSessionControlTexts'

// hold: the run is being built; the learner's terminal opens after, as the
// console's shell does (TerminalSessionPanel holdConsole).
const props = withDefaults(defineProps<{
  terminal: string
  covered: boolean
  hold: boolean
  title: string
  sessionInfo?: any
  showStopButton?: boolean
  isStopping?: boolean
  canStop?: boolean
  showDestroyButton?: boolean
  isDestroying?: boolean
}>(), { sessionInfo: undefined, showStopButton: false, isStopping: false, canStop: true, showDestroyButton: false, isDestroying: false })

// As the console's: the panel turns them into the page's own handlers.
const emit = defineEmits<{
  stop: []
  destroy: []
  'session-warning': [level: 'info' | 'warning' | 'danger']
  'session-expired': []
}>()

const hasNetwork = computed(() => sessionHasNetwork(props.sessionInfo))

const { t } = useTranslations({
  en: { desktopSlot: {
    starting: 'The desktop is starting.',
    fullScreen: 'Full screen (Esc to come back to the instructions)',
    failed: 'The desktop did not start. Reload the page to try again.'
  } },
  fr: { desktopSlot: {
    starting: 'Le bureau démarre.',
    fullScreen: 'Plein écran (Échap pour revenir aux consignes)',
    failed: "Le bureau n'a pas démarré. Rechargez la page pour réessayer."
  } }
})

const sessionControls = useSessionControlTexts()

const areaEl = ref<HTMLElement | null>(null)
const frame = ref<HTMLIFrameElement | null>(null)
const failed = ref(false)

function read() {
  frame.value = desktopFrames.get(props.terminal) ?? null
  failed.value = desktopFailures.has(props.terminal)
}

function place() {
  const f = frame.value
  const el = areaEl.value
  if (!f || !el) return
  const r = el.getBoundingClientRect()
  f.style.left = `${r.left}px`
  f.style.top = `${r.top}px`
  f.style.width = `${r.width}px`
  f.style.height = `${r.height}px`
  f.style.visibility = props.covered || r.width === 0 ? 'hidden' : 'visible'
}

// The desktop's iframe fills the screen (it was created with
// allow="fullscreen"); Esc gives the page back.
function fullScreen() {
  frame.value?.requestFullscreen().catch(() => {})
}

// The slot moves and resizes with the page around it: the panel's width and
// anything above it that grows or shrinks (a closed notice) resize the slot
// or the page, a scroll moves it. Placed again on each, never every frame.
const resized = new ResizeObserver(place)
watch([frame, () => props.covered], place)

watchEffect(() => {
  // A failure leaves the desktop without it: Verify still runs, and a click on
  // a command opens it again.
  if (frame.value && !props.hold) desktopLearnerTerminal(props.terminal).catch(() => {})
})

const stopListening = onDesktopFrames(read)
onMounted(() => {
  read()
  resized.observe(areaEl.value!)
  resized.observe(document.body)
  // Capture: a scroll in any of the page's scrolling boxes, not the window's alone.
  window.addEventListener('scroll', place, { capture: true, passive: true })
  window.addEventListener('resize', place)
})
onBeforeUnmount(() => {
  stopListening()
  resized.disconnect()
  window.removeEventListener('scroll', place, { capture: true })
  window.removeEventListener('resize', place)
  if (frame.value) frame.value.style.visibility = 'hidden'
})
</script>

<style scoped>
/* The iframe lies on <body>, out of the page's flow: while the learner drags
   the panel's edge (TerminalSessionView), it must not swallow the mouse. */
:global(.ocf-panel-resizing .ocf-desktop-frame) {
  pointer-events: none;
}
.ocf-desktop-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.ocf-desktop-card :deep(.card-body) {
  flex: 1;
  display: flex;
  padding: 0;
}
.ocf-desktop-fullscreen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-full);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.ocf-desktop-fullscreen:hover:not(:disabled) {
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.ocf-desktop-fullscreen:disabled {
  cursor: default;
  opacity: 0.5;
}
.ocf-desktop-area {
  position: relative;
  flex: 1;
  min-height: 480px;
  background: var(--terminal-bg);
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
