/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import axios from 'axios'
import type {
  PricingBreakdown,
  SubscriptionBatch,
  UserSubscription,
  BulkPurchaseInput
} from '../../../types/entities'

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
   * Purchase bulk licenses
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
  }
}
