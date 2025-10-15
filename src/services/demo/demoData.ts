/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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

/**
 * Demo Data Service
 *
 * Provides mock data for testing subscription functionality
 * without real backend integration or payments.
 */

export class DemoDataService {
  private static instance: DemoDataService

  private constructor() {}

  static getInstance(): DemoDataService {
    if (!this.instance) {
      this.instance = new DemoDataService()
    }
    return this.instance
  }

  /**
   * Get demo subscription plans
   */
  getDemoSubscriptionPlans() {
    return [
      {
        id: 'demo_plan_starter',
        name: 'Starter Plan',
        description: 'Perfect for individuals getting started with course creation',
        price_amount: 100, // $1.00 in cents for demo
        currency: 'eur',
        billing_interval: 'month',
        features: [
          'Create up to 5 courses',
          '2 concurrent users in labs',
          'Basic support',
          'Community access'
        ],
        max_courses: 5,
        max_concurrent_users: 2,
        trial_days: 14,
        is_active: true,
        stripe_product_id: 'prod_demo_starter',
        stripe_price_id: 'price_demo_starter',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo_plan_pro',
        name: 'Professional Plan',
        description: 'For educators and small teams creating multiple courses',
        price_amount: 2900, // $29.00 in cents for demo
        currency: 'eur',
        billing_interval: 'month',
        features: [
          'Create up to 25 courses',
          '10 concurrent users in labs',
          'Priority support',
          'Advanced analytics',
          'Custom branding'
        ],
        max_courses: 25,
        max_concurrent_users: 10,
        trial_days: 14,
        is_active: true,
        stripe_product_id: 'prod_demo_pro',
        stripe_price_id: 'price_demo_pro',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo_plan_enterprise',
        name: 'Enterprise Plan',
        description: 'For large organizations with advanced needs',
        price_amount: 9900, // $99.00 in cents for demo
        currency: 'eur',
        billing_interval: 'month',
        features: [
          'Unlimited courses',
          'Unlimited concurrent users',
          'Dedicated support',
          'Custom integrations',
          'SLA guarantee',
          'Advanced security'
        ],
        max_courses: -1, // -1 = unlimited
        max_concurrent_users: -1,
        trial_days: 30,
        is_active: true,
        stripe_product_id: 'prod_demo_enterprise',
        stripe_price_id: 'price_demo_enterprise',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo_plan_inactive',
        name: 'Legacy Plan',
        description: 'This plan is no longer available',
        price_amount: 1500,
        currency: 'eur',
        billing_interval: 'month',
        features: ['Legacy features'],
        max_courses: 10,
        max_concurrent_users: 5,
        trial_days: 0,
        is_active: false, // Inactive plan for testing
        stripe_product_id: 'prod_demo_legacy',
        stripe_price_id: 'price_demo_legacy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  /**
   * Get demo current subscription (for testing different states)
   */
  getDemoCurrentSubscription(status: 'active' | 'trialing' | 'canceled' | 'past_due' | null = 'active') {
    if (status === null) {
      return null // No subscription
    }

    const baseSubscription = {
      id: 'demo_sub_123',
      user_id: 'demo_user_123',
      subscription_plan_id: 'demo_plan_pro_123', // Correct field name from backend
      subscription_plan: {
        id: 'demo_plan_pro_123',
        name: 'Professional Plan',
        price_amount: 2900,
        currency: 'eur',
        billing_interval: 'month'
      },
      plan_name: 'Professional Plan',
      plan_price: 2900,
      currency: 'eur',
      billing_interval: 'month',
      stripe_subscription_id: 'sub_demo_123',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      updated_at: new Date().toISOString()
    }

    switch (status) {
      case 'active':
        return {
          ...baseSubscription,
          status: 'active',
          current_period_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          trial_end: null
        }

      case 'trialing':
        return {
          ...baseSubscription,
          status: 'trialing',
          current_period_start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          current_period_end: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          trial_end: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString()
        }

      case 'canceled':
        return {
          ...baseSubscription,
          status: 'active', // Still active but will cancel
          current_period_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: true,
          trial_end: null
        }

      case 'past_due':
        return {
          ...baseSubscription,
          status: 'past_due',
          current_period_start: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          current_period_end: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          trial_end: null
        }

      default:
        return baseSubscription
    }
  }

  /**
   * Get demo usage metrics
   */
  getDemoUsageMetrics() {
    return [
      {
        id: 'demo_usage_courses',
        metric_type: 'courses',
        current_value: 3,
        limit_value: 25,
        usage_percent: 12,
        period_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date().toISOString(),
        user_id: 'demo_user_123'
      },
      {
        id: 'demo_usage_users',
        metric_type: 'concurrent_users',
        current_value: 7,
        limit_value: 10,
        usage_percent: 70,
        period_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date().toISOString(),
        user_id: 'demo_user_123'
      },
    ]
  }

  /**
   * Get demo invoices
   */
  getDemoInvoices() {
    return [
      {
        id: 'demo_inv_001',
        invoice_number: 'INV-2025-001',
        amount: 2900,
        currency: 'eur',
        status: 'paid',
        invoice_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
        paid_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
        download_url: '/demo/invoices/inv-001.pdf',
        stripe_hosted_url: 'https://demo.stripe.com/invoice/123',
        stripe_invoice_id: 'in_demo_123',
        user_subscription: 'demo_sub_123',
        user_id: 'demo_user_123',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'demo_inv_002',
        invoice_number: 'INV-2025-002',
        amount: 2900,
        currency: 'eur',
        status: 'paid',
        invoice_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() - 53 * 24 * 60 * 60 * 1000).toISOString(),
        paid_at: new Date(Date.now() - 53 * 24 * 60 * 60 * 1000).toISOString(),
        download_url: '/demo/invoices/inv-002.pdf',
        stripe_hosted_url: 'https://demo.stripe.com/invoice/124',
        stripe_invoice_id: 'in_demo_124',
        user_subscription: 'demo_sub_123',
        user_id: 'demo_user_123',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }

  /**
   * Get demo payment methods
   */
  getDemoPaymentMethods() {
    return [
      {
        id: 'demo_pm_001',
        type: 'card',
        card_brand: 'visa',
        card_last4: '4242',
        card_exp_month: 12,
        card_exp_year: 2026,
        is_default: true,
        is_active: true,
        stripe_payment_method_id: 'pm_demo_visa',
        user_id: 'demo_user_123',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'demo_pm_002',
        type: 'card',
        card_brand: 'mastercard',
        card_last4: '5555',
        card_exp_month: 8,
        card_exp_year: 2025,
        is_default: false,
        is_active: true,
        stripe_payment_method_id: 'pm_demo_mc',
        user_id: 'demo_user_123',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
}

// Export singleton instance
export const demoData = DemoDataService.getInstance()

// Export convenience functions
export const getDemoSubscriptionPlans = () => demoData.getDemoSubscriptionPlans()
export const getDemoCurrentSubscription = (status?: Parameters<typeof demoData.getDemoCurrentSubscription>[0]) =>
  demoData.getDemoCurrentSubscription(status)
export const getDemoUsageMetrics = () => demoData.getDemoUsageMetrics()
export const getDemoInvoices = () => demoData.getDemoInvoices()
export const getDemoPaymentMethods = () => demoData.getDemoPaymentMethods()