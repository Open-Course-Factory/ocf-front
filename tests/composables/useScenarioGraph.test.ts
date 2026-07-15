/**
 * Tests for useScenarioGraph — the pure graph logic extracted from
 * ScenarioEditor.vue during the Wave 12 split (and extended by the graph
 * insert/repair feature #205).
 *
 * Safety net before the CourseEditor de-duplication refactor (FRONT-2): these
 * pin the behavior of the graph mutations so generalizing the composable can't
 * silently change them.
 *
 * Covered:
 *   - insertNodeOnEdge: splits A → B into A → new → B; no-ops on invalid
 *     connection or missing endpoints.
 *   - rewireEdgesAroundDeletedNode: bridges incoming → outgoing on a middle
 *     node; fires the onMultiEdgeRewireBlocked hook and skips when a node has
 *     multiple incoming/outgoing edges; no-ops for a last/first node.
 *   - handleEdgeConnect: enforces VALID_CONNECTIONS (removes the edge + fires
 *     onInvalidConnection on a bad drop); patches scenario_id for a valid
 *     scenario → existing-step connection.
 *   - syncOrderFromEdges: renumbers steps along the visual chain.
 *
 * The composable has no lifecycle hooks, so it's exercised by calling it
 * directly with a plain ref. axios is mocked (handleEdgeConnect /
 * syncOrderFromEdges issue PATCHes).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

const mockPatch = vi.fn()
vi.mock('axios', () => ({
  default: {
    patch: (...a: any[]) => mockPatch(...a)
  }
}))

import { useScenarioGraph } from '../../src/composables/useScenarioGraph'

function scenarioNode(id = 'scenario-1', entityId = 's1') {
  return { id, type: 'scenario', position: { x: 0, y: 0 }, data: { entityType: 'scenario', entityId, isNew: false } }
}
function stepNode(id: string, type = 'terminal', entityId: string | null = null, extra: Record<string, any> = {}) {
  return { id, type, position: { x: 0, y: 0 }, data: { entityType: type, entityId, isNew: entityId === null, ...extra } }
}
function edge(id: string, source: string, target: string, extra: Record<string, any> = {}) {
  return { id, source, target, type: 'smoothstep', animated: false, ...extra }
}

function makeGraph(opts: Parameters<typeof useScenarioGraph>[0] = { selectedScenarioId: ref<string | null>('s1') }) {
  return useScenarioGraph(opts)
}

beforeEach(() => {
  mockPatch.mockReset()
  mockPatch.mockResolvedValue({ data: {} })
  localStorage.clear()
})

describe('useScenarioGraph — insertNodeOnEdge', () => {
  it('splits A → B into A → new → B', () => {
    const g = makeGraph()
    g.nodes.value = [scenarioNode(), stepNode('step-1', 'terminal', 'st1')]
    g.edges.value = [edge('e-scenario-1-step-1', 'scenario-1', 'step-1', { sourceHandle: 'bottom-source', targetHandle: 'top' })]

    const newNode = stepNode('info-new-1', 'info')
    g.nodes.value = [...g.nodes.value, newNode]
    g.insertNodeOnEdge({ node: newNode, edgeId: 'e-scenario-1-step-1', source: 'scenario-1', target: 'step-1' })

    expect(g.edges.value).toHaveLength(2)
    // Original edge is gone
    expect(g.edges.value.find(e => e.id === 'e-scenario-1-step-1')).toBeUndefined()
    // scenario-1 → info-new-1 and info-new-1 → step-1
    expect(g.edges.value.some(e => e.source === 'scenario-1' && e.target === 'info-new-1')).toBe(true)
    expect(g.edges.value.some(e => e.source === 'info-new-1' && e.target === 'step-1')).toBe(true)
  })

  it('no-ops when the new node type is not a valid child (e.g. a scenario)', () => {
    const g = makeGraph()
    g.nodes.value = [scenarioNode(), stepNode('step-1', 'terminal', 'st1')]
    const original = [edge('e1', 'scenario-1', 'step-1')]
    g.edges.value = [...original]

    // A "scenario" is not in STEP_NODE_TYPES, so scenario → scenario is invalid.
    const badNode = { id: 'scenario-new', type: 'scenario', position: { x: 0, y: 0 }, data: { entityType: 'scenario' } }
    g.nodes.value = [...g.nodes.value, badNode]
    g.insertNodeOnEdge({ node: badNode, edgeId: 'e1', source: 'scenario-1', target: 'step-1' })

    expect(g.edges.value).toHaveLength(1)
    expect(g.edges.value[0].id).toBe('e1')
  })

  it('no-ops when source or target node is missing', () => {
    const g = makeGraph()
    g.nodes.value = [scenarioNode()]
    g.edges.value = [edge('e1', 'scenario-1', 'ghost')]

    const newNode = stepNode('info-new-1', 'info')
    g.insertNodeOnEdge({ node: newNode, edgeId: 'e1', source: 'scenario-1', target: 'ghost' })

    expect(g.edges.value).toHaveLength(1)
    expect(g.edges.value[0].id).toBe('e1')
  })
})

describe('useScenarioGraph — rewireEdgesAroundDeletedNode', () => {
  it('bridges incoming.source → outgoing.target for a middle node', () => {
    const g = makeGraph()
    g.nodes.value = [scenarioNode(), stepNode('step-1', 'terminal', 'st1'), stepNode('step-2', 'flag', 'st2')]
    g.edges.value = [
      edge('e-in', 'scenario-1', 'step-1', { sourceHandle: 'bottom-source', targetHandle: 'top' }),
      edge('e-out', 'step-1', 'step-2', { sourceHandle: 'right-source', targetHandle: 'left' })
    ]

    g.rewireEdgesAroundDeletedNode(g.nodes.value.find(n => n.id === 'step-1'))

    // The two edges touching step-1 are replaced by a single scenario-1 → step-2 edge
    expect(g.edges.value).toHaveLength(1)
    expect(g.edges.value[0].source).toBe('scenario-1')
    expect(g.edges.value[0].target).toBe('step-2')
  })

  it('fires onMultiEdgeRewireBlocked and skips the bridge when a node has 2 incoming edges', () => {
    const onMultiEdgeRewireBlocked = vi.fn()
    const g = makeGraph({ selectedScenarioId: ref<string | null>('s1'), onMultiEdgeRewireBlocked })
    g.nodes.value = [stepNode('a', 'terminal', 'a'), stepNode('b', 'terminal', 'b'), stepNode('mid', 'flag', 'm')]
    g.edges.value = [
      edge('e1', 'a', 'mid'),
      edge('e2', 'b', 'mid'),
      edge('e3', 'mid', 'x')
    ]

    g.rewireEdgesAroundDeletedNode(g.nodes.value.find(n => n.id === 'mid'))

    expect(onMultiEdgeRewireBlocked).toHaveBeenCalledOnce()
    // No bridge created; edges left untouched for the caller to remove.
    expect(g.edges.value).toHaveLength(3)
  })

  it('no-ops (no bridge) for a last node with only an incoming edge', () => {
    const g = makeGraph()
    g.nodes.value = [scenarioNode(), stepNode('step-1', 'terminal', 'st1')]
    g.edges.value = [edge('e-in', 'scenario-1', 'step-1')]

    g.rewireEdgesAroundDeletedNode(g.nodes.value.find(n => n.id === 'step-1'))

    expect(g.edges.value).toHaveLength(1)
    expect(g.edges.value[0].id).toBe('e-in')
  })
})

describe('useScenarioGraph — handleEdgeConnect (VALID_CONNECTIONS)', () => {
  it('removes the edge and fires onInvalidConnection for an invalid drop', async () => {
    const onInvalidConnection = vi.fn()
    const g = makeGraph({ selectedScenarioId: ref<string | null>('s1'), onInvalidConnection })
    // terminal → scenario is invalid (scenario is not a valid child)
    g.nodes.value = [stepNode('step-1', 'terminal', 'st1'), scenarioNode('scenario-2', 's2')]
    g.edges.value = [edge('bad', 'step-1', 'scenario-2')]

    await g.handleEdgeConnect({ source: 'step-1', target: 'scenario-2' })

    expect(onInvalidConnection).toHaveBeenCalledWith('terminal', 'scenario')
    expect(g.edges.value.find(e => e.id === 'bad')).toBeUndefined()
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('patches scenario_id for a valid scenario → existing-step connection', async () => {
    const g = makeGraph()
    g.nodes.value = [scenarioNode('scenario-1', 's1'), stepNode('step-1', 'terminal', 'st1')]
    g.edges.value = [edge('ok', 'scenario-1', 'step-1')]

    await g.handleEdgeConnect({ source: 'scenario-1', target: 'step-1' })

    expect(mockPatch).toHaveBeenCalledWith('/scenario-steps/st1', { scenario_id: 's1' })
    // Valid edge is kept
    expect(g.edges.value.find(e => e.id === 'ok')).toBeDefined()
  })
})

describe('useScenarioGraph — syncOrderFromEdges', () => {
  it('renumbers steps along the visual chain and returns the patch count', async () => {
    const g = makeGraph()
    g.nodes.value = [
      scenarioNode('scenario-1', 's1'),
      stepNode('step-1', 'terminal', 'st1', { order: 5 }),
      stepNode('step-2', 'flag', 'st2', { order: 6 })
    ]
    g.edges.value = [
      edge('e1', 'scenario-1', 'step-1'),
      edge('e2', 'step-1', 'step-2')
    ]

    const count = await g.syncOrderFromEdges()

    expect(count).toBe(2)
    expect(mockPatch).toHaveBeenCalledWith('/scenario-steps/st1', { order: 1 })
    expect(mockPatch).toHaveBeenCalledWith('/scenario-steps/st2', { order: 2 })
  })

  it('does not patch steps already in the correct order', async () => {
    const g = makeGraph()
    g.nodes.value = [
      scenarioNode('scenario-1', 's1'),
      stepNode('step-1', 'terminal', 'st1', { order: 1 }),
      stepNode('step-2', 'flag', 'st2', { order: 2 })
    ]
    g.edges.value = [
      edge('e1', 'scenario-1', 'step-1'),
      edge('e2', 'step-1', 'step-2')
    ]

    const count = await g.syncOrderFromEdges()

    expect(count).toBe(0)
    expect(mockPatch).not.toHaveBeenCalled()
  })
})
