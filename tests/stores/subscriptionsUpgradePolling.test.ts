import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

// Return the translation KEY so assertions can check the key identity
vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    currentOrganizationId: null
  })
}))

const isDemoModeMock = vi.fn(() => false)
vi.mock('../../src/services/demo', () => ({
  isDemoMode: (...args: any[]) => isDemoModeMock(...args),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn(async () => {}),
  demoPayments: {
    createCheckoutSession: vi.fn(),
    createPortalSession: vi.fn(),
    checkUsageLimit: vi.fn()
  },
  getDemoCurrentSubscription: vi.fn(() => ({ id: 'demo-sub', subscription_plan_id: 'plan-new', status: 'active' })),
  getDemoUsageMetrics: vi.fn(() => [])
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

describe('subscriptions store — upgradePlan polling', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    isDemoModeMock.mockReturnValue(false)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls getCurrentSubscription until new plan is reflected (no arbitrary setTimeout(3000+2000))', async () => {
    // GET /user-subscriptions/current should first return the OLD plan,
    // then after a few poll attempts return the NEW plan.
    let currentCalls = 0
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.startsWith('/user-subscriptions/current')) {
        currentCalls++
        // Return new plan on 3rd poll onwards
        if (currentCalls >= 3) {
          return { data: { id: 'sub-1', subscription_plan_id: 'plan-new', status: 'active' } }
        }
        return { data: { id: 'sub-1', subscription_plan_id: 'plan-old', status: 'active' } }
      }
      if (url.startsWith('/user-subscriptions/usage')) {
        return { data: [] }
      }
      return { data: {} }
    })
    mockedAxios.post.mockResolvedValue({ data: { success: true } })

    const store = useSubscriptionsStore()
    const upgradePromise = store.upgradePlan('plan-new')

    // Drive the polling loop — each iteration should be <= 1s apart.
    // If the implementation still uses setTimeout(3000) we would need to
    // advance 3000ms before even seeing the first post-upgrade read; with
    // the polling helper it should reflect after ~3 × 500ms = 1500ms.
    await vi.advanceTimersByTimeAsync(2500)
    await vi.advanceTimersByTimeAsync(500)

    const result = await upgradePromise

    expect(mockedAxios.post).toHaveBeenCalledWith('/user-subscriptions/upgrade', {
      new_plan_id: 'plan-new',
      proration_behavior: 'always_invoice'
    })
    expect(result).toEqual({ success: true })
    expect(store.currentSubscription?.subscription_plan_id).toBe('plan-new')
    // Proves we did in fact poll (not a single read)
    expect(currentCalls).toBeGreaterThanOrEqual(3)
  })

  it('sets a timeout error key when the webhook never syncs, but resolves without throwing', async () => {
    // GET /user-subscriptions/current always returns the OLD plan (webhook never arrives)
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.startsWith('/user-subscriptions/current')) {
        return { data: { id: 'sub-1', subscription_plan_id: 'plan-old', status: 'active' } }
      }
      if (url.startsWith('/user-subscriptions/usage')) {
        return { data: [] }
      }
      return { data: {} }
    })
    mockedAxios.post.mockResolvedValue({ data: { success: true } })

    const store = useSubscriptionsStore()
    const upgradePromise = store.upgradePlan('plan-new')

    // Advance enough fake time to exhaust the poll budget (~10s)
    await vi.advanceTimersByTimeAsync(15000)

    // Should resolve, not throw — the upgrade itself succeeded
    const result = await upgradePromise
    expect(result).toEqual({ success: true })

    // The error ref should carry the timeout translation key
    expect(store.error).toBe('subscriptions.upgradeSyncTimeout')
  })

  it('still reloads usage metrics even when the plan sync times out', async () => {
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.startsWith('/user-subscriptions/current')) {
        return { data: { id: 'sub-1', subscription_plan_id: 'plan-old', status: 'active' } }
      }
      if (url.startsWith('/user-subscriptions/usage')) {
        return { data: [{ metric_type: 'terminals', current_value: 2, limit_value: 10 }] }
      }
      return { data: {} }
    })
    mockedAxios.post.mockResolvedValue({ data: { success: true } })

    const store = useSubscriptionsStore()
    const upgradePromise = store.upgradePlan('plan-new')

    await vi.advanceTimersByTimeAsync(15000)
    await upgradePromise

    // usage endpoint must have been called despite the timeout
    const usageCalls = mockedAxios.get.mock.calls.filter(([url]) =>
      typeof url === 'string' && url.startsWith('/user-subscriptions/usage')
    )
    expect(usageCalls.length).toBeGreaterThanOrEqual(1)
  })

  it('upgradePlan — transient 5xx during polling does not break the upgrade', async () => {
    // Simulate a transient 502 during polling: Stripe accepted the upgrade but
    // the backend sync is briefly unavailable. Sequence on /current:
    //   attempt 1 -> OLD plan
    //   attempt 2 -> 502 (transient)
    //   attempt 3 -> OLD plan
    //   attempt 4 -> NEW plan
    // The poll must swallow the 502 and keep going until the NEW plan arrives.
    let currentCalls = 0
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.startsWith('/user-subscriptions/current')) {
        currentCalls++
        if (currentCalls === 2) {
          const err: any = new Error('Bad Gateway')
          err.response = { status: 502, data: {} }
          throw err
        }
        if (currentCalls >= 4) {
          return { data: { id: 'sub-1', subscription_plan_id: 'plan-new', status: 'active' } }
        }
        return { data: { id: 'sub-1', subscription_plan_id: 'plan-old', status: 'active' } }
      }
      if (url.startsWith('/user-subscriptions/usage')) {
        return { data: [] }
      }
      return { data: {} }
    })
    mockedAxios.post.mockResolvedValue({ data: { success: true } })

    const store = useSubscriptionsStore()
    const upgradePromise = store.upgradePlan('plan-new')

    // 4 attempts need ~3 × 500ms = 1500ms between them; give a little headroom.
    await vi.advanceTimersByTimeAsync(2500)

    const result = await upgradePromise

    // Upgrade resolved successfully — the transient error did not propagate.
    expect(result).toEqual({ success: true })
    // Final state reflects the new plan.
    expect(store.currentSubscription?.subscription_plan_id).toBe('plan-new')
    // No timeout warning was set.
    expect(store.error).toBe('')
    // Polling continued across the 502: at least 4 GETs to /current.
    const currentGets = mockedAxios.get.mock.calls.filter(([url]) =>
      typeof url === 'string' && url.startsWith('/user-subscriptions/current')
    )
    expect(currentGets.length).toBeGreaterThanOrEqual(4)
  })

  it('does not poll in demo mode (short-circuits to simulated delay)', async () => {
    isDemoModeMock.mockReturnValue(true)

    // Even if axios is called by accident, return something harmless
    mockedAxios.get.mockResolvedValue({ data: {} })
    mockedAxios.post.mockResolvedValue({ data: {} })

    const store = useSubscriptionsStore()
    const upgradePromise = store.upgradePlan('plan-new')

    await vi.advanceTimersByTimeAsync(5000)
    const result = await upgradePromise

    // Demo mode should not POST to the real upgrade endpoint
    const upgradePosts = mockedAxios.post.mock.calls.filter(([url]) =>
      typeof url === 'string' && url === '/user-subscriptions/upgrade'
    )
    expect(upgradePosts.length).toBe(0)
    expect(result).toBeDefined()
    expect((result as any).success).toBe(true)
  })
})
