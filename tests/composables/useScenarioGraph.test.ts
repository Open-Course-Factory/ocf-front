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

// These previously pinned 1-based numbering (first step → order 1), which was
// the bug: scenario steps are 0-based everywhere else — the importer writes
// Order = i, and a session seeds CurrentStep from the first step's Order — so
// the editor renumbered every imported scenario on its first save. The
// expectations below now encode the 0-based rule. Courses stay 1-based via the
// orderBase default; see useGraphEditor.GraphOrderLevel.
describe('useScenarioGraph — syncOrderFromEdges', () => {
  it('renumbers steps along the visual chain from 0 and reports what it patched', async () => {
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

    const result = await g.syncOrderFromEdges()

    expect(result).toEqual({ patched: 2, failed: 0, failedLabels: [], appendedOffChainLabels: [] })
    expect(mockPatch).toHaveBeenCalledWith('/scenario-steps/st1', { order: 0 })
    expect(mockPatch).toHaveBeenCalledWith('/scenario-steps/st2', { order: 1 })
  })

  it('leaves a step already at order 0 alone — 0 is the first step, not a missing value', async () => {
    const g = makeGraph()
    g.nodes.value = [
      scenarioNode('scenario-1', 's1'),
      stepNode('step-1', 'terminal', 'st1', { order: 0 }),
      stepNode('step-2', 'flag', 'st2', { order: 1 })
    ]
    g.edges.value = [
      edge('e1', 'scenario-1', 'step-1'),
      edge('e2', 'step-1', 'step-2')
    ]

    const result = await g.syncOrderFromEdges()

    expect(result).toEqual({ patched: 0, failed: 0, failedLabels: [], appendedOffChainLabels: [] })
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('counts a failed PATCH instead of reporting a clean pass', async () => {
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
    // The second step's renumber fails: the chain is now half-applied, which
    // is precisely the state that leaves duplicate or missing orders behind.
    mockPatch.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('boom'))

    const result = await g.syncOrderFromEdges()

    expect(result.patched).toBe(1)
    expect(result.failed).toBe(1)
    // Naming the step is the point: a count alone leaves the trainer with an
    // inconsistent sequence and no idea which one to repair.
    expect(result.failedLabels).toEqual(['st2'])
  })

  it('stops on a cyclic edge chain instead of walking it forever', async () => {
    const g = makeGraph()
    g.nodes.value = [
      scenarioNode('scenario-1', 's1'),
      stepNode('step-1', 'terminal', 'st1', { order: 5 }),
      stepNode('step-2', 'flag', 'st2', { order: 6 })
    ]
    // step-2 loops back to step-1. Nothing forbids drawing this, and without a
    // visited-set the walk never terminates and the tab hangs.
    g.edges.value = [
      edge('e1', 'scenario-1', 'step-1'),
      edge('e2', 'step-1', 'step-2'),
      edge('e3', 'step-2', 'step-1')
    ]

    const result = await g.syncOrderFromEdges()

    expect(result.patched).toBe(2)
    expect(mockPatch).toHaveBeenCalledWith('/scenario-steps/st1', { order: 0 })
    expect(mockPatch).toHaveBeenCalledWith('/scenario-steps/st2', { order: 1 })
  })
})

describe('useScenarioGraph — steps left off the chain', () => {
  it('appends an unconnected step instead of leaving it on an order the chain now uses', async () => {
    const g = makeGraph()
    g.nodes.value = [
      scenarioNode('scenario-1', 's1'),
      stepNode('step-1', 'terminal', 'st1', { order: 0 }),
      stepNode('step-2', 'flag', 'st2', { order: 1 }),
      // Wired to nothing, and sitting on a stale order. Before this fix it was
      // never renumbered at all, so it kept a value the chain could collide with.
      stepNode('step-3', 'terminal', 'st3', { order: 7 })
    ]
    g.edges.value = [
      edge('e1', 'scenario-1', 'step-1'),
      edge('e2', 'step-1', 'step-2')
    ]

    const result = await g.syncOrderFromEdges()

    // Named, not counted: an unconnected node is easy to miss on a busy canvas,
    // so the warning has to say which step moved.
    expect(result.appendedOffChainLabels).toEqual(['st3'])
    // The chain keeps 0 and 1; the orphan takes the next free slot.
    expect(mockPatch).not.toHaveBeenCalledWith('/scenario-steps/st1', expect.anything())
    expect(mockPatch).not.toHaveBeenCalledWith('/scenario-steps/st2', expect.anything())
    expect(mockPatch).toHaveBeenCalledWith('/scenario-steps/st3', { order: 2 })
  })

  it('produces a sequence with no duplicate orders even when steps are unconnected', async () => {
    const g = makeGraph()
    g.nodes.value = [
      scenarioNode('scenario-1', 's1'),
      stepNode('step-1', 'terminal', 'st1', { order: 3 }),
      stepNode('step-2', 'flag', 'st2', { order: 1 }),
      stepNode('step-3', 'terminal', 'st3', { order: 1 })
    ]
    // Only step-1 is on the chain; the other two share order 1 already.
    g.edges.value = [edge('e1', 'scenario-1', 'step-1')]

    await g.syncOrderFromEdges()

    const orders = g.nodes.value
      .filter((n: any) => n.id.startsWith('step-'))
      .map((n: any) => n.data.order)
    expect(new Set(orders).size).toBe(orders.length)
  })
})

describe('useScenarioGraph — step position is derived from chain order', () => {
  it('keeps the chain x for a step and restores only its saved y', () => {
    const g = makeGraph()
    g.nodes.value = [
      scenarioNode('scenario-1', 's1'),
      { ...stepNode('step-1', 'terminal', 'st1', { order: 0 }), position: { x: 100, y: 250 } }
    ]
    // An entry written before steps stopped persisting x. It still carries one;
    // it is read and ignored, so no migration is needed.
    localStorage.setItem(
      'scenarioEditor_positions_s1',
      JSON.stringify([{ id: 'step-1', entityId: 'st1', position: { x: 999, y: 400 } }])
    )

    g.loadNodePositions()

    const step = g.nodes.value.find((n: any) => n.id === 'step-1')
    expect(step.position.x).toBe(100)
    expect(step.position.y).toBe(400)
  })

  it('restores both axes for a non-step node', () => {
    const g = makeGraph()
    g.nodes.value = [{ ...scenarioNode('scenario-1', 's1'), position: { x: 0, y: 0 } }]
    localStorage.setItem(
      'scenarioEditor_positions_s1',
      JSON.stringify([{ id: 'scenario-1', entityId: 's1', position: { x: 42, y: 77 } }])
    )

    g.loadNodePositions()

    const scenario = g.nodes.value.find((n: any) => n.id === 'scenario-1')
    expect(scenario.position).toEqual({ x: 42, y: 77 })
  })

  // The saved payload is the other half of the rule: a step's x is recomputed
  // on every load, so writing one only guarantees the next load discards it.
  it('does not persist a horizontal position for a step', () => {
    const g = makeGraph()
    g.nodes.value = [
      { ...scenarioNode('scenario-1', 's1'), position: { x: 10, y: 20 } },
      { ...stepNode('step-1', 'terminal', 'st1', { order: 0 }), position: { x: 100, y: 250 } }
    ]

    g.saveNodePositions()

    const saved = JSON.parse(localStorage.getItem('scenarioEditor_positions_s1') as string)
    const step = saved.find((p: any) => p.id === 'step-1')
    const scenario = saved.find((p: any) => p.id === 'scenario-1')
    expect(step.position).toEqual({ y: 250 })
    expect(scenario.position).toEqual({ x: 10, y: 20 })
  })
})
