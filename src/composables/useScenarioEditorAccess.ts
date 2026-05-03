/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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

/**
 * useScenarioEditorAccess
 * ────────────────────────
 * Centralizes the access decision for the scenario editor surface (menu item,
 * `/scenario-editor` route, in-page edit controls).
 *
 * Returns `canAccessScenarioEditor` as a Vue computed ref that is true when
 * ANY of the following hold:
 *   - The user is a platform administrator (via `useAdminViewMode`)
 *     — and is NOT toggled to "view as standard user".
 *   - An organization in `useOrganizationsStore.userOrganizations` has
 *     `owner_user_id === useCurrentUserStore.userId` (legacy fixtures
 *     where only ownership is set).
 *   - `useUserMembershipsStore.orgMemberships` has a row with role
 *     `manager` or `owner` (DB-backed source of truth).
 *   - `useUserMembershipsStore.groupMemberships` has a row with role
 *     `manager` or `owner`.
 *
 * Note: previous versions also matched `userRoles` against the Casbin
 * prefixes `organization_manager:<id>` and `class-group_manager:<id>`. Those
 * prefixes are NEVER produced by the backend (verified via grep across
 * `ocf-core/src`). The membership store is the canonical role source, and
 * Layer-2 backend enforcement is the security boundary; the frontend
 * predicate just gates the UI.
 */
import { computed, type ComputedRef } from 'vue'
import { useCurrentUserStore } from '../stores/currentUser'
import { useOrganizationsStore } from '../stores/organizations'
import { useUserMembershipsStore } from '../stores/userMemberships'
import { useAdminViewMode } from './useAdminViewMode'

export interface ScenarioEditorAccess {
  canAccessScenarioEditor: ComputedRef<boolean>
}

export function useScenarioEditorAccess(): ScenarioEditorAccess {
  const currentUser = useCurrentUserStore()
  const organizationsStore = useOrganizationsStore()
  const membershipsStore = useUserMembershipsStore()
  const { shouldShowAllData } = useAdminViewMode()

  const canAccessScenarioEditor = computed<boolean>(() => {
    // 1. Platform admin (unless toggled to "view as standard user")
    if (shouldShowAllData.value) return true

    // 2. Org owner (`owner_user_id === currentUser.userId`) — kept for
    //    legacy fixtures and demo orgs that only set ownership without
    //    creating the corresponding membership row.
    const userId = currentUser.userId
    if (userId) {
      const userOrgs = organizationsStore.userOrganizations || []
      if (userOrgs.some(org => org.owner_user_id === userId)) return true
    }

    // 3. /me/memberships — DB-backed org memberships (canonical source)
    const orgMs = membershipsStore.orgMemberships || []
    if (orgMs.some(m => m.role === 'manager' || m.role === 'owner')) return true

    // 4. /me/memberships — DB-backed group memberships
    const groupMs = membershipsStore.groupMemberships || []
    if (groupMs.some(m => m.role === 'manager' || m.role === 'owner')) return true

    return false
  })

  return { canAccessScenarioEditor }
}
