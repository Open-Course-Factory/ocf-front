/**
 * Group and group membership type definitions
 */

import type { BaseEntity } from './base'

/**
 * Class Group entity (for team/class management)
 */
export interface ClassGroup extends BaseEntity {
  name: string
  display_name: string
  description?: string
  owner_user_id: string
  organization_id: string // Required: group must belong to an organization
  organizationID?: string // Backend uses camelCase
  subscription_plan_id?: string
  max_members: number
  member_count: number
  expires_at?: string
  casdoor_group_name?: string
  is_active: boolean
  is_expired?: boolean
  is_full?: boolean
  metadata?: Record<string, any>

  // Nested groups (hierarchical structure)
  parent_group_id?: string | null
  parentGroupID?: string | null // Backend uses camelCase
  parent_group?: ClassGroup // Populated when ?includes=ParentGroup
  parentGroup?: ClassGroup // Backend uses camelCase
  sub_groups?: ClassGroup[] // Populated when ?includes=SubGroups
  subGroups?: ClassGroup[] // Backend uses camelCase

  // Organization relationship (populated when ?includes=Organization)
  organization?: { id: string; name: string; display_name: string }
}

/**
 * Group Member entity (join table for class group membership)
 */
export interface GroupMember extends BaseEntity {
  group_id: string
  user_id: string
  role: 'owner' | 'admin' | 'assistant' | 'member'
  invited_by?: string
  joined_at?: string
  is_active: boolean
  metadata?: Record<string, any>
}

/**
 * Group Membership entity (Phase 3 - business roles)
 */
export interface GroupMembership extends BaseEntity {
  group_id: string
  user_id: string
  role: 'owner' | 'admin' | 'assistant' | 'member'
  joined_at: string
}

/**
 * Group Summary (lightweight group info)
 */
export interface GroupSummary extends BaseEntity {
  name: string
  display_name: string
  description?: string
  member_count?: number
}
