/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Shared graph-editor logic for the node/edge canvas used by both the scenario
 * editor and the course editor. Owns the nodes/edges refs and the topology
 * operations that are identical across editors — edge-insert (drop-on-edge),
 * delete-node auto-repair, edge-connect validation + FK sync, order-from-chain
 * synchronization, and per-entity node-position persistence.
 *
 * The two editors differ only in a handful of domain rules, injected via config:
 *   - which parent → child connections are valid (linear step chain vs the
 *     course → chapter → section → page hierarchy)
 *   - the foreign-key PATCH performed when a valid edge is (re)connected
 *   - the source handle used for the downstream half of an inserted node
 *   - the parent → child levels walked when renumbering order
 *   - the localStorage prefix for saved positions
 *
 * `useScenarioGraph` is a thin preset over this; CourseEditor consumes it
 * directly. Extracted during the FRONT-2 de-duplication (#280).
 */

import { ref, type Ref } from 'vue'
import axios from 'axios'

export interface GraphOrderLevel {
  // Node entityType whose children are renumbered along their edge chain.
  parentType: string
  // True when a node of `childType` is a child in this level's chain.
  isChild: (childType: string) => boolean
  // REST collection to PATCH the child's order onto.
  endpoint: string
  // Field name carrying the order value (usually 'order').
  orderField: string
  // Value given to the first child in the chain. Courses number chapters,
  // sections and pages from 1; scenario steps are 0-based, matching the
  // importer (ScenarioStep.Order = i) and ScenarioSession.CurrentStep.
  // Defaults to 1 so existing course levels keep their numbering.
  orderBase?: number
}

// Outcome of a renumber pass. A PATCH that fails mid-chain leaves duplicate or
// missing order values, so callers need more than a success count: `failedLabels`
// names the children that kept their old position, which is what someone needs
// in order to repair the sequence by hand.
export interface SyncOrderResult {
  patched: number
  failed: number
  failedLabels: string[]
  // Children that had no edge back to a parent and were appended to the end of
  // the chain rather than left holding an order the connected ones now use.
  // Named, not just counted: the author has to know which ones to wire up or
  // delete, and an unconnected node is not obvious on a busy canvas.
  appendedOffChainLabels: string[]
}

export interface UseGraphEditorConfig {
  // Reactive id of the currently-open entity — namespaces the positions key.
  selectedId: Ref<string | null>
  // localStorage key prefix, e.g. 'scenarioEditor' → 'scenarioEditor_positions_<id>'.
  storagePrefix: string
  // Whether a source → target edge is allowed (drives edge-connect validation).
  isValidConnection: (sourceType: string, targetType: string) => boolean
  // Whether `newType` may be spliced between `sourceType` and `targetType`.
  isValidInsertion: (sourceType: string, newType: string, targetType: string) => boolean
  // Source handle for the downstream (newNode → target) edge on insert.
  insertSecondEdgeSourceHandle: string
  // Persist the connection's foreign key on a valid (re)connect. Implementations
  // do their own PATCH + error signalling; return true to undo (remove) the edge.
  syncConnection?: (sourceNode: any, targetNode: any) => Promise<boolean>
  // Parent → child levels walked by syncOrderFromEdges.
  orderLevels: GraphOrderLevel[]
  // Refuses a connection the type rules allow but the graph shape does not —
  // a second outgoing edge, or one that closes a loop. Returns a reason key to
  // reject with, or null to accept. Checked before any FK is written.
  rejectConnection?: (payload: {
    sourceNode: any
    targetNode: any
    nodes: any[]
    edges: any[]
  }) => 'branch' | 'cycle' | null
  // Hook fired when a topology rejection removes the edge, so the caller can
  // explain why rather than leaving the link to vanish silently.
  onRejectedConnection?: (reason: 'branch' | 'cycle') => void
  // Hook fired when an invalid edge is dropped (after the edge is removed).
  onInvalidConnection?: (sourceType: string, targetType: string) => void
  // Hook fired when a node can't be auto-rewired on delete (multiple edges).
  onMultiEdgeRewireBlocked?: () => void
  // True for nodes whose horizontal position is DERIVED from their order in the
  // chain rather than chosen by the user. Their saved x is ignored on load, so
  // the canvas can never contradict the stored sequence — which is what made a
  // successful reorder appear not to have happened. y stays freeform.
  derivesXFromOrder?: (node: any) => boolean
}

export function useGraphEditor(config: UseGraphEditorConfig) {
  const nodes = ref<any[]>([])
  const edges = ref<any[]>([])

  // Drop/insert on an edge: split A → B into A → new → B. The new node is
  // expected to already exist in `nodes`; this only swaps the edges. No-ops when
  // the splice wouldn't yield a valid chain (caller can leave the node
  // unconnected for manual wiring).
  function insertNodeOnEdge(payload: { node: any; edgeId: string; source: string; target: string }) {
    const { node: newNode, edgeId, source, target } = payload

    const sourceNode = nodes.value.find(n => n.id === source)
    const targetNode = nodes.value.find(n => n.id === target)
    if (!sourceNode || !targetNode) return

    const sourceType = sourceNode.data.entityType
    const newType = newNode.data.entityType
    const targetType = targetNode.data.entityType
    if (!config.isValidInsertion(sourceType, newType, targetType)) return

    const oldEdge = edges.value.find(e => e.id === edgeId)
    const sourceHandle = oldEdge?.sourceHandle
    const targetHandle = oldEdge?.targetHandle
    const edgeType = oldEdge?.type || 'smoothstep'

    edges.value = [
      ...edges.value.filter(e => e.id !== edgeId),
      {
        id: `edge-${source}-${newNode.id}`,
        source,
        sourceHandle,
        target: newNode.id,
        targetHandle: 'top',
        type: edgeType,
        animated: false
      },
      {
        id: `edge-${newNode.id}-${target}`,
        source: newNode.id,
        sourceHandle: config.insertSecondEdgeSourceHandle,
        target,
        targetHandle,
        type: edgeType,
        animated: false
      }
    ]
  }

  // Replace `incoming → deletedNode` and `deletedNode → outgoing` with a single
  // `incoming → outgoing` edge so the linear chain is preserved on delete.
  function rewireEdgesAroundDeletedNode(node: any) {
    const incoming = edges.value.filter(e => e.target === node.id)
    const outgoing = edges.value.filter(e => e.source === node.id)

    // Multi-parent or multi-child: should not happen in the linear chain model.
    // Warn (via the caller's hook) and skip the rewire.
    if (incoming.length > 1 || outgoing.length > 1) {
      console.warn(
        '[useGraphEditor] cannot auto-rewire: node has multiple incoming/outgoing edges',
        { nodeId: node.id, incoming: incoming.length, outgoing: outgoing.length }
      )
      config.onMultiEdgeRewireBlocked?.()
      return
    }

    // Last child, orphan, or isolated: nothing to bridge.
    if (incoming.length === 0 || outgoing.length === 0) return

    const inEdge = incoming[0]
    const outEdge = outgoing[0]
    const newEdge = {
      id: `edge-${inEdge.source}-${outEdge.target}`,
      source: inEdge.source,
      sourceHandle: inEdge.sourceHandle,
      target: outEdge.target,
      targetHandle: outEdge.targetHandle,
      type: inEdge.type || 'smoothstep',
      animated: false,
      hidden: inEdge.hidden || outEdge.hidden || false
    }
    edges.value = [
      ...edges.value.filter(e => e.id !== inEdge.id && e.id !== outEdge.id),
      newEdge
    ]
  }

  // Validate a new edge connection. Removes the edge in-place when invalid;
  // otherwise delegates the foreign-key PATCH to the configured syncConnection,
  // which may request the edge be removed on failure.
  async function handleEdgeConnect(connection: any) {
    const sourceNode = nodes.value.find(n => n.id === connection.source)
    const targetNode = nodes.value.find(n => n.id === connection.target)
    if (!sourceNode || !targetNode) return

    const sourceType = sourceNode.data.entityType
    const targetType = targetNode.data.entityType

    const removeEdge = () => {
      edges.value = edges.value.filter(e =>
        !(e.source === connection.source && e.target === connection.target)
      )
    }

    if (!config.isValidConnection(sourceType, targetType)) {
      removeEdge()
      config.onInvalidConnection?.(sourceType, targetType)
      return
    }

    // Shape rules, checked before the FK write: the renumber follows one
    // outgoing edge per node, so a branch would be silently truncated and a
    // cycle silently cut short. Refusing at draw time beats accepting an edge
    // that means nothing.
    const rejection = config.rejectConnection?.({
      sourceNode,
      targetNode,
      nodes: nodes.value,
      edges: edges.value
    })
    if (rejection) {
      removeEdge()
      config.onRejectedConnection?.(rejection)
      return
    }

    if (config.syncConnection) {
      const shouldRemove = await config.syncConnection(sourceNode, targetNode)
      if (shouldRemove) removeEdge()
    }
  }

  // Renumber children along their visual edge chains and PATCH the backend.
  // Returns how many PATCHes succeeded and how many failed — a partial pass
  // corrupts the sequence, so the caller has to be able to say so.
  // Follows the edge chain from `parentNode` through its children and returns
  // them in visual order. Edges are user-drawn and nothing forbids a cycle,
  // which would walk forever and hang the tab, so the walk stops at the first
  // node already seen — the chain up to that point is still the right sequence.
  function walkChildChain(parentNode: any, isChild: (t: string) => boolean): any[] {
    const isChainEdgeFrom = (sourceId: string) => (e: any) => {
      if (e.source !== sourceId) return false
      const targetNode = nodes.value.find(n => n.id === e.target)
      return !!targetNode?.data?.entityType && isChild(targetNode.data.entityType)
    }

    const firstChildEdge = edges.value.find(isChainEdgeFrom(parentNode.id))
    if (!firstChildEdge) return []

    const chain: any[] = []
    const visited = new Set<string>()
    let currentNodeId: string | null = firstChildEdge.target

    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId)
      const currentNode = nodes.value.find(n => n.id === currentNodeId)
      if (!currentNode) break
      chain.push(currentNode)

      const nextEdge = edges.value.find(isChainEdgeFrom(currentNodeId))
      currentNodeId = nextEdge ? nextEdge.target : null
    }

    return chain
  }

  async function syncOrderFromEdges(): Promise<SyncOrderResult> {
    let patched = 0
    let appendedOffChainLabels: string[] = []
    const failedLabels: string[] = []

    for (const { parentType, isChild, endpoint, orderField, orderBase } of config.orderLevels) {
      const parentNodes = nodes.value.filter(n => n.data.entityType === parentType && n.data.entityId)

      const chains = parentNodes.map(parentNode => walkChildChain(parentNode, isChild))
      const onChain = new Set(chains.flat().map(child => child.id))

      // Children with no edge back to a parent were left untouched while the
      // connected ones were renumbered onto their values — a second way to end
      // up with duplicate orders. Adopt them onto the end of the chain, in
      // their existing relative order, so the sequence stays unique.
      //
      // Only safe with a single parent at this level: with several, an
      // unconnected child gives no way to tell whose it is, and guessing would
      // move it under the wrong one. Course levels below the root have many
      // parents and are therefore left as they are.
      if (parentNodes.length === 1 && chains.length === 1) {
        const offChain = nodes.value
          .filter(n =>
            n.data.entityId &&
            !n.data.isNew &&
            isChild(n.data.entityType) &&
            !onChain.has(n.id)
          )
          .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))

        chains[0].push(...offChain)
        appendedOffChainLabels = offChain.map(
          child => child.data.label || child.data.title || String(child.data.entityId)
        )
      }

      for (const orderedChildren of chains) {
        for (let i = 0; i < orderedChildren.length; i++) {
          const child = orderedChildren[i]
          const newOrder = i + (orderBase ?? 1)
          const currentOrder = child.data.order ?? child.data.number ?? 0

          if (child.data.entityId && !child.data.isNew && currentOrder !== newOrder) {
            try {
              await axios.patch(`${endpoint}/${child.data.entityId}`, {
                [orderField]: newOrder
              })
              child.data.order = newOrder
              patched++
            } catch (err) {
              console.error(`Failed to update order for ${endpoint} ${child.data.entityId}:`, err)
              failedLabels.push(child.data.label || child.data.title || String(child.data.entityId))
            }
          }
        }
      }
    }

    return { patched, failed: failedLabels.length, failedLabels, appendedOffChainLabels }
  }

  // Position persistence (per-entity localStorage).
  function positionsKey(): string | null {
    if (!config.selectedId.value) return null
    return `${config.storagePrefix}_positions_${config.selectedId.value}`
  }

  function saveNodePositions() {
    const storageKey = positionsKey()
    if (!storageKey) return

    const nodePositions = nodes.value.map(node => ({
      id: node.id,
      entityId: node.data.entityId,
      position: node.position
    }))

    localStorage.setItem(storageKey, JSON.stringify(nodePositions))
  }

  // Restores saved positions onto the current nodes. Returns how many nodes had
  // a saved x deliberately ignored because their position is derived from chain
  // order, so the caller can tell the user their arrangement was not applied
  // rather than leaving them to notice the canvas moved on its own.
  function loadNodePositions(): number {
    let discardedX = 0

    const storageKey = positionsKey()
    if (!storageKey) return discardedX

    const saved = localStorage.getItem(storageKey)
    if (!saved) return discardedX

    try {
      const savedPositions = JSON.parse(saved)
      const positionMap = new Map(savedPositions.map((p: any) => [p.id, p.position]))

      nodes.value.forEach(node => {
        const savedPosition = positionMap.get(node.id) as { x: number; y: number } | undefined
        if (!savedPosition) return

        if (config.derivesXFromOrder?.(node)) {
          // Keep the x the layout just computed from the chain; take only y.
          if (savedPosition.x !== node.position.x) discardedX++
          node.position = { x: node.position.x, y: savedPosition.y }
        } else {
          node.position = savedPosition
        }
      })
    } catch (err) {
      console.error('Failed to load node positions:', err)
    }

    return discardedX
  }

  function clearNodePositions(entityId: string) {
    localStorage.removeItem(`${config.storagePrefix}_positions_${entityId}`)
  }

  return {
    nodes,
    edges,
    insertNodeOnEdge,
    rewireEdgesAroundDeletedNode,
    handleEdgeConnect,
    syncOrderFromEdges,
    saveNodePositions,
    loadNodePositions,
    clearNodePositions
  }
}
