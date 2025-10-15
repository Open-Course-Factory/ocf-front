/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

/**
 * Async Wrapper Utility
 *
 * Eliminates try-catch boilerplate in store operations.
 * Provides consistent loading state management and error handling.
 *
 * @example
 * // Basic usage
 * const result = await withAsync(
 *   { isLoading, error },
 *   async () => {
 *     const response = await axios.get('/endpoint')
 *     return response.data
 *   },
 *   'myDomain.loadError'
 * )
 *
 * @example
 * // With post-processing callback
 * const result = await withAsync(
 *   { isLoading, error },
 *   async () => {
 *     const response = await axios.post('/endpoint', data)
 *     return response.data
 *   },
 *   'myDomain.createError',
 *   (data) => entities.push(data) // Post-processing
 * )
 */

import { Ref } from 'vue'
import { handleStoreError } from '../services/core/error'

/**
 * State refs for async operations
 */
export interface AsyncState {
  isLoading: Ref<boolean>
  error: Ref<string>
}

/**
 * Options for async wrapper
 */
export interface AsyncWrapperOptions<T> {
  /** Called when operation succeeds, before returning result */
  onSuccess?: (result: T) => void | Promise<void>
  /** Called when operation fails, before throwing error */
  onError?: (error: any) => void | Promise<void>
  /** Called after operation completes (success or error) */
  onFinally?: () => void | Promise<void>
  /** Skip setting isLoading to false (useful for chaining operations) */
  keepLoading?: boolean
  /** Skip clearing error at start */
  preserveError?: boolean
}

/**
 * Wraps an async operation with automatic loading/error state management
 *
 * @param state - Reactive state refs (isLoading, error)
 * @param operation - Async function to execute
 * @param fallbackKey - Translation key for error fallback
 * @param options - Optional callbacks and behaviors
 * @returns Result of the async operation
 *
 * @example
 * const loadData = async () => {
 *   return await withAsync(
 *     { isLoading: base.isLoading, error: base.error },
 *     async () => {
 *       const response = await axios.get('/data')
 *       return response.data
 *     },
 *     'myDomain.loadError',
 *     {
 *       onSuccess: (data) => {
 *         base.entities.splice(0, base.entities.length, ...data)
 *       }
 *     }
 *   )
 * }
 */
export async function withAsync<T>(
  state: AsyncState,
  operation: () => Promise<T>,
  fallbackKey: string,
  options: AsyncWrapperOptions<T> = {}
): Promise<T> {
  const {
    onSuccess,
    onError,
    onFinally,
    keepLoading = false,
    preserveError = false
  } = options

  // Set loading state
  state.isLoading.value = true
  if (!preserveError) {
    state.error.value = ''
  }

  try {
    // Execute operation
    const result = await operation()

    // Success callback
    if (onSuccess) {
      await onSuccess(result)
    }

    return result
  } catch (err: any) {
    // Handle error
    state.error.value = handleStoreError(err, fallbackKey)

    // Error callback
    if (onError) {
      await onError(err)
    }

    // Re-throw to allow caller to handle if needed
    throw err
  } finally {
    // Reset loading state
    if (!keepLoading) {
      state.isLoading.value = false
    }

    // Finally callback
    if (onFinally) {
      await onFinally()
    }
  }
}

/**
 * Creates a wrapped version of an async function with preset state refs
 * Useful for creating multiple operations with same error/loading state
 *
 * @param state - Reactive state refs to use for all operations
 * @returns Function that wraps async operations with this state
 *
 * @example
 * const baseAsync = createAsyncWrapper({ isLoading: base.isLoading, error: base.error })
 *
 * const loadData = async () => {
 *   return await baseAsync(
 *     async () => {
 *       const response = await axios.get('/data')
 *       return response.data
 *     },
 *     'myDomain.loadError'
 *   )
 * }
 *
 * const createData = async (data: any) => {
 *   return await baseAsync(
 *     async () => {
 *       const response = await axios.post('/data', data)
 *       return response.data
 *     },
 *     'myDomain.createError'
 *   )
 * }
 */
export function createAsyncWrapper(state: AsyncState) {
  return <T>(
    operation: () => Promise<T>,
    fallbackKey: string,
    options: AsyncWrapperOptions<T> = {}
  ): Promise<T> => {
    return withAsync(state, operation, fallbackKey, options)
  }
}

/**
 * Wraps multiple async operations to execute sequentially
 * Uses single loading state, combines errors
 *
 * @param state - Reactive state refs
 * @param operations - Array of [operation, fallbackKey] tuples
 * @returns Array of results
 *
 * @example
 * const [users, posts] = await withAsyncSequence(
 *   { isLoading, error },
 *   [
 *     [async () => axios.get('/users'), 'users.loadError'],
 *     [async () => axios.get('/posts'), 'posts.loadError']
 *   ]
 * )
 */
export async function withAsyncSequence<T extends any[]>(
  state: AsyncState,
  operations: Array<[() => Promise<any>, string]>
): Promise<T> {
  state.isLoading.value = true
  state.error.value = ''

  const results: any[] = []

  try {
    for (const [operation, fallbackKey] of operations) {
      try {
        const result = await operation()
        results.push(result)
      } catch (err: any) {
        state.error.value = handleStoreError(err, fallbackKey)
        throw err
      }
    }

    return results as T
  } finally {
    state.isLoading.value = false
  }
}

/**
 * Wraps multiple async operations to execute in parallel
 * Uses single loading state, returns all results or throws on any error
 *
 * @param state - Reactive state refs
 * @param operations - Array of [operation, fallbackKey] tuples
 * @returns Array of results
 *
 * @example
 * const [users, posts, comments] = await withAsyncParallel(
 *   { isLoading, error },
 *   [
 *     [async () => axios.get('/users'), 'users.loadError'],
 *     [async () => axios.get('/posts'), 'posts.loadError'],
 *     [async () => axios.get('/comments'), 'comments.loadError']
 *   ]
 * )
 */
export async function withAsyncParallel<T extends any[]>(
  state: AsyncState,
  operations: Array<[() => Promise<any>, string]>
): Promise<T> {
  state.isLoading.value = true
  state.error.value = ''

  try {
    const results = await Promise.all(
      operations.map(([operation]) => operation())
    )
    return results as T
  } catch (err: any) {
    // Use first operation's fallback key for error
    const fallbackKey = operations[0]?.[1] || 'errors.generic'
    state.error.value = handleStoreError(err, fallbackKey)
    throw err
  } finally {
    state.isLoading.value = false
  }
}
