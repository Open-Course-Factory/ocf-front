import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// ---- Mocks (must be before component imports) ----

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

// Mock the admin users service used by the component
const mockFetchAll = vi.fn()
vi.mock('../../src/services/admin/usersService', () => ({
  adminUsersService: {
    fetchAll: (...args: any[]) => mockFetchAll(...args)
  }
}))

// Mock vue-router (the page uses useRouter().push to navigate after start)
const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: mockRouterPush }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

// Mock currentUser store so we can fix the admin's own ID for the
// "no self-impersonation" rule
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    userId: 'admin-id',
    userName: 'admin',
    userDisplayName: 'Admin',
    userEmail: 'admin@example.com',
    userRoles: ['Administrator']
  })
}))

import AdminUsers from '../../src/components/Pages/Admin/AdminUsers.vue'
import { useImpersonationStore } from '../../src/stores/impersonation'
import type { AdminUserListing } from '../../src/services/admin/usersService'

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

function makeUser(overrides: Partial<AdminUserListing> = {}): AdminUserListing {
  return {
    id: 'u1',
    username: 'alice',
    display_name: 'Alice Smith',
    email: 'alice@example.com',
    is_active: true,
    is_admin: false,
    organizations: [],
    groups: [],
    ...overrides
  }
}

function mountAdminUsers() {
  const i18n = createTestI18n()
  setActivePinia(createPinia())

  return mount(AdminUsers, {
    global: {
      plugins: [i18n],
      stubs: {
        'router-link': {
          template: '<a class="router-link-stub"><slot /></a>',
          props: ['to']
        }
      }
    }
  })
}

