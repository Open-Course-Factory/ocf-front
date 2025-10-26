/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import axios from 'axios'
import type {
  OrganizationSubscription,
  OrganizationFeatures,
  SubscribeOrganizationRequest,
  CancelOrganizationSubscriptionRequest
} from '../../../types'

/**
 * Organization Subscription Service
 * Handles organization-level subscription management (Phase 2)
 */
export const organizationSubscriptionService = {
  /**
   * Get organization subscription
   */
  async getOrganizationSubscription(organizationId: string): Promise<OrganizationSubscription> {
    const response = await axios.get(`/organizations/${organizationId}/subscription`)
    return response.data.data || response.data
  },

  /**
   * Subscribe organization to plan
   */
  async subscribeOrganization(
    organizationId: string,
    data: SubscribeOrganizationRequest
  ): Promise<OrganizationSubscription> {
    const response = await axios.post(`/organizations/${organizationId}/subscribe`, data)
    return response.data.data || response.data
  },

  /**
   * Cancel organization subscription
   */
  async cancelOrganizationSubscription(
    organizationId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<void> {
    const data: CancelOrganizationSubscriptionRequest = { cancel_at_period_end: cancelAtPeriodEnd }
    await axios.delete(`/organizations/${organizationId}/subscription`, { data })
  },

  /**
   * Get organization features
   */
  async getOrganizationFeatures(organizationId: string): Promise<OrganizationFeatures> {
    const response = await axios.get(`/organizations/${organizationId}/features`)
    return response.data.data || response.data
  },

  /**
   * Get organization usage limits
   */
  async getOrganizationUsageLimits(organizationId: string): Promise<any> {
    const response = await axios.get(`/organizations/${organizationId}/usage-limits`)
    return response.data.data || response.data
  },
}
