<template>
  <BaseNode
    :data="data"
    :selected="selected"
    icon="&#x1F6A9;"
    node-class="flag-step-node"
    default-label="New Flag Step"
    border-color="var(--scenario-node-flag)"
    background-color="var(--scenario-node-flag-bg)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @toggle-expand="emit('toggle-expand', $event)"
    @select-tree="emit('select-tree', $event)"
  >
    <template #header>
      <div class="node-title">{{ data.label || 'New Flag Step' }}</div>
      <div v-if="data.order" class="node-subtitle">Step {{ data.order }}</div>
    </template>

    <template #metadata>
      <div class="node-meta">
        <div class="flag-info">
          <span v-if="data.flag_level != null" class="flag-level-badge">
            Lv.{{ data.flag_level }}
          </span>
          <span v-if="data.flag_path" class="meta-item flag-path" :title="data.flag_path">
            {{ truncatePath(data.flag_path) }}
          </span>
        </div>
        <div v-if="data.hint_content || data.hint_file_id" class="step-indicators">
          <span class="indicator indicator-hint" title="Has hint" aria-label="Has hint"><span aria-hidden="true">&#x1F4A1;</span></span>
        </div>
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
    hint_content?: string
    hint_file_id?: string
    flag_level?: number
    flag_path?: string
    background_script?: string
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

const truncatePath = (path: string, maxLength: number = 25): string => {
  if (!path) return ''
  return path.length > maxLength ? '...' + path.substring(path.length - maxLength + 3) : path
}
</script>

<style scoped>
.flag-step-node {
  border-color: var(--scenario-node-flag);
  min-width: 120px;
  max-width: 180px;
}

.flag-step-node.is-selected {
  box-shadow: var(--shadow-flag-step-node);
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

.flag-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.flag-level-badge {
  display: inline-block;
  font-size: 0.55rem;
  font-weight: 600;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: var(--scenario-node-flag-bg);
  color: var(--scenario-node-flag);
  border: 1px solid var(--scenario-node-flag);
}

.flag-path {
  font-family: var(--font-family-monospace);
  font-size: 0.55rem;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-indicators {
  display: flex;
  gap: 0.35rem;
}

.indicator {
  font-size: 0.65rem;
  opacity: 0.8;
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
