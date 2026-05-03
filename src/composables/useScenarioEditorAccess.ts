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
 * STUB — pending implementation in a follow-up commit (issue #213).
 *
 * The real composable will return `canAccessScenarioEditor` as a Vue computed
 * ref that is true when ANY of the following hold:
 *   • The user is a platform administrator (via `useAdminViewMode`)
 *   • Their `userRoles` (Casbin bindings) contain `organization_manager:<id>`
 *   • Their `userRoles` contain `class-group_manager:<id>`
 *   • An organization in `useOrganizationsStore.userOrganizations` has
 *     `owner_user_id === useCurrentUserStore.userId`
 *   • `useUserMembershipsStore.orgMemberships` has a row with role
 *     `manager` or `owner`
 *   • `useUserMembershipsStore.groupMemberships` has a row with role
 *     `manager` or `owner`
 *
 * This stub deliberately returns `false` for every caller so the failing
 * tests in tests/composables/useScenarioEditorAccess.test.ts will compile
 * and run the assertion path (rather than failing to import). The positive
 * test cases will FAIL until the real predicate is wired in.
 */
import { computed, type ComputedRef } from 'vue'

export interface ScenarioEditorAccess {
  canAccessScenarioEditor: ComputedRef<boolean>
}

export function useScenarioEditorAccess(): ScenarioEditorAccess {
  return {
    canAccessScenarioEditor: computed(() => false),
  }
}
