/**
 * Shared formatting utilities for the application
 * Centralizes common formatting logic to avoid duplication across stores and components
 */

/**
 * Common timezone options for user selection
 */
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Rome', label: 'Rome' },
  { value: 'Europe/Madrid', label: 'Madrid' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam' },
  { value: 'Europe/Brussels', label: 'Brussels' },
  { value: 'Europe/Zurich', label: 'Zurich' },
  { value: 'Europe/Stockholm', label: 'Stockholm' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'Mumbai, Kolkata, New Delhi' },
  { value: 'Asia/Shanghai', label: 'Beijing, Shanghai' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Australia/Melbourne', label: 'Melbourne' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
]

/**
 * Format a monetary amount from cents to a currency string
 * @param amount - Amount in cents (e.g., 1999 for $19.99)
 * @param currency - Currency code (default: 'EUR')
 * @param locale - Locale for formatting (default: 'fr-FR')
 * @returns Formatted currency string (e.g., "19,99 €")
 *
 * @example
 * formatCurrency(1999, 'EUR') // "19,99 €"
 * formatCurrency(1999, 'USD', 'en-US') // "$19.99"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

/**
 * Format a date string to a localized date string
 * @param dateString - ISO date string or timestamp
 * @param locale - Locale for formatting (default: 'fr-FR')
 * @param fallback - Fallback value if date is invalid (default: '-')
 * @param timezone - IANA timezone string (e.g., 'America/New_York', 'Europe/Paris')
 * @returns Formatted date string (e.g., "13/10/2025")
 *
 * @example
 * formatDate('2025-10-13T12:00:00Z') // "13/10/2025"
 * formatDate('2025-10-13T12:00:00Z', 'fr-FR', '-', 'America/New_York') // "13/10/2025" (in NY time)
 * formatDate('invalid', 'fr-FR', 'N/A') // "N/A"
 */
export function formatDate(
  dateString: string | null | undefined,
  locale: string = 'fr-FR',
  fallback: string = '-',
  timezone?: string
): string {
  if (!dateString) return fallback
  try {
    const options: Intl.DateTimeFormatOptions = timezone ? { timeZone: timezone } : {}
    return new Date(dateString).toLocaleDateString(locale, options)
  } catch (e) {
    return dateString
  }
}

/**
 * Format a date string to a localized date and time string
 * @param dateString - ISO date string or timestamp
 * @param locale - Locale for formatting (default: 'fr-FR')
 * @param fallback - Fallback value if date is invalid (default: '-')
 * @param timezone - IANA timezone string (e.g., 'America/New_York', 'Europe/Paris')
 * @returns Formatted date and time string (e.g., "13/10/2025 12:30:45")
 *
 * @example
 * formatDateTime('2025-10-13T12:30:45Z') // "13/10/2025 12:30:45"
 * formatDateTime('2025-10-13T12:30:45Z', 'fr-FR', '-', 'America/New_York') // "13/10/2025 08:30:45" (in NY time)
 */
export function formatDateTime(
  dateString: string | null | undefined,
  locale: string = 'fr-FR',
  fallback: string = '-',
  timezone?: string
): string {
  if (!dateString) return fallback
  try {
    const options: Intl.DateTimeFormatOptions = timezone ? { timeZone: timezone } : {}
    return new Date(dateString).toLocaleString(locale, options)
  } catch (e) {
    return dateString
  }
}

/**
 * Format a storage size in bytes to a human-readable string
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string (e.g., "1.5 GB", "512 KB")
 *
 * @example
 * formatStorageSize(1536) // "1.50 KB"
 * formatStorageSize(1073741824) // "1.00 GB"
 * formatStorageSize(512) // "512 B"
 */
export function formatStorageSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'

  const units = [
    { threshold: 1099511627776, label: 'TB' }, // 1024^4
    { threshold: 1073741824, label: 'GB' },     // 1024^3
    { threshold: 1048576, label: 'MB' },        // 1024^2
    { threshold: 1024, label: 'KB' },           // 1024^1
  ]

  for (const unit of units) {
    if (bytes >= unit.threshold) {
      return `${(bytes / unit.threshold).toFixed(decimals)} ${unit.label}`
    }
  }

  return `${bytes} B`
}

/**
 * Format a number with locale-specific thousand separators
 * @param value - Number to format
 * @param locale - Locale for formatting (default: 'fr-FR')
 * @returns Formatted number string (e.g., "1 234 567")
 *
 * @example
 * formatNumber(1234567) // "1 234 567" (fr-FR)
 * formatNumber(1234567, 'en-US') // "1,234,567"
 */
export function formatNumber(value: number, locale: string = 'fr-FR'): string {
  return value.toLocaleString(locale)
}

/**
 * Format a percentage value
 * @param value - Decimal value (0.5 for 50%)
 * @param decimals - Number of decimal places (default: 0)
 * @param locale - Locale for formatting (default: 'fr-FR')
 * @returns Formatted percentage string (e.g., "50 %", "33.33 %")
 *
 * @example
 * formatPercentage(0.5) // "50 %"
 * formatPercentage(0.3333, 2) // "33.33 %"
 */
export function formatPercentage(
  value: number,
  decimals: number = 0,
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m", "45s")
 *
 * @example
 * formatDuration(9000) // "2h 30m"
 * formatDuration(90) // "1m 30s"
 * formatDuration(45) // "45s"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param text - String to truncate
 * @param maxLength - Maximum length (default: 50)
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated string
 *
 * @example
 * truncate('A very long text that needs truncation', 20) // "A very long text ..."
 */
export function truncate(
  text: string,
  maxLength: number = 50,
  ellipsis: string = '...'
): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Extract error message from axios error response
 * Provides consistent error message extraction across the application
 * @param error - Error object (typically from axios)
 * @param fallback - Fallback message if no error message found (default: 'An error occurred')
 * @returns Extracted error message
 *
 * @example
 * try {
 *   await axios.get('/api/endpoint')
 * } catch (err) {
 *   const message = extractErrorMessage(err, t('myStore.loadError'))
 *   error.value = message
 * }
 */
export function extractErrorMessage(
  error: any,
  fallback: string = 'An error occurred'
): string {
  return (
    error?.response?.data?.error_message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  )
}
