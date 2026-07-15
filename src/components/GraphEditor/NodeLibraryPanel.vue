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
          tabindex="0"
          role="button"
          :title="nodeType.description"
          :aria-label="t('nodeLibrary.itemAriaLabel', { label: nodeType.label, description: nodeType.description })"
          @dragstart="handleDragStart($event, nodeType)"
          @dragend="handleDragEnd"
          @keydown.enter.prevent="handleKeyboardAdd(nodeType)"
          @keydown.space.prevent="handleKeyboardAdd(nodeType)"
        >
          <div
            class="node-library-preview"
            :style="{
              borderColor: nodeType.color,
              backgroundColor: nodeType.bgColor || 'transparent'
            }"
          >
            <span class="lib-icon" aria-hidden="true">{{ nodeType.icon }}</span>
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
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    nodeLibrary: {
      itemAriaLabel: '{label} — {description}. Press Enter or Space to add to canvas, or drag.'
    }
  },
  fr: {
    nodeLibrary: {
      itemAriaLabel: '{label} — {description}. Appuyez sur Entrée ou Espace pour ajouter au canevas, ou glissez.'
    }
  }
})

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
  (e: 'add-at-center', nodeType: string): void
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

const handleKeyboardAdd = (nodeType: NodeTypeDefinition) => {
  emit('add-at-center', nodeType.type)
}
</script>

<!-- Styles from editor-nodes.css (global, via main.css) -->
<!-- Node library item uses .node-library-item and .node-library-preview classes -->
