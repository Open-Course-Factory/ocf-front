import { describe, it, expect, beforeEach, vi } from 'vitest'

// The zoom ref is module-level (shared by every terminal on the page), so each
// test re-imports the module to start from what localStorage holds.
async function load() {
  vi.resetModules()
  return (await import('../../src/composables/useTerminalZoom')).useTerminalZoom()
}

describe('useTerminalZoom', () => {
  beforeEach(() => localStorage.clear())

  it('starts at 100% and steps through the levels, remembered per browser', async () => {
    const z = await load()
    expect(z.zoom.value).toBe(1)
    z.zoomIn()
    expect(z.zoom.value).toBe(1.25)
    expect(localStorage.getItem('ocf-terminal-zoom')).toBe('1.25')
    expect((await load()).zoom.value).toBe(1.25)
  })

  it('stops at both ends', async () => {
    const z = await load()
    for (let i = 0; i < 20; i++) z.zoomIn()
    expect(z.zoom.value).toBe(2.5)
    expect(z.canZoomIn.value).toBe(false)
    for (let i = 0; i < 20; i++) z.zoomOut()
    expect(z.zoom.value).toBe(0.75)
    expect(z.canZoomOut.value).toBe(false)
    z.resetZoom()
    expect(z.zoom.value).toBe(1)
  })

  it('ignores a stored value that is not a level', async () => {
    for (const bad of ['', 'abc', '0', '1.3', '99']) {
      localStorage.setItem('ocf-terminal-zoom', bad)
      expect((await load()).zoom.value).toBe(1)
    }
  })
})
