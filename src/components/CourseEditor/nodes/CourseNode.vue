<template>
  <div class="custom-node course-node" :class="{ 'is-new': data.isNew, 'is-selected': selected }">
    <!-- Connection handles on all 4 sides -->
    <Handle type="target" :position="Position.Top" id="top" />
    <Handle type="target" :position="Position.Left" id="left" />
    <Handle type="target" :position="Position.Right" id="right" />
    <Handle type="target" :position="Position.Bottom" id="bottom-target" />

    <div class="node-content">
      <div class="node-header">
        <span class="node-icon">📚</span>
        <div class="node-title-container">
          <div class="node-title">{{ data.label || 'New Course' }}</div>
          <div v-if="data.version" class="node-subtitle">v{{ data.version }}</div>
        </div>
      </div>

      <div v-if="data.isNew" class="node-badge new-badge">New</div>
      <div v-if="data.entityId" class="node-meta">
        <span class="meta-item" v-if="data.chapters">
          📖 {{ data.chapters?.length || 0 }} chapters
        </span>
      </div>
    </div>

    <div class="node-actions">
      <button
        v-if="data.chapters && data.chapters.length > 0"
        @click.stop="handleToggleExpand"
        class="action-btn expand-btn"
        :title="data.isExpanded ? 'Collapse' : 'Expand'"
      >
        {{ data.isExpanded ? '▼' : '▶' }}
      </button>
      <button @click.stop="handleEdit" class="action-btn" title="Edit">
        ✏️
      </button>
      <button @click.stop="handleDelete" class="action-btn delete-btn" title="Delete">
        🗑️
      </button>
    </div>

    <!-- Source handles on all 4 sides -->
    <Handle type="source" :position="Position.Top" id="top-source" />
    <Handle type="source" :position="Position.Left" id="left-source" />
    <Handle type="source" :position="Position.Right" id="right-source" />
    <Handle type="source" :position="Position.Bottom" id="bottom-source" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

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

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'edit', data: any): void
  (e: 'delete', data: any): void
  (e: 'toggle-expand', data: any): void
}>()

const handleEdit = () => {
  emit('edit', props.data)
}

const handleDelete = () => {
  emit('delete', props.data)
}

const handleToggleExpand = () => {
  emit('toggle-expand', props.data)
}
</script>

<style scoped>
.custom-node {
  background: var(--color-surface);
  border: 2px solid #4A90E2;
  border-radius: 8px;
  padding: 0.75rem;
  min-width: 140px;
  max-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  position: relative;
  /* Ensure background is opaque to hide edges passing underneath */
  z-index: inherit;
}

.custom-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.custom-node.is-selected {
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3);
}

.custom-node.is-new {
  border-style: dashed;
}

.course-node {
  border-color: #4A90E2;
  background: var(--color-surface);
}

.node-content {
  position: relative;
}

.node-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.node-icon {
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
}

.node-title-container {
  flex: 1;
  min-width: 0;
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

.node-badge {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: var(--color-primary);
  color: white;
  font-size: 0.5rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.new-badge {
  background: #50C878;
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

.node-actions {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
  opacity: 0;
  transition: opacity 0.2s;
}

.custom-node:hover .node-actions {
  opacity: 1;
}

.action-btn {
  flex: 1;
  background: var(--color-surface-variant);
  border: 1px solid var(--color-border);
  padding: 0.375rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--color-surface-hover);
  transform: scale(1.05);
}

.delete-btn:hover {
  background: #fee;
  border-color: #f44336;
}
</style>
