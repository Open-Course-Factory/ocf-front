/**
 * Tests for the free-text search box in Entity.vue's toolbar.
 *
 * The search is CLIENT-SIDE over the page currently loaded: the generic entity
 * routes in ocf-core turn every unrecognised query param into an exact-match
 * column predicate, so there is nothing server-side to delegate a substring
 * search to. Two consequences are pinned here — typing must not issue any new
 * HTTP request, and the UI must state that the count covers one page.
 *
 * The contract these tests hold, all on rendered DOM:
 *   - an empty box is indistinguishable from the search not existing: same rows,
 *     same order, no scope note, no extra request;
 *   - typing narrows the rendered rows to those whose card text matches, after
 *     the debounce and not before;
 *   - clearing restores the full page immediately, without waiting out a debounce;
 *   - a search matching nothing on a non-empty page says so, instead of falling
 *     through to the "you have no entities yet" empty state.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { h, reactive } from 'vue'

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

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, path: '/themes' }),
  useRouter: () => ({
    push: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined)
  })
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

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: null, userRoles: [] })
}))

import axios from 'axios'
import Entity from '../../src/components/Pages/Entity.vue'
import { useBaseStore } from '../../src/stores/baseStore'

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

function mountEntity(store: any) {
  return mount(Entity, {
    props: { entityName: 'themes', entityStore: store },
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

const THEMES = [
  { id: 't1', name: 'Solarized Light' },
  { id: 't2', name: 'Dracula' },
  { id: 't3', name: 'Gruvbox' }
]

function renderedNames(wrapper: ReturnType<typeof mountEntity>) {
  return wrapper.findAll('.e-name').map(n => n.text())
}

/** Type into the toolbar search box and let the debounce elapse. */
async function search(wrapper: ReturnType<typeof mountEntity>, text: string) {
  await wrapper.find('input[type="search"]').setValue(text)
  await vi.advanceTimersByTimeAsync(400)
  await flushPromises()
}

describe('Entity.vue — toolbar free-text search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // `performance` must be faked alongside Date, and the clock pinned.
    //
    // vitest does not fake `performance` by default, so vue-i18n's message
    // compiler compared a faked Date against a real performance.now() and
    // derived a negative timestamp. Every t() call then threw inside the
    // compiler, and useTranslations' wrapT caught it and returned the key —
    // so assertions on rendered text saw "entitySearch.scopeNote" rather than
    // a sentence, and the failure looked like a missing translation.
    vi.useFakeTimers({
      now: new Date('2026-01-01T00:00:00Z'),
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
    })
    setActivePinia(createPinia())
    ;(axios.get as any).mockResolvedValue(cursorPage(THEMES))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the whole page and no scope note while the box is empty', async () => {
    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()

    expect(renderedNames(wrapper)).toEqual(['Solarized Light', 'Dracula', 'Gruvbox'])
    expect(wrapper.find('.search-scope-info').exists()).toBe(false)
  })

  it('narrows the rendered rows to the entities whose name matches', async () => {
    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()

    await search(wrapper, 'dra')

    expect(renderedNames(wrapper)).toEqual(['Dracula'])
  })

  it('matches case- and accent-insensitively', async () => {
    ;(axios.get as any).mockResolvedValue(
      cursorPage([
        { id: 'g1', name: 'Promo Élève A' },
        { id: 'g2', name: 'Promo B' }
      ])
    )
    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()

    await search(wrapper, 'eleve')

    expect(renderedNames(wrapper)).toEqual(['Promo Élève A'])
  })

  it('waits out the debounce before narrowing the list', async () => {
    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()

    await wrapper.find('input[type="search"]').setValue('dra')
    await flushPromises()

    // Typed, but the debounce has not elapsed: still the whole page.
    expect(renderedNames(wrapper)).toHaveLength(3)

    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()

    expect(renderedNames(wrapper)).toEqual(['Dracula'])
  })

  it('issues no request while searching — the filtering is client-side', async () => {
    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()
    ;(axios.get as any).mockClear()

    await search(wrapper, 'dra')

    expect((axios.get as any).mock.calls).toHaveLength(0)
    expect(renderedNames(wrapper)).toEqual(['Dracula'])
  })

  it('states that the count covers the page being viewed, not the collection', async () => {
    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()

    await search(wrapper, 'o')

    const note = wrapper.find('.search-scope-info')
    expect(note.exists()).toBe(true)
    // Solarized Light and Gruvbox both contain an "o".
    expect(note.text()).toContain('2')
    expect(note.text()).toContain('page')
  })

  it('restores the full page as soon as the box is cleared', async () => {
    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()
    await search(wrapper, 'dra')
    expect(renderedNames(wrapper)).toEqual(['Dracula'])

    await wrapper.find('input[type="search"]').setValue('')
    await flushPromises()

    // No debounce to wait out: clearing is not a search.
    expect(renderedNames(wrapper)).toEqual(['Solarized Light', 'Dracula', 'Gruvbox'])
    expect(wrapper.find('.search-scope-info').exists()).toBe(false)
  })

  it('restores the full page from the clear button', async () => {
    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()
    await search(wrapper, 'dra')

    await wrapper.find('.btn-clear-search').trigger('click')
    await flushPromises()

    expect(renderedNames(wrapper)).toHaveLength(3)
  })

  it('says nothing matched rather than falling through to the empty state', async () => {
    const wrapper = mountEntity(makeThemesStore())
    await flushPromises()

    await search(wrapper, 'zzz-no-such-theme')

    expect(renderedNames(wrapper)).toHaveLength(0)
    expect(wrapper.find('.no-results').exists()).toBe(true)
    // The collection is not empty, so the "create your first one" state must not show.
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(false)
  })
})
