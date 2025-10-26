/**
 * Entity type definitions for domain models
 */

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string
  created_at?: string
  updated_at?: string
}

/**
 * Role entity (Phase 3 - simplified system)
 */
export interface Role {
  id: string
  name: 'member' | 'administrator' // Only 2 system roles
  description?: string
}

/**
 * User Summary (simplified user info from API responses)
 */
export interface UserSummary {
  id: string
  name: string
  display_name: string
  email: string
}

/**
 * User entity
 */
export interface User extends BaseEntity {
  email: string
  username?: string
  name?: string // For compatibility with API responses that use 'name' instead of 'username'
  display_name?: string
  roles?: Role[]
  is_active?: boolean
  last_login?: string

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
 * Pricing Tier for volume-based pricing
 */
export interface PricingTier {
  min_quantity: number
  max_quantity: number // 0 = unlimited
  unit_amount: number // Price per license in cents
  description: string
}

/**
 * Subscription Plan entity
 */
export interface SubscriptionPlan extends BaseEntity {
  name: string
  description?: string
  priority: number // Higher = better tier (for feature aggregation)
  stripe_product_id: string
  stripe_price_id: string
  price_amount: number // Price in cents (e.g., 900 = €9.00)
  price?: number // Deprecated: use price_amount instead
  currency: string
  billing_interval: 'month' | 'year'
  trial_days: number
  features: string[] // Human-readable features
  max_concurrent_users: number
  max_courses: number // -1 = unlimited
  max_lab_sessions: number
  is_active: boolean
  required_role: string

  // Terminal-specific limits
  max_session_duration_minutes: number
  max_concurrent_terminals: number
  allowed_machine_sizes: string[] // ["XS", "S", "M", "L"]
  network_access_enabled: boolean
  data_persistence_enabled: boolean
  data_persistence_gb: number
  allowed_templates: string[]

  // Tiered pricing (for bulk purchases)
  use_tiered_pricing: boolean
  pricing_tiers?: PricingTier[]
}

/**
 * Subscription entity (Individual User Subscription)
 */
export interface Subscription extends BaseEntity {
  user_id: string
  subscription_plan_id: string
  subscription_plan?: SubscriptionPlan
  stripe_subscription_id: string
  stripe_customer_id: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  subscription_type: 'personal' | 'assigned'
  is_primary: boolean // True if this is the active subscription being used
  current_period_start: string
  current_period_end: string
  trial_end?: string
  cancel_at_period_end: boolean
  cancelled_at?: string

  // Bulk license batch information (when assigned from bulk purchase)
  subscription_batch_id?: string
  batch_owner_id?: string
  batch_owner_name?: string
  batch_owner_email?: string
  assigned_at?: string

