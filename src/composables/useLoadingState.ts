/**
 * Composable for managing loading states
 * Reduces boilerplate for async operations that need loading indicators
 */

import { ref, readonly } from 'vue'

/**
 * Create a loading state manager for async operations
 * @param initialState - Initial loading state (default: false)
 * @returns Loading state management object
 *
 * @example
 * const { isLoading, withLoading } = useLoadingState()
 *
 * const fetchData = async () => {
 *   return await withLoading(async () => {
 *     const response = await axios.get('/data')
 *     return response.data
 *   })
 * }
 *
 * // Use in template: <button :disabled="isLoading">Load</button>
 */
export function useLoadingState(initialState: boolean = false) {
  const isLoading = ref(initialState)

  /**
   * Wrap an async operation with automatic loading state management
   * @param operation - Async function to execute
   * @returns Result of the operation
   */
  const withLoading = async <T>(operation: () => Promise<T>): Promise<T> => {
    isLoading.value = true
    try {
      return await operation()
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    withLoading,
  }
}

/**
 * Create multiple named loading states
 * Useful when a component needs to track multiple independent operations
 * @param stateNames - Array of state names
 * @returns Object with loading states and wrappers
 *
 * @example
 * const loading = useMultipleLoadingStates(['download', 'delete', 'update'])
 *
 * const downloadFile = async (id: string) => {
 *   await loading.withLoading('download', async () => {
 *     await fileService.download(id)
 *   })
 * }
 *
 * // In template: <button :disabled="loading.isLoading('download')">Download</button>
 */
export function useMultipleLoadingStates(stateNames: string[]) {
  const states: Record<string, ReturnType<typeof ref<boolean>>> = {}

  // Initialize all states
  stateNames.forEach((name) => {
    states[name] = ref(false)
  })

  /**
   * Check if a specific operation is loading
   */
  const isLoading = (stateName: string): boolean => {
    return states[stateName]?.value || false
  }

  /**
   * Check if any operation is loading
   */
  const isAnyLoading = (): boolean => {
    return Object.values(states).some((state) => state.value)
  }

  /**
   * Wrap an async operation with automatic loading state for a specific state name
   */
  const withLoading = async <T>(
    stateName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!states[stateName]) {
      throw new Error(`Loading state "${stateName}" not initialized`)
    }

    states[stateName].value = true
    try {
      return await operation()
    } finally {
      states[stateName].value = false
    }
  }

  return {
    isLoading,
    isAnyLoading,
    withLoading,
    states: readonly(states),
  }
}
