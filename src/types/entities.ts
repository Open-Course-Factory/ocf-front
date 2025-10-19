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
 * User entity
 */
export interface User extends BaseEntity {
  email: string
  username?: string
  display_name?: string
  roles?: string[]
  is_active?: boolean
  last_login?: string
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
  price: number
  price_amount?: number // Price in cents (alternative naming)
  currency: string
  billing_interval: 'month' | 'year'
  features?: string[] | Record<string, any> // Can be array or object
  is_active?: boolean
  stripe_price_id?: string
  use_tiered_pricing?: boolean
  pricing_tiers?: PricingTier[]
}

/**
 * Subscription entity
 */
export interface Subscription extends BaseEntity {
  user_id: string
  plan_id: string
  plan_name?: string
  status: 'active' | 'canceled' | 'past_due' | 'incomplete'
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  stripe_subscription_id?: string
  subscription_plan?: {
    allowed_machine_sizes?: string[]
  }
  plan_features?: {
    session_duration_hours?: number
    concurrent_terminals?: number
  }
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
  title: string
  description?: string
  user_id: string
  is_published?: boolean
  slug?: string
}

/**
 * Chapter entity
 */
export interface Chapter extends BaseEntity {
  course_id: string
  title: string
  description?: string
  order?: number
}

/**
 * Section entity
 */
export interface Section extends BaseEntity {
  chapter_id: string
  title: string
  content?: string
  order?: number
}

/**
 * Page entity
 */
export interface Page extends BaseEntity {
  section_id: string
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
  subscription_id?: string
  metric_type: string
  current_value: number
  limit_value?: number
  period_start?: string
  period_end?: string
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
 * Subscription Batch entity (bulk license purchase)
 */
export interface SubscriptionBatch extends BaseEntity {
  purchaser_user_id: string
  subscription_plan_id: string
  subscription_plan?: SubscriptionPlan
  group_id?: string
  stripe_subscription_id: string
  stripe_subscription_item_id?: string
  total_quantity: number
  assigned_quantity: number
  available_quantity: number // Calculated: total - assigned
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  current_period_start?: string
  current_period_end?: string
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
  status: 'unassigned' | 'active' | 'cancelled' | 'past_due'
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
