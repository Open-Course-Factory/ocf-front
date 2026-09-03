/**
 * Entity.vue on an archivable store.
 *
 * When the store opts in (archivable = true) the generic list grows a
 * "show archived" toggle in the toolbar, an archive/restore row action and an
 * archived badge. None of it may move the layout: the badge occupies a
 * reserved slot whether or not the row is archived, and the row action is one
 * always-rendered button whose label flips, never two buttons swapped in and
 * out. A store that does not opt in sees none of it.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'

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
  useRoute: () => ({ query: {}, path: '/scenarios' }),
  useRouter: () => ({
    push: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined)
  })
}))

const showErrorMock = vi.fn()
const showSuccessMock = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: showErrorMock,
    showSuccess: showSuccessMock,
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

const inService = { id: 'sc-1', title: 'Docker Basics' }
const archived = { id: 'sc-2', title: 'Old Lab', archived_at: '2026-01-15T10:00:00Z' }

function makeStore(archivable: boolean) {
  const base = useBaseStore()
  base.archivable.value = archivable
  const fieldList = new Map<string, any>([
    ['title', { label: 'Title', type: 'input', display: true, toBeSet: true, toBeEdited: true }]
  ])
  return reactive({ ...base, fieldList, $id: 'scenarios' })
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

function listResponse(rows: any[]) {
  return { data: { data: rows, nextCursor: null, hasMore: false, total: rows.length } }
}

async function mountList(store: any) {
  const wrapper = mount(Entity, {
    props: { entityName: 'scenarios', entityStore: store },
    global: {
      plugins: [createTestI18n()],
      stubs: { EntityModal: true, EntityListSkeleton: true, EmptyState: true }
    }
  })
  await flushPromises()
  return wrapper
}

describe('Entity.vue — archivable store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    ;(axios.get as any).mockResolvedValue(listResponse([inService, archived]))
  })

  it('shows nothing archive-related for a store that did not opt in', async () => {
    const wrapper = await mountList(makeStore(false))

    expect(wrapper.find('[data-test="entity-show-archived"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="entity-archive-toggle"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="entity-archived-badge"]').exists()).toBe(false)
  })

  it('offers the toggle and one row action per row, labelled by the row state', async () => {
    const wrapper = await mountList(makeStore(true))

    expect(wrapper.find('[data-test="entity-show-archived"]').exists()).toBe(true)
    const actions = wrapper.findAll('[data-test="entity-archive-toggle"]')
    expect(actions).toHaveLength(2)
    expect(actions[0].text()).toMatch(/archive/i)
    expect(actions[1].text()).toMatch(/restore/i)
  })

  it('reserves the badge slot on every row so an archived row is no taller', async () => {
    const wrapper = await mountList(makeStore(true))

    const badges = wrapper.findAll('[data-test="entity-archived-badge"]')
    expect(badges, 'both rows carry the slot').toHaveLength(2)
    expect(badges[0].attributes('aria-hidden')).toBe('true')
    expect(badges[0].classes()).toContain('ocf-archived-badge--placeholder')
    expect(badges[1].attributes('aria-hidden')).toBe('false')
    expect(badges[1].classes()).not.toContain('ocf-archived-badge--placeholder')
  })

  it('ticking the toggle reloads the list asking for archived rows', async () => {
    const store = makeStore(true)
    const wrapper = await mountList(store)
    ;(axios.get as any).mockClear()

    await wrapper.find('[data-test="entity-show-archived"]').setValue(true)
    await flushPromises()

    expect(store.includeArchived).toBe(true)
    const urls = (axios.get as any).mock.calls.map((c: any[]) => c[0])
    expect(urls.some((u: string) => u.startsWith('/scenarios?') && u.includes('include_archived=true'))).toBe(true)
  })

  it('archives from the row action, updates the row in place and confirms', async () => {
    ;(axios.post as any).mockResolvedValue({ data: { ...inService, archived_at: '2026-02-01T00:00:00Z' } })
    const wrapper = await mountList(makeStore(true))

    await wrapper.findAll('[data-test="entity-archive-toggle"]')[0].trigger('click')
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith('/scenarios/sc-1/archive')
    const firstRow = wrapper.findAll('li.entity-item')[0]
    expect(firstRow.find('[data-test="entity-archive-toggle"]').text()).toMatch(/restore/i)
    expect(firstRow.find('[data-test="entity-archived-badge"]').attributes('aria-hidden')).toBe('false')
    expect(showSuccessMock).toHaveBeenCalled()
  })

  it('restores from the same row action', async () => {
    ;(axios.post as any).mockResolvedValue({ data: { id: 'sc-2', title: 'Old Lab' } })
    const wrapper = await mountList(makeStore(true))

    await wrapper.findAll('[data-test="entity-archive-toggle"]')[1].trigger('click')
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith('/scenarios/sc-2/unarchive')
    expect(wrapper.findAll('[data-test="entity-archive-toggle"]')[1].text()).toMatch(/archive/i)
  })

  it('shows the backend refusal when archiving is refused', async () => {
    ;(axios.post as any).mockRejectedValue({ response: { status: 409, data: { error_message: 'still assigned' } } })
    const wrapper = await mountList(makeStore(true))

    await wrapper.findAll('[data-test="entity-archive-toggle"]')[0].trigger('click')
    await flushPromises()

    expect(showErrorMock).toHaveBeenCalledWith('still assigned')
    expect(wrapper.findAll('[data-test="entity-archive-toggle"]')[0].text()).not.toMatch(/restore/i)
  })
})
