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
          class="node-library-item"
          draggable="true"
          :title="nodeType.description"
          @dragstart="handleDragStart($event, nodeType)"
          @dragend="handleDragEnd"
        >
          <div
            class="node-library-preview"
            :style="{
              borderColor: nodeType.color,
              backgroundColor: nodeType.bgColor || 'transparent'
            }"
          >
            <span class="lib-icon">{{ nodeType.icon }}</span>
            <span class="lib-label">{{ nodeType.label }}</span>
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

<!-- Styles from editor-nodes.css (global, via main.css) -->
<!-- Node library item uses .node-library-item and .node-library-preview classes -->
