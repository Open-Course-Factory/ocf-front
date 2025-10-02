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
 * Feature Flags Service
 *
 * GitLab-style feature flags implementation for OCF Front.
 * Allows enabling/disabling features for gradual rollouts, A/B testing,
 * and emergency feature toggling.
 */

import { reactive } from 'vue'

export interface FeatureFlagConfig {
  enabled: boolean
  description?: string
  type?: 'development' | 'ops' | 'experiment'
  rolloutPercentage?: number
  allowedRoles?: string[]
  allowedUsers?: string[]
  environments?: string[]
}

export interface FeatureFlags {
  // Pilot features (starting with non-critical ones)
  theme_customization: FeatureFlagConfig
  archive_generations: FeatureFlagConfig
  ssh_key_management: FeatureFlagConfig

  // Course management features
  course_conception: FeatureFlagConfig

  // Terminal/Labs features
  terminal_management: FeatureFlagConfig

  // Documentation features
  help_documentation: FeatureFlagConfig

  // Future features (placeholder for expansion)
  [key: string]: FeatureFlagConfig
}

export class FeatureFlagService {
  private static instance: FeatureFlagService
  private flags: FeatureFlags

  private constructor() {
    // Default feature flag configuration - using reactive for Vue reactivity
    this.flags = reactive({
      // Pilot Features - Non-critical
      theme_customization: {
        enabled: true,
        description: 'Enable theme customization features',
        type: 'ops'
      },
      archive_generations: {
        enabled: true,
        description: 'Enable archive/generations management',
        type: 'ops'
      },
      ssh_key_management: {
        enabled: true,
        description: 'Enable SSH key management for terminal access',
        type: 'ops'
      },
      // Course Management Features
      course_conception: {
        enabled: true,
        description: 'Enable course conception and design features',
        type: 'ops',
        allowedRoles: ['administrator', 'teacher']
      },
      // Terminal/Labs Features
      terminal_management: {
        enabled: true,
        description: 'Enable terminal and practical work features',
        type: 'ops',
        allowedRoles: ['administrator', 'teacher', 'student']
      },
      // Documentation Features
      help_documentation: {
        enabled: true,
        description: 'Enable help center and documentation features',
        type: 'ops'
      }
    })

    // Load flags from environment variables (if any)
    this.loadEnvironmentFlags()
  }

  static getInstance(): FeatureFlagService {
    if (!this.instance) {
      this.instance = new FeatureFlagService()
    }
    return this.instance
  }

  /**
   * Load feature flags from environment variables
   * Format: VITE_FEATURE_FLAG_<FLAG_NAME>=true/false
   */
  private loadEnvironmentFlags(): void {
    Object.keys(this.flags).forEach(flagName => {
      const envVar = `VITE_FEATURE_FLAG_${flagName.toUpperCase()}`
      const envValue = import.meta.env[envVar]

      if (envValue !== undefined) {
        this.flags[flagName].enabled = envValue === 'true'
        console.log(`🏴 Feature flag "${flagName}" set from environment: ${this.flags[flagName].enabled}`)
      }
    })
  }

  /**
   * Check if a feature flag is enabled
   * GitLab-style checking with actor support
   */
  isEnabled(
    flagName: string,
    actor?: { userId?: string, role?: string, projectId?: string }
  ): boolean {
    const flag = this.flags[flagName]

    // Flag doesn't exist - default to false for safety
    if (!flag) {
      console.warn(`🏴 Feature flag "${flagName}" not found, defaulting to false`)
      return false
    }

    // Check base enabled state
    if (!flag.enabled) {
      return false
    }

    // Check role-based restrictions
    if (flag.allowedRoles && actor?.role) {
      return flag.allowedRoles.includes(actor.role)
    }

    // Check user-based restrictions
    if (flag.allowedUsers && actor?.userId) {
      return flag.allowedUsers.includes(actor.userId)
    }

    // Check rollout percentage (simple implementation)
    if (flag.rolloutPercentage !== undefined && actor?.userId) {
      const userHash = this.simpleHash(actor.userId)
      return (userHash % 100) < flag.rolloutPercentage
    }

    return flag.enabled
  }

  /**
   * Get all feature flags (for admin/debug purposes)
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags }
  }

  /**
   * Update a feature flag (for admin interface)
   */
  updateFlag(flagName: string, config: Partial<FeatureFlagConfig>): void {
    if (this.flags[flagName]) {
      this.flags[flagName] = { ...this.flags[flagName], ...config }
      this.logFlagChange(flagName, config)
    }
  }

  /**
   * Add a new feature flag
   */
  addFlag(flagName: string, config: FeatureFlagConfig): void {
    this.flags[flagName] = config
    this.logFlagChange(flagName, config)
  }

  /**
   * Simple hash function for rollout percentage
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Log feature flag changes
   */
  private logFlagChange(flagName: string, config: Partial<FeatureFlagConfig>): void {
    console.log(`🏴 Feature flag "${flagName}" updated:`, config)
  }
}

// Export singleton instance
export const featureFlagService = FeatureFlagService.getInstance()

// Export convenience functions (GitLab style)
export const isFeatureEnabled = (
  flagName: string,
  actor?: { userId?: string, role?: string, projectId?: string }
): boolean => {
  return featureFlagService.isEnabled(flagName, actor)
}

// Vue 3 Composable for feature flags
export function useFeatureFlags() {
  return {
    isEnabled: isFeatureEnabled,
    getAllFlags: () => featureFlagService.getAllFlags(),
    updateFlag: (flagName: string, config: Partial<FeatureFlagConfig>) =>
      featureFlagService.updateFlag(flagName, config)
  }
}