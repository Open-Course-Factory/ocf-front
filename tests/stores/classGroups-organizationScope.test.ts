/**
 * Teacher surfaces show ONE organization at a time (product decision, #309).
 *
 * For the generic `/class-groups` list that means a real server-side filter:
 * the backend turns an unknown query parameter into an exact-match column
 * filter, so the store appends `organization_id` and the page never receives
 * another organization's classes at all — as opposed to receiving a page of
 * twenty and showing three.
 *
 * Creation is the other half. A class saved without an organization would be
 * invisible the instant it was created, since every list is now scoped, so an
 * unanswered organization field means "the one I am working in".
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
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
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}))

vi.mock('element-plus', () => ({
  ElNotification: vi.fn(),
}))

const activeOrganization = ref<{ id: string; display_name: string } | null>(null)
vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    get currentOrganization() {
      return activeOrganization.value
    },
  }),
}))

import axios from 'axios'
import { useClassGroupsStore } from '../../src/stores/classGroups'

const mockGet = vi.mocked(axios.get)
const mockPost = vi.mocked(axios.post)

function requestedUrl(callIndex = 0): string {
  return mockGet.mock.calls[callIndex][0] as string
}

describe('classGroups store — organization scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    activeOrganization.value = { id: 'org-here', display_name: 'FormaTech' }
    mockGet.mockResolvedValue({ data: { data: [], hasMore: false, total: 0 } })
    mockPost.mockResolvedValue({ data: { id: 'new-class' } })
  })

  describe('listing', () => {
    it('asks the backend only for classes of the active organization', async () => {
      const store = useClassGroupsStore()

      await store.loadEntitiesWithCursor('/class-groups', undefined, 20, {})

      expect(requestedUrl()).toContain('organization_id=org-here')
    })

    it('follows an organization switch on the next load', async () => {
      const store = useClassGroupsStore()
      await store.loadEntitiesWithCursor('/class-groups', undefined, 20, {})

      activeOrganization.value = { id: 'org-elsewhere', display_name: 'ESITECH' }
      await store.loadEntitiesWithCursor('/class-groups', undefined, 20, {})

      expect(requestedUrl(1)).toContain('organization_id=org-elsewhere')
      expect(requestedUrl(1)).not.toContain('org-here')
    })

    it('keeps the filters the list was already applying', async () => {
      const store = useClassGroupsStore()

      await store.loadEntitiesWithCursor('/class-groups', undefined, 20, { is_active: 'true' })

      expect(requestedUrl()).toContain('is_active=true')
      expect(requestedUrl()).toContain('organization_id=org-here')
    })

    it('leaves the request unscoped rather than filtering on an empty organization', async () => {
      // `organization_id=` would be an exact match on the empty string, which
      // returns nothing — an unscoped list is the lesser wrong while the
      // organizations are still loading.
      activeOrganization.value = null
      const store = useClassGroupsStore()

      await store.loadEntitiesWithCursor('/class-groups', undefined, 20, {})

      expect(requestedUrl()).not.toContain('organization_id')
    })

    it('still carries the cursor and limit it was given', async () => {
      const store = useClassGroupsStore()

      await store.loadEntitiesWithCursor('/class-groups', 'cursor-abc', 50, {})

      expect(requestedUrl()).toContain('cursor=cursor-abc')
      expect(requestedUrl()).toContain('limit=50')
    })
  })

  describe('creation', () => {
    it('creates the class in the active organization when none was chosen', async () => {
      const store = useClassGroupsStore()

      await store.createEntity('/class-groups', { display_name: 'Docker' } as any)

      expect(mockPost.mock.calls[0][1]).toMatchObject({ organizationID: 'org-here' })
    })

    it('respects an organization the teacher chose explicitly', async () => {
      const store = useClassGroupsStore()

      await store.createEntity('/class-groups', {
        display_name: 'Docker',
        organization_id: 'org-elsewhere',
      } as any)

      expect(mockPost.mock.calls[0][1]).toMatchObject({ organizationID: 'org-elsewhere' })
    })

    it('creates without an organization when there is no active one to borrow', async () => {
      activeOrganization.value = null
      const store = useClassGroupsStore()

      await store.createEntity('/class-groups', { display_name: 'Docker' } as any)

      expect(mockPost.mock.calls[0][1]).not.toHaveProperty('organizationID')
    })
  })
})
