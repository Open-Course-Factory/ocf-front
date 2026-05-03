<template>
  <div
    v-if="visible"
    ref="rootRef"
    class="insert-node-picker"
    :style="positionStyle"
    role="menu"
    :aria-label="ariaLabel"
  >
    <div class="picker-header">{{ headerText }}</div>
    <button
      v-for="nodeType in nodeTypes"
      :key="nodeType.type"
      type="button"
      class="picker-item"
      :title="nodeType.description"
      :style="{ borderLeftColor: nodeType.color }"
      role="menuitem"
      @click.stop="handleSelect(nodeType)"
    >
      <span
        class="picker-item-icon"
        :style="{ backgroundColor: nodeType.bgColor || 'transparent' }"
      >{{ nodeType.icon }}</span>
      <span class="picker-item-label">{{ nodeType.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { NodeTypeDefinition } from './NodeLibraryPanel.vue'

interface Props {
  visible: boolean
  /** Available node types the user can pick from. */
  nodeTypes: NodeTypeDefinition[]
  /** Subset of types that are valid choices (others are hidden). */
  allowedTypes?: string[]
  /** Anchor in viewport (client) coordinates. */
  clientX: number
  clientY: number
  headerText?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  allowedTypes: () => [],
  headerText: 'Insert',
  ariaLabel: 'Insert node'
})

const emit = defineEmits<{
  (e: 'select', nodeType: NodeTypeDefinition): void
  (e: 'close'): void
}>()

const rootRef = ref<HTMLElement | null>(null)

const filteredNodeTypes = computed<NodeTypeDefinition[]>(() => {
  if (!props.allowedTypes || props.allowedTypes.length === 0) return props.nodeTypes
  return props.nodeTypes.filter((nt) => props.allowedTypes.includes(nt.type))
})

const positionStyle = computed(() => {
  // Center horizontally on the click point, place below by a small offset.
  // The picker uses position: fixed so coords are page-relative.
  return {
    position: 'fixed' as const,
    top: `${props.clientY + 12}px`,
    left: `${props.clientX}px`,
    transform: 'translateX(-50%)',
    zIndex: 1000
  }
})

const handleSelect = (nodeType: NodeTypeDefinition) => {
  emit('select', nodeType)
}

// Outside-click and Escape handling
const onDocumentMouseDown = (event: MouseEvent) => {
  if (!props.visible) return
  if (rootRef.value && rootRef.value.contains(event.target as Node)) return
  emit('close')
}

const onDocumentKeyDown = (event: KeyboardEvent) => {
  if (!props.visible) return
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
  }
}

// Replace the unfiltered `nodeTypes` we render with the filtered list
const nodeTypes = computed(() => filteredNodeTypes.value)

watch(
  () => props.visible,
  async (isVisible) => {
    if (isVisible) {
      document.addEventListener('mousedown', onDocumentMouseDown)
      document.addEventListener('keydown', onDocumentKeyDown)
      // Auto-focus the first item for keyboard accessibility
      await nextTick()
      const firstButton = rootRef.value?.querySelector<HTMLButtonElement>('.picker-item')
      firstButton?.focus()
    } else {
      document.removeEventListener('mousedown', onDocumentMouseDown)
      document.removeEventListener('keydown', onDocumentKeyDown)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown)
  document.removeEventListener('keydown', onDocumentKeyDown)
})
</script>

<style scoped>
.insert-node-picker {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  max-width: 260px;
  padding: 0.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.picker-header {
  padding: 0.375rem 0.5rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0.25rem;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border: none;
  border-left: 3px solid transparent;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: left;
  border-radius: 4px;
  transition: background 0.1s ease-in-out;
}

.picker-item:hover,
.picker-item:focus {
  background: var(--color-surface-hover);
  outline: none;
}

.picker-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  font-size: 1rem;
  flex-shrink: 0;
}

.picker-item-label {
  flex: 1;
  font-size: 0.875rem;
}
</style>
