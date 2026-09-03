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
  /**
   * Set when the class is archived (ocf-core#491). The ONE flag the front reads
   * for "archived"; `is_active` is derived from it on the backend and kept only
   * until every consumer has switched.
   */
  archived_at?: string | null
  /** Derived from archived_at on the backend — transitional, do not branch on it. */
  is_active: boolean
  /** Expiry passed: an "archive pending" hint — the hourly cron archives it. */
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
}

/**
 * Group Member entity (join table for class group membership)
 */
export interface GroupMember extends BaseEntity {
  group_id: string
  user_id: string
  role: 'owner' | 'manager' | 'member'
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
  role: 'owner' | 'manager' | 'member'
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

/**
 * One member of a class about to be archived, as GET
 * /class-groups/:id/archive-preview describes them (ocf-core#491).
 */
export interface ClassArchivePreviewMember {
  user_id: string
  email: string
  display_name: string
  role: string
  /** Other classes of the organization, not archived, this member belongs to. */
  other_active_classes_in_org: number
  /**
   * The organization membership behind this class member: `active`, `removed`
   * (row inactive), `none` (no row — a class without organization), and
   * `offboarded` once ocf-core#492 lands. Anything else is treated as
   * "cannot be offboarded from here".
   */
  org_member_state: 'active' | 'removed' | 'none' | 'offboarded' | string
}

export interface ClassArchivePreview {
  members: ClassArchivePreviewMember[]
}
