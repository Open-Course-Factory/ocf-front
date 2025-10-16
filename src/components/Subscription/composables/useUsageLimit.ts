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

import { useSubscriptionsStore } from '../../../stores/subscriptions'
import { useNotification } from '../../../composables/useNotification'

/**
 * Usage Limit Guard Composable
 *
 * Provides functionality to check usage limits for different metrics
 * before allowing actions that would consume resources.
 *
 * Based on the OCF Core Payment API Integration Guide example.
 */
export function useUsageLimit(metricType: string) {
  const subscriptionsStore = useSubscriptionsStore()
  const { showError } = useNotification()

  /**
   * Check if a requested action would exceed usage limits
   * @param requestedAmount - Amount of resources to be consumed (default: 1)
   * @returns Promise<{ allowed: boolean, current_usage?: number, limit?: number, remaining?: number }>
   */
  const checkUsage = async (requestedAmount: number = 1) => {
    try {
      const response = await subscriptionsStore.checkUsageLimit(metricType, requestedAmount)

      // The backend returns a detailed response with usage info
      return {
        allowed: response.allowed || false,
        current_usage: response.current_usage,
        limit: response.limit,
        remaining: response.remaining
      }
    } catch (error) {
      console.error('Error checking usage limit:', error)
      // In case of error, deny the action for safety
      return {
        allowed: false,
        error: 'Unable to verify usage limits'
      }
    }
  }

  /**
   * Check usage and show appropriate notification if limit exceeded
   * @param requestedAmount - Amount of resources to be consumed
   * @returns Promise<boolean> - true if action is allowed
   */
  const checkUsageWithAlert = async (requestedAmount: number = 1): Promise<boolean> => {
    const result = await checkUsage(requestedAmount)

    if (!result.allowed) {
      if (result.error) {
        showError('Unable to verify usage limits. Please try again.', 'Usage Verification Error')
      } else {
        showError('Usage limit exceeded. Please upgrade your plan.', 'Usage Limit Exceeded')
      }
      return false
    }

    return true
  }

  return {
    checkUsage,
    checkUsageWithAlert
  }
}

// Example usage for course creation (as shown in the backend spec)
export function useCreateCourseUsageLimit() {
  return useUsageLimit('courses_created')
}

// Example usage for storage
export function useStorageUsageLimit() {
  return useUsageLimit('storage_used')
}