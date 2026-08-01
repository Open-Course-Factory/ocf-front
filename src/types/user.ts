/**
 * User type definitions
 */

import type { BaseEntity, Role } from './base'
import type { OrganizationMembership } from './organization'
import type { GroupMembership } from './group'
import type { Subscription, SubscriptionPlan } from './subscription'

/**
 * User entity
 */
export interface User extends BaseEntity {
  email: string
  name?: string // Unified name field (compatible with 'username' from API)
  username?: string
  display_name?: string
  roles?: Role[]
  is_active?: boolean
  last_login?: string
  email_verified?: boolean
  email_verified_at?: string

  // Organization memberships (if preloaded with ?includes=organization_memberships)
  organization_memberships?: OrganizationMembership[]

  // Group memberships (if preloaded with ?includes=group_memberships)
  group_memberships?: GroupMembership[]

  // Effective features from subscriptions (aggregated across all organizations)
  max_courses?: number
  max_terminals?: number
  can_export_courses?: boolean
  can_use_api?: boolean
  max_session_duration_minutes?: number
  network_access_enabled?: boolean
  data_persistence_enabled?: boolean
  data_persistence_gb?: number
}

/**
 * Organization Feature Source (for effective features calculation)
 */
export interface OrganizationFeatureSource {
  organization_id: string
  organization_name: string
  role: 'owner' | 'manager' | 'member'
  contributing_features: string[]
}

/**
 * User Effective Features (aggregated from all organizations)
 */
/**
 * Why a user may not run classrooms. Stable codes from the backend — translate
 * them, never display them.
 */
export type ClassroomDeniedReason =
  | 'no_plan'
  | 'plan_lacks_group_management'
  | 'not_org_member'
  | 'insufficient_org_role'
  | 'personal_organization'

export interface UserEffectiveFeatures {
  user_id: string
  effective_features: SubscriptionPlan // Aggregated maximum features
  source_organizations: OrganizationFeatureSource[]
  has_personal_subscription: boolean
  personal_subscription?: Subscription

  /**
   * The backend's verdict on whether this user may create class groups, convert
   * an organization to a team, or buy learner seats.
   *
   * Read this. Do NOT infer it from `effective_features.features` containing
   * "group_management": that list is a UNION across the user's organizations and
   * answers "is this available to them somewhere", which is the gray-out
   * question and strictly more permissive. Inferring it is what had three screens
   * disagreeing with each other and with the backend (ocf-core#453).
   *
   * When asked with an organization context it also accounts for the user's role
   * there, so a student in a school — who inherits a plan that grants classrooms —
   * is correctly refused.
   */
  can_run_classrooms: boolean

  /** Refusal code, absent when `can_run_classrooms`. */
  classroom_denied_reason?: ClassroomDeniedReason
}
