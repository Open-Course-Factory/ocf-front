/**
 * CHARACTERIZATION — Entity.vue CRUD / export / import surfaces.
 *
 * MR-4 will delegate Entity.vue's raw axios calls to baseStore methods.
 * These tests PIN the observable HTTP contract (URL / verb / payload) and
 * the resulting store/DOM state for each write path, WITHOUT pinning which
 * internal path issues the call. Demo mode is mocked OFF.
 *
 * Covered call sites:
 *   create  → axios.post   /{entity}                (Entity.vue:1004)
 *   delete  → axios.delete /{entity}/{id}           (Entity.vue:1044)
 *   update  → store.updateEntity → PATCH /{entity}/{id}  (Entity.vue:1061 → baseStore)
 *   export  → GET /{entity}?page=N&size=100 sequence (Entity.vue:1211)
 *   import  → POST /{entity} per cleaned row         (Entity.vue:1297)
 *
 * The create/export/import handlers are driven through the component's
 * exposed setup bindings (wrapper.vm.addEntity / exportEntities /
 * handleImportFile) rather than through the heavy EntityModal / hidden file
 * input — the narrowest honest way to reach them; the assertions are still on
 * the observable axios boundary and store/DOM. Delete is driven through the
 * real row button in the DOM.
 *
 * Expected against current code: GREEN (this is characterization).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

// Wrapped in reactive() to mirror the Pinia store proxy used in production:
// deleteEntity mutates `store.entities` in place (findIndex + splice), which
// must be tracked reactively.
function makeThemesStore() {
  const base = useBaseStore()
  const fieldList = new Map<string, any>([
    ['name', { label: 'Theme Name', type: 'input', display: true, toBeSet: true, toBeEdited: true }]
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

function cursorPage(data: any[], extra: Record<string, any> = {}) {
  return { data: { data, nextCursor: null, hasMore: false, total: data.length, ...extra } }
}

describe('Entity.vue — CRUD / export / import (characterization)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    showConfirmSpy.mockResolvedValue(true)
    // Default: empty list so each test starts from a known state.
    ;(axios.get as any).mockResolvedValue(cursorPage([]))
  })

  it('create: POSTs the payload to /{entity} and appends the new entity', async () => {
    const store = makeThemesStore()
    const wrapper = mountEntity(store)
    await flushPromises()

    ;(axios.post as any).mockResolvedValueOnce({ data: { id: 'new1', name: 'Nord' } })

    await (wrapper.vm as any).addEntity({ name: 'Nord' })
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith('/themes', { name: 'Nord' })
    expect(store.entities.map((e: any) => e.id)).toContain('new1')
    expect(wrapper.findAll('.e-name').map((n) => n.text())).toContain('Nord')
  })

  it('delete: clicking a row delete button DELETEs /{entity}/{id} and drops the row', async () => {
    const store = makeThemesStore()
    ;(axios.get as any).mockResolvedValue(cursorPage([{ id: 't1', name: 'Solarized' }]))
    const wrapper = mountEntity(store)
    await flushPromises()

    ;(axios.delete as any).mockResolvedValueOnce({})

    const delBtn = wrapper.find('li.entity-item button.btn-danger')
    expect(delBtn.exists()).toBe(true)
    await delBtn.trigger('click')
    await flushPromises()

    expect(axios.delete).toHaveBeenCalledWith('/themes/t1')
    expect(store.entities.find((e: any) => e.id === 't1')).toBeUndefined()
    expect(wrapper.findAll('li.entity-item').length).toBe(0)
  })

  it('update: delegates to store.updateEntity → PATCH /{entity}/{id} with the payload', async () => {
    const store = makeThemesStore()
    const wrapper = mountEntity(store)
    await flushPromises()

    ;(axios.patch as any).mockResolvedValueOnce({ data: { id: 't1', name: 'Renamed' } })

    await (wrapper.vm as any).updateEntity({ id: 't1', name: 'Renamed' })
    await flushPromises()

    expect(axios.patch).toHaveBeenCalledWith('/themes/t1', { id: 't1', name: 'Renamed' })
  })

  it('export: pages through GET /{entity}?page=N&size=100 until totalPages is reached', async () => {
    const store = makeThemesStore()
    const wrapper = mountEntity(store)
    await flushPromises()

    // Reset the mount-time list load; configure the export pagination.
    ;(axios.get as any).mockReset()
    ;(axios.get as any).mockImplementation((url: string) => {
      if (url.includes('page=1')) {
        return Promise.resolve({ data: { data: [{ id: 'a', name: 'A' }], totalPages: 2 } })
      }
      return Promise.resolve({ data: { data: [{ id: 'b', name: 'B' }], totalPages: 2 } })
    })

    // happy-dom lacks object-URL helpers used by the download trigger.
    ;(window.URL as any).createObjectURL = vi.fn(() => 'blob:mock')
    ;(window.URL as any).revokeObjectURL = vi.fn()

    await (wrapper.vm as any).exportEntities()
    await flushPromises()

    const urls = (axios.get as any).mock.calls.map((c: any[]) => c[0])
    expect(urls.some((u: string) => u.startsWith('/themes?') && u.includes('page=1') && u.includes('size=100'))).toBe(true)
    expect(urls.some((u: string) => u.startsWith('/themes?') && u.includes('page=2') && u.includes('size=100'))).toBe(true)
    expect(showSuccessSpy).toHaveBeenCalled()
  })

  it('import: POSTs one cleaned row per entry (server-only fields stripped)', async () => {
    const store = makeThemesStore()
    const wrapper = mountEntity(store)
    await flushPromises()

    ;(axios.post as any).mockResolvedValue({ data: {} })

    const payload = [
      { id: 'srv-1', created_at: '2020', updated_at: '2021', deleted_at: null, name: 'Imported', color: 'blue' }
    ]
    const file = new File([JSON.stringify(payload)], 'themes.json', { type: 'application/json' })
    const input = document.createElement('input')
    Object.defineProperty(input, 'files', { value: [file] })

    await (wrapper.vm as any).handleImportFile({ target: input })
    await flushPromises()

    expect(axios.post).toHaveBeenCalledTimes(1)
    const [url, body] = (axios.post as any).mock.calls[0]
    expect(url).toBe('/themes')
    // Server-managed fields must be stripped; user fields preserved.
    expect(body).not.toHaveProperty('id')
    expect(body).not.toHaveProperty('created_at')
    expect(body).not.toHaveProperty('updated_at')
    expect(body).not.toHaveProperty('deleted_at')
    expect(body).toMatchObject({ name: 'Imported', color: 'blue' })
  })
})
