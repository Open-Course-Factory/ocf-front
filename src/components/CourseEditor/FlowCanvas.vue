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

      <template #node-course="{ data, selected }">
        <CourseNode :data="data" :selected="selected" @edit="handleEditNode" @delete="handleDeleteNode" @toggle-expand="handleToggleExpand" @select-tree="handleSelectTree" />
      </template>

      <template #node-chapter="{ data, selected }">
        <ChapterNode :data="data" :selected="selected" @edit="handleEditNode" @delete="handleDeleteNode" @toggle-expand="handleToggleExpand" @select-tree="handleSelectTree" />
      </template>

      <template #node-section="{ data, selected }">
        <SectionNode :data="data" :selected="selected" @edit="handleEditNode" @delete="handleDeleteNode" @toggle-expand="handleToggleExpand" @select-tree="handleSelectTree" />
      </template>

      <template #node-page="{ data, selected }">
        <PageNode :data="data" :selected="selected" @edit="handleEditNode" @delete="handleDeleteNode" @select-tree="handleSelectTree" />
      </template>
    </VueFlow>

    <div v-if="nodesData.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>{{ t('flowCanvas.emptyTitle') }}</h3>
      <p>{{ t('flowCanvas.emptyDescription') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useTranslations } from '../../composables/useTranslations'
import CourseNode from './nodes/CourseNode.vue'
import ChapterNode from './nodes/ChapterNode.vue'
import SectionNode from './nodes/SectionNode.vue'
import PageNode from './nodes/PageNode.vue'

const { t } = useTranslations({
  en: {
    flowCanvas: {
      emptyTitle: 'No Nodes Yet',
      emptyDescription: 'Drag node types from the library or existing entities from the course tree to get started'
    }
  },
  fr: {
    flowCanvas: {
      emptyTitle: 'Aucun Nœud',
      emptyDescription: 'Glissez des types de nœuds depuis la bibliothèque ou des entités existantes depuis l\'arbre de cours pour commencer'
    }
  }
})

interface Props {
  nodes: any[]
  edges: any[]
  draggedNodeType?: string | null
}

const props = defineProps<Props>()

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

// Local reactive state
const nodesData = ref(props.nodes)
const edgesData = ref(props.edges)

// Watch for prop changes - but preserve Vue Flow's internal state
watch(() => props.nodes, (newNodes, oldNodes) => {
  // Only update if:
  // 1. Number of nodes changed (add/remove), OR
  // 2. Node IDs changed (different course loaded), OR
  // 3. Hidden property changed (expand/collapse)
  const lengthChanged = newNodes.length !== nodesData.value.length
  const idsChanged = !oldNodes ||
    newNodes.length !== oldNodes.length ||
    newNodes.some((node, idx) => node.id !== oldNodes[idx]?.id)

  // Check if hidden state changed (for expand/collapse)
  const hiddenChanged = newNodes.some((node) => {
    const oldNode = nodesData.value.find(n => n.id === node.id)
    return oldNode && oldNode.hidden !== node.hidden
  })

  if (lengthChanged || idsChanged || hiddenChanged) {
    nodesData.value = newNodes
  }
})

watch(() => props.edges, (newEdges, oldEdges) => {
  const lengthChanged = newEdges.length !== edgesData.value.length
  const idsChanged = !oldEdges ||
    newEdges.length !== oldEdges.length ||
    newEdges.some((edge, idx) => edge.id !== oldEdges[idx]?.id)

  // Check if hidden state changed (for expand/collapse)
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

  // Get Vue Flow instance to convert screen coords to flow coords
  const canvasElement = event.currentTarget as HTMLElement
  const rect = canvasElement.getBoundingClientRect()

  // Calculate position relative to canvas viewport
  const x = event.clientX - rect.left - 100 // Offset for node center
  const y = event.clientY - rect.top - 50

  // Create new node
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
  // Sync the updated nodes back to parent
  // This ensures position changes are reflected in CourseEditor's nodes.value
  emit('nodes-change', changes)

  // Also emit the full updated nodes array for proper sync
  if (changes.some(c => c.type === 'position')) {
    // Use nextTick to ensure Vue Flow has updated nodesData
    Promise.resolve().then(() => {
      emit('update:nodes', nodesData.value)
    })
  }
}

const handleEdgesChange = (changes: any[]) => {
  emit('edges-change', changes)
}

// Node action handlers
const handleEditNode = (nodeData: any) => {
  console.log('FlowCanvas: handleEditNode called', nodeData)
  // Find the node and emit edit event to open edit modal
  const node = nodesData.value.find(n => n.data === nodeData)
  if (node) {
    console.log('FlowCanvas: emitting node-edit', node)
    emit('node-edit', node)
  }
}

const handleDeleteNode = (nodeData: any) => {
  // Find the node and emit delete event
  const node = nodesData.value.find(n => n.data === nodeData)
  if (node) {
    emit('node-delete', node)
  }
}

const handleToggleExpand = (nodeData: any) => {
  emit('toggle-expand', nodeData)
}

const handleSelectTree = (nodeData: any) => {
  console.log('FlowCanvas: handleSelectTree called', nodeData)
  emit('select-tree', nodeData)
}

const handleConnect = (connection: any) => {
  emit('edge-connect', connection)
}
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
