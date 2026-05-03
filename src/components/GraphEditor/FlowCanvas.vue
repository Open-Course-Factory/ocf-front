<template>
  <div ref="canvasRef" class="flow-canvas">
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
      :edge-types="edgeTypes"
      :default-edge-options="defaultEdgeOptions"
      :nodes-focusable="true"
      :edges-focusable="true"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
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
import { computed, markRaw, onBeforeUnmount, onMounted, provide, ref, watch, type Component } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import InsertableEdge from './edges/InsertableEdge.vue'

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
  /** Emitted when a node is inserted on an edge (drop or hover-+ click).
   * Parent should split the edge: A → newNode, newNode → B. */
  (e: 'edge-insert', payload: { node: any; edgeId: string; source: string; target: string }): void
  /** Emitted when the user clicks the hover-+ on an edge.
   * Parent should open a picker at the given client coordinates. */
  (e: 'edge-insert-request', payload: {
    edgeId: string
    source: string
    target: string
    flowX: number
    flowY: number
    clientX: number
    clientY: number
  }): void
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
const canvasRef = ref<HTMLElement | null>(null)

// Vue Flow utilities (need access to screenToFlowCoordinate)
const { screenToFlowCoordinate } = useVueFlow()

// Register the custom insertable edge type so all edges get a hover-+ badge.
// `markRaw` so Vue does not try to make the component reactive.
const edgeTypes = {
  insertable: markRaw(InsertableEdge)
}

// Default edge options applied to edges that don't specify a type.
// Existing edges in scenarios/courses use `type: 'smoothstep'`. The InsertableEdge
// itself renders a smoothstep path internally, so swapping edge types preserves the
// visual style while adding the hover-+ badge.
const defaultEdgeOptions = computed(() => ({
  type: 'insertable'
}))

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

// Force every edge through the InsertableEdge component so course + scenario
// editors get the hover-+ behaviour without each one opting in. The edges that
// arrive from the parent typically have `type: 'smoothstep'`; we override that.
const normaliseEdges = (incoming: any[]) => incoming.map((edge) => ({
  ...edge,
  type: 'insertable'
}))

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
    edgesData.value = normaliseEdges(newEdges)
  }
}, { immediate: true })

// === Drop-on-edge logic ===========================================================
//
// We compute the closest edge (by perpendicular distance from a flow-coordinate
// drop point to the segment between the source and target node positions). If
// the closest distance is within DROP_ON_EDGE_THRESHOLD, we treat it as a
// drop-on-edge and emit `edge-insert` so the parent can split the chain.
const DROP_ON_EDGE_THRESHOLD = 30 // flow units (pixels at zoom 1)
const DRAG_HIGHLIGHT_CLASS = 'drop-target'
let highlightedEdgeId: string | null = null

const getNodeCenter = (nodeId: string): { x: number; y: number } | null => {
  const node = nodesData.value.find(n => n.id === nodeId)
  if (!node?.position) return null
  // Use the node's anchor (top-left) plus half its measured size when available,
  // otherwise fall back to a reasonable default. This mirrors how Vue Flow
  // approximates handle positions for unrendered nodes.
  const width = (node as any).dimensions?.width ?? (node as any).width ?? 200
  const height = (node as any).dimensions?.height ?? (node as any).height ?? 80
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2
  }
}

