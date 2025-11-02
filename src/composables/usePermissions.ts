/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { computed } from 'vue'
import { useCurrentUserStore } from '../stores/currentUser'

/**
 * Composable for checking user permissions
 *
 * Permissions are loaded from the backend based on:
 * - User role (administrator, teacher, student)
 * - Organization ownership
 * - Group membership
 * - Feature flags
 *
 * Usage:
 * ```typescript
 * const { hasPermission, hasAnyPermission } = usePermissions()
 *
 * if (hasPermission('view_groups')) {
 *   // Show groups menu
 * }
 *
 * if (hasAnyPermission(['create_groups', 'manage_all_groups'])) {
 *   // Show create button
 * }
 * ```
 */
export function usePermissions() {
  const currentUser = useCurrentUserStore()

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return currentUser.permissions.includes(permission)
  }

  /**
   * Check if user has any of the specified permissions (OR logic)
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => currentUser.permissions.includes(p))
  }

  /**
   * Check if user has all specified permissions (AND logic)
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => currentUser.permissions.includes(p))
  }

  /**
   * Create a reactive computed for a specific permission
   * Useful for v-if directives
   */
  const createPermissionCheck = (permission: string) => {
    return computed(() => currentUser.permissions.includes(permission))
  }

  /**
   * Create a reactive computed for multiple permissions (OR logic)
   */
  const createAnyPermissionCheck = (permissions: string[]) => {
    return computed(() =>
      permissions.some(p => currentUser.permissions.includes(p))
    )
  }

  /**
   * Create a reactive computed for multiple permissions (AND logic)
   */
  const createAllPermissionsCheck = (permissions: string[]) => {
    return computed(() =>
      permissions.every(p => currentUser.permissions.includes(p))
    )
  }

  /**
   * Get all user permissions (reactive)
   */
  const permissions = computed(() => currentUser.permissions)

  return {
    // Simple checks (for use in methods/setup)
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Reactive checks (for use in templates)
    createPermissionCheck,
    createAnyPermissionCheck,
    createAllPermissionsCheck,

    // Raw permissions
    permissions
  }
}

/**
 * Vue directive for conditional rendering based on permissions
 *
 * Usage:
 * ```vue
 * <button v-permission="'create_groups'">Create Group</button>
 * <div v-permission="['view_groups', 'manage_groups']">...</div>
 * ```
 */
export const vPermission = {
  mounted(el: HTMLElement, binding: { value: string | string[] }) {
    const { hasAnyPermission } = usePermissions()

    const permissions = Array.isArray(binding.value) ? binding.value : [binding.value]
    const hasAccess = hasAnyPermission(permissions)

    if (!hasAccess) {
      el.style.display = 'none'
    }
  },
  updated(el: HTMLElement, binding: { value: string | string[] }) {
    const { hasAnyPermission } = usePermissions()

    const permissions = Array.isArray(binding.value) ? binding.value : [binding.value]
    const hasAccess = hasAnyPermission(permissions)

    el.style.display = hasAccess ? '' : 'none'
  }
}
