/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import axios from 'axios'
import type { UserEffectiveFeatures } from '../../../types'

/**
 * User Features Service
 * Handles user effective features (aggregated from all organizations)
 */
export const userFeaturesService = {
  /**
   * Get user's effective features (aggregated from all organizations)
   * Users can belong to multiple organizations and will inherit the
   * MAXIMUM features across all organizations.
   */
  async getUserEffectiveFeatures(): Promise<UserEffectiveFeatures> {
    const response = await axios.get('/users/me/features')
    return response.data.data || response.data
  },

  /**
   * Check if user has specific feature
   */
  async hasFeature(featureName: string): Promise<boolean> {
    const features = await this.getUserEffectiveFeatures()
    return features.effective_features.features?.includes(featureName) ?? false
  },

  /**
   * Get max concurrent terminals allowed for user
   */
  async getMaxConcurrentTerminals(): Promise<number> {
    const features = await this.getUserEffectiveFeatures()
    return features.effective_features.max_concurrent_terminals
  },

  /**
   * Get max courses allowed for user
   */
  async getMaxCourses(): Promise<number> {
    const features = await this.getUserEffectiveFeatures()
    return features.effective_features.max_courses
  },

  /**
   * Get max session duration in minutes
   */
  async getMaxSessionDuration(): Promise<number> {
    const features = await this.getUserEffectiveFeatures()
    return features.effective_features.max_session_duration_minutes
  },

  /**
   * Check if user can export courses
   */
  async canExportCourses(): Promise<boolean> {
    const features = await this.getUserEffectiveFeatures()
    return features.effective_features.can_export_courses ?? false
  },

  /**
   * Check if user can use API
   */
  async canUseAPI(): Promise<boolean> {
    const features = await this.getUserEffectiveFeatures()
    return features.effective_features.can_use_api ?? false
  },
}
