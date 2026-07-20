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
//
// This file was updated for the ocf-core !312 BREAKING change: the safe-sync
// endpoint now returns { created, updated, price_migrated, archived, skipped,
// failed } (string[] each, entries like "Name (uuid)"). The old keys
// { synced_plans, skipped_plans, failed_plans, total_plans } are GONE.
//
// Adapter contract encoded here (see report):
//   synced_count = created.length + updated.length
//   skipped_count = skipped.length
//   failed_count = failed.length
//   total_plans  = created + updated + skipped + failed lengths summed
//                  (price_migrated and archived do NOT count toward total_plans)
//   details.synced = [...created, ...updated]
//   details.skipped / details.failed carry the backend string arrays
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
    // Realistic NEW backend payload from POST /subscription-plans/sync-stripe (!312)
    ;(axios.post as any).mockResolvedValue({
      data: {
        created: ['Pro (11111111-1111-1111-1111-111111111111)'],
        updated: ['School (22222222-2222-2222-2222-222222222222)'],
        price_migrated: [],
        archived: [],
        skipped: ['Free (33333333-3333-3333-3333-333333333333)', 'Trial (44444444-4444-4444-4444-444444444444)'],
        failed: []
      }
    })

    const store = useSubscriptionPlansStore()
    const result = await store.syncAndLoadPlans()

    // 1) Must be the adapted RESULT object, NOT the plans array.
    expect(Array.isArray(result)).toBe(false)
    expect(result).toMatchObject({
      success: true,
      synced_count: 2, // 1 created + 1 updated
      skipped_count: 2,
      failed_count: 0,
      total_plans: 4, // 1 + 1 + 2 + 0
      details: {
        synced: [
          'Pro (11111111-1111-1111-1111-111111111111)',
          'School (22222222-2222-2222-2222-222222222222)'
        ],
        skipped: [
          'Free (33333333-3333-3333-3333-333333333333)',
          'Trial (44444444-4444-4444-4444-444444444444)'
        ],
        failed: []
      }
    })

    // 2) Must still refresh the plan list.
    expect(axios.get).toHaveBeenCalledWith('/subscription-plans')
    expect(store.entities.map((p: any) => p.id)).toEqual(['p1', 'p2'])
  })

  it('returns success with zero synced when every plan was skipped (null-safe on empty arrays)', async () => {
    // Backend may serialize empty slices as null — the adapter must treat null as [].
    ;(axios.post as any).mockResolvedValue({
      data: {
        created: null,
        updated: null,
        price_migrated: null,
        archived: null,
        skipped: [
          'Free (no change)',
          'Trial (no change)',
          'Pro (no change)',
          'School (no change)',
          'Enterprise (no change)',
          'Custom (no change)'
        ],
        failed: null
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
