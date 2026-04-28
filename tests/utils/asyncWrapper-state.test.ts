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
  withAsyncSequence
} from '../../src/utils/asyncWrapper'
import type { AsyncState } from '../../src/utils/asyncWrapper'

function createState(): AsyncState {
  return {
    isLoading: ref(false),
    error: ref('')
  }
}

describe('withAsync — state transitions', () => {
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

describe('withAsyncSequence — state transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
