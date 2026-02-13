<template>
  <BaseNode
    :data="data"
    :selected="selected"
    icon="📄"
    node-class="section-node"
    default-label="New Section"
    border-color="var(--course-node-section)"
    background-color="var(--course-node-section-bg)"
    children-key="pages"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @toggle-expand="emit('toggle-expand', $event)"
    @select-tree="emit('select-tree', $event)"
  >
    <template #header>
      <div class="node-title">{{ data.label || 'New Section' }}</div>
      <div v-if="data.number" class="node-subtitle">Section {{ data.number }}</div>
    </template>

    <template #metadata>
      <div v-if="data.entityId" class="node-meta">
        <span class="meta-item" v-if="data.pages">
          📃 {{ data.pages?.length || 0 }} pages
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
    number?: number
    pages?: any[]
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
.section-node {
  border-color: var(--course-node-section);
  min-width: 120px;
  max-width: 170px;
}

.section-node.is-selected {
  box-shadow: 0 4px 16px rgba(80, 200, 120, 0.3);
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
