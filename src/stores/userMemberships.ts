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
import { isDemoMode } from '../services/demo'

export type MembershipRole = 'owner' | 'manager' | 'member'

export interface OrgMembership {
  organization_id: string
  role: MembershipRole
}

export interface GroupMembership {
  group_id: string
  role: MembershipRole
}

/**
 * Lightweight store for the current user's organization and group memberships,
 * used by UI surfaces that need to gate actions per-scope without N round-trips
 * (e.g. the scenario editor's "Create New" scope picker).
 */
export const useUserMembershipsStore = defineStore('userMemberships', () => {
  const orgMemberships = ref<OrgMembership[]>([])
  const groupMemberships = ref<GroupMembership[]>([])
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref('')

  const loadMemberships = async () => {
    if (isDemoMode()) {
      // Demo mode: synthesize a manager-of-everything view so the UI can be exercised
      orgMemberships.value = [
        { organization_id: 'demo-org-1', role: 'owner' },
        { organization_id: 'demo-org-2', role: 'manager' },
      ]
      groupMemberships.value = []
      isLoaded.value = true
      return
    }

    isLoading.value = true
    error.value = ''
    try {
      const [orgRes, groupRes] = await Promise.all([
        axios.get('/organizations/me/memberships'),
        axios.get('/groups/me/memberships'),
      ])

      const orgs = orgRes.data?.data || orgRes.data || []
      const groups = groupRes.data?.data || groupRes.data || []

      orgMemberships.value = Array.isArray(orgs) ? orgs : []
      groupMemberships.value = Array.isArray(groups) ? groups : []
      isLoaded.value = true
    } catch (err: any) {
      error.value = err.response?.data?.error_message ||
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to load memberships'
      // Diagnostic dump — remove once the membership 404 is identified.
      console.error('[userMemberships] load failed', {
        message: err.message,
        status: err.response?.status,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
        method: err.config?.method,
        responseData: err.response?.data,
        responseHeaders: err.response?.headers,
      })
      // Keep going with empty arrays so UI just hides scoped actions
      orgMemberships.value = []
      groupMemberships.value = []
      isLoaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  const ensureLoaded = async () => {
    if (!isLoaded.value && !isLoading.value) {
      await loadMemberships()
    }
  }

  const getOrgRole = (orgId: string): MembershipRole | null => {
    const m = orgMemberships.value.find(x => x.organization_id === orgId)
    return m?.role ?? null
  }

  const getGroupRole = (groupId: string): MembershipRole | null => {
    const m = groupMemberships.value.find(x => x.group_id === groupId)
    return m?.role ?? null
  }

  const canManageOrg = (orgId: string): boolean => {
    const r = getOrgRole(orgId)
    return r === 'manager' || r === 'owner'
  }

  const canManageGroup = (groupId: string): boolean => {
    const r = getGroupRole(groupId)
    return r === 'manager' || r === 'owner'
  }

  const reset = () => {
    orgMemberships.value = []
    groupMemberships.value = []
    isLoaded.value = false
    error.value = ''
  }

  return {
    // state
    orgMemberships,
    groupMemberships,
    isLoaded,
    isLoading,
    error,
    // actions
    loadMemberships,
    ensureLoaded,
    reset,
    // helpers
    getOrgRole,
    getGroupRole,
    canManageOrg,
    canManageGroup,
  }
})
