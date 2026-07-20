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

// RED — third-way Stripe sync UI (#285). These methods do NOT exist yet.
//
// Backend contract (ocf-core !312):
//   POST /subscription-plans/sync-stripe/mirror?dry_run=true|false
//     → StripeSyncResult { created, updated, price_migrated, archived, skipped,
//       failed } (string[] each). dry_run=true reports what WOULD be archived
//       without writing.
//   POST /subscription-plans/import-stripe
//     → { processed_plans, created_plans (n), updated_plans (n), skipped_plans (n),
//         failed_plans: [{stripe_product_id, stripe_price_id, error}],
//         created_details: string[], updated_details: string[],
//         skipped_details: string[] }
//
// Store adapter contracts encoded here (see report):
//   mirrorPlansToStripe(dryRun): POST '/subscription-plans/sync-stripe/mirror'
//     with axios config { params: { dry_run: <boolean> } }. Returns:
//       { success: true,
//         synced_count = created + updated lengths,
//         skipped_count = skipped.length,
//         failed_count  = failed.length,
//         archived_count = archived.length,
//         total_plans   = created + updated + skipped + failed lengths,
//         details: { synced: [...created, ...updated], skipped, failed,
//                    price_migrated, archived } }
//
//   importPlansFromStripe(): POST '/subscription-plans/import-stripe', then
//     refresh the plan list via GET '/subscription-plans'. Returns:
//       { success: true,
//         created_count = created_plans (number),
//         updated_count = updated_plans (number),
//         skipped_count = skipped_plans (number),
//         failed_count  = failed_plans.length,
//         details: { created: created_details, updated: updated_details,
//                    skipped: skipped_details,
//                    failed: <readable string per failed entry, containing the
//                            product id, price id and error> } }

const plansFixture = [
  { id: 'p1', name: 'Pro', price_amount: 2000, currency: 'EUR', billing_interval: 'month' },
  { id: 'p2', name: 'School', price_amount: 5000, currency: 'EUR', billing_interval: 'month' }
]

describe('subscriptionPlans store - mirrorPlansToStripe (#285)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    ;(axios.get as any).mockResolvedValue({ data: plansFixture })
  })

  it('dry run: POSTs to the mirror endpoint with dry_run=true and adapts the archive preview', async () => {
    ;(axios.post as any).mockResolvedValue({
      data: {
        created: [],
        updated: [],
        price_migrated: [],
        archived: [
          'Legacy Plan (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)',
          'Old Tier (bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb)'
        ],
        skipped: ['Pro (11111111-1111-1111-1111-111111111111)'],
        failed: []
      }
    })

    const store = useSubscriptionPlansStore()
    const result = await store.mirrorPlansToStripe(true)

    // URL + dry_run param (body arg intentionally not pinned).
    const call = (axios.post as any).mock.calls[0]
    expect(call[0]).toBe('/subscription-plans/sync-stripe/mirror')
    expect(call[call.length - 1]).toMatchObject({ params: { dry_run: true } })

    expect(Array.isArray(result)).toBe(false)
    expect(result).toMatchObject({
      success: true,
      synced_count: 0,
      skipped_count: 1,
      failed_count: 0,
      archived_count: 2,
      total_plans: 1, // 0 + 0 + 1 + 0 (archived excluded, matching sync spec)
      details: {
        synced: [],
        skipped: ['Pro (11111111-1111-1111-1111-111111111111)'],
        failed: [],
        price_migrated: [],
        archived: [
          'Legacy Plan (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)',
          'Old Tier (bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb)'
        ]
      }
    })
  })

  it('real run: POSTs with dry_run=false and reports what was archived/updated', async () => {
    ;(axios.post as any).mockResolvedValue({
      data: {
        created: [],
        updated: ['Pro (11111111-1111-1111-1111-111111111111)'],
        price_migrated: [],
        archived: ['Legacy Plan (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)'],
        skipped: [],
        failed: []
      }
    })

    const store = useSubscriptionPlansStore()
    const result = await store.mirrorPlansToStripe(false)

    const call = (axios.post as any).mock.calls[0]
    expect(call[0]).toBe('/subscription-plans/sync-stripe/mirror')
    expect(call[call.length - 1]).toMatchObject({ params: { dry_run: false } })

    expect(result).toMatchObject({
      success: true,
      synced_count: 1,
      archived_count: 1,
      total_plans: 1,
      details: {
        archived: ['Legacy Plan (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)']
      }
    })
  })

  it('throws and records the store error when the request fails', async () => {
    ;(axios.post as any).mockRejectedValue({ response: { status: 500 } })

    const store = useSubscriptionPlansStore()
    await expect(store.mirrorPlansToStripe(true)).rejects.toBeTruthy()
    expect(store.error).toBeTruthy()
  })
})

describe('subscriptionPlans store - importPlansFromStripe (#285)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    ;(axios.get as any).mockResolvedValue({ data: plansFixture })
  })

  it('POSTs to the import endpoint, adapts the import result, and refreshes the plan list', async () => {
    ;(axios.post as any).mockResolvedValue({
      data: {
        processed_plans: 4,
        created_plans: 2,
        updated_plans: 1,
        skipped_plans: 1,
        failed_plans: [
          { stripe_product_id: 'prod_ABC', stripe_price_id: 'price_123', error: 'missing metadata' }
        ],
        created_details: ['Starter (prod_AAA)', 'Growth (prod_BBB)'],
        updated_details: ['Pro (prod_CCC)'],
        skipped_details: ['Enterprise (already imported)']
      }
    })

    const store = useSubscriptionPlansStore()
    const result = await store.importPlansFromStripe()

    expect(axios.post).toHaveBeenCalledWith('/subscription-plans/import-stripe')

    expect(Array.isArray(result)).toBe(false)
    expect(result).toMatchObject({
      success: true,
      created_count: 2,
      updated_count: 1,
      skipped_count: 1,
      failed_count: 1,
      details: {
        created: ['Starter (prod_AAA)', 'Growth (prod_BBB)'],
        updated: ['Pro (prod_CCC)'],
        skipped: ['Enterprise (already imported)']
      }
    })

    // Failed entries adapted to a single readable string carrying all three pieces.
    expect(result.details.failed).toHaveLength(1)
    const failedLine = result.details.failed[0]
    expect(failedLine).toContain('prod_ABC')
    expect(failedLine).toContain('price_123')
    expect(failedLine).toContain('missing metadata')

    // Plan list refreshed after import.
    expect(axios.get).toHaveBeenCalledWith('/subscription-plans')
    expect(store.entities.map((p: any) => p.id)).toEqual(['p1', 'p2'])
  })

  it('throws and records the store error when the request fails', async () => {
    ;(axios.post as any).mockRejectedValue({ response: { status: 500 } })

    const store = useSubscriptionPlansStore()
    await expect(store.importPlansFromStripe()).rejects.toBeTruthy()
    expect(store.error).toBeTruthy()
  })
})
