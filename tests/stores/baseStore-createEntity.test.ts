/**
 * RED — baseStore.createEntity skipHooks option (MR-4 product decision).
 *
 * Product decision (owner, 2026-07-11): Entity.vue's bulk-import path must
 * create rows WITHOUT running the store's create hooks, restoring pre-refactor
 * semantics. For hook-bearing stores this matters: e.g. generations'
 * afterCreate triggers a real generation job, classGroups' afterCreate creates
 * subgroups — none of which should fire when importing a JSON dump.
 *
 * Fix contract pinned here (store layer):
 *   createEntity(endpoint, data, options?: { skipHooks?: boolean })
 *     - { skipHooks: true }  → POST + entities.push happen; NEITHER beforeCreate
 *                              NOR afterCreate runs.
 *     - no options / default → unchanged (both hooks run).
 *
 * Note on RED: vitest transpiles via esbuild (types stripped, not checked), so
 * the extra 3rd argument does NOT fail to compile — instead the test RUNS and
 * the hooks fire anyway, so the skipHooks assertions fail. That failure is the
 * red. The default-behavior test is a GREEN regression pin (hooks already run).
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

describe('baseStore.createEntity — skipHooks option (MR-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skipHooks: true — POSTs and pushes the entity but runs NEITHER hook', async () => {
    const store = useBaseStore()
    const beforeCalls: any[] = []
    const afterCalls: any[] = []
    store.setBeforeCreateHook(async (data) => { beforeCalls.push(data); return data })
    store.setAfterCreateHook(async (entity) => { afterCalls.push(entity) })

    ;(axios.post as any).mockResolvedValueOnce({ data: { id: 'x1', name: 'Foo' } })

    const created = await store.createEntity('/things', { name: 'Foo' }, { skipHooks: true })

    // The write still happens exactly as today.
    expect(axios.post).toHaveBeenCalledWith('/things', { name: 'Foo' })
    expect(created).toMatchObject({ id: 'x1' })
    expect(store.entities.map((e: any) => e.id)).toContain('x1')

    // RED today: both hooks currently fire because the option is ignored.
    expect(beforeCalls).toHaveLength(0)
    expect(afterCalls).toHaveLength(0)
  })

  it('[regression] default (no options) — runs BOTH create hooks', async () => {
    const store = useBaseStore()
    const beforeCalls: any[] = []
    const afterCalls: any[] = []
    store.setBeforeCreateHook(async (data) => { beforeCalls.push(data); return data })
    store.setAfterCreateHook(async (entity) => { afterCalls.push(entity) })

    ;(axios.post as any).mockResolvedValueOnce({ data: { id: 'x2', name: 'Bar' } })

    await store.createEntity('/things', { name: 'Bar' })

    expect(axios.post).toHaveBeenCalledWith('/things', { name: 'Bar' })
    expect(store.entities.map((e: any) => e.id)).toContain('x2')
    expect(beforeCalls).toHaveLength(1)
    expect(afterCalls).toHaveLength(1)
  })
})
