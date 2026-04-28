<template>
  <div class="node-library-panel">
    <div class="panel-header">
      <h3>{{ panelTitle }}</h3>
    </div>

    <div class="panel-content">
      <div class="node-types">
        <div
          v-for="nodeType in nodeTypes"
          :key="nodeType.type"
          class="node-type-item"
          draggable="true"
          :title="nodeType.description"
          @dragstart="handleDragStart($event, nodeType)"
          @dragend="handleDragEnd"
        >
          <div
            class="node-preview"
            :style="{
              borderColor: nodeType.color,
              backgroundColor: nodeType.bgColor || 'transparent'
            }"
          >
            <span class="node-icon">{{ nodeType.icon }}</span>
            <span class="node-label">{{ nodeType.label }}</span>
          </div>
        </div>
      </div>

      <div class="library-footer">
        <p class="help-text">{{ helpText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface NodeTypeDefinition {
  type: string
  icon: string
  color: string
  bgColor?: string
  label: string
  description: string
}

interface Props {
  nodeTypes: NodeTypeDefinition[]
  panelTitle?: string
  helpText?: string
}

withDefaults(defineProps<Props>(), {
  panelTitle: 'Node Library',
  helpText: 'Drag a node type onto the canvas to create a new entity'
})

const emit = defineEmits<{
  (e: 'node-drag-start', nodeType: string, data: any): void
  (e: 'node-drag-end'): void
}>()

const handleDragStart = (event: DragEvent, nodeType: NodeTypeDefinition) => {
  if (!event.dataTransfer) return

  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/vueflow', JSON.stringify({
    type: nodeType.type,
    isNewNode: true
  }))

  const dragImage = event.currentTarget as HTMLElement
  event.dataTransfer.setDragImage(dragImage, 50, 25)

  emit('node-drag-start', nodeType.type, nodeType)
}

const handleDragEnd = () => {
  emit('node-drag-end')
}
</script>

<style scoped>
.node-library-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
}

.panel-header {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.panel-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.node-types {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.node-type-item {
  cursor: grab;
  border-radius: 6px;
  transition: all 0.15s;
  user-select: none;
}

.node-type-item:active {
  cursor: grabbing;
  opacity: 0.7;
}

.node-type-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.node-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border: 2px solid;
  border-radius: 6px;
  transition: all 0.15s;
}

.node-icon {
  font-size: 1.1rem;
  line-height: 1;
  flex-shrink: 0;
}

.node-label {
  flex: 1;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.library-footer {
  margin-top: auto;
  padding: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.help-text {
  margin: 0;
  font-size: 0.65rem;
  color: var(--color-text-secondary);
  line-height: 1.3;
  text-align: center;
  opacity: 0.7;
}

.node-type-item.dragging {
  opacity: 0.5;
}
</style>
