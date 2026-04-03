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
    if (err?.response?.data?.error_message) return err.response.data.error_message
    if (err?.response?.data?.message) return err.response.data.message
    if (err?.message) return err.message
    return fallbackKey
  })
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn(),
  demoPayments: {
    createCheckoutSession: vi.fn(),
    createPortalSession: vi.fn(),
    checkUsageLimit: vi.fn()
  },
  getDemoCurrentSubscription: vi.fn(),
  getDemoUsageMetrics: vi.fn()
}))

vi.mock('../../src/services/features', () => ({
  featureFlagService: {
    isMetricVisible: vi.fn(() => true)
  }
}))

vi.mock('../../src/utils/formatters', () => ({
  formatDate: (date: string) => date
}))

vi.mock('../../src/composables/useStatusFormatters', () => ({
  useStatusFormatters: () => ({
    getStatusClass: (status: string) => `status-${status}`,
    getStatusIcon: (status: string) => `icon-${status}`
  })
}))

import axios from 'axios'
import { useSubscriptionsStore } from '../../src/stores/subscriptions'

const mockedAxios = vi.mocked(axios)

describe('subscriptions store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('getCurrentSubscription', () => {
    it('fetches and stores current subscription', async () => {
      const mockSub = { id: 'sub-1', status: 'active', plan_name: 'Pro' }
      mockedAxios.get.mockResolvedValue({ data: mockSub })

      const store = useSubscriptionsStore()
      const result = await store.getCurrentSubscription()

      expect(mockedAxios.get).toHaveBeenCalledWith('/user-subscriptions/current')
      expect(result).toEqual(mockSub)
      expect(store.currentSubscription).toEqual(mockSub)
    })

    it('sets currentSubscription to null on 404', async () => {
      const error = { response: { status: 404, data: {} }, message: 'Not found' }
      mockedAxios.get.mockRejectedValue(error)

      const store = useSubscriptionsStore()

      await expect(store.getCurrentSubscription()).rejects.toBeDefined()
      expect(store.currentSubscription).toBeNull()
    })

    it('manages loading state', async () => {
      mockedAxios.get.mockResolvedValue({ data: { id: 'sub-1' } })

      const store = useSubscriptionsStore()

      let loadingDuringCall = false
      const originalGet = mockedAxios.get.getMockImplementation()
      mockedAxios.get.mockImplementation(async (...args) => {
        loadingDuringCall = store.isLoading
        return { data: { id: 'sub-1' } }
      })

      await store.getCurrentSubscription()

      expect(loadingDuringCall).toBe(true)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('createCheckoutSession', () => {
    it('posts checkout data and redirects on paid plan', async () => {
      const mockResponse = { url: 'https://stripe.com/checkout/session-123' }
      mockedAxios.post.mockResolvedValue({ data: mockResponse })

      // Mock window.location.href
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' }
      })

      const store = useSubscriptionsStore()
      await store.createCheckoutSession('plan-1', '/success', '/cancel')

      expect(mockedAxios.post).toHaveBeenCalledWith('/user-subscriptions/checkout', {
        subscription_plan_id: 'plan-1',
        success_url: '/success',
        cancel_url: '/cancel'
      })
      expect(window.location.href).toBe('https://stripe.com/checkout/session-123')

      // Restore
      Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
    })

    it('includes coupon code when provided', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} })

      const store = useSubscriptionsStore()
      await store.createCheckoutSession('plan-1', '/success', '/cancel', 'DISCOUNT10')

      expect(mockedAxios.post).toHaveBeenCalledWith('/user-subscriptions/checkout', {
        subscription_plan_id: 'plan-1',
        success_url: '/success',
        cancel_url: '/cancel',
        coupon_code: 'DISCOUNT10'
      })
    })

    it('includes allow_replace flag when set', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} })

      const store = useSubscriptionsStore()
      await store.createCheckoutSession('plan-1', '/success', '/cancel', undefined, true)

      expect(mockedAxios.post).toHaveBeenCalledWith('/user-subscriptions/checkout', {
        subscription_plan_id: 'plan-1',
        success_url: '/success',
        cancel_url: '/cancel',
        allow_replace: true
      })
    })

    it('handles free plan activation without redirect', async () => {
      const mockResponse = {
        free_plan: true,
        subscription: { id: 'sub-free', status: 'active' }
      }
      mockedAxios.post.mockResolvedValue({ data: mockResponse })

      const store = useSubscriptionsStore()
      const result = await store.createCheckoutSession('plan-free', '/success', '/cancel')

      expect(result).toEqual(mockResponse)
      expect(store.currentSubscription).toEqual({ id: 'sub-free', status: 'active' })
    })
  })

  describe('cancelSubscription', () => {
    it('posts cancel request and refreshes subscription', async () => {
      mockedAxios.post.mockResolvedValue({})
      mockedAxios.get.mockResolvedValue({ data: { id: 'sub-1', status: 'canceled' } })

      const store = useSubscriptionsStore()
      const result = await store.cancelSubscription('sub-1')

      expect(mockedAxios.post).toHaveBeenCalledWith('/user-subscriptions/sub-1/cancel')
      expect(result).toBe(true)
    })

    it('appends cancel_immediately param when set', async () => {
      mockedAxios.post.mockResolvedValue({})
      mockedAxios.get.mockResolvedValue({ data: { id: 'sub-1' } })

      const store = useSubscriptionsStore()
      await store.cancelSubscription('sub-1', true)

      expect(mockedAxios.post).toHaveBeenCalledWith('/user-subscriptions/sub-1/cancel?cancel_immediately=true')
    })
  })

  describe('reactivateSubscription', () => {
    it('posts reactivate request and refreshes subscription', async () => {
      mockedAxios.post.mockResolvedValue({})
      mockedAxios.get.mockResolvedValue({ data: { id: 'sub-1', status: 'active' } })

      const store = useSubscriptionsStore()
      const result = await store.reactivateSubscription('sub-1')

      expect(mockedAxios.post).toHaveBeenCalledWith('/user-subscriptions/sub-1/reactivate')
      expect(result).toBe(true)
    })
  })

  describe('getUsageMetrics', () => {
    it('fetches and deduplicates usage metrics', async () => {
      const mockMetrics = [
        { metric_type: 'terminals', current: 2, limit: 10 },
        { metric_type: 'terminals', current: 2, limit: 10 }, // duplicate
        { metric_type: 'storage', current: 5, limit: 100 }
      ]
      mockedAxios.get.mockResolvedValue({ data: mockMetrics })

      const store = useSubscriptionsStore()
      const result = await store.getUsageMetrics()

      expect(mockedAxios.get).toHaveBeenCalledWith('/user-subscriptions/usage')
      expect(result).toHaveLength(2)
      expect(result[0].metric_type).toBe('terminals')
      expect(result[1].metric_type).toBe('storage')
    })

    it('handles empty response', async () => {
      mockedAxios.get.mockResolvedValue({ data: null })

      const store = useSubscriptionsStore()
      const result = await store.getUsageMetrics()

      expect(result).toEqual([])
    })
  })

  describe('checkUsageLimit', () => {
    it('posts usage check and returns result', async () => {
      const mockResult = {
        allowed: true,
        source: 'personal',
        current_usage: 2,
        limit: 10,
        remaining: 8
      }
      mockedAxios.post.mockResolvedValue({ data: mockResult })

      const store = useSubscriptionsStore()
      const result = await store.checkUsageLimit('terminals', 1)

      expect(mockedAxios.post).toHaveBeenCalledWith('/user-subscriptions/usage/check', {
        metric_type: 'terminals',
        increment: 1
      })
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(8)
    })

    it('returns allowed:false on error', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { data: { error_message: 'Limit exceeded', source: 'organization' } }
      })

      const store = useSubscriptionsStore()
      const result = await store.checkUsageLimit('terminals', 1)

      expect(result.allowed).toBe(false)
      expect(result.source).toBe('organization')
    })
  })

  describe('helper methods', () => {
    it('isTrialing returns true when status is trialing', () => {
      const store = useSubscriptionsStore()
      store.currentSubscription = { status: 'trialing' } as any

      expect(store.isTrialing()).toBe(true)
    })

    it('isTrialing returns false when status is not trialing', () => {
      const store = useSubscriptionsStore()
      store.currentSubscription = { status: 'active' } as any

      expect(store.isTrialing()).toBe(false)
    })

    it('isCanceled returns true when cancel_at_period_end is true', () => {
      const store = useSubscriptionsStore()
      store.currentSubscription = { cancel_at_period_end: true } as any

      expect(store.isCanceled()).toBe(true)
    })

    it('isCanceled returns false when cancel_at_period_end is false', () => {
      const store = useSubscriptionsStore()
      store.currentSubscription = { cancel_at_period_end: false } as any

      expect(store.isCanceled()).toBe(false)
    })

    it('hasActiveSubscription returns true for active status', () => {
      const store = useSubscriptionsStore()
      store.currentSubscription = { status: 'active' } as any

      expect(store.hasActiveSubscription()).toBe(true)
    })

    it('hasActiveSubscription returns true for trialing status', () => {
      const store = useSubscriptionsStore()
      store.currentSubscription = { status: 'trialing' } as any

      expect(store.hasActiveSubscription()).toBe(true)
    })

    it('hasActiveSubscription returns false for canceled status', () => {
      const store = useSubscriptionsStore()
      store.currentSubscription = { status: 'canceled' } as any

      expect(store.hasActiveSubscription()).toBe(false)
    })

    it('hasActiveSubscription returns falsy when no subscription', () => {
      const store = useSubscriptionsStore()
      store.currentSubscription = null

      expect(store.hasActiveSubscription()).toBeFalsy()
    })
  })

  describe('status formatters', () => {
    it('getStatusClass returns formatted status class', () => {
      const store = useSubscriptionsStore()
      expect(store.getStatusClass('active')).toBe('status-active')
    })

    it('getStatusIcon returns formatted status icon', () => {
      const store = useSubscriptionsStore()
      expect(store.getStatusIcon('active')).toBe('icon-active')
    })
  })

  describe('adminAssignPlan', () => {
    it('posts admin plan assignment', async () => {
      mockedAxios.post.mockResolvedValue({ data: { success: true } })

      const store = useSubscriptionsStore()
      const result = await store.adminAssignPlan('user-1', 'plan-pro', 30)

      expect(mockedAxios.post).toHaveBeenCalledWith('/user-subscriptions/admin-assign', {
        user_id: 'user-1',
        plan_id: 'plan-pro',
        duration_days: 30
      })
      expect(result).toEqual({ success: true })
    })
  })

  describe('error state management', () => {
    it('sets error on failed API call', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 500, data: { message: 'Server error' } },
        message: 'Server error'
      })

      const store = useSubscriptionsStore()
      await expect(store.getCurrentSubscription()).rejects.toBeDefined()

      expect(store.error).not.toBe('')
    })

    it('clears error on new successful call', async () => {
      const store = useSubscriptionsStore()
      store.error = 'previous error'

      mockedAxios.get.mockResolvedValue({ data: { id: 'sub-1' } })
      await store.getCurrentSubscription()

      expect(store.error).toBe('')
    })
  })
})
