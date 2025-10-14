/**
 * Composable that provides timezone-aware formatting functions
 * Automatically applies user's timezone and locale preferences
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSettingsStore } from '../stores/userSettings'
import {
  formatCurrency,
  formatDate as baseFormatDate,
  formatDateTime as baseFormatDateTime,
  formatStorageSize,
  formatNumber,
  formatPercentage,
  formatDuration,
  truncate,
} from '../utils/formatters'

export function useFormatters() {
  const { locale } = useI18n()
  const settingsStore = useUserSettingsStore()

  // Get user's timezone preference, default to UTC
  const userTimezone = computed(() => settingsStore.settings.timezone || 'UTC')

  // Get user's locale from i18n
  const userLocale = computed(() => locale.value || 'fr-FR')

  /**
   * Format date with user's timezone and locale
   */
  const formatDate = (
    dateString: string | null | undefined,
    fallback: string = '-'
  ): string => {
    return baseFormatDate(dateString, userLocale.value, fallback, userTimezone.value)
  }

  /**
   * Format date and time with user's timezone and locale
   */
  const formatDateTime = (
    dateString: string | null | undefined,
    fallback: string = '-'
  ): string => {
    return baseFormatDateTime(dateString, userLocale.value, fallback, userTimezone.value)
  }

  /**
   * Format currency with user's locale
   */
  const formatPrice = (amount: number, currency: string = 'EUR'): string => {
    return formatCurrency(amount, currency, userLocale.value)
  }

  /**
   * Format number with user's locale
   */
  const formatNum = (value: number): string => {
    return formatNumber(value, userLocale.value)
  }

  /**
   * Format percentage with user's locale
   */
  const formatPercent = (value: number, decimals: number = 0): string => {
    return formatPercentage(value, decimals, userLocale.value)
  }

  return {
    formatDate,
    formatDateTime,
    formatPrice,
    formatNum,
    formatPercent,
    formatStorageSize,
    formatDuration,
    truncate,
  }
}
