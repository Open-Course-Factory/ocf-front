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

import { ref, computed } from 'vue'
import { useCurrentUserStore } from '../stores/currentUser'

const viewAsStandardUser = ref<boolean>(false)

/**
 * Composable for managing admin view mode
 * Allows admins to view pages as if they were standard users
 */
export function useAdminViewMode() {
  const currentUser = useCurrentUserStore()

  /**
   * Check if user is an admin
   */
  const isAdmin = computed(() =>
    currentUser.userRoles.includes('administrator')
  )

  /**
   * Check if we should filter data as a standard user would see it
   * Returns true if:
   * - User is admin AND viewing as standard user
   */
  const shouldFilterAsStandardUser = computed(() =>
    isAdmin.value && viewAsStandardUser.value
  )

  /**
   * Check if we should show all data (admin view)
   * Returns true if:
   * - User is admin AND NOT viewing as standard user
   */
  const shouldShowAllData = computed(() =>
    isAdmin.value && !viewAsStandardUser.value
  )

  /**
   * Get the effective user role for filtering purposes
   * Returns 'standard' if admin is viewing as standard user, 'admin' otherwise
   */
  const effectiveRole = computed(() =>
    shouldFilterAsStandardUser.value ? 'standard' : 'admin'
  )

  /**
   * Toggle between admin view and standard user view
   */
  function toggleViewMode() {
    viewAsStandardUser.value = !viewAsStandardUser.value
    // Save to localStorage for persistence
    localStorage.setItem('adminViewAsStandardUser', String(viewAsStandardUser.value))
  }

  /**
   * Set view mode explicitly
   */
  function setViewAsStandardUser(value: boolean) {
    viewAsStandardUser.value = value
    localStorage.setItem('adminViewAsStandardUser', String(value))
  }

  /**
   * Load view mode from localStorage
   */
  function loadViewMode() {
    const saved = localStorage.getItem('adminViewAsStandardUser')
    if (saved !== null) {
      viewAsStandardUser.value = saved === 'true'
    }
  }

  /**
   * Initialize view mode from localStorage
   */
  function initViewMode() {
    loadViewMode()
  }

  /**
   * Reset view mode (useful when user logs out)
   */
  function resetViewMode() {
    viewAsStandardUser.value = false
    localStorage.removeItem('adminViewAsStandardUser')
  }

  return {
    isAdmin,
    viewAsStandardUser,
    shouldFilterAsStandardUser,
    shouldShowAllData,
    effectiveRole,
    toggleViewMode,
    setViewAsStandardUser,
    initViewMode,
    resetViewMode
  }
}
