<template>
  <!-- Standard edge path (smoothstep, matching the default edge style) -->
  <BaseEdge
    :id="id"
    :path="edgePath"
    :marker-end="markerEnd"
    :marker-start="markerStart"
    :style="style"
  />

  <!-- Action badges rendered in label layer (HTML overlay).
       Always rendered but kept low-opacity until hovered/focused so users can
       discover them without obscuring the edge. Insert splits the link in two;
       remove takes it away so the chain can be redrawn. -->
  <EdgeLabelRenderer>
    <div
      class="insertable-edge-badge-wrapper"
      :data-edge-id="id"
      :class="{ 'is-focused': isFocused }"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${edgeLabelX}px, ${edgeLabelY}px)`,
        pointerEvents: 'all'
      }"
      @focus.capture="isFocused = true"
      @blur.capture="isFocused = false"
      @mouseenter="isFocused = true"
      @mouseleave="isFocused = false"
    >
      <button
        type="button"
        class="insertable-edge-badge"
        :title="insertLabel"
        :aria-label="insertLabel"
        @click.stop="handleInsert"
      >
        <i class="fas fa-plus" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="insertable-edge-badge insertable-edge-badge--remove"
        :title="removeLabel"
        :aria-label="removeLabel"
        @click.stop="handleRemove"
      >
        <i class="fas fa-minus" aria-hidden="true"></i>
      </button>
    </div>
  </EdgeLabelRenderer>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position } from '@vue-flow/core'

interface Props {
  id: string
  source: string
  target: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition?: Position
  targetPosition?: Position
  markerEnd?: string
  markerStart?: string
  style?: any
}

const props = defineProps<Props>()

const isFocused = ref(false)

// Allow parent canvas to inject an aria label translation
const insertLabel = inject<string>('insertableEdgeAriaLabel', 'Insert a step here')
const removeLabel = inject<string>('removableEdgeAriaLabel', 'Remove this link')

const pathTuple = computed(() => getSmoothStepPath({
  sourceX: props.sourceX,
  sourceY: props.sourceY,
  sourcePosition: props.sourcePosition ?? Position.Bottom,
  targetX: props.targetX,
  targetY: props.targetY,
  targetPosition: props.targetPosition ?? Position.Top
}))

const edgePath = computed(() => pathTuple.value[0])
const edgeLabelX = computed(() => pathTuple.value[1])
const edgeLabelY = computed(() => pathTuple.value[2])

// Both actions use a custom DOM event so the parent (FlowCanvas) can listen on
// its container. This avoids needing a shared event bus and works with Vue
// Flow's dynamic edge component instantiation.
const handleInsert = (event: MouseEvent | KeyboardEvent) => {
  const detail = {
    edgeId: props.id,
    source: props.source,
    target: props.target,
    // Approx midpoint in flow coordinates — the canvas can use this as drop position
    flowX: edgeLabelX.value,
    flowY: edgeLabelY.value,
    // Anchor for the picker popup (screen coords from the click event if available)
    clientX: 'clientX' in event ? event.clientX : 0,
    clientY: 'clientY' in event ? event.clientY : 0
  }
  window.dispatchEvent(new CustomEvent('graph-editor:insert-on-edge', { detail }))
}

// Removing a link is canvas-local: step order is only written on Save, so this
// is undone by Reset and needs no confirmation step.
const handleRemove = () => {
  window.dispatchEvent(
    new CustomEvent('graph-editor:remove-edge', { detail: { edgeId: props.id } })
  )
}
</script>

<style scoped>
.insertable-edge-badge-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Fixed width for both badges plus their gap. Sized rather than auto so the
     hit area never changes with state — the badges must not move under a
     cursor that is already on its way to one. */
  gap: 4px;
  width: 48px;
  height: 24px;
  outline: none;
  /* Low opacity by default so the edge stays clean — bumps to 1 on hover/focus
     of the badges themselves, so users can still discover them without them
     being loud. */
  opacity: 0.25;
  transition: opacity 0.12s ease-in-out;
}

.insertable-edge-badge-wrapper:hover,
.insertable-edge-badge-wrapper.is-focused,
.insertable-edge-badge-wrapper:focus-within {
  opacity: 1;
}

.insertable-edge-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--color-primary, #3b82f6);
  border-radius: 50%;
  background: var(--color-surface, #ffffff);
  color: var(--color-primary, #3b82f6);
  font-size: 0.75rem;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: background 0.12s ease-in-out, color 0.12s ease-in-out, transform 0.08s ease-in-out;
}

.insertable-edge-badge:hover {
  background: var(--color-primary, #3b82f6);
  color: var(--color-text-inverse, #ffffff);
  transform: scale(1.1);
}

.insertable-edge-badge:focus-visible {
  background: var(--color-primary, #3b82f6);
  color: var(--color-text-inverse, #ffffff);
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}

/* Removing a link is the destructive half, so it reads as destructive rather
   than borrowing the insert badge's primary colour. */
.insertable-edge-badge--remove {
  border-color: var(--color-danger, #dc2626);
  color: var(--color-danger, #dc2626);
}

.insertable-edge-badge--remove:hover {
  background: var(--color-danger, #dc2626);
  color: var(--color-text-inverse, #ffffff);
}

.insertable-edge-badge--remove:focus-visible {
  background: var(--color-danger, #dc2626);
  outline-color: var(--color-danger, #dc2626);
}
</style>
