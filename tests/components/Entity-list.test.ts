/**
 * CHARACTERIZATION — Entity.vue list / pagination surfaces.
 *
 * MR-4 will delegate Entity.vue's raw axios calls to baseStore methods.
 * These tests PIN the externally-observable contract that must NOT change:
 * the HTTP requests issued (URL / verb / params) and the rendered list.
 * They deliberately do NOT pin which internal code path issues the call,
 * hook mechanics, or demo-mode branches (demo mode is mocked OFF).
 *
 * A realistic store (`{ ...useBaseStore(), fieldList }`, like the themes
 * store) is used, so the list load takes the STORE path
 * (`store.loadEntitiesWithCursor`, Entity.vue:864) — the path that actually
 * runs in production. The raw-axios fallback (Entity.vue:892) is unreachable
 * with any baseStore-backed store (it requires a store WITHOUT a
 * `loadEntitiesWithCursor` method, which no real store is) and is therefore
 * documented rather than pinned — see the report.
 *
 * Expected against current code: GREEN (this is characterization).
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

// Demo mode OFF — the baseStore branches on isDemoMode(); we pin the real path.
vi.mock('../../src/services/demo', () => ({
  isDemoMode: () => false,
  logDemoAction: vi.fn(),
  simulateDelay: () => Promise.resolve()
}))

// Route/router are stubbed; route.query is a stable empty object so the
// deep query watcher never fires. push/replace resolve so updateURL()'s
// `.finally` chain settles.
const mockRouterPush = vi.fn().mockResolvedValue(undefined)
const mockRouterReplace = vi.fn().mockResolvedValue(undefined)
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, path: '/themes' }),
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace })
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showConfirm: vi.fn().mockResolvedValue(true),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  })
}))

// Non-admin current user → displayedEntities does no admin filtering and
// returns the store entities verbatim.
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: null, userRoles: [] })
}))

import axios from 'axios'
import Entity from '../../src/components/Pages/Entity.vue'
import { useBaseStore } from '../../src/stores/baseStore'

// A realistic themes-like store: baseStore + a fieldList with a display field.
// Wrapped in reactive() to mirror the Pinia store proxy used in production.
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
      // Render entities through the public card-slot API so DOM assertions
      // don't depend on EntityCard internals.
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

describe('Entity.vue — list load & pagination (characterization)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('issues the cursor list load GET /{entity}?cursor=&limit=20 on mount (store path)', async () => {
    ;(axios.get as any).mockResolvedValue(cursorPage([{ id: 't1', name: 'Solarized' }]))

    mountEntity(makeThemesStore())
    await flushPromises()

    const urls = (axios.get as any).mock.calls.map((c: any[]) => c[0])
    // The store's loadEntitiesWithCursor builds `/themes?cursor=&limit=20`.
    expect(
      urls.some((u: any) =>
        typeof u === 'string' &&
        u.startsWith('/themes?') &&
        u.includes('cursor=') &&
        u.includes('limit=20')
      )
    ).toBe(true)
  })

  it('renders one row per loaded entity, showing its display field', async () => {
    ;(axios.get as any).mockResolvedValue(
      cursorPage([
        { id: 't1', name: 'Solarized' },
        { id: 't2', name: 'Dracula' }
      ])
    )

    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()

    const rows = wrapper.findAll('li.entity-item')
    expect(rows.length).toBe(2)
    const names = wrapper.findAll('.e-name').map((n) => n.text())
    expect(names).toContain('Solarized')
    expect(names).toContain('Dracula')
  })

  it('navigating to page 2 re-issues the list GET carrying the next cursor', async () => {
    // First load advertises another page and a concrete next cursor.
    ;(axios.get as any).mockResolvedValueOnce(
      cursorPage(
        Array.from({ length: 20 }, (_, i) => ({ id: `t${i}`, name: `Theme ${i}` })),
        { nextCursor: 'CURSOR2', hasMore: true, total: 40 }
      )
    )
    // Second load (page 2) — assert its URL carries the cursor.
    ;(axios.get as any).mockResolvedValueOnce(
      cursorPage(
        Array.from({ length: 20 }, (_, i) => ({ id: `t${20 + i}`, name: `Theme ${20 + i}` })),
        { nextCursor: null, hasMore: false, total: 40 }
      )
    )

    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()

    ;(axios.get as any).mockClear()
    await (wrapper.vm as any).goToNextPage()
    await flushPromises()

    const urls = (axios.get as any).mock.calls.map((c: any[]) => c[0])
    expect(
      urls.some((u: any) => typeof u === 'string' && u.startsWith('/themes?') && u.includes('cursor=CURSOR2'))
    ).toBe(true)
  })

  it('loads parent/sub stores without pagination via GET /{key} with size=100', async () => {
    // getEntitiesWithoutPagination (Entity.vue:977) is exercised when the
    // store declares sub-entities. It issues a distinct un-paginated GET.
    const store = makeThemesStore()
    const childStore = useBaseStore()
    store.subEntitiesStores.set('themeChildren', childStore as any)

    ;(axios.get as any).mockImplementation((url: string) => {
      if (typeof url === 'string' && url.startsWith('/themes?')) {
        return Promise.resolve(cursorPage([{ id: 't1', name: 'Solarized' }]))
      }
      // un-paginated child load
      return Promise.resolve({ data: [] })
    })

    mountEntity(store)
    await flushPromises()

    const childCall = (axios.get as any).mock.calls.find((c: any[]) => c[0] === '/themeChildren')
    expect(childCall).toBeTruthy()
    expect(childCall[1]).toEqual({ params: { size: 100 } })
  })
})
