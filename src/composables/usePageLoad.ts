/**
 * Composable for standardized page loading with error handling
 * Reduces boilerplate in page components that need to load data on mount
 */

import { ref } from 'vue'
import { extractErrorMessage } from '../utils/formatters'

/**
 * Create a page load manager with consistent error handling
 * @returns Page load management object
 *
 * @example
 * const { error, isLoading, withErrorHandling } = usePageLoad()
 *
 * const loadInvoices = async () => {
 *   await withErrorHandling(
 *     async () => {
 *       await entityStore.syncAndLoadInvoices()
 *     },
 *     t('invoices.loadError')
 *   )
 * }
 *
 * onMounted(() => {
 *   loadInvoices()
 * })
 *
 * // In template:
 * // <ErrorAlert v-if="error" :message="error" @dismiss="error = ''" />
 * // <LoadingSpinner v-if="isLoading" />
 */
export function usePageLoad() {
  const error = ref('')
  const isLoading = ref(false)

  /**
   * Execute an async operation with automatic error handling
   * @param operation - Async function to execute
   * @param fallbackMessage - Fallback error message (can be translation key)
   * @returns Result of the operation, or undefined if error occurred
   */
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    fallbackMessage: string
  ): Promise<T | undefined> => {
    try {
      error.value = ''
      isLoading.value = true
      return await operation()
    } catch (err: any) {
      console.error(fallbackMessage, err)
      error.value = extractErrorMessage(err, fallbackMessage)
      return undefined
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear the current error message
   */
  const clearError = () => {
    error.value = ''
  }

  /**
   * Set an error message manually
   */
  const setError = (message: string) => {
    error.value = message
  }

  return {
    error,
    isLoading,
    withErrorHandling,
    clearError,
    setError,
  }
}

/**
 * Simplified page load for operations that don't return data
 * Perfect for void operations like sync, delete, update
 *
 * @example
 * const { error, executeWithErrorHandling } = useSimplePageLoad()
 *
 * const syncData = () => {
 *   executeWithErrorHandling(
 *     () => dataStore.sync(),
 *     t('common.syncError')
 *   )
 * }
 */
export function useSimplePageLoad() {
  const { error, isLoading, withErrorHandling, clearError, setError } = usePageLoad()

  /**
   * Execute an async operation without expecting a return value
   */
  const executeWithErrorHandling = async (
    operation: () => Promise<any>,
    fallbackMessage: string
  ): Promise<void> => {
    await withErrorHandling(operation, fallbackMessage)
  }

  return {
    error,
    isLoading,
    executeWithErrorHandling,
    clearError,
    setError,
  }
}
