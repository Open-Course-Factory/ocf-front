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
 * Subscription Plan entity
 */
export interface SubscriptionPlan extends BaseEntity {
  name: string
  description?: string
  price: number
  currency: string
  billing_interval: 'month' | 'year'
  features?: Record<string, any>
  is_active?: boolean
  stripe_price_id?: string
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
