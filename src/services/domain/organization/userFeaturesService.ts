/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
   * Get max courses allowed for user
   */
  async getMaxCourses(): Promise<number> {
    const features = await this.getUserEffectiveFeatures()
    // max_courses is deprecated/optional (!319 — column dropped server-side);
    // fall back to the -1 "unlimited" sentinel when absent.
    return features.effective_features.max_courses ?? -1
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
}
