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
import axios from 'axios'

export interface FeatureFlagConfig {
  id?: string               // Backend feature ID
  enabled: boolean
  description?: string
  type?: 'development' | 'ops' | 'experiment'
  rolloutPercentage?: number
  allowedRoles?: string[]
  allowedUsers?: string[]
  environments?: string[]
  // Metadata for filtering related entities
  controlledMetrics?: string[]  // Usage metric types controlled by this flag
  controlledFeatures?: string[] // Generic features controlled by this flag
  // Backend metadata
  module?: string           // Feature module/category
  name?: string             // Backend feature name
  createdAt?: string
  updatedAt?: string
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

  // Group management features
  class_groups: FeatureFlagConfig

  // Documentation features
  help_documentation: FeatureFlagConfig

  // Future features (placeholder for expansion)
  [key: string]: FeatureFlagConfig
}

export class FeatureFlagService {
  private static instance: FeatureFlagService
  private flags: FeatureFlags
  private readonly STORAGE_KEY = 'ocf_feature_flags'
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private lastFetch: number = 0
  private isFetching: boolean = false
  private initPromise: Promise<void> | null = null
  private isInitialized: boolean = false

  private constructor() {
    // Default feature flag configuration - using reactive for Vue reactivity
    // IMPORTANT: Start with enabled: false for major features to prevent flashing
    // They will be enabled once backend response arrives or env vars are loaded
    this.flags = reactive({
      // Pilot Features - Non-critical (can start enabled)
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
      // Course Management Features (start disabled to prevent flashing)
      course_conception: {
        enabled: false,
        description: 'Enable course conception and design features',
        type: 'ops',
        allowedRoles: ['administrator', 'member'],
        controlledMetrics: ['courses'], // Hide course-related usage metrics when disabled
        controlledFeatures: ['course_creation', 'course_editing']
      },
      // Terminal/Labs Features (start disabled to prevent flashing)
      terminal_management: {
        enabled: false,
        description: 'Enable terminal and practical work features',
        type: 'ops',
        allowedRoles: ['administrator', 'member'],
        controlledMetrics: ['concurrent_terminals'], // Hide terminal-related metrics when disabled
        controlledFeatures: ['terminal_access']
      },
      // Group Management Features (start disabled to prevent flashing)
      class_groups: {
        enabled: false,
        description: 'Enable class/group management features',
        type: 'ops',
        allowedRoles: ['administrator', 'member'],
        controlledFeatures: ['group_creation', 'group_management']
      },
      // Documentation Features (can start enabled)
      help_documentation: {
        enabled: true,
        description: 'Enable help center and documentation features',
        type: 'ops'
      }
    })

    // DO NOT initialize here! Must wait for axios baseURL to be configured
    // Initialization will be triggered manually by calling waitForInitialization()
    this.initPromise = null
  }

