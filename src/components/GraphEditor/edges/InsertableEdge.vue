<template>
  <!-- Standard edge path (smoothstep, matching the default edge style) -->
  <BaseEdge
    :id="id"
    :path="edgePath"
    :marker-end="markerEnd"
    :marker-start="markerStart"
    :style="style"
  />

  <!-- Insertion badge rendered in label layer (HTML overlay).
       Always rendered but kept low-opacity until hovered/focused so users can
       discover it without obscuring the edge. -->
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
      tabindex="0"
      :aria-label="ariaLabel"
      @keydown.enter.prevent="handleClick"
      @keydown.space.prevent="handleClick"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <button
        type="button"
        class="insertable-edge-badge"
        :title="ariaLabel"
        @click.stop="handleClick"
      >
        <i class="fas fa-plus"></i>
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
const ariaLabel = inject<string>('insertableEdgeAriaLabel', 'Insert a step here')

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

const handleClick = (event: MouseEvent | KeyboardEvent) => {
  // Use a custom DOM event so the parent (FlowCanvas) can listen on its container.
  // This avoids needing a shared event bus and works with Vue Flow's dynamic edge
  // component instantiation.
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
</script>

<style scoped>
.insertable-edge-badge-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  outline: none;
  /* Low opacity by default so the edge stays clean — bumps to 1 on hover/focus
     of the badge itself, so users can still discover it without it being loud. */
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

.insertable-edge-badge-wrapper.is-focused .insertable-edge-badge,
.insertable-edge-badge-wrapper:focus-within .insertable-edge-badge {
  background: var(--color-primary, #3b82f6);
  color: var(--color-text-inverse, #ffffff);
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}
</style>
