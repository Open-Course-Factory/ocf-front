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
  member_id: string
}

export interface GroupMembership {
  id: string
  name: string
  role: string
  member_id: string
}

export interface AdminUserListing {
  id: string
  username: string
  display_name: string
  email: string
  avatar?: string
  is_active: boolean
  is_admin: boolean
  email_verified: boolean
  organizations: OrgMembership[]
  groups: GroupMembership[]
}

export interface AdminCreateUserInput {
  username: string
  display_name: string
  email: string
  password: string
  first_name: string
  last_name: string
  email_verified: boolean
  default_role?: string
}

export interface AdminCreateUserOutput {
  id: string
  username: string
  email: string
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

  /** Sends the standard password-reset email to the user — the admin never sees the new password. */
  async sendPasswordResetEmail(userId: string): Promise<void> {
    await axios.post(`admin/users/${userId}/send-password-reset-email`)
  },

  /** Grants the platform "administrator" role to the user. */
  async grantAdminRole(userId: string): Promise<void> {
    await axios.post(`admin/users/${userId}/admin-role`)
  },

  /** Revokes the platform "administrator" role from the user. */
  async revokeAdminRole(userId: string): Promise<void> {
    await axios.delete(`admin/users/${userId}/admin-role`)
  },

  /** Blocks or restores the user's ability to sign in. */
  async setForbidden(userId: string, forbidden: boolean): Promise<void> {
    await axios.put(`admin/users/${userId}/forbidden`, { forbidden })
  },

  /** Creates a user account directly — no self-signup ToS step, no email verification link unless asked for. */
  async createUser(input: AdminCreateUserInput): Promise<AdminCreateUserOutput> {
    const response = await axios.post<AdminCreateUserOutput>('admin/users', input)
    return response.data
  },

  /** Force-verifies the user's email with no token — for accounts whose owner never completed the self-service link. */
  async verifyEmail(userId: string): Promise<void> {
    await axios.post(`admin/users/${userId}/verify-email`)
  },

  /** Sets the user's password directly — no email is sent; the admin hands it over themselves. */
  async setPassword(userId: string, password: string): Promise<void> {
    await axios.put(`admin/users/${userId}/password`, { password })
  },

  /**
   * Permanently erases the user: Stripe cancellation, Casdoor identity, RBAC
   * policies and all OCF-side data (memberships, personal organization,
   * sessions, settings). Irreversible. The backend refuses (409) if the
   * user still owns a non-personal organization or group — ownership must
   * be transferred first.
   */
  async deleteUser(userId: string): Promise<void> {
    await axios.delete(`users/${userId}`)
  },
}
