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
  max_concurrent_terminals?: number
  max_session_duration_minutes?: number
  allowed_machine_sizes?: string[]
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
export interface UserEffectiveFeatures {
  user_id: string
  effective_features: SubscriptionPlan // Aggregated maximum features
  source_organizations: OrganizationFeatureSource[]
  has_personal_subscription: boolean
  personal_subscription?: Subscription
}
