/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { defineStore } from 'pinia'
import { useBaseStore } from './baseStore'

export interface OrganizationRolePlan {
  id: string
  organization_id: string
  role: string
  subscription_plan_id: string
  subscription_plan?: {
    id?: string
    name?: string
    [key: string]: any
  }
  [key: string]: any
}

export const useOrganizationRolePlansStore = defineStore('organizationRolePlans', () => {
  const base = useBaseStore()

  // Role plan overrides are listed via an org-scoped endpoint but created,
  // updated, and deleted via the flat /organization-role-plans resource.
  const loadOrganizationRolePlans = (organizationId: string): Promise<OrganizationRolePlan[]> =>
    base.loadEntities(`/organizations/${organizationId}/role-plans`, () => [])

  const createRolePlan = (data: {
    organization_id: string
    role: string
    subscription_plan_id: string
  }): Promise<OrganizationRolePlan> =>
    base.createEntity('/organization-role-plans', data)

  const updateRolePlan = (
    id: string,
    data: { subscription_plan_id: string }
  ): Promise<OrganizationRolePlan> =>
    base.updateEntity('/organization-role-plans', id, data)

  const deleteRolePlan = (id: string) =>
    base.deleteEntity('/organization-role-plans', id)

  return {
    ...base,
    loadOrganizationRolePlans,
    createRolePlan,
    updateRolePlan,
    deleteRolePlan,
  }
})