  // Deprecated fields (for backward compatibility)
  plan_id?: string
  plan_name?: string
}

/**
 * Invoice entity
 */
export interface Invoice extends BaseEntity {
  user_id: string
  subscription_id?: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  invoice_date?: string
  due_date?: string
  paid_at?: string
  stripe_invoice_id?: string
}

/**
 * Payment Method entity
 */
export interface PaymentMethod extends BaseEntity {
  user_id: string
  type: 'card' | 'bank_account' | 'paypal'
  last4?: string
  brand?: string
  exp_month?: number
  exp_year?: number
  is_default?: boolean
  stripe_payment_method_id?: string
}

/**
 * Terminal Session entity
 */
export interface TerminalSession extends BaseEntity {
  user_id: string
  session_id: string
  name?: string
  instance_type?: string
  status: 'starting' | 'active' | 'stopped' | 'expired' | 'terminated'
  console_url?: string
  expires_at?: string
  terms?: string
}

/**
 * SSH Key entity
 */
export interface SshKey extends BaseEntity {
  user_id: string
  name: string
  public_key?: string
  private_key?: string
  fingerprint?: string
}

/**
 * Course entity
 */
export interface Course extends BaseEntity {
  name: string
  version: string
  title: string
  subtitle?: string
  header?: string
  footer?: string
  description?: string
  learning_objectives?: string
  format?: string
  author_email?: string
  category?: string
  logo?: string
  prelude?: string
  user_id?: string
  owner_id?: string
  is_published?: boolean
  slug?: string
  chapters?: Chapter[]
}

/**
 * Chapter entity
 */
export interface Chapter extends BaseEntity {
  course_id: string
  course?: Course  // Optional: full course object if loaded
  title: string
  description?: string
  order?: number
  sections?: Section[]
}

/**
 * Section entity
 */
export interface Section extends BaseEntity {
  chapter_id: string
  chapter?: Chapter  // Optional: full chapter object if loaded
  title: string
  content?: string
  order?: number
  pages?: Page[]
}

/**
 * Page entity
 */
export interface Page extends BaseEntity {
  section_id: string
  section?: Section  // Optional: full section object if loaded
  title: string
  content?: string
  order?: number
}

/**
 * Generation entity (AI course generation)
 */
export interface Generation extends BaseEntity {
  user_id: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: any
  error?: string
}

/**
 * Usage Metric entity
 */
export interface UsageMetric extends BaseEntity {
  user_id: string
  metric_type: 'concurrent_terminals' | 'courses' | 'lab_sessions'
  current_value: number
  limit_value: number
  period_start: string
  period_end: string
  last_updated: string
  usage_percent: number // Calculated: (current_value / limit_value) * 100
}

/**
 * Class Group entity (for team/class management)
 */
export interface ClassGroup extends BaseEntity {
  name: string
  display_name: string
  description?: string
  owner_user_id: string
  subscription_plan_id?: string
  max_members: number
  member_count: number
  expires_at?: string
  casdoor_group_name?: string
  is_active: boolean
  is_expired?: boolean
  is_full?: boolean
  metadata?: Record<string, any>
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
 * Terminal Share entity (extended to support group sharing)
 */
export interface TerminalShare extends BaseEntity {
  terminal_id: string
  shared_with_user_id?: string
  shared_with_group_id?: string
  shared_by_user_id: string
  share_type: 'user' | 'group'
  access_level: 'read' | 'write' | 'admin'
  expires_at?: string
  is_active: boolean
  metadata?: Record<string, any>
}

/**
 * Subscription Batch entity (bulk license purchase - Phase 3)
 */
export interface SubscriptionBatch extends BaseEntity {
  purchaser_user_id: string
  subscription_plan_id: string
  subscription_plan?: SubscriptionPlan
  group_id?: string
  stripe_subscription_id: string
  stripe_subscription_item_id: string
  total_quantity: number
  assigned_quantity: number
  available_quantity: number // Calculated: total - assigned
  status: 'pending_payment' | 'active' | 'cancelled'
  current_period_start: string
  current_period_end: string
  cancelled_at?: string
}

/**
 * User Subscription entity (individual license in a batch)
 */
export interface UserSubscription extends BaseEntity {
  user_id?: string
  subscription_batch_id?: string
  subscription_plan_id: string
  subscription_plan?: SubscriptionPlan
  status: 'unassigned' | 'active' | 'canceled' | 'cancelled' | 'past_due'
  current_period_start?: string
  current_period_end?: string
  cancelled_at?: string
  stripe_subscription_id?: string
}

/**
 * Tier Cost breakdown for pricing preview
 */
export interface TierCost {
  range: string // "1-10", "11-25", "26+"
  quantity: number
  unit_price: number // In cents
  subtotal: number // In cents
}

/**
 * Pricing Breakdown response
 */
export interface PricingBreakdown {
  plan_name: string
  total_quantity: number
  tier_breakdown: TierCost[]
  total_monthly_cost: number // In cents
  average_per_license: number // In currency (e.g., 9.33)
  savings_vs_individual: number // In cents
  currency: string
}

/**
 * Bulk Purchase Input
 */
export interface BulkPurchaseInput {
  subscription_plan_id: string
  quantity: number
  group_id?: string
  payment_method_id?: string
  coupon_code?: string
}

// ==========================================
// ORGANIZATION-RELATED TYPES (Phase 2 & 3)
// ==========================================

/**
 * Organization entity
 */
export interface Organization extends BaseEntity {
  name: string
  display_name: string
  description?: string
  owner_user_id: string
  subscription_plan_id?: string
  is_personal: boolean // Auto-created personal org for each user
  max_groups: number
  max_members: number
  is_active: boolean
  metadata?: Record<string, any>

  // Counts (if preloaded)
  group_count?: number
  member_count?: number

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

/**
 * Organization Subscription entity (Phase 2)
 */
export interface OrganizationSubscription extends BaseEntity {
  organization_id: string
  subscription_plan_id: string
  subscription_plan?: SubscriptionPlan
  stripe_subscription_id: string
  stripe_customer_id: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'pending_payment'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  quantity: number // Always 1 for org subscriptions
}

/**
 * Usage Limits (from subscription plan)
 */
export interface UsageLimits {
  max_concurrent_terminals: number
  max_session_duration_minutes: number
  max_courses: number
  allowed_machine_sizes: string[]
  network_access_enabled: boolean
  data_persistence_enabled: boolean
  data_persistence_gb: number
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

/**
 * Audit Log entity
 */
export interface AuditLog extends BaseEntity {
  user_id: string
  organization_id?: string
  action: string
  entity_type: string
  entity_id: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
}
