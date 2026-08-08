/**
 * Tests for the action badges on a scenario-editor link (InsertableEdge.vue).
 *
 * The edge grew a second action. Before it, the only badge was `+`, so a
 * trainer could add a step between two links but had no way to take a link
 * away — the reported symptom was "there is only a + and no -, and Del does
 * nothing". Del did nothing because Vue Flow's default deleteKeyCode is
 * Backspace, but a keyboard shortcut nobody is told about was never the
 * affordance anyway.
 *
 * What is pinned here is the contract between the badge and the canvas: which
 * DOM events carry which edge id. The canvas-side handling (removing from the
 * edge list and mirroring it to the parent) rides on the same
 * add/remove-change path the insert badge already used.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Vue Flow's edge primitives need a live flow instance; the component under
// test only uses them to draw, so they are stubbed down to nothing.
vi.mock('@vue-flow/core', () => ({
  BaseEdge: { name: 'BaseEdge', template: '<path />' },
  EdgeLabelRenderer: { name: 'EdgeLabelRenderer', template: '<div><slot /></div>' },
  getSmoothStepPath: () => ['M0,0', 50, 60],
  Position: { Bottom: 'bottom', Top: 'top' }
}))

import InsertableEdge from '../../src/components/GraphEditor/edges/InsertableEdge.vue'

const EDGE_PROPS = {
  id: 'edge-step-1-step-2',
  source: 'step-1',
  target: 'step-2',
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100
}

let events: CustomEvent[]
const capture = (e: Event) => events.push(e as CustomEvent)

beforeEach(() => {
  events = []
  window.addEventListener('graph-editor:insert-on-edge', capture)
  window.addEventListener('graph-editor:remove-edge', capture)
})

afterEach(() => {
  window.removeEventListener('graph-editor:insert-on-edge', capture)
  window.removeEventListener('graph-editor:remove-edge', capture)
})

describe('InsertableEdge — link actions', () => {
  it('offers both an insert and a remove control', () => {
    const wrapper = mount(InsertableEdge, { props: EDGE_PROPS })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].find('i').classes()).toContain('fa-plus')
    expect(buttons[1].find('i').classes()).toContain('fa-minus')
  })

  it('asks the canvas to remove this edge, by id', async () => {
    const wrapper = mount(InsertableEdge, { props: EDGE_PROPS })

    await wrapper.findAll('button')[1].trigger('click')

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('graph-editor:remove-edge')
    expect(events[0].detail).toEqual({ edgeId: 'edge-step-1-step-2' })
  })

  it('still asks the canvas to insert on this edge', async () => {
    const wrapper = mount(InsertableEdge, { props: EDGE_PROPS })

    await wrapper.findAll('button')[0].trigger('click')

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('graph-editor:insert-on-edge')
    expect(events[0].detail).toMatchObject({
      edgeId: 'edge-step-1-step-2',
      source: 'step-1',
      target: 'step-2'
    })
  })

  // Both controls are reachable and named. The remove control in particular
  // must not be an unlabelled icon: it is the destructive one.
  it('labels both controls for assistive tech', () => {
    const wrapper = mount(InsertableEdge, {
      props: EDGE_PROPS,
      global: {
        provide: {
          insertableEdgeAriaLabel: 'Insérer une étape ici',
          removableEdgeAriaLabel: 'Supprimer ce lien'
        }
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('aria-label')).toBe('Insérer une étape ici')
    expect(buttons[1].attributes('aria-label')).toBe('Supprimer ce lien')
  })
})
