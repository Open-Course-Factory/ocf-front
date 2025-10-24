<template>
  <div class="tree-node" :class="`tree-node-${entityType}`" :style="{ paddingLeft: `${level * 1.25}rem` }">
    <div
      class="node-header"
      draggable="true"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @click="toggleExpanded"
    >
      <span v-if="hasChildren" class="expand-icon" :class="{ expanded: isExpanded }">
        ▶
      </span>
      <span v-else class="expand-icon-placeholder"></span>

      <span class="node-icon">{{ getIcon(entityType) }}</span>
      <span class="node-label">{{ getLabel(entity, entityType) }}</span>

      <div class="node-actions" @click.stop>
        <button
          class="action-btn"
          :title="t('treeNode.duplicate')"
          @click="handleDuplicate"
        >
          📋
        </button>
        <button
          class="action-btn"
          :title="t('treeNode.move')"
          @click="handleMove"
        >
          ✂️
        </button>
      </div>
    </div>

    <div v-if="isExpanded && hasChildren" class="node-children">
      <!-- Chapters -->
      <template v-if="entityType === 'course' && entity.chapters">
        <CourseTreeNode
          v-for="chapter in sortedChildren(entity.chapters)"
          :key="chapter.id"
          :entity="chapter"
          entity-type="chapter"
          :level="level + 1"
          @entity-drag-start="$emit('entity-drag-start', $event, 'chapter')"
          @duplicate="$emit('duplicate', $event, 'chapter')"
          @move="$emit('move', $event)"
        />
      </template>

      <!-- Sections -->
      <template v-if="entityType === 'chapter' && entity.sections">
        <CourseTreeNode
          v-for="section in sortedChildren(entity.sections)"
          :key="section.id"
          :entity="section"
          entity-type="section"
          :level="level + 1"
          @entity-drag-start="$emit('entity-drag-start', $event, 'section')"
          @duplicate="$emit('duplicate', $event, 'section')"
          @move="$emit('move', $event)"
        />
      </template>

      <!-- Pages -->
      <template v-if="entityType === 'section' && entity.pages">
        <CourseTreeNode
          v-for="page in sortedChildren(entity.pages)"
          :key="page.id"
          :entity="page"
          entity-type="page"
          :level="level + 1"
          @entity-drag-start="$emit('entity-drag-start', $event, 'page')"
          @duplicate="$emit('duplicate', $event, 'page')"
          @move="$emit('move', $event)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    treeNode: {
      duplicate: 'Duplicate to another course',
      move: 'Move to another parent'
    }
  },
  fr: {
    treeNode: {
      duplicate: 'Dupliquer vers un autre cours',
      move: 'Déplacer vers un autre parent'
    }
  }
})

interface Props {
  entity: any
  entityType: 'course' | 'chapter' | 'section' | 'page'
  level: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'entity-drag-start', entity: any, entityType: string): void
  (e: 'duplicate', entity: any, entityType: string): void
  (e: 'move', entity: any): void
}>()

const isExpanded = ref(props.level < 1) // Auto-expand first level
const isDragging = ref(false)

const hasChildren = computed(() => {
  if (props.entityType === 'course') return props.entity.chapters && props.entity.chapters.length > 0
  if (props.entityType === 'chapter') return props.entity.sections && props.entity.sections.length > 0
  if (props.entityType === 'section') return props.entity.pages && props.entity.pages.length > 0
  return false
})

const toggleExpanded = () => {
  if (hasChildren.value) {
    isExpanded.value = !isExpanded.value
  }
}

const getIcon = (type: string): string => {
  const icons: Record<string, string> = {
    course: '📚',
    chapter: '📖',
    section: '📄',
    page: '📃'
  }
  return icons[type] || '📄'
}

const getLabel = (entity: any, type: string): string => {
  if (type === 'course') {
    return `${entity.name} v${entity.version}`
  }
  return entity.title || entity.name || 'Untitled'
}

const sortedChildren = (children: any[]): any[] => {
  if (!children) return []
  return [...children].sort((a, b) => {
    const orderA = a.order ?? a.number ?? 0
    const orderB = b.order ?? b.number ?? 0
    return orderA - orderB
  })
}

const handleDragStart = (event: DragEvent) => {
  if (!event.dataTransfer) return

  isDragging.value = true
  event.dataTransfer.effectAllowed = 'copyMove'
  event.dataTransfer.setData('application/vueflow', JSON.stringify({
    type: props.entityType,
    isNewNode: false,
    entityId: props.entity.id,
    label: getLabel(props.entity, props.entityType),
    entity: props.entity
  }))

  emit('entity-drag-start', props.entity, props.entityType)
}

const handleDragEnd = () => {
  isDragging.value = false
}

const handleDuplicate = () => {
  emit('duplicate', props.entity, props.entityType)
}

const handleMove = () => {
  emit('move', props.entity)
}
</script>

<style scoped>
.tree-node {
  font-size: 0.875rem;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  border-radius: 4px;
  margin: 0 0.5rem;
}

.node-header:hover {
  background: var(--color-surface-hover);
}

.node-header:active {
  cursor: grabbing;
}

.expand-icon {
  font-size: 0.625rem;
  color: var(--color-text-secondary);
  transition: transform 0.2s;
  display: inline-block;
  width: 0.75rem;
  text-align: center;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.expand-icon-placeholder {
  width: 0.75rem;
  display: inline-block;
}

.node-icon {
  font-size: 1rem;
  line-height: 1;
}

.node-label {
  flex: 1;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.node-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.15s;
}

.node-header:hover .node-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  border-radius: 3px;
  transition: background 0.15s;
  line-height: 1;
}

.action-btn:hover {
  background: var(--color-surface-variant);
}

.node-children {
  margin-top: 0.25rem;
}

/* Entity type colors */
.tree-node-course > .node-header {
  font-weight: 600;
  border-left: 3px solid #4A90E2;
  background: #E8F0FB;
}

.tree-node-chapter > .node-header {
  font-weight: 500;
  border-left: 3px solid #7B68EE;
  background: #EBE8F5;
}

.tree-node-section > .node-header {
  font-weight: 400;
  border-left: 3px solid #50C878;
  background: #E6F5ED;
}

.tree-node-page > .node-header {
  font-weight: 400;
  border-left: 3px solid #FFA500;
  background: #FFF3E6;
}

/* Dragging state */
.node-header.dragging {
  opacity: 0.5;
}
</style>
