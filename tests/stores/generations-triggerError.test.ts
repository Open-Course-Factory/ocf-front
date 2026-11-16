/**
 * RED — issue #415: a failed POST /courses/generate must surface the API's
 * error text. ocf-core error bodies are { error_code, error_message }, not
 * { message }.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((_err: any, fallbackKey: string) => fallbackKey)
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn()
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userName: 'alice', secretToken: 'token' })
}))

vi.mock('../../src/stores/login', () => ({
  useLoginStore: () => ({ email: 'alice@example.com' })
}))

import axios from 'axios'
import { useGenerationsStore } from '../../src/stores/generations'

describe('generations store — generation trigger error (#415)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('stores the API error_message when POST /courses/generate fails', async () => {
    const apiError = Object.assign(new Error('Request failed with status code 503'), {
      response: {
        status: 503,
        data: { error_code: 503, error_message: 'Worker unavailable, retry later' },
      },
    })
    vi.mocked(axios.post).mockImplementation(async (url: string) => {
      if (url === '/courses/generate') throw apiError
      return { status: 201, data: { id: 'g1', status: 'pending' } }
    })

    const store = useGenerationsStore()
    await store.createEntity('/generations', { format: '0' })

    const generation = store.entities.find((e: any) => e.id === 'g1')
    expect(generation?.status).toBe('failed')
    expect(generation?.error_message).toContain('Worker unavailable, retry later')
  })
})
