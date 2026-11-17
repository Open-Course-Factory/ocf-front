import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

// Mocks MUST be defined BEFORE imports
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
  handleStoreError: vi.fn((err: any, fallbackKey: string) => {
    if (err?.message) return err.message
    return fallbackKey
  })
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

import axios from 'axios'
import { useTerminalsStore } from '../../src/stores/terminals'

const mockedAxios = vi.mocked(axios)

describe('terminals store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('stopTerminalSession', () => {
    it('posts stop request and refreshes user sessions', async () => {
      mockedAxios.post.mockResolvedValue({})
      mockedAxios.get.mockResolvedValue({ data: [] })

      const store = useTerminalsStore()
      const result = await store.stopTerminalSession('terminal-1')

      expect(mockedAxios.post).toHaveBeenCalledWith('/terminals/terminal-1/stop')
      expect(result).toBe(true)
    })

    it('sets error on failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Stop failed'))

      const store = useTerminalsStore()
      await expect(store.stopTerminalSession('terminal-1')).rejects.toThrow('Stop failed')

      expect(store.error).toBe('Stop failed')
    })
  })

  describe('getUserSessions', () => {
    it('fetches user sessions and updates activeSessions', async () => {
      const mockSessions = [
        { id: '1', session_id: 'sid-1', status: 'running' },
        { id: '2', session_id: 'sid-2', status: 'stopped' }
      ]
      mockedAxios.get.mockResolvedValue({ data: mockSessions })

      const store = useTerminalsStore()
      const result = await store.getUserSessions()

      expect(mockedAxios.get).toHaveBeenCalledWith('/terminals/user-sessions')
      expect(result).toEqual(mockSessions)
      expect(store.activeSessions).toEqual(mockSessions)
    })

    it('handles empty response', async () => {
      mockedAxios.get.mockResolvedValue({ data: null })

      const store = useTerminalsStore()
      const result = await store.getUserSessions()

      expect(result).toEqual([])
      expect(store.activeSessions).toEqual([])
    })

    it('clears sessions on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Load error'))

      const store = useTerminalsStore()
      // Pre-populate
      store.activeSessions = [{ id: '1' }] as any

      await expect(store.getUserSessions()).rejects.toThrow('Load error')

      expect(store.activeSessions).toEqual([])
    })
  })

  // What the terminal form and table are built from.
  describe('fieldList', () => {
    it('exposes the session fields', () => {
      const fields = useTerminalsStore().fieldList
      const expected = ['id', 'session_id', 'status', 'expires_at', 'terms', 'expiry', 'created_at']
      expect(expected.filter(name => !fields.has(name))).toEqual([])
    })

    it.each([
      ['terms', { type: 'textarea', toBeSet: true, required: true }],
      ['status', { toBeSet: false, toBeEdited: false }]
    ])('configures %s as the form expects', (name, config) => {
      expect(useTerminalsStore().fieldList.get(name)).toMatchObject(config)
    })
  })
})
