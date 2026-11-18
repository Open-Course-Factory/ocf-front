/**
 * The scenarios list follows the organization picked in the top menu, like
 * the class groups list: the store appends `organization_id`, which the
 * backend applies as an exact-match filter.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}))

vi.mock('element-plus', () => ({ ElNotification: vi.fn() }))

const activeOrganization = ref<{ id: string } | null>(null)
vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    get currentOrganization() {
      return activeOrganization.value
    },
  }),
}))

import axios from 'axios'
import { useScenariosStore } from '../../src/stores/scenarios'

const mockGet = vi.mocked(axios.get)
const url = (i = 0) => mockGet.mock.calls[i][0] as string

describe('scenarios store — organization scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    activeOrganization.value = { id: 'org-cesi' }
    mockGet.mockResolvedValue({ data: { data: [], hasMore: false, total: 0 } })
  })

  it('lists only the scenarios of the active organization, keeping other filters', async () => {
    await useScenariosStore().loadEntitiesWithCursor('/scenarios', undefined, 20, { difficulty: 'easy' })

    expect(url()).toContain('organization_id=org-cesi')
    expect(url()).toContain('difficulty=easy')
  })

  it('follows an organization switch on the next load', async () => {
    const store = useScenariosStore()
    await store.loadEntitiesWithCursor('/scenarios', undefined, 20, {})
    activeOrganization.value = { id: 'org-mds' }
    await store.loadEntitiesWithCursor('/scenarios', undefined, 20, {})

    expect(url(1)).toContain('organization_id=org-mds')
  })

  it('stays unscoped without an active organization', async () => {
    activeOrganization.value = null
    await useScenariosStore().loadEntitiesWithCursor('/scenarios', undefined, 20, {})

    expect(url()).not.toContain('organization_id')
  })
})
