/**
 * baseStore archiving support.
 *
 * Archiving is a framework capability an entity opts into (ocf-core#488):
 * POST /{entities}/{id}/archive|unarchive answer with the entity DTO carrying
 * archived_at, and GET /{entities} hides archived rows unless asked with
 * include_archived=true. The store mirrors exactly that contract — and never
 * sends the parameter when the toggle is off, because the generic list
 * handler treats every unknown parameter as a column filter (404).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: () => false,
  logDemoAction: vi.fn(),
  simulateDelay: () => Promise.resolve()
}))

import axios from 'axios'
import { useBaseStore } from '../../src/stores/baseStore'

const inService = { id: 'sc-1', title: 'Docker Basics' }
const archived = { ...inService, archived_at: '2026-01-15T10:00:00Z' }

function listResponse(rows: any[]) {
  return { data: { data: rows, nextCursor: null, hasMore: false, total: rows.length } }
}

describe('baseStore — archivable entities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is not archivable and does not show archived rows by default', () => {
    const store = useBaseStore()
    expect(store.archivable.value).toBe(false)
    expect(store.includeArchived.value).toBe(false)
  })

  it('leaves include_archived out of the list request while the toggle is off', async () => {
    ;(axios.get as any).mockResolvedValue(listResponse([inService]))
    const store = useBaseStore()
    store.archivable.value = true

    await store.loadEntitiesWithCursor('/scenarios', undefined, 20)

    expect((axios.get as any).mock.calls[0][0]).not.toContain('include_archived')
  })

  it('asks for archived rows with include_archived=true once the toggle is on', async () => {
    ;(axios.get as any).mockResolvedValue(listResponse([inService, archived]))
    const store = useBaseStore()
    store.archivable.value = true
    store.includeArchived.value = true

    await store.loadEntitiesWithCursor('/scenarios', undefined, 20)
    await store.fetchAllEntities('/scenarios')

    const cursorUrl = (axios.get as any).mock.calls[0][0] as string
    const exportUrl = (axios.get as any).mock.calls[1][0] as string
    expect(cursorUrl).toContain('include_archived=true')
    expect(exportUrl).toContain('include_archived=true')
  })

  it('archives through POST /{entities}/{id}/archive and updates the row in place', async () => {
    ;(axios.get as any).mockResolvedValue(listResponse([inService]))
    ;(axios.post as any).mockResolvedValue({ data: archived })
    const store = useBaseStore()
    await store.loadEntitiesWithCursor('/scenarios', undefined, 20)

    const result = await store.archiveEntity('/scenarios', 'sc-1')

    expect(axios.post).toHaveBeenCalledWith('/scenarios/sc-1/archive')
    expect(result.archived_at).toBe(archived.archived_at)
    expect(store.entities[0].archived_at).toBe(archived.archived_at)
  })

  it('restores through POST /{entities}/{id}/unarchive and clears archived_at on the row', async () => {
    ;(axios.get as any).mockResolvedValue(listResponse([archived]))
    // The DTO omits archived_at once cleared (omitempty).
    ;(axios.post as any).mockResolvedValue({ data: inService })
    const store = useBaseStore()
    await store.loadEntitiesWithCursor('/scenarios', undefined, 20)

    await store.unarchiveEntity('/scenarios', 'sc-1')

    expect(axios.post).toHaveBeenCalledWith('/scenarios/sc-1/unarchive')
    expect(store.entities[0].archived_at).toBeUndefined()
  })

  it('propagates a refusal so the caller can show the backend message', async () => {
    const refusal = { response: { status: 409, data: { error_message: 'still assigned' } } }
    ;(axios.post as any).mockRejectedValue(refusal)
    const store = useBaseStore()

    await expect(store.archiveEntity('/scenarios', 'sc-1')).rejects.toBe(refusal)
  })
})
