import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

/**
 * The organization role checks answer from the memberships loaded at startup
 * (`userMemberships`, loaded by currentUser.loadPermissions), not from a second
 * snapshot only some pages load. An org manager who opened the subscription
 * dashboard directly was told they could not manage their own organization and
 * lost the org usage panel (#394).
 */

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
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

// The real store drags the router in; the checks only read the platform roles.
const currentUserStub = { userRoles: ['member'] as string[] }
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => currentUserStub
}))

import { usePermissionsStore } from '../../src/stores/permissions'
import { useUserMembershipsStore } from '../../src/stores/userMemberships'

describe('permissions store — org role checks read the startup memberships', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    currentUserStub.userRoles = ['member']
    const memberships = useUserMembershipsStore()
    memberships.orgMemberships = [
      { organization_id: 'org-owned', role: 'owner' },
      { organization_id: 'org-managed', role: 'manager' },
      { organization_id: 'org-member', role: 'member' }
    ]
    memberships.isLoaded = true
  })

  it('canManageOrganization: true for a manager or owner, without loading another snapshot', () => {
    const store = usePermissionsStore()

    expect(store.canManageOrganization('org-managed')).toBe(true)
    expect(store.canManageOrganization('org-owned')).toBe(true)
  })

  it('canManageOrganization: false for a plain member or an unknown organization', () => {
    const store = usePermissionsStore()

    expect(store.canManageOrganization('org-member')).toBe(false)
    expect(store.canManageOrganization('org-unknown')).toBe(false)
  })

  it('isOrganizationOwner and canDeleteOrganization: true only for the owner', () => {
    const store = usePermissionsStore()

    expect(store.isOrganizationOwner('org-owned')).toBe(true)
    expect(store.canDeleteOrganization('org-owned')).toBe(true)
    for (const org of ['org-managed', 'org-member', 'org-unknown']) {
      expect(store.isOrganizationOwner(org)).toBe(false)
      expect(store.canDeleteOrganization(org)).toBe(false)
    }
  })

  it('a platform administrator passes every check, member of the org or not', () => {
    currentUserStub.userRoles = ['administrator']
    const store = usePermissionsStore()

    for (const org of ['org-member', 'org-unknown']) {
      expect(store.canManageOrganization(org)).toBe(true)
      expect(store.isOrganizationOwner(org)).toBe(true)
      expect(store.canDeleteOrganization(org)).toBe(true)
    }
  })
})
