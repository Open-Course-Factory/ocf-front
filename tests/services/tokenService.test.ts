import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TokenService } from '../../src/services/auth/tokenService'

describe('TokenService', () => {
  let service: TokenService

  beforeEach(() => {
    service = new TokenService()
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  // Helper: create a JWT with a given exp claim (seconds since epoch)
  function makeJwt(exp: number): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({ exp, sub: 'user-1' }))
    return `${header}.${payload}.fake-signature`
  }

  describe('getAccessToken', () => {
    it('returns null when no token stored', () => {
      expect(service.getAccessToken()).toBeNull()
    })

    it('returns token from localStorage', () => {
      localStorage.setItem('ocf_access_token', 'local-token')
      expect(service.getAccessToken()).toBe('local-token')
    })

    it('returns token from sessionStorage when localStorage is empty', () => {
      sessionStorage.setItem('ocf_access_token', 'session-token')
      expect(service.getAccessToken()).toBe('session-token')
    })

    it('prefers localStorage over sessionStorage', () => {
      localStorage.setItem('ocf_access_token', 'local-token')
      sessionStorage.setItem('ocf_access_token', 'session-token')
      expect(service.getAccessToken()).toBe('local-token')
    })
  })

  describe('setAccessToken', () => {
    it('stores token in sessionStorage by default (rememberMe=false)', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600
      const token = makeJwt(exp)

      service.setAccessToken(token)

      expect(sessionStorage.getItem('ocf_access_token')).toBe(token)
      expect(localStorage.getItem('ocf_access_token')).toBeNull()
      expect(localStorage.getItem('ocf_remember_me')).toBeNull()
    })

    it('stores token in localStorage when rememberMe=true', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600
      const token = makeJwt(exp)

      service.setAccessToken(token, true)

      expect(localStorage.getItem('ocf_access_token')).toBe(token)
      expect(localStorage.getItem('ocf_remember_me')).toBe('true')
    })

    it('stores expiration time extracted from JWT', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600
      const token = makeJwt(exp)

      service.setAccessToken(token)

      const storedExpires = sessionStorage.getItem('ocf_expires_at')
      expect(storedExpires).toBe((exp * 1000).toString())
    })

    it('falls back to 1 hour when JWT cannot be parsed', () => {
      const before = Date.now()
      service.setAccessToken('not-a-valid-jwt')
      const after = Date.now()

      const storedExpires = parseInt(sessionStorage.getItem('ocf_expires_at')!)
      // Should be roughly now + 1 hour
      expect(storedExpires).toBeGreaterThanOrEqual(before + 3600000)
      expect(storedExpires).toBeLessThanOrEqual(after + 3600000)
    })

    it('removes remember_me flag when rememberMe=false', () => {
      // First set with rememberMe=true
      localStorage.setItem('ocf_remember_me', 'true')

      const exp = Math.floor(Date.now() / 1000) + 3600
      service.setAccessToken(makeJwt(exp), false)

      expect(localStorage.getItem('ocf_remember_me')).toBeNull()
    })
  })

  describe('clearTokens', () => {
    it('removes all token-related items from both storages', () => {
      localStorage.setItem('ocf_access_token', 'token')
      localStorage.setItem('ocf_expires_at', '123')
      localStorage.setItem('ocf_remember_me', 'true')
      sessionStorage.setItem('ocf_access_token', 'token')
      sessionStorage.setItem('ocf_expires_at', '123')

      service.clearTokens()

      expect(localStorage.getItem('ocf_access_token')).toBeNull()
      expect(localStorage.getItem('ocf_expires_at')).toBeNull()
      expect(localStorage.getItem('ocf_remember_me')).toBeNull()
      expect(sessionStorage.getItem('ocf_access_token')).toBeNull()
      expect(sessionStorage.getItem('ocf_expires_at')).toBeNull()
    })
  })

  describe('hasValidToken', () => {
    it('returns false when no token exists', () => {
      expect(service.hasValidToken()).toBe(false)
    })

    it('returns true when token exists and is not expired', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const token = makeJwt(exp)
      service.setAccessToken(token)

      expect(service.hasValidToken()).toBe(true)
    })

    it('returns false when token exists but is expired', () => {
      const exp = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const token = makeJwt(exp)
      sessionStorage.setItem('ocf_access_token', token)
      sessionStorage.setItem('ocf_expires_at', (exp * 1000).toString())

      expect(service.hasValidToken()).toBe(false)
    })
  })

  describe('isTokenExpired', () => {
    it('returns true when no expiration stored', () => {
      expect(service.isTokenExpired()).toBe(true)
    })

    it('returns false when token expires well in the future', () => {
      const futureMs = Date.now() + 3600000 // 1 hour from now
      localStorage.setItem('ocf_expires_at', futureMs.toString())

      expect(service.isTokenExpired()).toBe(false)
    })

    it('returns true when token is within 5-minute margin of expiration', () => {
      // Set expiration to 4 minutes from now (within 5-min margin)
      const expiresAt = Date.now() + (4 * 60 * 1000)
      localStorage.setItem('ocf_expires_at', expiresAt.toString())

      expect(service.isTokenExpired()).toBe(true)
    })

    it('returns true when token is already expired', () => {
      const pastMs = Date.now() - 1000
      sessionStorage.setItem('ocf_expires_at', pastMs.toString())

      expect(service.isTokenExpired()).toBe(true)
    })

    it('checks sessionStorage when localStorage has no expiration', () => {
      const futureMs = Date.now() + 3600000
      sessionStorage.setItem('ocf_expires_at', futureMs.toString())

      expect(service.isTokenExpired()).toBe(false)
    })
  })

  describe('getTimeUntilExpiry', () => {
    it('returns 0 when no expiration stored', () => {
      expect(service.getTimeUntilExpiry()).toBe(0)
    })

    it('returns positive milliseconds when token is not expired', () => {
      const futureMs = Date.now() + 3600000
      localStorage.setItem('ocf_expires_at', futureMs.toString())

      const timeLeft = service.getTimeUntilExpiry()
      expect(timeLeft).toBeGreaterThan(0)
      expect(timeLeft).toBeLessThanOrEqual(3600000)
    })

    it('returns 0 when token is already expired', () => {
      const pastMs = Date.now() - 1000
      sessionStorage.setItem('ocf_expires_at', pastMs.toString())

      expect(service.getTimeUntilExpiry()).toBe(0)
    })
  })
})
