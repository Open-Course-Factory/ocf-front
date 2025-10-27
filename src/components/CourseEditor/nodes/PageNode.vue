<template>
  <BaseNode
    :data="data"
    :selected="selected"
    icon="📃"
    node-class="page-node"
    default-label="New Page"
    border-color="#FFA500"
    background-color="var(--color-white)3E6"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @toggle-expand="emit('toggle-expand', $event)"
    @select-tree="emit('select-tree', $event)"
  >
    <template #header>
      <div class="node-title">{{ data.label || 'New Page' }}</div>
      <div v-if="data.number" class="node-subtitle">Page {{ data.number }}</div>
    </template>

    <template #metadata>
      <div v-if="data.content" class="node-meta">
        <span class="meta-item content-preview">
          {{ truncateContent(data.content) }}
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
    content?: string
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

const truncateContent = (content: string | any[], maxLength: number = 60): string => {
  if (!content) return ''

  // Handle array content
  let textContent = ''
  if (Array.isArray(content)) {
    textContent = content.join(' ')
  } else if (typeof content === 'string') {
    textContent = content
  } else {
    textContent = String(content)
  }

  // Strip HTML tags if present
  const stripped = textContent.replace(/<[^>]*>/g, '').trim()
  return stripped.length > maxLength ? stripped.substring(0, maxLength) + '...' : stripped
}
</script>

<style scoped>
.page-node {
  border-color: #FFA500;
  min-width: 110px;
  max-width: 160px;
}

.page-node.is-selected {
  box-shadow: 0 4px 16px rgba(255, 165, 0, 0.3);
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
