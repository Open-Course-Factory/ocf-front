/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import axios from 'axios'
import type {
  PricingBreakdown,
  SubscriptionBatch,
  UserSubscription,
  BulkPurchaseInput
} from '../../../types/entities'

/** One unit of a seat product: a seat for a billing period, or one learner for one day. */
export type SeatUnit = 'seat_month' | 'learner_day'

export interface PurchasableSeatPlan {
  id: string
  name: string
  description: string
  currency: string
  billing_interval: string
  price_amount: number
  use_tiered_pricing: boolean
  pricing_tiers: Array<{ min_quantity: number; max_quantity: number; unit_amount: number }>
  /** Always resolved by the server — never empty, so the screen has nothing to guess. */
  seat_unit: SeatUnit
}

export interface PurchasableSeatPlansResponse {
  can_purchase: boolean
  reason?: string
  plans: PurchasableSeatPlan[]
}

export interface PricingPreviewParams {
  subscriptionPlanId: string
  quantity: number
}

export interface AssignLicenseInput {
  user_id: string
}

export interface UpdateQuantityInput {
  new_quantity: number
}

/**
 * Bulk License Management Service
 * Handles volume-based license purchases, assignments, and management
 */
export const bulkLicenseService = {
  /**
   * The seat products this trainer may buy for learners.
   *
   * Seat plans are hidden from the catalogue (is_catalog=false, so they never
   * reach the public pricing page), which means the ordinary plan list does not
   * contain them. This endpoint returns exactly what a purchase would accept,
   * plus whether the caller may buy at all — an ineligible caller gets
   * can_purchase=false with a reason rather than a 403, because the screen has
   * to explain itself.
   */
  async getPurchasableSeatPlans(): Promise<PurchasableSeatPlansResponse> {
    const response = await axios.get('/subscription-batches/purchasable-plans')
    return response.data
  },

  /**
   * Get pricing preview for bulk purchase
   * @param params Plan ID and quantity
   * @returns Detailed pricing breakdown with tier costs
   */
  async getPricingPreview(params: PricingPreviewParams): Promise<PricingBreakdown> {
    const response = await axios.get('/subscription-plans/pricing-preview', {
      params: {
        subscription_plan_id: params.subscriptionPlanId,
        quantity: params.quantity
      }
    })
    return response.data
  },

  /**
   * Create Stripe checkout session for bulk purchase
   * @param input Purchase details with redirect URLs
   * @returns Checkout session with URL to redirect to Stripe
   */
  async createBulkCheckoutSession(input: {
    subscription_plan_id: string
    quantity: number
    success_url: string
    cancel_url: string
    group_id?: string
    coupon_code?: string
  }): Promise<{ session_id: string; url: string }> {
    const response = await axios.post('/subscription-batches/create-checkout-session', input)
    return response.data
  },

  /**
   * Purchase bulk licenses (direct - used if payment already handled)
   * @param input Purchase details (plan, quantity, group, payment method)
   * @returns Created subscription batch
   */
  async purchaseBulkLicenses(input: BulkPurchaseInput): Promise<SubscriptionBatch> {
    const response = await axios.post('/user-subscriptions/purchase-bulk', input)
    return response.data
  },

  /**
   * Get all batches purchased by current user
   * @returns List of subscription batches
   */
  async getMyBatches(): Promise<SubscriptionBatch[]> {
    const response = await axios.get('/subscription-batches')
    return response.data
  },

  /**
   * Get a specific batch by ID
   * @param batchId Batch ID
   * @returns Subscription batch details
   */
  async getBatchById(batchId: string): Promise<SubscriptionBatch> {
    const response = await axios.get(`/subscription-batches/${batchId}`)
    return response.data
  },

  /**
   * Get all licenses (assigned and unassigned) in a batch
   * @param batchId Batch ID
   * @returns List of user subscriptions (licenses)
   */
  async getBatchLicenses(batchId: string): Promise<UserSubscription[]> {
    const response = await axios.get(`/subscription-batches/${batchId}/licenses`)
    return response.data
  },

  /**
   * Assign a license to a user
   * @param batchId Batch ID
   * @param input User ID to assign to
   * @returns Updated license (user subscription)
   */
  async assignLicense(batchId: string, input: AssignLicenseInput): Promise<UserSubscription> {
    const response = await axios.post(`/subscription-batches/${batchId}/assign`, input)
    return response.data
  },

  /**
   * Revoke a license assignment
   * @param batchId Batch ID
   * @param licenseId License ID
   * @returns Success message
   */
  async revokeLicense(batchId: string, licenseId: string): Promise<{ message: string }> {
    const response = await axios.delete(
      `/subscription-batches/${batchId}/licenses/${licenseId}/revoke`
    )
    return response.data
  },

  /**
   * Update batch quantity (scale up/down)
   * @param batchId Batch ID
   * @param input New quantity
   * @returns Success message
   */
  async updateBatchQuantity(
    batchId: string,
    input: UpdateQuantityInput
  ): Promise<{ message: string }> {
    const response = await axios.patch(`/subscription-batches/${batchId}/quantity`, input)
    return response.data
  },

  /**
   * Cancel a batch subscription
   * @param batchId Batch ID
   * @returns Success message
   */
  async cancelBatch(batchId: string): Promise<{ message: string }> {
    const response = await axios.delete(`/subscription-batches/${batchId}`)
    return response.data
  },

  /**
   * Permanently delete a canceled batch
   * @param batchId Batch ID
   * @returns Success message
   */
  async deleteBatch(batchId: string): Promise<{ message: string }> {
    const response = await axios.delete(`/subscription-batches/${batchId}/permanent`)
    return response.data
  }
}
