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
import { ref } from 'vue'
import axios from 'axios'
import { useStoreTranslations } from '../composables/useTranslations'
import { isDemoMode, logDemoAction } from '../services/demo'
import { createAsyncWrapper } from '../utils/asyncWrapper'

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
  const isLoading = ref(false)
  const error = ref('')
  const withAsync = createAsyncWrapper({ isLoading, error })

  const { t } = useStoreTranslations({
    en: {
      organizationRolePlans: {
        loadError: 'Failed to load role plan overrides',
        createError: 'Failed to create role plan override',
        updateError: 'Failed to update role plan override',
        deleteError: 'Failed to delete role plan override',
      }
    },
    fr: {
      organizationRolePlans: {
        loadError: 'Échec du chargement des plans par rôle',
        createError: 'Échec de la création du plan par rôle',
        updateError: 'Échec de la modification du plan par rôle',
        deleteError: 'Échec de la suppression du plan par rôle',
      }
    }
  })

  // Load role plan overrides for a given organization (server-scoped via org-scoped endpoint)
  const loadOrganizationRolePlans = async (organizationId: string): Promise<OrganizationRolePlan[]> => {
    return withAsync(async () => {
      if (isDemoMode()) {
        logDemoAction('loadOrganizationRolePlans', { organizationId })
        return []
      }

      const response = await axios.get(`/organizations/${organizationId}/role-plans`)
      return response.data?.data || response.data || []
    }, 'organizationRolePlans.loadError')
  }

  // Create a role plan override
  const createRolePlan = async (data: {
    organization_id: string
    role: string
    subscription_plan_id: string
  }): Promise<OrganizationRolePlan> => {
    return withAsync(async () => {
      if (isDemoMode()) {
        logDemoAction('createRolePlan', data)
        return { id: `demo-role-plan-${data.role}`, ...data }
      }

      const response = await axios.post('/organization-role-plans', data)
      return response.data?.data || response.data
    }, 'organizationRolePlans.createError')
  }

  // Update a role plan override
  const updateRolePlan = async (
    id: string,
    data: { subscription_plan_id: string }
  ): Promise<OrganizationRolePlan> => {
    return withAsync(async () => {
      if (isDemoMode()) {
        logDemoAction('updateRolePlan', { id, data })
        return { id, ...data } as OrganizationRolePlan
      }

      const response = await axios.patch(`/organization-role-plans/${id}`, data)
      return response.data?.data || response.data
    }, 'organizationRolePlans.updateError')
  }

  // Delete a role plan override
  const deleteRolePlan = async (id: string): Promise<void> => {
    return withAsync(async () => {
      if (isDemoMode()) {
        logDemoAction('deleteRolePlan', { id })
        return
      }

      await axios.delete(`/organization-role-plans/${id}`)
    }, 'organizationRolePlans.deleteError')
  }

  return {
    // State
    isLoading,
    error,

    // Actions
    loadOrganizationRolePlans,
    createRolePlan,
    updateRolePlan,
    deleteRolePlan,

    // Translations
    t,
  }
})
