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
import { featureFlagService, isFeatureEnabled, type FeatureFlagConfig } from '../services/featureFlags'
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
  const updateFlag = (flagName: string, config: Partial<FeatureFlagConfig>) => {
    const actor = getCurrentActor()
    if (actor.role === 'administrator') {
      featureFlagService.updateFlag(flagName, config)
    } else {
      console.warn('🏴 Only administrators can update feature flags')
    }
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

  return {
    isEnabled,
    createReactiveFlag,
    areEnabled,
    anyEnabled,
    flags,
    updateFlag,
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