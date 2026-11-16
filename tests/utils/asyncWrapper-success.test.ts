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

describe('withAsync — success path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the result of the operation', async () => {
    const state = createState()

    const result = await withAsync(
      state,
      async () => ({ id: 1, name: 'test' }),
      'test.error'
    )

    expect(result).toEqual({ id: 1, name: 'test' })
  })

  it('calls onSuccess callback with the result', async () => {
    const state = createState()
    const onSuccess = vi.fn()

    await withAsync(
      state,
      async () => 'result-data',
      'test.error',
      { onSuccess }
    )

    expect(onSuccess).toHaveBeenCalledWith('result-data')
  })

  it('calls onFinally after success', async () => {
    const state = createState()
    const onFinally = vi.fn()

    await withAsync(
      state,
      async () => 'ok',
      'test.error',
      { onFinally }
    )

    expect(onFinally).toHaveBeenCalled()
  })
})

describe('createAsyncWrapper — success path', () => {
  it('returns a function that wraps operations with the given state', async () => {
    const state = createState()
    const boundAsync = createAsyncWrapper(state)

    const result = await boundAsync(
      async () => 42,
      'test.error'
    )

    expect(result).toBe(42)
    expect(state.isLoading.value).toBe(false)
  })
})
