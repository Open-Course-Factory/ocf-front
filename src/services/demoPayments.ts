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

import { demoConfig, logDemoAction, simulateDelay } from './demoConfig'
import { getDemoSubscriptionPlans } from './demoData'

/**
 * Demo Payment Service
 *
 * Mocks Stripe payment processing for safe testing of subscription flows
 * without real payments or external API calls.
 */

export class DemoPaymentService {
  private static instance: DemoPaymentService

  private constructor() {}

  static getInstance(): DemoPaymentService {
    if (!this.instance) {
      this.instance = new DemoPaymentService()
    }
    return this.instance
  }

  /**
   * Mock Stripe checkout session creation
   */
  async createCheckoutSession(
    planId: string,
    successUrl: string,
    cancelUrl: string,
    couponCode?: string
  ): Promise<{ session_id: string; url: string }> {
    logDemoAction('Creating demo checkout session', { planId, couponCode })

    await simulateDelay(2000) // Simulate API delay

    const plans = getDemoSubscriptionPlans()
    const plan = plans.find(p => p.id === planId)

    if (!plan) {
      throw new Error('Demo plan not found')
    }

    // Simulate different outcomes based on plan
    if (plan.name.includes('Enterprise')) {
      // Simulate longer processing for enterprise
      await simulateDelay(1000)
    }

    const sessionId = `cs_demo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    return {
      session_id: sessionId,
      url: this.buildDemoCheckoutUrl(sessionId, successUrl, cancelUrl, plan)
    }
  }

  /**
   * Mock Stripe customer portal session creation
   */
  async createPortalSession(returnUrl: string): Promise<{ url: string }> {
    logDemoAction('Creating demo portal session', { returnUrl })

    await simulateDelay(1500)

    const sessionId = `bcs_demo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    return {
      url: this.buildDemoPortalUrl(sessionId, returnUrl)
    }
  }

  /**
   * Mock usage limit checking
   */
  async checkUsageLimit(
    metricType: string,
    requestedAmount: number = 1
  ): Promise<{ allowed: boolean; current_usage: number; limit: number; remaining: number }> {
    logDemoAction('Checking demo usage limit', { metricType, requestedAmount })

    await simulateDelay(500)

    // Mock different scenarios based on metric type
    const mockLimits = {
      courses_created: { current: 3, limit: 25 },
      lab_sessions: { current: 85, limit: 100 },
      concurrent_users: { current: 7, limit: 10 },
      storage_used: { current: 1500, limit: 5000 }
    }

    const usage = mockLimits[metricType] || { current: 0, limit: 100 }
    const newUsage = usage.current + requestedAmount
    const allowed = newUsage <= usage.limit

    return {
      allowed,
      current_usage: usage.current,
      limit: usage.limit,
      remaining: Math.max(0, usage.limit - usage.current)
    }
  }

  /**
   * Mock coupon validation (if backend implements it)
   */
  async validateCoupon(
    couponCode: string,
    planId: string
  ): Promise<{ valid: boolean; code: string; discount: string; type: string; value: number }> {
    logDemoAction('Validating demo coupon', { couponCode, planId })

    await simulateDelay(800)

    // Mock validation - some codes work, some don't
    const validCoupons = {
      'DEMO10': { discount: '10%', type: 'percent', value: 10 },
      'SAVE5': { discount: '5€', type: 'amount', value: 500 }, // 5€ in cents
      'TRIAL': { discount: 'Extended trial', type: 'trial', value: 30 }
    }

    const coupon = validCoupons[couponCode.toUpperCase()]

    if (!coupon) {
      throw new Error('Invalid coupon code')
    }

    return {
      valid: true,
      code: couponCode.toUpperCase(),
      discount: coupon.discount,
      type: coupon.type,
      value: coupon.value
    }
  }

  /**
   * Build demo checkout URL that redirects to success/cancel
   */
  private buildDemoCheckoutUrl(
    sessionId: string,
    successUrl: string,
    cancelUrl: string,
    plan: any
  ): string {
    const baseUrl = `${window.location.origin}/demo-checkout`
    const params = new URLSearchParams({
      session_id: sessionId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      plan_name: plan.name,
      amount: plan.price_amount.toString(),
      currency: plan.currency
    })

    return `${baseUrl}?${params.toString()}`
  }

  /**
   * Build demo portal URL
   */
  private buildDemoPortalUrl(sessionId: string, returnUrl: string): string {
    const baseUrl = `${window.location.origin}/demo-portal`
    const params = new URLSearchParams({
      session_id: sessionId,
      return_url: returnUrl
    })

    return `${baseUrl}?${params.toString()}`
  }

  /**
   * Simulate webhook processing (for testing subscription state changes)
   */
  simulateWebhook(
    eventType: 'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted' | 'invoice.payment_succeeded' | 'invoice.payment_failed',
    data: any
  ): void {
    logDemoAction('Simulating webhook', { eventType, data })

    // In a real app, this would trigger store updates
    console.log(`🔄 Demo webhook: ${eventType}`, data)
  }

  /**
   * Check if we should intercept API calls in demo mode
   */
  shouldInterceptApiCall(url: string): boolean {
    if (!demoConfig.isDemoMode()) {
      return false
    }

    const interceptedEndpoints = [
      '/subscription-plans',
      '/user-subscriptions/current',
      '/user-subscriptions/checkout',
      '/user-subscriptions/portal',
      '/user-subscriptions/usage',
      '/user-subscriptions/usage/check',
      '/invoices/user',
      '/payment-methods/user'
    ]

    return interceptedEndpoints.some(endpoint => url.includes(endpoint))
  }
}

// Export singleton instance
export const demoPayments = DemoPaymentService.getInstance()

// Export convenience functions
export const createDemoCheckoutSession = (planId: string, successUrl: string, cancelUrl: string, couponCode?: string) =>
  demoPayments.createCheckoutSession(planId, successUrl, cancelUrl, couponCode)

export const createDemoPortalSession = (returnUrl: string) =>
  demoPayments.createPortalSession(returnUrl)

export const checkDemoUsageLimit = (metricType: string, requestedAmount?: number) =>
  demoPayments.checkUsageLimit(metricType, requestedAmount)

export const validateDemoCoupon = (couponCode: string, planId: string) =>
  demoPayments.validateCoupon(couponCode, planId)