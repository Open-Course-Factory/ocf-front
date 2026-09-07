/**
 * loadPermissions() is the one canonical post-auth step run by both the boot
 * path (main.ts) and the login path (Login.vue). Eager-loading the user's
 * memberships used to be a separate call at each of those two sites (#214);
 * it now rides on loadPermissions so a third path cannot forget it.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ showToast: vi.fn(), showError: vi.fn(), showSuccess: vi.fn() })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn()
}))

vi.mock('../../src/router', () => ({
  default: { currentRoute: { value: { meta: {}, path: '/' } }, push: vi.fn() }
}))

import axios from 'axios'
import { useCurrentUserStore } from '../../src/stores/currentUser'
import { useUserMembershipsStore } from '../../src/stores/userMemberships'

const mockedGet = vi.mocked(axios.get)

describe('currentUser.loadPermissions — memberships ride along', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockedGet.mockImplementation(async (url: string) => {
      if (url === '/auth/permissions') {
        return { data: { user_id: 'u1', roles: ['member'], permissions: [] } }
      }
      if (url === '/users/me') {
        return { data: { data: { organization_memberships: [{ organization_id: 'org-1', role: 'owner' }], group_memberships: [] } } }
      }
      throw new Error(`unexpected GET ${url}`)
    })
  })

  it('leaves the memberships store loaded once permissions are in', async () => {
    await useCurrentUserStore().loadPermissions()
    await flushPromises()

    const memberships = useUserMembershipsStore()
    expect(memberships.isLoaded).toBe(true)
    expect(memberships.getOrgRole('org-1')).toBe('owner')
  })

  it('does not let a memberships failure fail the permissions load', async () => {
    mockedGet.mockImplementation(async (url: string) => {
      if (url === '/auth/permissions') return { data: { user_id: 'u1', roles: ['member'], permissions: ['x'] } }
      throw new Error('memberships down')
    })

    await expect(useCurrentUserStore().loadPermissions()).resolves.toEqual(expect.any(Array))
    await flushPromises()
    expect(useUserMembershipsStore().isLoaded).toBe(true)
    expect(useUserMembershipsStore().getOrgRole('org-1')).toBeNull()
  })
})
