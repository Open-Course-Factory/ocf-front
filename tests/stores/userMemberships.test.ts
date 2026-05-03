import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

/*
 * Tests for the `useUserMembershipsStore`.
 *
 * The store loads two endpoints (/organizations/me/memberships and
 * /groups/me/memberships) in parallel. Originally it used `Promise.all`,
 * which means a single failing endpoint rejects the whole load and wipes
 * BOTH membership arrays — even though the OTHER endpoint succeeded. This
 * caused a real prod bug (#216): the scenario editor's scope picker hid
 * groups for users whose group endpoint succeeded but whose org endpoint
 * 404'd (or vice versa).
 *
 * The fix switches to `Promise.allSettled` so each endpoint's result is
 * preserved independently. These tests pin that behavior.
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

describe('useUserMembershipsStore.loadMemberships', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockedAxios.get.mockReset()
  })

  /**
   * BEHAVIOR PROTECTED: When BOTH endpoints succeed, both arrays are
   * populated. Baseline / smoke test.
   */
  it('populates both arrays when both endpoints succeed', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/organizations/me/memberships') {
        return Promise.resolve({ data: { data: [{ organization_id: 'org-1', role: 'manager' }] } })
      }
      if (url === '/groups/me/memberships') {
        return Promise.resolve({ data: { data: [{ group_id: 'group-1', role: 'owner' }] } })
      }
      return Promise.reject(new Error('unexpected url ' + url))
    })

    const store = useUserMembershipsStore()
    await store.loadMemberships()

    expect(store.orgMemberships).toEqual([{ organization_id: 'org-1', role: 'manager' }])
    expect(store.groupMemberships).toEqual([{ group_id: 'group-1', role: 'owner' }])
    expect(store.isLoaded).toBe(true)
    expect(store.error).toBe('')
  })

  /**
   * BEHAVIOR PROTECTED: A failing /organizations/me/memberships call
   * MUST NOT wipe the successful /groups/me/memberships result.
   *
   * GUT-CHECK: Today, with `Promise.all`, both arrays end up empty. After
   * the fix (Promise.allSettled), the group array survives.
   *
   * This is the core regression test for issue #216.
   */
  it('keeps groupMemberships when only the orgs endpoint fails', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/organizations/me/memberships') {
        return Promise.reject({
          response: { status: 404, data: { error_message: 'no orgs route' } },
          message: 'Request failed',
        })
      }
      if (url === '/groups/me/memberships') {
        return Promise.resolve({
          data: { data: [{ group_id: 'group-1', role: 'owner' }] },
        })
      }
      return Promise.reject(new Error('unexpected url ' + url))
    })

    const store = useUserMembershipsStore()
    await store.loadMemberships()

    expect(store.groupMemberships).toEqual([{ group_id: 'group-1', role: 'owner' }])
    expect(store.orgMemberships).toEqual([])
    expect(store.isLoaded).toBe(true)
    // Error surface is populated for observability, but the load completes.
    expect(store.error).not.toBe('')
  })

  /**
   * BEHAVIOR PROTECTED: A failing /groups/me/memberships call MUST NOT
   * wipe the successful /organizations/me/memberships result. Symmetric
   * counterpart of the test above.
   */
  it('keeps orgMemberships when only the groups endpoint fails', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/organizations/me/memberships') {
        return Promise.resolve({
          data: { data: [{ organization_id: 'org-1', role: 'manager' }] },
        })
      }
      if (url === '/groups/me/memberships') {
        return Promise.reject({
          response: { status: 500, data: { message: 'internal error' } },
          message: 'Request failed',
        })
      }
      return Promise.reject(new Error('unexpected url ' + url))
    })

    const store = useUserMembershipsStore()
    await store.loadMemberships()

    expect(store.orgMemberships).toEqual([{ organization_id: 'org-1', role: 'manager' }])
    expect(store.groupMemberships).toEqual([])
    expect(store.isLoaded).toBe(true)
    expect(store.error).not.toBe('')
  })

  /**
   * BEHAVIOR PROTECTED: When BOTH endpoints fail, both arrays are empty
   * but `isLoaded` still becomes true (so consumers don't poll forever)
   * and the error is surfaced.
   */
  it('clears both arrays and surfaces an error when both endpoints fail', async () => {
    mockedAxios.get.mockImplementation(() => {
      return Promise.reject({
        response: { status: 500, data: { message: 'internal error' } },
        message: 'Request failed',
      })
    })

    const store = useUserMembershipsStore()
    await store.loadMemberships()

    expect(store.orgMemberships).toEqual([])
    expect(store.groupMemberships).toEqual([])
    expect(store.isLoaded).toBe(true)
    expect(store.error).not.toBe('')
  })
})