  private async initialize(): Promise<void> {
    try {
      await this.fetchFromBackend(true)
      console.log('✅ Feature flags initialized from backend')
    } catch (err: any) {
      // If error is 401/403 (unauthenticated), that's expected - just use defaults
      // Don't load localStorage in this case as it may have stale data
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('🏴 User not authenticated yet, using default feature flags')
      } else {
        console.warn('⚠️ Failed to fetch feature flags from backend, using defaults:', err)
      }
      // Do NOT load localStorage here - backend is source of truth
      // localStorage will only be loaded if backend fetch fails during updateFlag()
    } finally {
      this.isInitialized = true
    }
  }

  /**
   * Wait for feature flags to be initialized from backend
   * If not yet started, start initialization now
   */
  async waitForInitialization(): Promise<void> {
    if (this.isInitialized) {
      return
    }
    // Start initialization if not already started
    if (!this.initPromise) {
      this.initPromise = this.initialize()
    }
    await this.initPromise
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
   * Load feature flags from localStorage (EMERGENCY FALLBACK ONLY)
   * Only called when backend fetch fails
   * LocalStorage values are only written when admin manually toggles flags
   * Note: Currently unused as we prefer default values over potentially stale localStorage
   */
  // @ts-expect-error - Method reserved for emergency localStorage fallback
  private loadLocalStorageFlags(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const storedFlags = JSON.parse(stored)
        Object.keys(storedFlags).forEach(flagName => {
          if (this.flags[flagName] && storedFlags[flagName].enabled !== undefined) {
            this.flags[flagName].enabled = storedFlags[flagName].enabled
            console.log(`🏴 Feature flag "${flagName}" loaded from localStorage (fallback): ${this.flags[flagName].enabled}`)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load feature flags from localStorage:', error)
    }
  }

  /**
   * Save current feature flags to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const flagsToStore: Record<string, { enabled: boolean }> = {}
      Object.keys(this.flags).forEach(flagName => {
        flagsToStore[flagName] = { enabled: this.flags[flagName].enabled }
      })
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(flagsToStore))
      console.log('🏴 Feature flags saved to localStorage')
    } catch (error) {
      console.warn('Failed to save feature flags to localStorage:', error)
    }
  }

  /**
   * Clear localStorage and reload from backend
   */
  clearLocalStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('🏴 Feature flags cleared from localStorage')
      // Force reload from backend
      this.fetchFromBackend(true).catch(err => {
        console.warn('Failed to reload from backend:', err)
        // Fallback to environment defaults
        this.loadEnvironmentFlags()
      })
    } catch (error) {
      console.warn('Failed to clear feature flags from localStorage:', error)
    }
  }

  /**
   * Refresh feature flags from backend after login/authentication
   * This bypasses cache and ensures we have fresh data
   */
  async refreshAfterLogin(): Promise<void> {
    console.log('🏴 Refreshing feature flags after login...')
    this.lastFetch = 0 // Reset cache timestamp to force refresh
    await this.fetchFromBackend(true)
  }

  /**
   * Fetch feature flags from backend API
   * Uses caching with TTL to avoid excessive requests
   */
  async fetchFromBackend(force: boolean = false): Promise<void> {
    const now = Date.now()
    const cacheValid = (now - this.lastFetch) < this.CACHE_TTL

    // Skip if cache is valid and not forced
    if (!force && cacheValid) {
      console.log('🏴 Using cached feature flags')
      return
    }

    // Prevent concurrent fetches
    if (this.isFetching) {
      console.log('🏴 Feature flags fetch already in progress')
      return
    }

    this.isFetching = true

    try {
      const response = await axios.get('/features')

      // Handle paginated response (data is inside response.data.data)
      const backendFeatures = Array.isArray(response.data)
        ? response.data
        : response.data.data || []

      if (Array.isArray(backendFeatures)) {
        if (backendFeatures.length > 0) {
          console.log(`🏴 Backend returned ${backendFeatures.length} features`)

          // First pass: reset all flags that will be updated from backend
          const flagsToUpdate = new Set<string>()
          backendFeatures.forEach((feature: any) => {
            const backendKey = feature.key || feature.name
            const flagKey = this.mapBackendFeatureToFlagKey(backendKey)
            flagsToUpdate.add(flagKey)
          })

          // Reset flags that will be updated (especially important for OR logic)
          flagsToUpdate.forEach(flagKey => {
            if (this.flags[flagKey]) {
              this.flags[flagKey].enabled = false
            }
          })

          // Second pass: apply backend features using OR logic
          backendFeatures.forEach((feature: any) => {
            const backendKey = feature.key || feature.name
            const flagKey = this.mapBackendFeatureToFlagKey(backendKey)

            if (this.flags[flagKey]) {
              // Apply feature state using OR logic for multi-mapped features
              this.applyBackendFeatureToFlag(backendKey, feature.enabled)

              // Merge other backend metadata (only once per flag)
              if (!this.flags[flagKey].id) {
                this.flags[flagKey] = {
                  ...this.flags[flagKey],
                  id: feature.id,
                  description: feature.description || this.flags[flagKey].description,
                  module: feature.module,
                  name: feature.name,
                  createdAt: feature.created_at || feature.createdAt,
                  updatedAt: feature.updated_at || feature.updatedAt
                }
              }
            }
          })

          this.lastFetch = now
          console.log(`✅ Feature flags synced from backend (${backendFeatures.length} features)`)
        } else {
          // Backend returned empty array - no features configured in database
          console.warn(`⚠️ Backend returned empty feature flags array`)
          console.log(`🏴 Falling back to environment variables...`)
          this.loadEnvironmentFlags()

          // Log which flags are enabled from environment
          const envEnabledFlags = Object.entries(this.flags)
            .filter(([_, flag]) => flag.enabled)
            .map(([key, _]) => key)

          if (envEnabledFlags.length > 0) {
            console.log(`🏴 Enabled flags from environment: ${envEnabledFlags.join(', ')}`)
          } else {
            console.warn(`⚠️ No environment variables found. Using default flag states.`)
          }

          this.lastFetch = now
        }

        // Log final state summary (only in dev mode)
        if (import.meta.env.DEV) {
          const enabledFlags = Object.entries(this.flags)
            .filter(([_, flag]) => flag.enabled)
            .map(([key, _]) => key)
          console.log(`🏴 Feature flags: ${enabledFlags.join(', ') || 'none enabled'}`)
        }
      } else {
        console.error(`❌ Backend response is not an array!`)
      }
    } catch (error: any) {
      console.error(`❌ Failed to fetch feature flags from backend:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      })
      // Fallback to cached/local values - don't throw
    } finally {
      this.isFetching = false
    }
  }

  /**
   * Map backend feature key to frontend flag key
   * Backend already sends keys in snake_case format
   * Map special cases where backend and frontend keys differ
   */
  private mapBackendFeatureToFlagKey(backendKey: string): string {
    // Special mappings for backend -> frontend
    const keyMap: Record<string, string> = {
      'course_conception': 'course_conception', // Direct match
      'terminals': 'terminal_management', // Backend "terminals" -> Frontend "terminal_management"
      'class_groups': 'class_groups', // Direct match
      // Add more mappings as needed
    }

    return keyMap[backendKey] || backendKey
  }

  /**
   * Apply backend feature state to frontend flag
   * If multiple backend features map to the same frontend flag, use OR logic (any enabled = flag enabled)
   */
  private applyBackendFeatureToFlag(backendKey: string, backendEnabled: boolean): void {
    const flagKey = this.mapBackendFeatureToFlagKey(backendKey)

    if (this.flags[flagKey]) {
      // For terminal_management, enable if ANY backend feature (labs OR terminals) is enabled
      if (flagKey === 'terminal_management') {
        // Use OR logic: keep existing enabled state or set to new enabled state
        this.flags[flagKey].enabled = this.flags[flagKey].enabled || backendEnabled
      } else {
        // For other flags, just set directly
        this.flags[flagKey].enabled = backendEnabled
      }
    }
  }

  /**
   * Sync feature flag changes to backend
   */
  async syncToBackend(flagKey: string): Promise<void> {
    const flag = this.flags[flagKey]
    if (!flag || !flag.id) {
      console.warn(`⚠️ Cannot sync flag "${flagKey}" - no backend ID`, flag)
      return
    }

    const payload = { enabled: flag.enabled }
    console.log(`🏴 Syncing "${flagKey}" to backend:`, {
      url: `/features/${flag.id}`,
      method: 'PATCH',
      payload,
      flagName: flag.name
    })

    try {
      const response = await axios.patch(`/features/${flag.id}`, payload)
      console.log(`✅ Feature flag "${flagKey}" synced to backend successfully`, response.data)
    } catch (error: any) {
      console.error(`❌ Failed to sync feature flag "${flagKey}":`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      throw error
    }
  }

  /**
   * Sync usage limits after toggling course/terminal features
   */
  async syncUsageLimits(): Promise<void> {
    try {
      const response = await axios.post('/user-subscriptions/sync-usage-limits')
      console.log('🏴 Usage limits synced:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Failed to sync usage limits:', error)
      throw error
    }
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

    // Debug logging for troubleshooting
    if (!flag.enabled) {
      console.debug(`🏴 Feature flag "${flagName}" is DISABLED (enabled=${flag.enabled}, initialized=${this.isInitialized}, lastFetch=${this.lastFetch})`)
      return false
    }

    console.debug(`🏴 Feature flag "${flagName}" is ENABLED (enabled=${flag.enabled}, actor role=${actor?.role})`)

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
    // if (flag.rolloutPercentage !== undefined && actor?.userId) {
    //   const userHash = this.simpleHash(actor.userId)
    //   return (userHash % 100) < flag.rolloutPercentage
    // }

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
   * Syncs to backend if backend ID exists
   */
  async updateFlag(flagName: string, config: Partial<FeatureFlagConfig>): Promise<void> {
    if (this.flags[flagName]) {
      const oldEnabled = this.flags[flagName].enabled
      const hasBackendId = !!this.flags[flagName].id

      console.log(`🏴 updateFlag("${flagName}")`, {
        oldEnabled,
        newEnabled: config.enabled,
        hasBackendId,
        backendId: this.flags[flagName].id,
        backendName: this.flags[flagName].name
      })

      this.flags[flagName] = { ...this.flags[flagName], ...config }
      this.logFlagChange(flagName, config)

      // Persist to localStorage (local override)
      this.saveToLocalStorage()

      // Sync to backend if we have a backend ID
      if (this.flags[flagName].id && config.enabled !== undefined) {
        console.log(`🏴 Flag has backend ID, syncing to backend...`)
        try {
          await this.syncToBackend(flagName)

          // Auto-sync usage limits if toggling course/terminal features
          if (oldEnabled !== config.enabled &&
              (this.flags[flagName].controlledMetrics?.length || 0) > 0) {
            console.log(`🏴 Feature "${flagName}" affects metrics, syncing usage limits...`)
            await this.syncUsageLimits()
          }
        } catch (error) {
          console.error(`❌ Failed to sync "${flagName}" to backend:`, error)
          // Revert local change on backend failure
          this.flags[flagName].enabled = oldEnabled
          this.saveToLocalStorage()
          throw error
        }
      } else {
        console.warn(`⚠️ Flag "${flagName}" NOT synced to backend`, {
          reason: !this.flags[flagName].id ? 'No backend ID' : 'enabled not in config',
          hasId: !!this.flags[flagName].id,
          configKeys: Object.keys(config)
        })
      }
    } else {
      console.error(`❌ Flag "${flagName}" not found in flags`)
    }
  }

  /**
   * Add a new feature flag
   */
  addFlag(flagName: string, config: FeatureFlagConfig): void {
    this.flags[flagName] = config
    this.logFlagChange(flagName, config)
    // Persist to localStorage
    this.saveToLocalStorage()
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
   * Check if a specific metric type should be visible based on feature flags
   */
  isMetricVisible(
    metricType: string,
    actor?: { userId?: string, role?: string, projectId?: string }
  ): boolean {
    // Check all feature flags to see if any control this metric type
    for (const [flagName, flag] of Object.entries(this.flags)) {
      if (flag.controlledMetrics?.includes(metricType)) {
        // If a flag controls this metric, check if that flag is enabled
        if (!this.isEnabled(flagName, actor)) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Check if a specific feature should be visible based on feature flags
   */
  isFeatureVisible(
    featureName: string,
    actor?: { userId?: string, role?: string, projectId?: string }
  ): boolean {
    // Check all feature flags to see if any control this feature
    for (const [flagName, flag] of Object.entries(this.flags)) {
      if (flag.controlledFeatures?.includes(featureName)) {
        // If a flag controls this feature, check if that flag is enabled
        if (!this.isEnabled(flagName, actor)) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Get all visible metric types based on current feature flags
   */
  getVisibleMetricTypes(
    actor?: { userId?: string, role?: string, projectId?: string }
  ): Set<string> {
    const allMetricTypes = new Set<string>()
    const hiddenMetricTypes = new Set<string>()

    // Collect all controlled metrics
    Object.entries(this.flags).forEach(([flagName, flag]) => {
      if (flag.controlledMetrics) {
        flag.controlledMetrics.forEach(metric => {
          allMetricTypes.add(metric)
          if (!this.isEnabled(flagName, actor)) {
            hiddenMetricTypes.add(metric)
          }
        })
      }
    })

    // Return only visible ones
    return new Set([...allMetricTypes].filter(m => !hiddenMetricTypes.has(m)))
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

// Export convenience function (GitLab style)
export const isFeatureEnabled = (
  flagName: string,
  actor?: { userId?: string, role?: string, projectId?: string }
): boolean => {
  return featureFlagService.isEnabled(flagName, actor)
}