const distanceToSegment = (
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number => {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) {
    return Math.hypot(px - ax, py - ay)
  }
  // Project point onto segment, clamping t to [0, 1]
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

const findEdgeNearPoint = (flowX: number, flowY: number): { edge: any; distance: number } | null => {
  let best: { edge: any; distance: number } | null = null
  for (const edge of edgesData.value) {
    if (edge.hidden) continue
    const sourceCenter = getNodeCenter(edge.source)
    const targetCenter = getNodeCenter(edge.target)
    if (!sourceCenter || !targetCenter) continue
    const dist = distanceToSegment(
      flowX,
      flowY,
      sourceCenter.x,
      sourceCenter.y,
      targetCenter.x,
      targetCenter.y
    )
    if (!best || dist < best.distance) {
      best = { edge, distance: dist }
    }
  }
  if (best && best.distance <= DROP_ON_EDGE_THRESHOLD) {
    return best
  }
  return null
}

const setEdgeHighlight = (edgeId: string | null) => {
  if (highlightedEdgeId === edgeId) return
  if (highlightedEdgeId) {
    const previous = edgesData.value.find(e => e.id === highlightedEdgeId)
    if (previous && typeof previous.class === 'string') {
      previous.class = previous.class
        .split(' ')
        .filter((c: string) => c && c !== DRAG_HIGHLIGHT_CLASS)
        .join(' ')
    } else if (previous) {
      previous.class = ''
    }
  }
  highlightedEdgeId = edgeId
  if (edgeId) {
    const next = edgesData.value.find(e => e.id === edgeId)
    if (next) {
      const existing = typeof next.class === 'string' ? next.class : ''
      if (!existing.split(' ').includes(DRAG_HIGHLIGHT_CLASS)) {
        next.class = (existing + ' ' + DRAG_HIGHLIGHT_CLASS).trim()
      }
    }
  }
  // Force reactive update on the edges array so Vue Flow re-renders
  edgesData.value = [...edgesData.value]
}

// Drag and drop handling
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }

  // Highlight the edge that would be split if the user drops here
  try {
    const flowPos = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
    const hit = findEdgeNearPoint(flowPos.x, flowPos.y)
    setEdgeHighlight(hit ? hit.edge.id : null)
  } catch {
    // screenToFlowCoordinate may not be ready in some test environments
  }
}

const handleDragLeave = (event: DragEvent) => {
  // Clear highlight only when the cursor leaves the canvas root (relatedTarget
  // is outside the .flow-canvas element). Otherwise crossing between Vue Flow
  // children would flicker the highlight off and on.
  const relatedTarget = event.relatedTarget as Node | null
  if (!canvasRef.value || !relatedTarget || !canvasRef.value.contains(relatedTarget)) {
    setEdgeHighlight(null)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  if (!event.dataTransfer) return

  const data = event.dataTransfer.getData('application/vueflow')
  if (!data) {
    setEdgeHighlight(null)
    return
  }

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

  // Find an edge near the drop point so we can auto-split the chain
  let hitEdge: any = null
  try {
    const flowPos = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
    const hit = findEdgeNearPoint(flowPos.x, flowPos.y)
    hitEdge = hit?.edge ?? null
  } catch {
    hitEdge = null
  }

  setEdgeHighlight(null)

  nodesData.value = [...nodesData.value, newNode]
  emit('node-added', newNode)

  if (hitEdge) {
    emit('edge-insert', {
      node: newNode,
      edgeId: hitEdge.id,
      source: hitEdge.source,
      target: hitEdge.target
    })
  }
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

// === Hover-+ click handling =======================================================
//
// InsertableEdge dispatches a window-level CustomEvent because it lives in a
// portal and we need the click to bubble back to the parent canvas reliably.
const onInsertOnEdgeRequest = (event: Event) => {
  const detail = (event as CustomEvent).detail as {
    edgeId: string
    source: string
    target: string
    flowX: number
    flowY: number
    clientX: number
    clientY: number
  }
  if (!detail) return
  // Only respond if the edge is actually one we own (avoid cross-canvas leakage
  // if multiple FlowCanvas instances are mounted simultaneously, e.g. in tests).
  const ownsEdge = edgesData.value.some(e => e.id === detail.edgeId)
  if (!ownsEdge) return
  emit('edge-insert-request', detail)
}

onMounted(() => {
  window.addEventListener('graph-editor:insert-on-edge', onInsertOnEdgeRequest)
})

onBeforeUnmount(() => {
  window.removeEventListener('graph-editor:insert-on-edge', onInsertOnEdgeRequest)
})

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

/* Drop-target highlight: when dragging a node from the library over an edge,
   the edge that would be split lights up so the author has clear feedback. */
:deep(.vue-flow__edge.drop-target .vue-flow__edge-path) {
  stroke: var(--color-primary);
  stroke-width: 3;
  stroke-dasharray: 8 4;
  filter: drop-shadow(0 0 4px var(--color-primary));
}

/* Nodes should render above edges */
:deep(.vue-flow__node) {
  z-index: 10 !important;
}

:deep(.vue-flow__node.selected) {
  z-index: 11 !important;
}
</style>
