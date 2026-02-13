<template>
  <div class="node-library-panel">
    <div class="panel-header">
      <h3>{{ t('nodeLibrary.title') }}</h3>
    </div>

    <div class="panel-content">
      <div class="node-types">
        <div
          v-for="nodeType in nodeTypes"
          :key="nodeType.type"
          class="node-type-item"
          draggable="true"
          @dragstart="handleDragStart($event, nodeType)"
          @dragend="handleDragEnd"
        >
          <div class="node-preview" :class="`node-${nodeType.type}`">
            <span class="node-icon">{{ nodeType.icon }}</span>
            <span class="node-label">{{ t(`nodeLibrary.${nodeType.type}`) }}</span>
          </div>
          <div class="node-description">
            {{ t(`nodeLibrary.${nodeType.type}Description`) }}
          </div>
        </div>
      </div>

      <div class="library-footer">
        <p class="help-text">{{ t('nodeLibrary.dragInstruction') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    nodeLibrary: {
      title: 'Node Library',
      course: 'Course',
      chapter: 'Chapter',
      section: 'Section',
      page: 'Page',
      courseDescription: 'Root level course container',
      chapterDescription: 'Major course division',
      sectionDescription: 'Chapter subdivision',
      pageDescription: 'Individual content page',
      dragInstruction: 'Drag a node type onto the canvas to create a new entity'
    }
  },
  fr: {
    nodeLibrary: {
      title: 'Bibliothèque de Nœuds',
      course: 'Cours',
      chapter: 'Chapitre',
      section: 'Section',
      page: 'Page',
      courseDescription: 'Conteneur de cours principal',
      chapterDescription: 'Division majeure du cours',
      sectionDescription: 'Sous-division de chapitre',
      pageDescription: 'Page de contenu individuelle',
      dragInstruction: 'Glissez un type de nœud sur le canevas pour créer une nouvelle entité'
    }
  }
})

interface NodeType {
  type: string
  icon: string
  color: string
}

const nodeTypes = ref<NodeType[]>([
  { type: 'course', icon: '📚', color: '#4A90E2' },
  { type: 'chapter', icon: '📖', color: '#7B68EE' },
  { type: 'section', icon: '📄', color: '#50C878' },
  { type: 'page', icon: '📃', color: '#FFA500' }
])

const emit = defineEmits<{
  (e: 'node-drag-start', nodeType: string, data: any): void
  (e: 'node-drag-end'): void
}>()

const handleDragStart = (event: DragEvent, nodeType: NodeType) => {
  if (!event.dataTransfer) return

  // Set drag data
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/vueflow', JSON.stringify({
    type: nodeType.type,
    isNewNode: true
  }))

  // Create custom drag image
  const dragImage = event.currentTarget as HTMLElement
  event.dataTransfer.setDragImage(dragImage, 50, 25)

  // Emit event
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
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.panel-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.node-types {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.node-type-item {
  cursor: grab;
  border-radius: 8px;
  transition: all 0.2s;
  user-select: none;
}

.node-type-item:active {
  cursor: grabbing;
}

.node-type-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.node-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 2px solid;
  border-radius: 8px;
  transition: all 0.2s;
}

.node-type-item:hover .node-preview {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.node-preview.node-course {
  border-color: var(--course-node-course);
  background: var(--course-node-course-bg);
}

.node-preview.node-chapter {
  border-color: var(--course-node-chapter);
  background: var(--course-node-chapter-bg);
}

.node-preview.node-section {
  border-color: var(--course-node-section);
  background: var(--course-node-section-bg);
}

.node-preview.node-page {
  border-color: var(--course-node-page);
  background: var(--course-node-page-bg);
}

.node-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.node-label {
  flex: 1;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.node-description {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.library-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.help-text {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  text-align: center;
}

/* Drag state */
.node-type-item.dragging {
  opacity: 0.5;
}
</style>