describe('AdminUsers', () => {
  // Stub window.location so confirmImpersonate can safely assign to .href
  // without actually navigating in the JSDOM test environment.
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mockFetchAll.mockReset()
    // @ts-ignore — JSDOM allows replacing location after delete
    delete (window as any).location
    // @ts-ignore
    ;(window as any).location = { href: '' }
  })

  afterEach(() => {
    // @ts-ignore
    ;(window as any).location = originalLocation
  })

  it('renders empty state when no users', async () => {
    mockFetchAll.mockResolvedValueOnce([])
    const wrapper = mountAdminUsers()
    await flushPromises()

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text().toLowerCase()).toContain('no users')
  })

  it('renders one row per user', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice' }),
      makeUser({ id: 'u2', username: 'bob', email: 'bob@example.com' }),
      makeUser({ id: 'u3', username: 'carol', email: 'carol@example.com' })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(3)
  })

  it('shows username and email', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice', display_name: 'Alice Smith', email: 'alice@example.com' })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('alice')
    expect(text).toContain('Alice Smith')
    expect(text).toContain('alice@example.com')
  })

  it('shows organization badges with role', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({
        id: 'u1',
        organizations: [{ id: 'o1', name: 'Acme', role: 'owner' }]
      })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Acme')
    expect(text).toContain('owner')
  })

  it('shows group badges with role', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({
        id: 'u1',
        groups: [{ id: 'g1', name: 'DevOps', role: 'manager' }]
      })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('DevOps')
    expect(text).toContain('manager')
  })

  it('shows admin badge for is_admin: true', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice', is_admin: true })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    expect(wrapper.find('.admin-badge').exists()).toBe(true)
  })

  it('sortable by display_name column', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice', display_name: 'Alice', email: 'a@x.com' }),
      makeUser({ id: 'u2', username: 'bob', display_name: 'Bob', email: 'b@x.com' }),
      makeUser({ id: 'u3', username: 'carol', display_name: 'Carol', email: 'c@x.com' })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    // Default order should be ascending by display_name (Alice, Bob, Carol)
    let rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('Alice')
    expect(rows[2].text()).toContain('Carol')

    // Click the display_name header to toggle to descending
    const header = wrapper.find('th[data-sort="display_name"]')
    expect(header.exists()).toBe(true)
    await header.trigger('click')
    await nextTick()

    rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('Carol')
    expect(rows[2].text()).toContain('Alice')
  })

  it('search filter narrows list', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice', display_name: 'Alice', email: 'a@x.com' }),
      makeUser({ id: 'u2', username: 'bob', display_name: 'Bob', email: 'b@x.com' }),
      makeUser({ id: 'u3', username: 'carol', display_name: 'Carol', email: 'c@x.com' })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    const search = wrapper.find('input[type="text"].search-input')
    expect(search.exists()).toBe(true)
    await search.setValue('alice')
    await nextTick()

    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(1)
    expect(rows[0].text()).toContain('Alice')
  })

  it('impersonate button disabled when isImpersonating', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice' }),
      makeUser({ id: 'u2', username: 'bob' })
    ])
    setActivePinia(createPinia())
    const store = useImpersonationStore()
    store.targetUserId = 'someone-else'

    const i18n = createTestI18n()
    const wrapper = mount(AdminUsers, {
      global: {
        plugins: [i18n],
        stubs: {
          'router-link': {
            template: '<a class="router-link-stub"><slot /></a>',
            props: ['to']
          }
        }
      }
    })
    await flushPromises()

    const buttons = wrapper.findAll('button.impersonate-btn')
    expect(buttons.length).toBeGreaterThan(0)
    for (const btn of buttons) {
      expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    }
  })

  it('clicking impersonate opens confirmation modal', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice', display_name: 'Alice' })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)

    const btn = wrapper.find('button.impersonate-btn')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    await nextTick()

    expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)
  })

  it('confirming modal calls store.start() with the row user id', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice', display_name: 'Alice' })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    const store = useImpersonationStore()
    const startSpy = vi.spyOn(store, 'start').mockResolvedValue({
      id: 'u1',
      username: 'alice',
      display_name: 'Alice',
      email: 'alice@example.com'
    })

    await wrapper.find('button.impersonate-btn').trigger('click')
    await nextTick()

    const confirmBtn = wrapper.find('button.impersonate-confirm')
    expect(confirmBtn.exists()).toBe(true)
    await confirmBtn.trigger('click')
    await flushPromises()

    expect(startSpy).toHaveBeenCalledWith('u1')
  })

  it('confirming modal triggers a hard reload to / after start succeeds', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice', display_name: 'Alice' })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    const store = useImpersonationStore()
    vi.spyOn(store, 'start').mockResolvedValue({
      id: 'u1',
      username: 'alice',
      display_name: 'Alice',
      email: 'alice@example.com'
    })

    await wrapper.find('button.impersonate-btn').trigger('click')
    await nextTick()
    await wrapper.find('button.impersonate-confirm').trigger('click')
    await flushPromises()

    // Hard reload required so all Pinia stores re-initialize as the
    // impersonated user — SPA navigation would keep admin's stale state.
    expect(window.location.href).toBe('/')
  })

  it('confirming modal does NOT reload when store.start() fails', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice', display_name: 'Alice' })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    const store = useImpersonationStore()
    vi.spyOn(store, 'start').mockRejectedValue(new Error('nope'))

    await wrapper.find('button.impersonate-btn').trigger('click')
    await nextTick()
    await wrapper.find('button.impersonate-confirm').trigger('click')
    await flushPromises()

    expect(window.location.href).toBe('')
  })

  it('cancelling modal closes it without calling start', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'u1', username: 'alice', display_name: 'Alice' })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    const store = useImpersonationStore()
    const startSpy = vi.spyOn(store, 'start').mockResolvedValue({
      id: 'u1',
      username: 'alice',
      display_name: 'Alice',
      email: 'alice@example.com'
    })

    await wrapper.find('button.impersonate-btn').trigger('click')
    await nextTick()
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)

    const cancelBtn = wrapper.find('button.impersonate-cancel')
    expect(cancelBtn.exists()).toBe(true)
    await cancelBtn.trigger('click')
    await nextTick()

    expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)
    expect(startSpy).not.toHaveBeenCalled()
  })

  it('disables impersonate button on the admin\'s own row', async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeUser({ id: 'admin-id', username: 'admin', display_name: 'Admin' }),
      makeUser({ id: 'u2', username: 'bob', display_name: 'Bob' })
    ])
    const wrapper = mountAdminUsers()
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(2)

    const adminRowBtn = rows[0].find('button.impersonate-btn')
    const bobRowBtn = rows[1].find('button.impersonate-btn')
    expect((adminRowBtn.element as HTMLButtonElement).disabled).toBe(true)
    expect((bobRowBtn.element as HTMLButtonElement).disabled).toBe(false)
  })
})
