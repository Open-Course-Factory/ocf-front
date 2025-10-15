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

import { computed, inject, provide } from 'vue'
import { featureFlagService, isFeatureEnabled, type FeatureFlagConfig } from '../services/features'
import { useCurrentUserStore } from '../stores/currentUser'

// Feature flags context key for provide/inject
export const FEATURE_FLAGS_KEY = Symbol('featureFlags')

/**
 * Vue 3 Composable for Feature Flags
 * GitLab-style implementation with provide/inject pattern
 */
export function useFeatureFlags() {
  const currentUser = useCurrentUserStore()

  // Get current user context for actor-based checking
  const getCurrentActor = () => ({
    userId: currentUser.userId,
    role: currentUser.userRoles[0] || 'student'
  })

  /**
   * Check if a feature is enabled for current user (reactive)
   */
  const isEnabled = (flagName: string) => {
    return isFeatureEnabled(flagName, getCurrentActor())
  }

  /**
   * Reactive computed that watches for flag changes
   */
  const createReactiveFlag = (flagName: string) => {
    return computed(() => {
      return isFeatureEnabled(flagName, getCurrentActor())
    })
  }

  /**
   * Get all feature flags (reactive)
   */
  const flags = computed(() => featureFlagService.getAllFlags())

  /**
   * Update a feature flag (admin only)
   */
  const updateFlag = async (flagName: string, config: Partial<FeatureFlagConfig>) => {
    const actor = getCurrentActor()
    if (actor.role === 'administrator') {
      await featureFlagService.updateFlag(flagName, config)
    } else {
      console.warn('🏴 Only administrators can update feature flags')
    }
  }

  /**
   * Fetch feature flags from backend
   */
  const fetchFromBackend = async (force?: boolean) => {
    await featureFlagService.fetchFromBackend(force)
  }

  /**
   * Refresh feature flags after login (bypasses cache)
   */
  const refreshAfterLogin = async () => {
    await featureFlagService.refreshAfterLogin()
  }

  /**
   * Wait for feature flags to initialize from backend
   */
  const waitForInitialization = async () => {
    await featureFlagService.waitForInitialization()
  }

  /**
   * Sync usage limits
   */
  const syncUsageLimits = async () => {
    await featureFlagService.syncUsageLimits()
  }

  /**
   * Clear localStorage overrides
   */
  const clearLocalStorage = () => {
    featureFlagService.clearLocalStorage()
  }

  /**
   * Check multiple flags at once
   */
  const areEnabled = (flagNames: string[]) => {
    return flagNames.every(flagName => isEnabled(flagName))
  }

  /**
   * Check if any of the flags are enabled
   */
  const anyEnabled = (flagNames: string[]) => {
    return flagNames.some(flagName => isEnabled(flagName))
  }

  /**
   * Check if a metric type is visible (for filtering)
   */
  const isMetricVisible = (metricType: string) => {
    const actor = getCurrentActor()
    return featureFlagService.isMetricVisible(metricType, actor)
  }

  /**
   * Check if a feature is visible (for filtering)
   */
  const isFeatureVisible = (featureName: string) => {
    const actor = getCurrentActor()
    return featureFlagService.isFeatureVisible(featureName, actor)
  }

  /**
   * Get all visible metric types
   */
  const getVisibleMetricTypes = () => {
    const actor = getCurrentActor()
    return featureFlagService.getVisibleMetricTypes(actor)
  }

  /**
   * Generic filter function for any array of entities with a type/category field
   */
  const filterByFeatureFlags = <T extends Record<string, any>>(
    entities: T[],
    typeField: keyof T
  ): T[] => {
    const actor = getCurrentActor()
    return entities.filter(entity => {
      const entityType = entity[typeField]
      if (!entityType) return true // If no type field, always show
      return featureFlagService.isMetricVisible(entityType.toString(), actor)
    })
  }

  return {
    isEnabled,
    createReactiveFlag,
    areEnabled,
    anyEnabled,
    flags,
    updateFlag,
    fetchFromBackend,
    refreshAfterLogin,
    waitForInitialization,
    syncUsageLimits,
    clearLocalStorage,
    isMetricVisible,
    isFeatureVisible,
    getVisibleMetricTypes,
    filterByFeatureFlags,
    getCurrentActor
  }
}

/**
 * Provider for feature flags (to be used at app level)
 */
export function provideFeatureFlags() {
  const featureFlags = useFeatureFlags()
  provide(FEATURE_FLAGS_KEY, featureFlags)
  return featureFlags
}

/**
 * Inject feature flags from parent provider
 */
export function injectFeatureFlags() {
  const featureFlags = inject(FEATURE_FLAGS_KEY)
  if (!featureFlags) {
    console.warn('🏴 Feature flags not provided, falling back to direct usage')
    return useFeatureFlags()
  }
  return featureFlags
}

/**
 * Directive for conditional rendering based on feature flags
 * Usage: v-feature-flag="'theme_customization'"
 */
export const vFeatureFlag = {
  mounted(el: HTMLElement, binding: { value: string }) {
    const featureFlags = useFeatureFlags()
    if (!featureFlags.isEnabled(binding.value)) {
      el.style.display = 'none'
    }
  },
  updated(el: HTMLElement, binding: { value: string }) {
    const featureFlags = useFeatureFlags()
    el.style.display = featureFlags.isEnabled(binding.value) ? '' : 'none'
  }
}