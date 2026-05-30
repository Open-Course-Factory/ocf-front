/**
 * Tests for download — the browser file-download side-effect helpers extracted
 * verbatim from GroupScenariosTab.vue (commit c4 of #244).
 *
 * Each helper builds a Blob, creates an object URL, clicks a temporary anchor
 * with the given filename, then revokes the URL. We capture the Blob (via the
 * createObjectURL spy) and the anchor (via the createElement spy) to assert on
 * observable effects: blob content + type, anchor.download, click(), revoke().
 *
 * Source (parent lines 945–953, 1080–1097):
 *   downloadCsv  → Blob([csv], { type: 'text/csv;charset=utf-8;' })
 *   downloadJSON → Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
 *   downloadBlob → passes the blob through unchanged
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { downloadCsv, downloadJSON, downloadBlob } from '../../src/utils/download'

let createdAnchor: HTMLAnchorElement
let clickSpy: ReturnType<typeof vi.fn>
let capturedBlob: Blob | null
let createObjectURLSpy: ReturnType<typeof vi.fn>
let revokeObjectURLSpy: ReturnType<typeof vi.fn>
let createElementSpy: any

beforeEach(() => {
  capturedBlob = null
  clickSpy = vi.fn()

  createObjectURLSpy = vi.fn((blob: Blob) => {
    capturedBlob = blob
    return 'blob:fake-url'
  })
  revokeObjectURLSpy = vi.fn()
  ;(globalThis.URL as any).createObjectURL = createObjectURLSpy
  ;(globalThis.URL as any).revokeObjectURL = revokeObjectURLSpy

  // Intercept the anchor that the helper creates so we can read .download/.href
  // and confirm it was clicked, without a real navigation.
  const realCreateElement = document.createElement.bind(document)
  createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = realCreateElement(tag) as HTMLElement
    if (tag === 'a') {
      createdAnchor = el as HTMLAnchorElement
      ;(el as any).click = clickSpy
    }
    return el
  })
})

afterEach(() => {
  createElementSpy.mockRestore()
})

describe('downloadCsv', () => {
  it('creates a text/csv blob with the csv content and downloads it under the filename', async () => {
    downloadCsv('a,b,c\n1,2,3', 'results.csv')

    expect(capturedBlob).toBeInstanceOf(Blob)
    expect(capturedBlob!.type).toContain('text/csv')
    expect(await capturedBlob!.text()).toBe('a,b,c\n1,2,3')

    expect(createdAnchor.download).toBe('results.csv')
    expect(createdAnchor.getAttribute('href')).toBe('blob:fake-url')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url')
  })
})

describe('downloadJSON', () => {
  it('creates a pretty-printed application/json blob and downloads it', async () => {
    const data = { name: 'Alice', steps: [1, 2] }
    downloadJSON(data, 'export.json')

    expect(capturedBlob).toBeInstanceOf(Blob)
    expect(capturedBlob!.type).toContain('application/json')
    // 2-space pretty print, matching JSON.stringify(data, null, 2).
    expect(await capturedBlob!.text()).toBe(JSON.stringify(data, null, 2))

    expect(createdAnchor.download).toBe('export.json')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url')
  })
})

describe('downloadBlob', () => {
  it('passes the provided blob through unchanged and downloads it', async () => {
    const blob = new Blob(['raw-bytes'], { type: 'application/zip' })
    downloadBlob(blob, 'archive.zip')

    // The same blob instance is handed to createObjectURL.
    expect(capturedBlob).toBe(blob)
    expect(capturedBlob!.type).toBe('application/zip')
    expect(await capturedBlob!.text()).toBe('raw-bytes')

    expect(createdAnchor.download).toBe('archive.zip')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url')
  })
})
