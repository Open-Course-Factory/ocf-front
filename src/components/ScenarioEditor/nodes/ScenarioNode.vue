<template>
  <BaseNode
    :data="data"
    :selected="selected"
    icon="🧪"
    node-class="scenario-node"
    default-label="New Scenario"
    border-color="var(--scenario-node-scenario)"
    background-color="var(--scenario-node-scenario-bg)"
    children-key="steps"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @toggle-expand="emit('toggle-expand', $event)"
    @select-tree="emit('select-tree', $event)"
  >
    <template #header>
      <div class="node-title">{{ data.label || 'New Scenario' }}</div>
      <div v-if="data.difficulty" class="node-subtitle">
        <span class="difficulty-badge" :class="`difficulty-${data.difficulty}`">
          {{ data.difficulty }}
        </span>
      </div>
    </template>

    <template #metadata>
      <div v-if="data.entityId" class="node-meta">
        <span class="meta-item" v-if="data.steps">
          📋 {{ data.steps?.length || 0 }} steps
        </span>
        <span class="meta-item" v-if="data.estimated_time">
          ⏱️ {{ data.estimated_time }}
        </span>
        <span class="meta-item" v-if="data.flags_enabled">
          🚩 flags
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
    difficulty?: string
    estimated_time?: string
    steps?: any[]
    flags_enabled?: boolean
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
.scenario-node {
  border-color: var(--scenario-node-scenario);
  min-width: 150px;
  max-width: 220px;
}

.scenario-node.is-selected {
  box-shadow: var(--shadow-scenario-node);
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
  margin-top: 0.125rem;
}

.difficulty-badge {
  display: inline-block;
  font-size: 0.55rem;
  font-weight: 600;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  text-transform: capitalize;
}

.difficulty-beginner {
  background: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.difficulty-intermediate {
  background: var(--color-warning-bg);
  color: var(--color-orange);
  border: 1px solid var(--color-orange);
}

.difficulty-advanced {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}
</style>
