import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock tokenService
vi.mock('../../src/services/auth/tokenService', () => ({
  tokenService: {
    getAccessToken: vi.fn(),
    hasValidToken: vi.fn()
  }
}))

// Mock currentUser store
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: vi.fn(() => ({
    autoLogout: vi.fn()
  }))
}))

// Mock router
vi.mock('../../src/router', () => ({
  default: {
    push: vi.fn(),
    currentRoute: { value: { name: 'Home', fullPath: '/home' } }
  }
}))

// Capture interceptor callbacks
let requestInterceptor: Function
let requestErrorInterceptor: Function
let responseInterceptor: Function
let responseErrorInterceptor: Function

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: '', headers: { common: {} }, timeout: 30000 },
    interceptors: {
      request: {
        use: vi.fn((onFulfilled: Function, onRejected: Function) => {
          requestInterceptor = onFulfilled
          requestErrorInterceptor = onRejected
        }),
        eject: vi.fn()
      },
      response: {
        use: vi.fn((onFulfilled: Function, onRejected: Function) => {
          responseInterceptor = onFulfilled
          responseErrorInterceptor = onRejected
        }),
        eject: vi.fn()
      }
    }
  }
}))

import axios from 'axios'
import { tokenService } from '../../src/services/auth/tokenService'
import { useCurrentUserStore } from '../../src/stores/currentUser'
import router from '../../src/router'
import { setupAxiosInterceptors, setupAxiosDefaults } from '../../src/services/core/http/axiosInterceptor'

const mockedTokenService = vi.mocked(tokenService)
const mockedRouter = vi.mocked(router)

describe('axiosInterceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset router currentRoute
    ;(mockedRouter.currentRoute as any).value = { name: 'Home', fullPath: '/home' }
    // Register interceptors
    setupAxiosInterceptors()
  })

  describe('request interceptor', () => {
    it('adds Bearer token for non-auth requests when token is valid', () => {
      mockedTokenService.getAccessToken.mockReturnValue('my-token')
      mockedTokenService.hasValidToken.mockReturnValue(true)

      const config = {
        url: '/users',
        method: 'get',
        headers: {} as any
      }

      const result = requestInterceptor(config)
      expect(result.headers.Authorization).toBe('Bearer my-token')
    })

    it('does not duplicate Bearer prefix when token already has it', () => {
      mockedTokenService.getAccessToken.mockReturnValue('Bearer existing-token')
      mockedTokenService.hasValidToken.mockReturnValue(true)

      const config = {
        url: '/users',
        method: 'get',
        headers: {} as any
      }

      const result = requestInterceptor(config)
      expect(result.headers.Authorization).toBe('Bearer existing-token')
    })

    it('does not add token for /auth/login requests', () => {
      mockedTokenService.getAccessToken.mockReturnValue('my-token')
      mockedTokenService.hasValidToken.mockReturnValue(true)

      const config = {
        url: '/auth/login',
        method: 'post',
        headers: {} as any
      }

      const result = requestInterceptor(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('does not add token when token is not valid', () => {
      mockedTokenService.getAccessToken.mockReturnValue('my-token')
      mockedTokenService.hasValidToken.mockReturnValue(false)

      const config = {
        url: '/users',
        method: 'get',
        headers: {} as any
      }

      const result = requestInterceptor(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('does not add token when no token exists', () => {
      mockedTokenService.getAccessToken.mockReturnValue(null)
      mockedTokenService.hasValidToken.mockReturnValue(false)

      const config = {
        url: '/users',
        method: 'get',
        headers: {} as any
      }

      const result = requestInterceptor(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('rejects on request error', async () => {
      const error = new Error('Request setup failed')
      await expect(requestErrorInterceptor(error)).rejects.toThrow('Request setup failed')
    })
  })

  describe('response interceptor', () => {
    it('passes successful responses through', () => {
      const response = {
        data: { id: 1 },
        config: { method: 'post', url: '/test' }
      }

      const result = responseInterceptor(response)
      expect(result).toBe(response)
    })

    it('triggers autoLogout on 401 errors', async () => {
      const error = {
        response: { status: 401, data: {} },
        config: { method: 'post', url: '/test' }
      }

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)

      // Verify useCurrentUserStore was called and autoLogout invoked
      const storeInstance = (useCurrentUserStore as any)()
      expect(storeInstance.autoLogout).toBeDefined()
    })

    it('redirects to VerifyEmail on 403 EMAIL_NOT_VERIFIED', async () => {
      const error = {
        response: { status: 403, data: { error: 'EMAIL_NOT_VERIFIED' } },
        config: { method: 'post', url: '/test' }
      }

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(mockedRouter.push).toHaveBeenCalledWith({
        name: 'VerifyEmail',
        query: { redirect: '/home' }
      })
    })

    it('does not redirect to VerifyEmail if already on VerifyEmail page', async () => {
      ;(mockedRouter.currentRoute as any).value = { name: 'VerifyEmail', fullPath: '/verify' }

      const error = {
        response: { status: 403, data: { error: 'EMAIL_NOT_VERIFIED' } },
        config: { method: 'post', url: '/test' }
      }

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(mockedRouter.push).not.toHaveBeenCalled()
    })

    it('does not redirect on regular 403 errors', async () => {
      const error = {
        response: { status: 403, data: { error: 'FORBIDDEN' } },
        config: { method: 'post', url: '/test' }
      }

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(mockedRouter.push).not.toHaveBeenCalled()
    })

    it('logs warning on 503 errors', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const error = {
        response: { status: 503, data: { error_message: 'Service down' } },
        config: { method: 'get', url: '/test' }
      }

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(warnSpy).toHaveBeenCalledWith('503 Service Unavailable:', 'Service down')
    })
  })

  describe('setupAxiosDefaults', () => {
    it('sets base URL from environment variables', () => {
      import.meta.env.VITE_API_URL = 'api.example.com'
      import.meta.env.VITE_PROTOCOL = 'https'

      setupAxiosDefaults()

      expect(axios.defaults.baseURL).toBe('https://api.example.com/api/v1')
      expect(axios.defaults.timeout).toBe(30000)
    })
  })
})
