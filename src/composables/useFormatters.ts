/**
 * Composable that provides timezone-aware formatting functions
 * Automatically applies user's timezone and locale preferences
 */

import { computed } from 'vue'
import { getActivePinia } from 'pinia'
import i18n from '../i18n'
import { USER_SETTINGS_STORE_ID } from '../stores/userSettingsId'
import {
  formatCurrency,
  formatDate as baseFormatDate,
  formatDateTime as baseFormatDateTime,
  formatStorageSize,
  formatNumber,
  formatPercentage,
  formatDuration,
  truncate,
  getBrowserTimezone,
  intlLocale,
} from '../utils/formatters'

/**
 * The user's saved time zone, else the browser's. Read at call time, so stores
 * and utils (outside component setup) follow a change made after they loaded.
 * No saved preference means "show me my own clock", not UTC.
 */
export function currentUserTimezone(): string {
  // The settings store's state, read by its id rather than through
  // useUserSettingsStore(): that module pulls in the router, which formatting
  // must not depend on. Layout loads it on every signed-in page; until then
  // (or with no pinia at all), the browser zone applies.
  const saved = getActivePinia()?.state.value[USER_SETTINGS_STORE_ID]?.settings?.timezone
  // shortcut: ocf-core stores 'UTC' as every user's default, so UTC reads as "not chosen" and a user who really wants UTC cannot have it; drop this once ocf-core stores '' by default.
  return saved && saved !== 'UTC' ? saved : getBrowserTimezone()
}

export function useFormatters() {
  // The app's i18n instance: what a bare useI18n() returns in a component, minus
  // the need for an installed plugin, and the same one stores and utils read.
  const { locale } = i18n.global

  const userTimezone = computed(currentUserTimezone)

  // Get user's locale from i18n
  const userLocale = computed(() => intlLocale(locale.value))

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
