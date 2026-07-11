/**
 * RED — Entity.vue import must SKIP create hooks (MR-4 product decision).
 *
 * Product decision (owner, 2026-07-11): the bulk-import path
 * (handleImportFile → per-row create) must NOT run the store's create hooks,
 * restoring pre-refactor semantics. For hook-bearing stores the hooks have real
 * blast radius (generations' afterCreate launches a generation job;
 * classGroups' afterCreate creates subgroups) that must not fire on an import.
 * The manual create path (addEntity) must KEEP running hooks — skipHooks must
 * not leak into the normal path.
 *
 * These tests mount the real Entity.vue over a store carrying observable
 * before/after create hooks and drive the two write paths through the exposed
 * setup bindings (vm.handleImportFile / vm.addEntity), asserting on the hooks'
 * observable side effects and the axios boundary. Demo mode is mocked OFF.
 *
 * Expected: test 1 RED (import currently runs hooks), test 2 GREEN (regression
 * pin — manual create already runs hooks; guards against skipHooks leaking).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { h, reactive } from 'vue'

// ---- Mocks (must be declared before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: () => false,
  logDemoAction: vi.fn(),
  simulateDelay: () => Promise.resolve()
}))

const mockRouterPush = vi.fn().mockResolvedValue(undefined)
const mockRouterReplace = vi.fn().mockResolvedValue(undefined)
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, path: '/themes' }),
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace })
}))

const showSuccessSpy = vi.fn()
const showErrorSpy = vi.fn()
const showConfirmSpy = vi.fn().mockResolvedValue(true)
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: showErrorSpy,
    showSuccess: showSuccessSpy,
    showConfirm: showConfirmSpy,
    showInfo: vi.fn(),
    showWarning: vi.fn()
  })
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: null, userRoles: [] })
}))

import axios from 'axios'
import Entity from '../../src/components/Pages/Entity.vue'
import { useBaseStore } from '../../src/stores/baseStore'

// Store carrying observable create hooks. reactive() mirrors the Pinia store
// proxy used in production; the spread preserves the shared hook closure, so
// setBeforeCreateHook/setAfterCreateHook drive the same hooks createEntity reads.
function makeHookedStore() {
  const base = useBaseStore()
  const fieldList = new Map<string, any>([
    ['name', { label: 'Name', type: 'input', display: true, toBeSet: true, toBeEdited: true }]
  ])
  return reactive({ ...base, fieldList })
}

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

function mountEntity(store: any, entityName = 'themes') {
  return mount(Entity, {
    props: { entityName, entityStore: store },
    slots: {
      card: (slotProps: any) => h('span', { class: 'e-name' }, slotProps.entity?.name)
    },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        EntityModal: true,
        EntityCard: true,
        EntityListSkeleton: true,
        EmptyState: true
      }
    }
  })
}

function cursorPage(data: any[]) {
  return { data: { data, nextCursor: null, hasMore: false, total: data.length } }
}

describe('Entity.vue — create hooks on import vs manual create (MR-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    showConfirmSpy.mockResolvedValue(true)
    ;(axios.get as any).mockResolvedValue(cursorPage([]))
  })

  it('import does not run create hooks (both markers stay untouched)', async () => {
    const store = makeHookedStore()
    const beforeCalls: any[] = []
    const afterCalls: any[] = []
    store.setBeforeCreateHook(async (data: any) => { beforeCalls.push(data); return data })
    store.setAfterCreateHook(async (entity: any) => { afterCalls.push(entity) })

    const wrapper = mountEntity(store)
    await flushPromises()

    ;(axios.post as any).mockResolvedValue({ data: {} })

    const payload = [{ name: 'Row1' }, { name: 'Row2' }]
    const file = new File([JSON.stringify(payload)], 'themes.json', { type: 'application/json' })
    const input = document.createElement('input')
    Object.defineProperty(input, 'files', { value: [file] })

    await (wrapper.vm as any).handleImportFile({ target: input })
    await flushPromises()

    // The writes still happen: one POST per row. (The store push is pinned at
    // the store layer — handleImportFile calls loadEntities() afterwards, whose
    // mocked GET returns empty, so entities.length here reflects the reload, not
    // the import; asserting it would test the reload, not this contract.)
    expect(axios.post).toHaveBeenCalledTimes(2)

    // RED today: the import path runs createEntity with hooks enabled, so both
    // markers get populated. With { skipHooks: true } they must stay empty.
    expect(beforeCalls).toHaveLength(0)
    expect(afterCalls).toHaveLength(0)
  })

  it('[regression] manual create still runs both hooks (skipHooks does not leak)', async () => {
    const store = makeHookedStore()
    const beforeCalls: any[] = []
    const afterCalls: any[] = []
    // beforeCreate transforms the payload; the transformed body must reach POST.
    store.setBeforeCreateHook(async (data: any) => { beforeCalls.push(data); return { ...data, tagged: true } })
    store.setAfterCreateHook(async (entity: any) => { afterCalls.push(entity) })

    const wrapper = mountEntity(store)
    await flushPromises()

    ;(axios.post as any).mockResolvedValueOnce({ data: { id: 'm1', name: 'Manual' } })

    await (wrapper.vm as any).addEntity({ name: 'Manual' })
    await flushPromises()

    expect(beforeCalls).toHaveLength(1)
    expect(afterCalls).toHaveLength(1)
    // beforeCreate's transformation is applied to the POST payload.
    expect(axios.post).toHaveBeenCalledWith('/themes', { name: 'Manual', tagged: true })
  })
})
