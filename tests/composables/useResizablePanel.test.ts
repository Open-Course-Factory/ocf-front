/**
 * Tests for useResizablePanel — the drag-from-the-left-edge resize logic shared
 * by the scenario/course editors (extracted during the Wave 12 split, extended
 * with keyboard resize in the a11y pass #210).
 *
 * Safety net before the CourseEditor de-duplication refactor (FRONT-2).
 *
 * Covered:
 *   - default width + custom bounds
 *   - loadPanelWidth reads a valid width from localStorage on mount and ignores
 *     out-of-bounds values
 *   - resizeBy: adjusts within bounds + persists, and clamps at min/max
 *   - startResize flips isResizing
 *
 * The composable installs document listeners in onMounted, so it's run inside a
 * fake setup() (the established dummy-mount pattern). localStorage is the real
 * jsdom one, cleared between tests.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useResizablePanel } from '../../src/composables/useResizablePanel'

type Panel = ReturnType<typeof useResizablePanel>

function setupPanel(options: Parameters<typeof useResizablePanel>[0]): Panel {
  let captured!: Panel
  const Dummy = defineComponent({
    setup() {
      captured = useResizablePanel(options)
      return () => h('div')
    }
  })
  mount(Dummy)
  return captured
}

beforeEach(() => {
  localStorage.clear()
})

describe('useResizablePanel — initial width', () => {
  it('uses the default width when storage is empty', () => {
    const p = setupPanel({ storageKey: 'test_panel' })
    expect(p.panelWidth.value).toBe(280)
  })

  it('honors a custom defaultWidth', () => {
    const p = setupPanel({ storageKey: 'test_panel', defaultWidth: 320 })
    expect(p.panelWidth.value).toBe(320)
  })

  it('restores a valid saved width from localStorage on mount', () => {
    localStorage.setItem('test_panel', '400')
    const p = setupPanel({ storageKey: 'test_panel' })
    expect(p.panelWidth.value).toBe(400)
  })

  it('ignores an out-of-bounds saved width', () => {
    localStorage.setItem('test_panel', '9999')
    const p = setupPanel({ storageKey: 'test_panel' })
    expect(p.panelWidth.value).toBe(280)
  })
})

describe('useResizablePanel — resizeBy (keyboard resize)', () => {
  it('adjusts the width by the delta and persists it', () => {
    const p = setupPanel({ storageKey: 'test_panel' })
    p.resizeBy(10)
    expect(p.panelWidth.value).toBe(290)
    expect(localStorage.getItem('test_panel')).toBe('290')

    p.resizeBy(-30)
    expect(p.panelWidth.value).toBe(260)
    expect(localStorage.getItem('test_panel')).toBe('260')
  })

  it('does not exceed maxWidth', () => {
    const p = setupPanel({ storageKey: 'test_panel', defaultWidth: 595, maxWidth: 600 })
    p.resizeBy(10) // would be 605 > 600 → rejected
    expect(p.panelWidth.value).toBe(595)
  })

  it('does not go below minWidth', () => {
    const p = setupPanel({ storageKey: 'test_panel', defaultWidth: 205, minWidth: 200 })
    p.resizeBy(-10) // would be 195 < 200 → rejected
    expect(p.panelWidth.value).toBe(205)
  })
})

describe('useResizablePanel — startResize', () => {
  it('flips isResizing on mousedown', () => {
    const p = setupPanel({ storageKey: 'test_panel' })
    expect(p.isResizing.value).toBe(false)
    p.startResize(new MouseEvent('mousedown', { clientX: 100 }))
    expect(p.isResizing.value).toBe(true)
  })
})
