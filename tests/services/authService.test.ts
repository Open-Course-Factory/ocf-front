import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock axios before importing authService
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

import axios from 'axios'
import { AuthService } from '../../src/services/auth/authService'

const mockedAxios = vi.mocked(axios)

describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    service = new AuthService()
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('sends POST to /auth/login with email and password', async () => {
      const mockResponse = { data: { token: 'jwt-token', user: { id: '1', email: 'test@example.com' } } }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await service.login('test@example.com', 'password123')

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'test@example.com', password: 'password123' }
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('propagates error on failed login', async () => {
      const error = new Error('Invalid credentials')
      mockedAxios.post.mockRejectedValue(error)

      await expect(service.login('bad@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('sends POST to /auth/register with email, password, and name', async () => {
      const mockResponse = { data: { success: true, message: 'Registered' } }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await service.register('user@example.com', 'pass123', 'John')

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/auth/register',
        { email: 'user@example.com', password: 'pass123', name: 'John' }
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('sends register without name when not provided', async () => {
      const mockResponse = { data: { success: true, message: 'Registered' } }
      mockedAxios.post.mockResolvedValue(mockResponse)

      await service.register('user@example.com', 'pass123')

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/auth/register',
        { email: 'user@example.com', password: 'pass123', name: undefined }
      )
    })
  })

  describe('logout', () => {
    it('sends POST to /auth/logout', async () => {
      mockedAxios.post.mockResolvedValue({})

      await service.logout()

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout')
    })

    it('propagates error on failed logout', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'))

      await expect(service.logout()).rejects.toThrow('Network error')
    })
  })

  describe('verifyEmail', () => {
    it('sends POST to /auth/verify-email with token', async () => {
      const mockResponse = { data: { success: true, message: 'Verified', verified: true } }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await service.verifyEmail('verification-token-123')

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/auth/verify-email',
        { token: 'verification-token-123' }
      )
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('resendVerification', () => {
    it('sends POST to /auth/resend-verification with email', async () => {
      const mockResponse = { data: { success: true, message: 'Sent' } }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await service.resendVerification('user@example.com')

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/auth/resend-verification',
        { email: 'user@example.com' }
      )
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getVerificationStatus', () => {
    it('sends GET to /auth/verify-status', async () => {
      const mockResponse = { data: { verified: true, email: 'user@example.com', verified_at: '2024-01-01' } }
      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await service.getVerificationStatus()

      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/verify-status')
      expect(result).toEqual(mockResponse.data)
    })
  })
})
