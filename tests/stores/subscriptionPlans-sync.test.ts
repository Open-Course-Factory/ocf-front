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
  handleStoreError: vi.fn((err: any, fallbackKey: string) => fallbackKey)
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn(),
  getDemoSubscriptionPlans: vi.fn(() => [])
}))

import axios from 'axios'
import { useSubscriptionPlansStore } from '../../src/stores/subscriptionPlans'

// RED — syncAndLoadPlans() must return the ADAPTED sync-result object built from
// POST /subscription-plans/sync-stripe (the object SubscriptionPlans.vue reads
// `syncResult.success` on), while ALSO refreshing the plan list via
// GET /subscription-plans. The bug: it discards the sync result and returns the
// raw plans ARRAY from loadPlans(), so the component always shows the error
// branch (an array has no `.success`).
describe('subscriptionPlans store - syncAndLoadPlans (#sync-result-display)', () => {
  const plansFixture = [
    { id: 'p1', name: 'Pro', price_amount: 2000, currency: 'EUR', billing_interval: 'month' },
    { id: 'p2', name: 'School', price_amount: 5000, currency: 'EUR', billing_interval: 'month' }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // GET /subscription-plans → plan list refresh
    ;(axios.get as any).mockResolvedValue({ data: plansFixture })
  })

  it('returns the adapted sync-result object (not the plans array) and refreshes the plan list', async () => {
    // Realistic backend payload from POST /subscription-plans/sync-stripe
    ;(axios.post as any).mockResolvedValue({
      data: {
        synced_plans: ['Pro', 'School'],
        skipped_plans: ['Free (free plan)', 'Trial (free plan)'],
        failed_plans: null,
        total_plans: 6
      }
    })

    const store = useSubscriptionPlansStore()
    const result = await store.syncAndLoadPlans()

    // 1) Must be the adapted RESULT object, NOT the plans array.
    expect(Array.isArray(result)).toBe(false)
    expect(result).toMatchObject({
      success: true,
      synced_count: 2,
      skipped_count: 2,
      failed_count: 0,
      total_plans: 6,
      details: {
        synced: ['Pro', 'School'],
        skipped: ['Free (free plan)', 'Trial (free plan)'],
        failed: []
      }
    })

    // 2) Must still refresh the plan list.
    expect(axios.get).toHaveBeenCalledWith('/subscription-plans')
    expect(store.entities.map((p: any) => p.id)).toEqual(['p1', 'p2'])
  })

  it('returns success with zero synced when every plan was skipped', async () => {
    ;(axios.post as any).mockResolvedValue({
      data: {
        synced_plans: null,
        skipped_plans: [
          'Free (free plan)',
          'Trial (free plan)',
          'Pro (no change)',
          'School (no change)',
          'Enterprise (no change)',
          'Custom (no change)'
        ],
        failed_plans: null,
        total_plans: 6
      }
    })

    const store = useSubscriptionPlansStore()
    const result = await store.syncAndLoadPlans()

    expect(Array.isArray(result)).toBe(false)
    expect(result).toMatchObject({
      success: true,
      synced_count: 0,
      skipped_count: 6,
      failed_count: 0,
      total_plans: 6
    })
    // Plan list still refreshed.
    expect(axios.get).toHaveBeenCalledWith('/subscription-plans')
  })
})
