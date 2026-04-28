<template>
  <BaseNode
    :data="data"
    :selected="selected"
    icon="&#x1F4D6;"
    node-class="info-step-node"
    default-label="New Info Step"
    border-color="var(--scenario-node-info)"
    background-color="var(--scenario-node-info-bg)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @toggle-expand="emit('toggle-expand', $event)"
    @select-tree="emit('select-tree', $event)"
  >
    <template #header>
      <div class="node-title">{{ data.label || 'New Info Step' }}</div>
      <div v-if="data.order" class="node-subtitle">Step {{ data.order }}</div>
    </template>

    <template #metadata>
      <div v-if="data.text_content" class="node-meta">
        <span class="meta-item content-preview">
          {{ truncateContent(data.text_content) }}
        </span>
      </div>
    </template>
  </BaseNode>
</template>

<script setup lang="ts">
import BaseNode from '../../GraphEditor/nodes/BaseNode.vue'

interface Props {
  data: {
    label: string
    isNew?: boolean
    entityId?: string
    order?: number
    text_content?: string
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

const truncateContent = (content: string, maxLength: number = 60): string => {
  if (!content) return ''
  const stripped = content.replace(/<[^>]*>/g, '').trim()
  return stripped.length > maxLength ? stripped.substring(0, maxLength) + '...' : stripped
}
</script>

<style scoped>
.info-step-node {
  border-color: var(--scenario-node-info);
  min-width: 120px;
  max-width: 180px;
}

.info-step-node.is-selected {
  box-shadow: var(--shadow-info-step-node);
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

.content-preview {
  font-style: italic;
  line-height: 1.4;
  opacity: 0.8;
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
