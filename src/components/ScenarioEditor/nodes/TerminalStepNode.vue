<template>
  <BaseNode
    :data="data"
    :selected="selected"
    icon="&#x1F5A5;&#xFE0F;"
    node-class="terminal-step-node"
    default-label="New Terminal Step"
    border-color="var(--scenario-node-terminal)"
    background-color="var(--scenario-node-terminal-bg)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @toggle-expand="emit('toggle-expand', $event)"
    @select-tree="emit('select-tree', $event)"
  >
    <template #header>
      <div class="node-title">{{ data.label || 'New Terminal Step' }}</div>
      <div v-if="data.order" class="node-subtitle">Step {{ data.order }}</div>
    </template>

    <template #metadata>
      <div class="node-meta">
        <div class="step-indicators">
          <span v-if="data.verify_script || data.verify_script_id" class="indicator indicator-verify" title="Has verify script" aria-label="Has verify script"><span aria-hidden="true">&#x2713;</span></span>
          <span v-if="data.background_script" class="indicator indicator-background" title="Has background script" aria-label="Has background script"><span aria-hidden="true">&#x2699;&#xFE0F;</span></span>
          <span v-if="data.hint_content || data.hint_file_id" class="indicator indicator-hint" title="Has hint" aria-label="Has hint"><span aria-hidden="true">&#x1F4A1;</span></span>
        </div>
        <span v-if="data.text_content" class="meta-item content-preview">
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
    hint_content?: string
    hint_file_id?: string
    verify_script?: string
    verify_script_id?: string
    background_script?: string
    foreground_script?: string
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
.terminal-step-node {
  border-color: var(--scenario-node-terminal);
  min-width: 120px;
  max-width: 180px;
}

.terminal-step-node.is-selected {
  box-shadow: var(--shadow-terminal-step-node);
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

.step-indicators {
  display: flex;
  gap: 0.35rem;
}

.indicator {
  font-size: 0.65rem;
  opacity: 0.8;
}

.indicator-verify {
  color: var(--color-success);
  font-weight: 700;
}

.indicator-background {
  color: var(--color-text-secondary);
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
