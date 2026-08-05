/**
 * `/organizations?create=1` opens the creation form on arrival (#315).
 *
 * The console's personal-organization state promises "create my organization";
 * landing on a page that merely has a button somewhere on it is a different
 * promise. This matters more than convenience: the navigation hides the
 * organizations category in a personal context, so that call to action is the
 * only route a teacher has to creating a team organization.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}))

let routeQuery: Record<string, string> = {}
vi.mock('vue-router', () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn(),
    isReady: vi.fn().mockResolvedValue(undefined),
    addRoute: vi.fn(),
    getRoutes: () => [],
    resolve: (to: unknown) => ({ href: '#', ...(to as object) }),
    currentRoute: { value: { query: {}, params: {}, meta: {} } },
  }
  return {
    useRoute: () => ({ get query() { return routeQuery } }),
    useRouter: () => router,
    createRouter: () => router,
    createWebHistory: () => ({}),
    createWebHashHistory: () => ({}),
  }
})

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    userOrganizations: [],
    isLoading: false,
    error: '',
    loadOrganizations: vi.fn().mockResolvedValue([]),
    createOrganization: vi.fn(),
    updateOrganization: vi.fn(),
  }),
}))

vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    canManageOrganization: () => true,
    loadCurrentUser: vi.fn().mockResolvedValue(undefined),
  }),
}))

import Organizations from '../../src/components/Pages/Organizations.vue'

async function mountOrganizations(query: Record<string, string>) {
  routeQuery = query
  setActivePinia(createPinia())

  const wrapper = mount(Organizations, {
    global: {
      stubs: {
        OrganizationsList: { template: '<div class="list-stub" />' },
        OrganizationModal: {
          props: ['isOpen'],
          template: '<div class="modal-stub" :data-open="isOpen" />',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

function modalIsOpen(wrapper: any): boolean {
  return wrapper.find('.modal-stub').attributes('data-open') === 'true'
}

describe('Organizations page — arriving to create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeQuery = {}
  })

  it('opens the creation form when asked to', async () => {
    const wrapper = await mountOrganizations({ create: '1' })

    expect(modalIsOpen(wrapper)).toBe(true)
  })

  it('leaves the page as it was without the parameter', async () => {
    const wrapper = await mountOrganizations({})

    expect(modalIsOpen(wrapper)).toBe(false)
  })
})
