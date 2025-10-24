<template>
  <div
    class="custom-node"
    :class="[nodeClass, { 'is-new': data.isNew, 'is-selected': selected }]"
    :style="{ borderColor: borderColor, backgroundColor: backgroundColor }"
  >
    <!-- Connection handles on all 4 sides -->
    <Handle type="target" :position="Position.Top" id="top" />
    <Handle type="target" :position="Position.Left" id="left" />
    <Handle type="target" :position="Position.Right" id="right" />
    <Handle type="target" :position="Position.Bottom" id="bottom-target" />

    <div
      class="node-content"
      :class="{ 'is-expandable': isExpandable }"
      @click="handleContentClick"
      @dblclick.stop="handleContentDoubleClick"
    >
      <div class="node-header">
        <span class="node-icon">{{ icon }}</span>
        <div class="node-title-container">
          <slot name="header">
            <div class="node-title">{{ data.label || defaultLabel }}</div>
            <div v-if="subtitle" class="node-subtitle">{{ subtitle }}</div>
          </slot>
        </div>
        <span v-if="isExpandable" class="expand-indicator">
          {{ data.isExpanded ? '▼' : '▶' }}
        </span>
      </div>

      <div v-if="data.isNew" class="node-badge new-badge">New</div>

      <!-- Slot for custom metadata -->
      <slot name="metadata"></slot>
    </div>

    <!-- Action buttons - completely isolated from click delay logic -->
    <div class="node-actions" @click.stop @dblclick.stop>
      <button
        v-if="isExpandable"
        @click="handleSelectTree($event)"
        @mousedown.stop
        @dblclick.stop
        class="action-btn select-tree-btn"
        title="Select with children"
      >
        ☑️
      </button>
      <button
        @click="handleEdit($event)"
        @mousedown.stop
        @dblclick.stop
        class="action-btn"
        title="Edit"
      >
        ✏️
      </button>
      <button
        @click="handleDelete($event)"
        @mousedown.stop
        @dblclick.stop
        class="action-btn delete-btn"
        title="Delete"
      >
        🗑️
      </button>
    </div>

    <!-- Source handles on all 4 sides -->
    <Handle type="source" :position="Position.Top" id="top-source" />
    <Handle type="source" :position="Position.Left" id="left-source" />
    <Handle type="source" :position="Position.Right" id="right-source" />
    <Handle type="source" :position="Position.Bottom" id="bottom-source" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Handle, Position } from '@vue-flow/core'

interface Props {
  data: {
    label?: string
    isNew?: boolean
    entityId?: string
    isExpanded?: boolean
    [key: string]: any
  }
  selected?: boolean
  icon: string
  nodeClass: string
  defaultLabel: string
  borderColor: string
  backgroundColor: string
  childrenKey?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'edit', data: any): void
  (e: 'delete', data: any): void
  (e: 'toggle-expand', data: any): void
  (e: 'select-tree', data: any): void
}>()

// Click delay timer to distinguish single from double click
const clickTimer = ref<number | null>(null)

const isExpandable = computed(() => {
  if (!props.childrenKey) return false
  const children = props.data[props.childrenKey]
  return children && children.length > 0
})

const subtitle = computed(() => {
  // This can be overridden via the header slot
  return null
})

const handleEdit = (event?: MouseEvent) => {
  console.log('BaseNode: handleEdit called', props.data)
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  emit('edit', props.data)
}

const handleDelete = (event?: MouseEvent) => {
  console.log('BaseNode: handleDelete called', props.data)
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  emit('delete', props.data)
}

const handleToggleExpand = () => {
  emit('toggle-expand', props.data)
}

const handleSelectTree = (event?: MouseEvent) => {
  console.log('BaseNode: handleSelectTree called', props.data)
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  emit('select-tree', props.data)
}

const handleContentClick = (event: MouseEvent) => {
  // Don't handle when Ctrl/Cmd is held (let Vue Flow handle multi-select)
  if (event.ctrlKey || event.metaKey) {
    return
  }

  // Clear any existing timer
  if (clickTimer.value) {
    clearTimeout(clickTimer.value)
  }

  // Capture the current selection state
  const wasSelected = props.selected

  // Wait 250ms to see if it's a double-click
  clickTimer.value = window.setTimeout(() => {
    // If node was not selected, just selecting it is enough (Vue Flow handles this)
    // If node was already selected AND expandable, toggle expand/collapse
    if (wasSelected && isExpandable.value) {
      handleToggleExpand()
    }
    // If not selected, Vue Flow will select it automatically via the click
    clickTimer.value = null
  }, 250)
}

const handleContentDoubleClick = (event: MouseEvent) => {
  console.log('BaseNode: handleContentDoubleClick triggered')

  // Prevent Vue Flow from handling this event
  event.preventDefault()
  event.stopPropagation()

  // Clear the single-click timer
  if (clickTimer.value) {
    clearTimeout(clickTimer.value)
    clickTimer.value = null
  }

  // Don't select tree when Ctrl/Cmd is held (let Vue Flow handle multi-select)
  if (event.ctrlKey || event.metaKey) {
    console.log('BaseNode: Ctrl/Cmd held, skipping select tree')
    return
  }

  // Select this node and all its children
  console.log('BaseNode: calling handleSelectTree from double-click')
  handleSelectTree()
}
</script>

<style scoped>
.custom-node {
  border: 2px solid;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  position: relative;
}

.custom-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.custom-node.is-selected {
  border-color: var(--color-primary);
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3), 0 4px 16px rgba(74, 144, 226, 0.4);
  background: linear-gradient(135deg, var(--color-surface) 0%, rgba(74, 144, 226, 0.05) 100%);
  transform: scale(1.02);
}

.custom-node.is-new {
  border-style: dashed;
}

.node-content {
  position: relative;
}

.node-content.is-expandable {
  cursor: pointer;
  user-select: none;
}

.node-content.is-expandable:hover {
  opacity: 0.9;
}

.node-content.is-expandable:active {
  opacity: 0.95;
}

.node-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.expand-indicator {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  margin-left: auto;
  flex-shrink: 0;
  line-height: 1;
}

.node-icon {
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
}

.node-title-container {
  flex: 1;
  min-width: 0;
}

.node-title {
  font-weight: 600;
  font-size: 0.7rem;
  color: var(--color-text-primary);
  word-wrap: break-word;
  line-height: 1.3;
}

.node-subtitle {
  font-size: 0.6rem;
  color: var(--color-text-secondary);
  margin-top: 0.125rem;
}

.node-badge {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: var(--color-primary);
  color: white;
  font-size: 0.5rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.new-badge {
  background: #50C878;
}

.node-actions {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.25rem;
  border-top: 2px solid var(--color-border);
  background: rgba(0, 0, 0, 0.03);
  opacity: 1;
  transition: all 0.2s;
  position: relative;
  z-index: 10;
  cursor: default;
  user-select: none;
  margin-left: -0.75rem;
  margin-right: -0.75rem;
  margin-bottom: -0.75rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  backdrop-filter: brightness(0.97);
}

.node-actions:hover {
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: brightness(0.95);
}

.action-btn {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s;
  position: relative;
  z-index: 1;
  pointer-events: auto;
  user-select: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.action-btn:hover {
  background: var(--color-surface-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.select-tree-btn:hover {
  background: rgba(74, 144, 226, 0.1);
  border-color: var(--color-primary);
}

.delete-btn:hover {
  background: #fee;
  border-color: #f44336;
}
</style>
