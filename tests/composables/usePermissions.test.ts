import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the currentUser store before importing the composable
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: vi.fn(() => ({
    permissions: ['view_courses', 'create_courses', 'manage_groups']
  }))
}))

import { usePermissions } from '../../src/composables/usePermissions'
import { useCurrentUserStore } from '../../src/stores/currentUser'

describe('usePermissions', () => {
  beforeEach(() => {
    // Reset to default permissions before each test
    vi.mocked(useCurrentUserStore).mockReturnValue({
      permissions: ['view_courses', 'create_courses', 'manage_groups']
    } as any)
  })

  describe('hasPermission', () => {
    it('returns true when user has the permission', () => {
      const { hasPermission } = usePermissions()
      expect(hasPermission('view_courses')).toBe(true)
    })

    it('returns false when user does not have the permission', () => {
      const { hasPermission } = usePermissions()
      expect(hasPermission('delete_users')).toBe(false)
    })

    it('returns false for empty string', () => {
      const { hasPermission } = usePermissions()
      expect(hasPermission('')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true when at least one permission matches', () => {
      const { hasAnyPermission } = usePermissions()
      expect(hasAnyPermission(['delete_users', 'view_courses'])).toBe(true)
    })

    it('returns false when no permissions match', () => {
      const { hasAnyPermission } = usePermissions()
      expect(hasAnyPermission(['delete_users', 'admin_panel'])).toBe(false)
    })

    it('returns false for empty array', () => {
      const { hasAnyPermission } = usePermissions()
      expect(hasAnyPermission([])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('returns true when all permissions are present', () => {
      const { hasAllPermissions } = usePermissions()
      expect(hasAllPermissions(['view_courses', 'create_courses'])).toBe(true)
    })

    it('returns false when at least one permission is missing', () => {
      const { hasAllPermissions } = usePermissions()
      expect(hasAllPermissions(['view_courses', 'delete_users'])).toBe(false)
    })

    it('returns true for empty array (vacuous truth)', () => {
      const { hasAllPermissions } = usePermissions()
      expect(hasAllPermissions([])).toBe(true)
    })
  })

  describe('createPermissionCheck', () => {
    it('returns a computed that is true for a granted permission', () => {
      const { createPermissionCheck } = usePermissions()
      const check = createPermissionCheck('view_courses')
      expect(check.value).toBe(true)
    })

    it('returns a computed that is false for a missing permission', () => {
      const { createPermissionCheck } = usePermissions()
      const check = createPermissionCheck('delete_users')
      expect(check.value).toBe(false)
    })
  })

  describe('createAnyPermissionCheck', () => {
    it('returns a computed that is true when at least one permission matches', () => {
      const { createAnyPermissionCheck } = usePermissions()
      const check = createAnyPermissionCheck(['delete_users', 'view_courses'])
      expect(check.value).toBe(true)
    })

    it('returns a computed that is false when no permissions match', () => {
      const { createAnyPermissionCheck } = usePermissions()
      const check = createAnyPermissionCheck(['delete_users', 'admin_panel'])
      expect(check.value).toBe(false)
    })
  })

  describe('createAllPermissionsCheck', () => {
    it('returns a computed that is true when all permissions match', () => {
      const { createAllPermissionsCheck } = usePermissions()
      const check = createAllPermissionsCheck(['view_courses', 'create_courses'])
      expect(check.value).toBe(true)
    })

    it('returns a computed that is false when not all match', () => {
      const { createAllPermissionsCheck } = usePermissions()
      const check = createAllPermissionsCheck(['view_courses', 'delete_users'])
      expect(check.value).toBe(false)
    })
  })

  describe('permissions computed', () => {
    it('returns the full permissions array', () => {
      const { permissions } = usePermissions()
      expect(permissions.value).toEqual(['view_courses', 'create_courses', 'manage_groups'])
    })
  })

  describe('empty permissions', () => {
    beforeEach(() => {
      vi.mocked(useCurrentUserStore).mockReturnValue({
        permissions: []
      } as any)
    })

    it('hasPermission returns false', () => {
      const { hasPermission } = usePermissions()
      expect(hasPermission('view_courses')).toBe(false)
    })

    it('hasAnyPermission returns false', () => {
      const { hasAnyPermission } = usePermissions()
      expect(hasAnyPermission(['view_courses', 'create_courses'])).toBe(false)
    })

    it('hasAllPermissions with non-empty array returns false', () => {
      const { hasAllPermissions } = usePermissions()
      expect(hasAllPermissions(['view_courses'])).toBe(false)
    })

    it('hasAllPermissions with empty array returns true', () => {
      const { hasAllPermissions } = usePermissions()
      expect(hasAllPermissions([])).toBe(true)
    })

    it('createPermissionCheck returns false for any permission', () => {
      const { createPermissionCheck } = usePermissions()
      expect(createPermissionCheck('view_courses').value).toBe(false)
    })

    it('permissions computed returns empty array', () => {
      const { permissions } = usePermissions()
      expect(permissions.value).toEqual([])
    })
  })
})
