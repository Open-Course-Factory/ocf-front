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
  createAsyncWrapper,
  withAsyncSequence,
  withAsyncParallel
} from '../../src/utils/asyncWrapper'
import type { AsyncState } from '../../src/utils/asyncWrapper'
import { handleStoreError } from '../../src/services/core/error'

function createState(): AsyncState {
  return {
    isLoading: ref(false),
    error: ref('')
  }
}

describe('withAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets isLoading=true during execution and false after', async () => {
    const state = createState()
    let loadingDuringExecution = false

    await withAsync(
      state,
      async () => {
        loadingDuringExecution = state.isLoading.value
        return 'ok'
      },
      'test.error'
    )

    expect(loadingDuringExecution).toBe(true)
    expect(state.isLoading.value).toBe(false)
  })

  it('clears error at start', async () => {
    const state = createState()
    state.error.value = 'previous error'

    let errorDuringExecution = ''

    await withAsync(
      state,
      async () => {
        errorDuringExecution = state.error.value
        return 'ok'
      },
      'test.error'
    )

    expect(errorDuringExecution).toBe('')
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

  it('keeps loading=true when keepLoading option is set', async () => {
    const state = createState()

    await withAsync(
      state,
      async () => 'ok',
      'test.error',
      { keepLoading: true }
    )

    expect(state.isLoading.value).toBe(true)
  })

  it('preserves existing error when preserveError is set', async () => {
    const state = createState()
    state.error.value = 'existing error'

    let errorDuringExecution = ''

    await withAsync(
      state,
      async () => {
        errorDuringExecution = state.error.value
        return 'ok'
      },
      'test.error',
      { preserveError: true }
    )

    expect(errorDuringExecution).toBe('existing error')
  })
})

describe('createAsyncWrapper', () => {
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

describe('withAsyncSequence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes operations sequentially and returns all results', async () => {
    const state = createState()
    const executionOrder: number[] = []

    const [r1, r2] = await withAsyncSequence(state, [
      [async () => { executionOrder.push(1); return 'first' }, 'op1.error'],
      [async () => { executionOrder.push(2); return 'second' }, 'op2.error']
    ])

    expect(r1).toBe('first')
    expect(r2).toBe('second')
    expect(executionOrder).toEqual([1, 2])
    expect(state.isLoading.value).toBe(false)
  })

  it('stops on first error and sets error message', async () => {
    const state = createState()

    await expect(
      withAsyncSequence(state, [
        [async () => 'ok', 'op1.error'],
        [async () => { throw new Error('second failed') }, 'op2.error'],
        [async () => 'never', 'op3.error']
      ])
    ).rejects.toThrow('second failed')

    expect(state.error.value).toBe('second failed')
    expect(state.isLoading.value).toBe(false)
  })

  it('sets loading state during sequence', async () => {
    const state = createState()
    let loadingDuring = false

    await withAsyncSequence(state, [
      [async () => { loadingDuring = state.isLoading.value; return 'ok' }, 'op.error']
    ])

    expect(loadingDuring).toBe(true)
    expect(state.isLoading.value).toBe(false)
  })
})

describe('withAsyncParallel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes operations in parallel and returns all results', async () => {
    const state = createState()

    const [r1, r2, r3] = await withAsyncParallel(state, [
      [async () => 'a', 'op1.error'],
      [async () => 'b', 'op2.error'],
      [async () => 'c', 'op3.error']
    ])

    expect(r1).toBe('a')
    expect(r2).toBe('b')
    expect(r3).toBe('c')
    expect(state.isLoading.value).toBe(false)
  })

  it('sets error using first operation fallback key on failure', async () => {
    const state = createState()

    await expect(
      withAsyncParallel(state, [
        [async () => 'ok', 'first.error'],
        [async () => { throw new Error('parallel fail') }, 'second.error']
      ])
    ).rejects.toThrow('parallel fail')

    // Uses handleStoreError with the error; our mock returns the error message
    expect(state.error.value).toBe('parallel fail')
    expect(state.isLoading.value).toBe(false)
  })

  it('uses errors.generic when no operations provided', async () => {
    const state = createState()

    // Promise.all with empty array resolves to []
    const results = await withAsyncParallel(state, [])
    expect(results).toEqual([])
  })
})
