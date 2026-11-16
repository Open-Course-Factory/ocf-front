import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

// Mock the error handler used by asyncWrapper
vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((err: any, fallbackKey: string) => {
    // Simulate real behavior: return error message or fallback
    if (err?.message) return err.message
    return fallbackKey
  })
}))

import {
  withAsync,
  createAsyncWrapper
} from '../../src/utils/asyncWrapper'
import type { AsyncState } from '../../src/utils/asyncWrapper'

function createState(): AsyncState {
  return {
    isLoading: ref(false),
    error: ref('')
  }
}

describe('withAsync — error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets error and calls onError on failure, then re-throws', async () => {
    const state = createState()
    const onError = vi.fn()
    const testError = new Error('Operation failed')

    await expect(
      withAsync(
        state,
        async () => { throw testError },
        'test.fallback',
        { onError }
      )
    ).rejects.toThrow('Operation failed')

    expect(state.error.value).toBe('Operation failed')
    expect(onError).toHaveBeenCalledWith(testError)
    expect(state.isLoading.value).toBe(false)
  })

  it('calls onFinally after failure', async () => {
    const state = createState()
    const onFinally = vi.fn()

    await withAsync(
      state,
      async () => { throw new Error('fail') },
      'test.error',
      { onFinally }
    ).catch(() => {})

    expect(onFinally).toHaveBeenCalled()
  })
})

describe('createAsyncWrapper — error handling', () => {
  it('handles errors through the bound state', async () => {
    const state = createState()
    const boundAsync = createAsyncWrapper(state)

    await expect(
      boundAsync(
        async () => { throw new Error('Bound error') },
        'test.fallback'
      )
    ).rejects.toThrow('Bound error')

    expect(state.error.value).toBe('Bound error')
  })
})
