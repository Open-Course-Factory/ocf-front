<template>
  <BaseNode
    :data="data"
    :selected="selected"
    icon="📚"
    node-class="course-node"
    default-label="New Course"
    border-color="#4A90E2"
    background-color="#E8F0FB"
    children-key="chapters"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @toggle-expand="emit('toggle-expand', $event)"
    @select-tree="emit('select-tree', $event)"
  >
    <template #header>
      <div class="node-title">{{ data.label || 'New Course' }}</div>
      <div v-if="data.version" class="node-subtitle">v{{ data.version }}</div>
    </template>

    <template #metadata>
      <div v-if="data.entityId" class="node-meta">
        <span class="meta-item" v-if="data.chapters">
          📖 {{ data.chapters?.length || 0 }} chapters
        </span>
      </div>
    </template>
  </BaseNode>
</template>

<script setup lang="ts">
import BaseNode from './BaseNode.vue'

interface Props {
  data: {
    label: string
    isNew?: boolean
    entityId?: string
    version?: string
    chapters?: any[]
    [key: string]: any
  }
  selected?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'edit', data: any): void
  (e: 'delete', data: any): void
  (e: 'toggle-expand', data: any): void
  (e: 'select-tree', data: any): void
}>()
</script>

<style scoped>
.course-node {
  border-color: #4A90E2;
  min-width: 140px;
  max-width: 200px;
}

.course-node.is-selected {
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3);
}

.node-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.6rem;
  color: var(--color-text-secondary);
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
</style>
