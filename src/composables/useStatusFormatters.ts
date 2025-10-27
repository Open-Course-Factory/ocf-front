/**
 * Composable for formatting status values consistently
 * Provides reusable status formatters to avoid duplication across stores
 */

import { formatDate as formatDateUtil } from '../utils/formatters'

/**
 * Status class mappings for common status types
 */
export const STATUS_CLASS_MAPS = {
  // Invoice statuses
  invoice: {
    paid: 'text-success',
    unpaid: 'text-warning',
    draft: 'text-muted',
    void: 'text-danger',
  },
  // Subscription statuses
  subscription: {
    active: 'text-success',
    trialing: 'text-info',
    canceled: 'text-warning',
    past_due: 'text-danger',
    unpaid: 'text-danger',
    incomplete: 'text-muted',
  },
  // Terminal statuses
  terminal: {
    running: 'text-success',
    stopped: 'text-muted',
    error: 'text-danger',
    pending: 'text-warning',
  },
  // Generation statuses
  generation: {
    completed: 'text-success',
    pending: 'text-warning',
    processing: 'text-info',
    failed: 'text-danger',
    error: 'text-danger',
  },
  // Generic boolean/active statuses
  active: {
    active: 'text-success',
    inactive: 'text-muted',
    true: 'text-success',
    false: 'text-muted',
  },
} as const

/**
 * Status icon mappings for common status types
 */
export const STATUS_ICON_MAPS = {
  invoice: {
    paid: 'fas fa-check-circle',
    unpaid: 'fas fa-clock',
    draft: 'fas fa-file',
    void: 'fas fa-times-circle',
  },
  subscription: {
    active: 'fas fa-check-circle',
    trialing: 'fas fa-flask',
    canceled: 'fas fa-ban',
    past_due: 'fas fa-exclamation-triangle',
    unpaid: 'fas fa-exclamation-circle',
    incomplete: 'fas fa-hourglass-half',
  },
  terminal: {
    running: 'fas fa-play-circle',
    stopped: 'fas fa-stop-circle',
    error: 'fas fa-exclamation-circle',
    pending: 'fas fa-hourglass-half',
  },
  generation: {
    completed: 'fas fa-check-circle',
    pending: 'fas fa-clock',
    processing: 'fas fa-spinner fa-spin',
    failed: 'fas fa-times-circle',
    error: 'fas fa-exclamation-triangle',
  },
  active: {
    active: 'fas fa-check-circle',
    inactive: 'fas fa-times-circle',
    true: 'fas fa-check-circle',
    false: 'fas fa-times-circle',
  },
} as const

/**
 * Create status formatters for a specific status type
 * @param type - Type of status (invoice, subscription, terminal, generation, active)
 * @returns Status formatter functions
 *
 * @example
 * // In a store:
 * const { getStatusClass, getStatusIcon } = useStatusFormatters('invoice')
 *
 * const invoiceStatusClass = getStatusClass('paid') // 'text-success'
 * const invoiceStatusIcon = getStatusIcon('paid') // 'fas fa-check-circle'
 */
export function useStatusFormatters(
  type: keyof typeof STATUS_CLASS_MAPS = 'active'
) {
  /**
   * Get CSS class for a status value
   * @param status - Status value (case-insensitive)
   * @returns CSS class name
   */
  const getStatusClass = (status: string | boolean): string => {
    const normalizedStatus = String(status).toLowerCase()
    const classMap = STATUS_CLASS_MAPS[type] as Record<string, string>
    return classMap[normalizedStatus] || 'text-secondary'
  }

  /**
   * Get icon class for a status value
   * @param status - Status value (case-insensitive)
   * @returns Font Awesome icon class
   */
  const getStatusIcon = (status: string | boolean): string => {
    const normalizedStatus = String(status).toLowerCase()
    const iconMap = STATUS_ICON_MAPS[type] as Record<string, string>
    return iconMap[normalizedStatus] || 'fas fa-question-circle'
  }

  /**
   * Format a date string using the common date formatter
   * @param dateString - ISO date string
   * @param locale - Locale for formatting (default: 'fr-FR')
   * @param fallback - Fallback value if date is invalid (default: '-')
   * @returns Formatted date string
   */
  const formatDate = (
    dateString: string | null | undefined,
    locale: string = 'fr-FR',
    fallback: string = '-'
  ): string => {
    return formatDateUtil(dateString, locale, fallback)
  }

  return {
    getStatusClass,
    getStatusIcon,
    formatDate,
  }
}

/**
 * Create custom status formatters with your own mappings
 * Use this when the predefined types don't match your needs
 *
 * @example
 * const { getStatusClass, getStatusIcon } = useCustomStatusFormatters({
 *   classMap: {
 *     approved: 'text-success',
 *     rejected: 'text-danger',
 *     pending: 'text-warning',
 *   },
 *   iconMap: {
 *     approved: 'fas fa-thumbs-up',
 *     rejected: 'fas fa-thumbs-down',
 *     pending: 'fas fa-clock',
 *   }
 * })
 */
export function useCustomStatusFormatters(options: {
  classMap: Record<string, string>
  iconMap?: Record<string, string>
}) {
  const { classMap, iconMap } = options

  const getStatusClass = (status: string | boolean): string => {
    const normalizedStatus = String(status).toLowerCase()
    return classMap[normalizedStatus] || 'text-secondary'
  }

  const getStatusIcon = (status: string | boolean): string => {
    if (!iconMap) return 'fas fa-question-circle'
    const normalizedStatus = String(status).toLowerCase()
    return iconMap[normalizedStatus] || 'fas fa-question-circle'
  }

  const formatDate = (
    dateString: string | null | undefined,
    locale: string = 'fr-FR',
    fallback: string = '-'
  ): string => {
    return formatDateUtil(dateString, locale, fallback)
  }

  return {
    getStatusClass,
    getStatusIcon,
    formatDate,
  }
}
