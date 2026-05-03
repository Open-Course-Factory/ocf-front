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
      // Use Promise.allSettled so a single endpoint failing doesn't wipe
      // both arrays. Real prod incident (#216): users whose /organizations
      // route 404'd lost their group memberships too, hiding groups they
      // owned from the scenario editor's scope picker.
      const [orgRes, groupRes] = await Promise.allSettled([
        axios.get('/organizations/me/memberships'),
        axios.get('/groups/me/memberships'),
      ])

      const orgs = orgRes.status === 'fulfilled'
        ? (orgRes.value.data?.data ?? orgRes.value.data ?? [])
        : []
      const groups = groupRes.status === 'fulfilled'
        ? (groupRes.value.data?.data ?? groupRes.value.data ?? [])
        : []

      orgMemberships.value = Array.isArray(orgs) ? orgs : []
      groupMemberships.value = Array.isArray(groups) ? groups : []
      isLoaded.value = true

      // Surface a partial-failure error for observability, but don't fail
      // the load — the half that succeeded is still usable.
      if (orgRes.status === 'rejected' || groupRes.status === 'rejected') {
        const failed: any = orgRes.status === 'rejected'
          ? (orgRes as any).reason
          : (groupRes as any).reason
        error.value = failed?.response?.data?.error_message ||
                      failed?.response?.data?.message ||
                      failed?.message ||
                      'Failed to load some memberships'
      }
    } catch (err: any) {
      // Promise.allSettled doesn't throw, but keep the catch as a safety
      // net for genuinely unexpected runtime errors (e.g., synchronous
      // throws from a bad mock or interceptor).
      error.value = err.response?.data?.error_message ||
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to load memberships'
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
