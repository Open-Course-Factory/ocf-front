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

import axios from 'axios'

export interface OrgMembership {
  id: string
  name: string
  role: string
}

export interface GroupMembership {
  id: string
  name: string
  role: string
}

export interface AdminUserListing {
  id: string
  username: string
  display_name: string
  email: string
  avatar?: string
  is_active: boolean
  is_admin: boolean
  organizations: OrgMembership[]
  groups: GroupMembership[]
}

/**
 * Service for the admin Users page (impersonation launchpad).
 *
 * Wraps the admin/users-with-memberships endpoint, which returns a flat list
 * of every user on the platform alongside their org and group memberships.
 * Used by the AdminUsers page to render the impersonation table. Admin-only
 * — the backend rejects the call for non-admin callers.
 */
export const adminUsersService = {
  async fetchAll(): Promise<AdminUserListing[]> {
    const response = await axios.get<AdminUserListing[]>('admin/users-with-memberships')
    return response.data || []
  },
}
