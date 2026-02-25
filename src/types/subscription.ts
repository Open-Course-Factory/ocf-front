/**
 * Subscription, pricing, and payment type definitions
 */

import type { BaseEntity } from './base'

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
  planned_features?: string[] // Features coming soon
  max_concurrent_users: number
  max_courses: number // -1 = unlimited
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
  allowed_backends: string[]
  default_backend: string
  command_history_retention_days: number // 0 = no recording, >0 = days to retain

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

  // Plan features (aggregated from subscription plan)
  plan_features?: {
    session_duration_hours?: number
    [key: string]: any
  }

  // Deprecated fields (for backward compatibility)
  plan_id?: string
  plan_name?: string
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
  status: 'pending_payment' | 'active' | 'cancelled' | 'canceled'
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
  individual_unit_price?: number // In cents (individual price per license for comparison)
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

// Subscription API request types (moved from api.ts)

/**
 * Create Checkout Session Request (Individual)
 */
export interface CreateCheckoutSessionRequest {
  subscription_plan_id: string
  success_url: string
  cancel_url: string
  allow_replace?: boolean
}

/**
 * Create Bulk Checkout Session Request
 */
export interface CreateBulkCheckoutSessionRequest {
  subscription_plan_id: string
  quantity: number
  success_url: string
  cancel_url: string
  group_id?: string
}

/**
 * Upgrade Subscription Request
 */
export interface UpgradeSubscriptionRequest {
  new_plan_id: string
  proration_behavior?: 'always_invoice' | 'create_prorations' | 'none'
}

/**
 * Assign License Request
 */
export interface AssignLicenseRequest {
  user_id: string
}

/**
 * Update Batch Quantity Request
 */
export interface UpdateBatchQuantityRequest {
  new_quantity: number
}

/**
 * Checkout Session Response
 */
export interface CheckoutSessionResponse {
  url: string
  session_id: string
}
