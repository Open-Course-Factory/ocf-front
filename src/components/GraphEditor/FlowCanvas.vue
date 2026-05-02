<template>
  <div class="flow-canvas">
    <VueFlow
      v-model:nodes="nodesData"
      v-model:edges="edgesData"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="4"
      :snap-to-grid="true"
      :snap-grid="[15, 15]"
      :elevate-edges-on-select="false"
      :node-types="customNodeTypes"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @node-click="handleNodeClick"
      @pane-click="handlePaneClick"
      @nodes-change="handleNodesChange"
      @edges-change="handleEdgesChange"
      @connect="handleConnect"
    >
      <Background pattern-color="#aaa" :gap="16" />
      <Controls />
      <MiniMap />
    </VueFlow>

    <div v-if="nodesData.length === 0" class="empty-state">
      <div class="empty-icon">{{ emptyIcon }}</div>
      <h3>{{ emptyTitle }}</h3>
      <p>{{ emptyDescription }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide, type Component } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

interface Props {
  nodes: any[]
  edges: any[]
  draggedNodeType?: string | null
  customNodeTypes?: Record<string, Component>
  emptyIcon?: string
  emptyTitle?: string
  emptyDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  draggedNodeType: null,
  customNodeTypes: undefined,
  emptyIcon: '📚',
  emptyTitle: 'No Nodes Yet',
  emptyDescription: 'Drag node types from the library to get started'
})

const emit = defineEmits<{
  (e: 'nodes-change', changes: any[]): void
  (e: 'edges-change', changes: any[]): void
  (e: 'update:nodes', nodes: any[]): void
  (e: 'node-click', event: any): void
  (e: 'pane-click', event: any): void
  (e: 'node-added', node: any): void
  (e: 'node-edit', node: any): void
  (e: 'node-delete', node: any): void
  (e: 'toggle-expand', nodeData: any): void
  (e: 'select-tree', nodeData: any): void
  (e: 'edge-connect', connection: any): void
}>()

// Provide event handlers so custom node types can call them via inject
provide('flowCanvasHandlers', {
  onEdit: (nodeData: any) => handleEditNode(nodeData),
  onDelete: (nodeData: any) => handleDeleteNode(nodeData),
  onToggleExpand: (nodeData: any) => handleToggleExpand(nodeData),
  onSelectTree: (nodeData: any) => handleSelectTree(nodeData)
})

// Local reactive state
const nodesData = ref(props.nodes)
const edgesData = ref(props.edges)

// Watch for prop changes - but preserve Vue Flow's internal state
watch(() => props.nodes, (newNodes, oldNodes) => {
  const lengthChanged = newNodes.length !== nodesData.value.length
  const idsChanged = !oldNodes ||
    newNodes.length !== oldNodes.length ||
    newNodes.some((node, idx) => node.id !== oldNodes[idx]?.id)

  const hiddenChanged = newNodes.some((node) => {
    const oldNode = nodesData.value.find(n => n.id === node.id)
    return oldNode && oldNode.hidden !== node.hidden
  })

  // After a save the parent rebuilds nodes via convertScenarioToNodes,
  // so each node carries a fresh `data` object reference. Detect this
  // so node-level changes (e.g. quiz question count) propagate even
  // when the structural shape is identical.
  const dataChanged = newNodes.some((node) => {
    const oldNode = nodesData.value.find(n => n.id === node.id)
    return oldNode && oldNode.data !== node.data
  })

  if (lengthChanged || idsChanged || hiddenChanged || dataChanged) {
    nodesData.value = newNodes
  }
})

watch(() => props.edges, (newEdges, oldEdges) => {
  const lengthChanged = newEdges.length !== edgesData.value.length
  const idsChanged = !oldEdges ||
    newEdges.length !== oldEdges.length ||
    newEdges.some((edge, idx) => edge.id !== oldEdges[idx]?.id)

  const hiddenChanged = newEdges.some((edge) => {
    const oldEdge = edgesData.value.find(e => e.id === edge.id)
    return oldEdge && oldEdge.hidden !== edge.hidden
  })

  if (lengthChanged || idsChanged || hiddenChanged) {
    edgesData.value = newEdges
  }
})

// Drag and drop handling
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  if (!event.dataTransfer) return

  const data = event.dataTransfer.getData('application/vueflow')
  if (!data) return

  const nodeData = JSON.parse(data)

  const canvasElement = event.currentTarget as HTMLElement
  const rect = canvasElement.getBoundingClientRect()

  const x = event.clientX - rect.left - 100
  const y = event.clientY - rect.top - 50

  const newNode = {
    id: nodeData.entityId ? `${nodeData.type}-${nodeData.entityId}` : `${nodeData.type}-new-${Date.now()}`,
    type: nodeData.type,
    position: { x, y },
    data: {
      label: nodeData.isNewNode ? `New ${capitalizeFirst(nodeData.type)}` : nodeData.label,
      entityId: nodeData.entityId || null,
      entityType: nodeData.type,
      isNew: nodeData.isNewNode || false,
      ...nodeData
    }
  }

  nodesData.value = [...nodesData.value, newNode]
  emit('node-added', newNode)
}

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Node event handlers
const handleNodeClick = (event: any) => {
  emit('node-click', event)
}

const handlePaneClick = (event: any) => {
  emit('pane-click', event)
}

const handleNodesChange = (changes: any[]) => {
  emit('nodes-change', changes)

  if (changes.some(c => c.type === 'position')) {
    Promise.resolve().then(() => {
      emit('update:nodes', nodesData.value)
    })
  }
}

const handleEdgesChange = (changes: any[]) => {
  emit('edges-change', changes)
}

// Node action handlers (forwarded from node components via customNodeTypes)
const handleEditNode = (nodeData: any) => {
  const node = nodesData.value.find(n => n.data === nodeData)
  if (node) {
    emit('node-edit', node)
  }
}

const handleDeleteNode = (nodeData: any) => {
  const node = nodesData.value.find(n => n.data === nodeData)
  if (node) {
    emit('node-delete', node)
  }
}

const handleToggleExpand = (nodeData: any) => {
  emit('toggle-expand', nodeData)
}

const handleSelectTree = (nodeData: any) => {
  emit('select-tree', nodeData)
}

const handleConnect = (connection: any) => {
  emit('edge-connect', connection)
}

// Expose handlers so custom node types can call them via provide/inject or events
defineExpose({
  handleEditNode,
  handleDeleteNode,
  handleToggleExpand,
  handleSelectTree
})
</script>

<style>
/* Import Vue Flow base styles */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';
</style>

<style scoped>
.flow-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--color-background);
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  z-index: 0;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  opacity: 0.5;
  max-width: 300px;
}

/* Dark mode adjustments for Vue Flow */
:deep(.vue-flow__background) {
  background-color: var(--color-background);
}

:deep(.vue-flow__controls) {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

:deep(.vue-flow__controls button) {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

:deep(.vue-flow__controls button:hover) {
  background: var(--color-surface-hover);
}

:deep(.vue-flow__minimap) {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

/* Edge styling - always render behind nodes */
:deep(.vue-flow__edge) {
  z-index: 1 !important;
}

:deep(.vue-flow__edge-path) {
  stroke: var(--color-text-secondary);
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: var(--color-primary);
}

/* Nodes should render above edges */
:deep(.vue-flow__node) {
  z-index: 10 !important;
}

:deep(.vue-flow__node.selected) {
  z-index: 11 !important;
}
</style>
