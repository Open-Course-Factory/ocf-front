import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/*
 * Tests for the `useUserMembershipsStore`.
 *
 * The store loads the current user's organization and group memberships via
 * a single backend call:
 *
 *   GET /users/me?includes=organization_memberships,group_memberships
 *
 * The backend swallows per-include preload errors and returns an empty array
 * for any failed include (see ocf-core src/auth/routes/usersRoutes/getUser.go),
 * so partial-failure protection is enforced server-side: each include either
 * arrives populated or as `[]`. Refs #217 (consolidates the previous dual-
 * endpoint Promise.allSettled approach used to fix prod incident #216).
 *
 * The store maps the verbose membership records returned by /users/me to the
 * lightweight `{organization_id, role}` / `{group_id, role}` shape consumed by
 * UI surfaces such as the scenario editor's scope picker.
 */

// ---- Boundary mocks ------------------------------------------------------

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

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
}))

// ---- Real imports --------------------------------------------------------

import axios from 'axios'
import { useUserMembershipsStore } from '../../src/stores/userMemberships'

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> }

const USERS_ME_URL = '/users/me'
const EXPECTED_INCLUDES = 'organization_memberships,group_memberships'

/**
 * Helper: assert that the store called /users/me with the expected
 * `includes` query param. Both call shapes used by axios are accepted:
 *   axios.get('/users/me', { params: { includes: '...' } })
 *   axios.get('/users/me?includes=...')
 */
function expectUsersMeIncludesCall() {
  expect(mockedAxios.get).toHaveBeenCalledTimes(1)
  const [url, config] = mockedAxios.get.mock.calls[0]
  const includes = config?.params?.includes
  if (includes !== undefined) {
    expect(url).toBe(USERS_ME_URL)
    expect(includes).toBe(EXPECTED_INCLUDES)
  } else {
    expect(url).toBe(`${USERS_ME_URL}?includes=${EXPECTED_INCLUDES}`)
  }
}

describe('useUserMembershipsStore.loadMemberships', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockedAxios.get.mockReset()
  })

  /**
   * BEHAVIOR PROTECTED: When /users/me returns both includes populated, the
   * store maps each verbose record to its lightweight shape. Baseline / smoke.
   */
  it('populates both arrays when /users/me returns both includes', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        id: 'user-1',
        email: 'tom@example.com',
        organization_memberships: [
          {
            id: 'om-1',
            organization_id: 'org-1',
            user_id: 'user-1',
            role: 'manager',
            joined_at: '2025-01-01T00:00:00Z',
            is_active: true,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
        group_memberships: [
          {
            id: 'gm-1',
            group_id: 'group-1',
            user_id: 'user-1',
            role: 'owner',
            joined_at: '2025-01-01T00:00:00Z',
          },
        ],
      },
    })

    const store = useUserMembershipsStore()
    await store.loadMemberships()

    expectUsersMeIncludesCall()
    expect(store.orgMemberships).toEqual([{ organization_id: 'org-1', role: 'manager' }])
    expect(store.groupMemberships).toEqual([{ group_id: 'group-1', role: 'owner' }])
    expect(store.isLoaded).toBe(true)
    expect(store.error).toBe('')
  })

  /**
   * BEHAVIOR PROTECTED: When the backend swallowed the org_memberships preload
   * error and returned an empty array for that include, the store keeps the
   * surviving group_memberships and ends up with empty orgs. This mirrors the
   * partial-failure protection from #216 — the failing include is empty, the
   * other one survives, and the load completes cleanly (no error surfaced
   * because the top-level /users/me call succeeded).
   */
  it('keeps groupMemberships when backend returns empty organization_memberships', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        id: 'user-1',
        email: 'tom@example.com',
        organization_memberships: [],
        group_memberships: [
          {
            id: 'gm-1',
            group_id: 'group-1',
            user_id: 'user-1',
            role: 'owner',
            joined_at: '2025-01-01T00:00:00Z',
          },
        ],
      },
    })

    const store = useUserMembershipsStore()
    await store.loadMemberships()

    expectUsersMeIncludesCall()
    expect(store.orgMemberships).toEqual([])
    expect(store.groupMemberships).toEqual([{ group_id: 'group-1', role: 'owner' }])
    expect(store.isLoaded).toBe(true)
    expect(store.error).toBe('')
  })

  /**
   * BEHAVIOR PROTECTED: Symmetric counterpart — backend swallowed the
   * group_memberships preload error and returned `[]` for that include while
   * organization_memberships succeeded.
   */
  it('keeps orgMemberships when backend returns empty group_memberships', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        id: 'user-1',
        email: 'tom@example.com',
        organization_memberships: [
          {
            id: 'om-1',
            organization_id: 'org-1',
            user_id: 'user-1',
            role: 'manager',
            joined_at: '2025-01-01T00:00:00Z',
            is_active: true,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
        group_memberships: [],
      },
    })

    const store = useUserMembershipsStore()
    await store.loadMemberships()

    expectUsersMeIncludesCall()
    expect(store.orgMemberships).toEqual([{ organization_id: 'org-1', role: 'manager' }])
    expect(store.groupMemberships).toEqual([])
    expect(store.isLoaded).toBe(true)
    expect(store.error).toBe('')
  })

  /**
   * BEHAVIOR PROTECTED: When the top-level /users/me call itself fails (e.g.
   * 500, network error, auth lapse), both arrays are cleared, an error is
   * surfaced, and `isLoaded` still becomes true so consumers don't poll
   * forever.
   */
  it('clears both arrays and surfaces an error when /users/me fails', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 500, data: { message: 'internal error' } },
      message: 'Request failed',
    })

    const store = useUserMembershipsStore()
    await store.loadMemberships()

    expectUsersMeIncludesCall()
    expect(store.orgMemberships).toEqual([])
    expect(store.groupMemberships).toEqual([])
    expect(store.isLoaded).toBe(true)
    expect(store.error).not.toBe('')
  })
})
