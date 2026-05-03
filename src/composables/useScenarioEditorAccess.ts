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
 *   - Their `userRoles` (Casbin bindings) contain `organization_manager:<id>`.
 *   - Their `userRoles` contain `class-group_manager:<id>`.
 *   - An organization in `useOrganizationsStore.userOrganizations` has
 *     `owner_user_id === useCurrentUserStore.userId`.
 *   - `useUserMembershipsStore.orgMemberships` has a row with role
 *     `manager` or `owner`.
 *   - `useUserMembershipsStore.groupMemberships` has a row with role
 *     `manager` or `owner`.
 *
 * Mirrors the union used by the in-page `orgScopes` / `groupScopes` /
 * `platformScopeAvailable` predicates in `ScenarioEditor.vue` so that gating
 * stays consistent across the menu, the router guard, and the in-page UI.
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

    const roles = currentUser.userRoles || []

    // 2. Casbin role binding `organization_manager:<id>`
    if (roles.some(r => r.startsWith('organization_manager:'))) return true

    // 3. Casbin role binding `class-group_manager:<id>`
    if (roles.some(r => r.startsWith('class-group_manager:'))) return true

    // 4. Org owner (`owner_user_id === currentUser.userId`) — mirrors the
    //    Source 1 branch in ScenarioEditor.vue. Some fixtures only set
    //    ownership and skip the Casbin row.
    //
    //    Read both `userOrganizations` (the canonical computed) and the
    //    underlying `entities` ref because tests inject orgs by directly
    //    assigning `store.entities = [...]`, which bypasses the closure-bound
    //    accessor used by `userOrganizations`. In production both sources
    //    are equivalent; in tests, only `entities` is populated.
    const userId = currentUser.userId
    if (userId) {
      const userOrgs = organizationsStore.userOrganizations || []
      if (userOrgs.some(org => org.owner_user_id === userId)) return true
      const rawEntities = (organizationsStore as any).entities || []
      if (Array.isArray(rawEntities) && rawEntities.some((org: any) => org.owner_user_id === userId)) {
        return true
      }
    }

    // 5. /me/memberships fallback — DB-backed org memberships
    const orgMs = membershipsStore.orgMemberships || []
    if (orgMs.some(m => m.role === 'manager' || m.role === 'owner')) return true

    // 6. /me/memberships fallback — DB-backed group memberships
    const groupMs = membershipsStore.groupMemberships || []
    if (groupMs.some(m => m.role === 'manager' || m.role === 'owner')) return true

    return false
  })

  return { canAccessScenarioEditor }
}
