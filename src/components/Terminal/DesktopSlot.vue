<!--
  The place of the run's desktop, where the console would be. The desktop's
  iframe stays a child of <body> (moving an iframe reloads its page): this
  keeps it laid over the slot, and hides it while something covers the slot
  (the build overlay, a banner).
-->
<template>
  <div ref="slotEl" class="ocf-desktop-slot" data-testid="desktop-slot">
    <div v-if="!frame" class="ocf-desktop-waiting">
      <i class="fas fa-desktop" aria-hidden="true"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { desktopFrames, onDesktopFrames } from '../../services/domain/terminal/localMachine'

const props = defineProps<{ terminal: string; covered: boolean }>()

const slotEl = ref<HTMLElement | null>(null)
const frame = ref<HTMLIFrameElement | null>(null)

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

const stopListening = onDesktopFrames(() => { frame.value = desktopFrames.get(props.terminal) ?? null })
onMounted(() => {
  frame.value = desktopFrames.get(props.terminal) ?? null
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
  background: var(--color-gray-900, #000);
  border-radius: var(--border-radius-md, 6px);
}
.ocf-desktop-waiting {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--color-text-muted);
  font-size: 2rem;
}
</style>
