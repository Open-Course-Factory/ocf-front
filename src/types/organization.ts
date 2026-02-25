/**
 * Organization type definitions
 */

import type { BaseEntity } from './base'
import type { SubscriptionPlan } from './subscription'
import type { GroupSummary } from './group'
import type { User } from './user'
import type { UsageLimits } from './admin'

/**
 * Organization entity
 */
export interface Organization extends BaseEntity {
  name: string
  display_name: string
  description?: string
  owner_user_id: string
  subscription_plan_id?: string
  organization_type: 'personal' | 'team' // Type of organization
  is_personal?: boolean // Deprecated: use organization_type instead
  max_groups: number
  max_members: number
  is_active: boolean
  metadata?: Record<string, any>

  // Counts (if preloaded)
  group_count?: number
  member_count: number // Number of members in organization

  // Related data (if preloaded with ?includes=members,groups)
  members?: OrganizationMember[]
  groups?: GroupSummary[]
}

/**
 * Organization Membership entity (Phase 3 - business roles)
 */
export interface OrganizationMembership extends BaseEntity {
  organization_id: string
  user_id: string
  role: 'owner' | 'manager' | 'member'
  invited_by?: string
  joined_at: string
  is_active: boolean
}

/**
 * Organization Member entity (with user details)
 */
export interface OrganizationMember extends OrganizationMembership {
  user?: User // Populated when ?includes=user
  organization?: Organization // Populated when ?includes=organization
}

/**
 * Organization Group entity (bulk import feature)
 */
export interface OrganizationGroup extends BaseEntity {
  organization_id: string
  name: string
  display_name: string
  description?: string
  parent_group_id?: string
  parent_group?: OrganizationGroup
  max_members?: number
  member_count: number
  expires_at?: string
  external_id?: string
  is_active: boolean
  metadata?: Record<string, any>
}

/**
 * Organization Subscription entity (Phase 2)
 */
export interface OrganizationSubscription extends BaseEntity {
  organization_id: string
  subscription_plan_id: string
  subscription_plan?: SubscriptionPlan
  stripe_subscription_id: string | null
  stripe_customer_id: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'pending_payment'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  quantity: number // Always 1 for org subscriptions
}

/**
 * Organization Features (includes subscription + usage limits)
 */
export interface OrganizationFeatures {
  organization_id: string
  organization_name: string
  subscription_plan?: SubscriptionPlan
  has_active_subscription: boolean
  features: string[]
  usage_limits: UsageLimits
}

// Organization API request types (moved from api.ts)

/**
 * Create Organization Request
 */
export interface CreateOrganizationRequest {
  name: string
  display_name: string
  description?: string
  max_groups?: number
  max_members?: number
}

/**
 * Update Organization Request
 */
export interface UpdateOrganizationRequest {
  display_name?: string
  description?: string
  max_groups?: number
  max_members?: number
  metadata?: Record<string, any>
}

/**
 * Convert Organization to Team Request
 */
export interface ConvertOrganizationToTeamRequest {
  name?: string // Optional new name for the team
}

/**
 * Subscribe Organization Request
 */
export interface SubscribeOrganizationRequest {
  subscription_plan_id: string
  payment_method_id?: string
  quantity?: number // Always 1 for org subscriptions
}

/**
 * Cancel Organization Subscription Request
 */
export interface CancelOrganizationSubscriptionRequest {
  cancel_at_period_end?: boolean
}
