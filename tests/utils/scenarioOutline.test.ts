/**
 * The editor's step list is the step order: moving, inserting or deleting a
 * step ends with the list written back as 0-based orders.
 *
 * Scenario steps are 0-based everywhere else — the importer writes Order = i
 * and a session seeds CurrentStep from the first step's Order — and an editor
 * that renumbered from 1 rewrote every imported scenario on its first save.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const patchMock = vi.fn()
vi.mock('axios', () => ({ default: { patch: (...args: any[]) => patchMock(...args) } }))

import { draftStep, insertStep, moveStep, renumberSteps, savedPosition, toOutlineSteps } from '../../src/utils/scenarioOutline'

const steps = () => toOutlineSteps([
  { id: 'c', order: 2, title: 'Third', step_type: 'quiz' },
  { id: 'a', order: 0, title: 'First', step_type: 'terminal' },
  { id: 'b', order: 1, title: 'Second' }
])

beforeEach(() => patchMock.mockReset().mockResolvedValue({}))

describe('toOutlineSteps', () => {
  it('orders by the stored order, keeping order 0 first, and defaults a missing type to terminal', () => {
    const list = steps()
    expect(list.map(s => s.id)).toEqual(['a', 'b', 'c'])
    expect(list[1].step_type).toBe('terminal')
  })
})

describe('moveStep / insertStep', () => {
  it('moves a step down and up', () => {
    expect(moveStep(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveStep(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'c', 'b'])
  })

  it('leaves the list alone for a move past either end', () => {
    const list = ['a', 'b']
    expect(moveStep(list, 0, -1)).toBe(list)
    expect(moveStep(list, 1, 2)).toBe(list)
  })

  it('inserts at the given position, clamped to the ends', () => {
    expect(insertStep(['a', 'b'], 'x', 1)).toEqual(['a', 'x', 'b'])
    expect(insertStep(['a', 'b'], 'x', 9)).toEqual(['a', 'b', 'x'])
    expect(insertStep(['a', 'b'], 'x', -3)).toEqual(['x', 'a', 'b'])
  })
})

describe('renumberSteps', () => {
  it('writes the new list order from 0, patching only the steps that moved', async () => {
    const list = moveStep(steps(), 2, 0) // c, a, b

    const result = await renumberSteps(list)

    expect(patchMock.mock.calls).toEqual([
      ['/scenario-steps/c', { order: 0 }],
      ['/scenario-steps/a', { order: 1 }],
      ['/scenario-steps/b', { order: 2 }]
    ])
    expect(result).toEqual({ patched: 3, failedLabels: [] })
    expect(list.map(s => s.order)).toEqual([0, 1, 2])
  })

  it('patches nothing when the order already matches', async () => {
    await renumberSteps(steps())
    expect(patchMock).not.toHaveBeenCalled()
  })

  it('gives an unsaved draft its place without writing it', async () => {
    const list = insertStep(steps(), draftStep('flag'), 1) // a, draft, b, c

    await renumberSteps(list)

    expect(patchMock.mock.calls).toEqual([
      ['/scenario-steps/b', { order: 2 }],
      ['/scenario-steps/c', { order: 3 }]
    ])
  })

  it('names the steps whose order could not be saved, and keeps their old order', async () => {
    patchMock.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('boom'))
    const list = moveStep(steps(), 0, 1) // b, a, c

    const result = await renumberSteps(list)

    expect(result).toEqual({ patched: 1, failedLabels: ['First'] })
    expect(list.map(s => s.order)).toEqual([0, 0, 2])
  })
})

describe('savedPosition', () => {
  it('counts only the saved steps before an outline index', () => {
    const list = insertStep(steps(), draftStep('info'), 1) // a, draft, b, c
    expect(savedPosition(list, 0)).toBe(0)
    expect(savedPosition(list, 2)).toBe(1)
    expect(savedPosition(list, 4)).toBe(3)
  })
})
