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
 * Demo Configuration Service
 *
 * Provides configuration and utilities for demo/testing mode,
 * allowing safe testing of subscription flows without real payments.
 */

import { logger } from '../core/logging/logger'

export class DemoConfigService {
  private static instance: DemoConfigService

  private constructor() {}

  static getInstance(): DemoConfigService {
    if (!this.instance) {
      this.instance = new DemoConfigService()
    }
    return this.instance
  }

  /**
   * Check if demo mode is enabled
   */
  isDemoMode(): boolean {
    return import.meta.env.VITE_DEMO_MODE === 'true'
  }

  /**
   * Get demo mode indicator for UI
   */
  getDemoIndicator(): { show: boolean, text: string, class: string } {
    if (this.isDemoMode()) {
      return {
        show: true,
        text: 'DEMO MODE - No real charges',
        class: 'demo-mode-banner'
      }
    }
    return { show: false, text: '', class: '' }
  }

  /**
   * Demo delay simulation (to simulate network requests)
   */
  async simulateDelay(ms: number = 1000): Promise<void> {
    if (this.isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, ms))
    }
  }

  /**
   * Get demo-specific configuration
   */
  getDemoConfig() {
    return {
      enableMockPayments: this.isDemoMode(),
      mockStripePublishableKey: 'pk_test_demo_mode',
      simulateNetworkDelay: this.isDemoMode(),
      defaultDelayMs: 1500,
      showDebugInfo: this.isDemoMode()
    }
  }

  /**
   * Log demo actions (only in demo mode)
   */
  logDemoAction(action: string, data?: any): void {
    if (this.isDemoMode() && this.getDemoConfig().showDebugInfo) {
      logger.demo(action, data)
    }
  }
}

// Export singleton instance
export const demoConfig = DemoConfigService.getInstance()

// Export convenience functions
export const isDemoMode = () => demoConfig.isDemoMode()
export const simulateDelay = (ms?: number) => demoConfig.simulateDelay(ms)
export const logDemoAction = (action: string, data?: any) => demoConfig.logDemoAction(action, data)