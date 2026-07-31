/**
 * BulkLicensePurchase — the one screen for buying learner seats (#296).
 *
 * There is deliberately only one. A second purchase page existed briefly during
 * this work and was removed: two screens for one purpose is worse than either.
 *
 * Two properties are pinned.
 *
 * 1. The order becomes a QUANTITY via the plan's seat_unit. A day pack is priced
 *    per learner-day, so ten learners for three days is thirty units; a monthly
 *    seat is priced per seat, so the same order is ten. Nothing else in the data
 *    distinguishes the two products — both are billing_interval=month — and
 *    getting this wrong overcharges by a factor of the duration.
 *
 * 2. Seat products come from their OWN endpoint, never the plan catalogue. Seat
 *    plans are is_catalog=false, so the catalogue does not contain them for a
 *    non-admin — reading it showed a trainer an empty page, which is why this
 *    screen never worked before.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { getPurchasableSeatPlans, getPricingPreview } = vi.hoisted(() => ({
  getPurchasableSeatPlans: vi.fn(),
  getPricingPreview: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (k: string) => k, te: () => true, locale: { value: 'en' } }),
  useStoreTranslations: () => ({ t: (k: string) => k, te: () => true, locale: { value: 'en' } }),
}))

vi.mock('../../src/services/domain/subscription/bulkLicenseService', () => ({
  bulkLicenseService: {
    getPurchasableSeatPlans,
    getPricingPreview,
    createBulkCheckoutSession: vi.fn(),
  },
}))

vi.mock('../../src/stores/subscriptionBatches', () => ({
  useSubscriptionBatchesStore: () => ({
    batches: [],
    loadBatches: vi.fn(),
    createBulkCheckoutSession: vi.fn(),
  }),
}))

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({ entities: [], loadEntities: vi.fn() }),
}))

import BulkLicensePurchase from '../../src/components/Pages/BulkLicensePurchase.vue'

const MONTHLY = {
  id: 'plan-monthly', name: 'Siège élève — mensuel', description: '', currency: 'eur',
  billing_interval: 'month', price_amount: 900, use_tiered_pricing: true,
  pricing_tiers: [], seat_unit: 'seat_month' as const,
}
const PACK = {
  id: 'plan-pack', name: 'Siège élève — pack jours', description: '', currency: 'eur',
  billing_interval: 'month', price_amount: 165, use_tiered_pricing: true,
  pricing_tiers: [], seat_unit: 'learner_day' as const,
}

const stubs = { ErrorAlert: true, RouterLink: { template: '<a><slot /></a>' } }

async function mountScreen() {
  const wrapper = mount(BulkLicensePurchase, { global: { stubs } })
  await flushPromises()
  await flushPromises()
  return wrapper
}

describe('BulkLicensePurchase — seat ordering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    getPurchasableSeatPlans.mockResolvedValue({ can_purchase: true, plans: [MONTHLY, PACK] })
    // Server prices: 10 seat-months = 80.00, 30 learner-days = 49.50.
    getPricingPreview.mockImplementation(async ({ quantity }: any) => ({
      total_monthly_cost: quantity === 10 ? 8000 : quantity === 30 ? 4950 : quantity * 100,
    }))
  })

  it('reads the seat endpoint, not the plan catalogue', async () => {
    await mountScreen()
    expect(
      getPurchasableSeatPlans,
      'the catalogue does not contain hidden seat plans — reading it showed a trainer nothing',
    ).toHaveBeenCalled()
  })

  it('turns the order into a quantity using each plan’s seat unit', async () => {
    await mountScreen()
    const asked = getPricingPreview.mock.calls.map(c => c[0])
    expect(asked).toEqual(
      expect.arrayContaining([
        { subscriptionPlanId: 'plan-monthly', quantity: 10 },
        { subscriptionPlanId: 'plan-pack', quantity: 30 }, // 10 learners x 3 days
      ]),
    )
  })

  it('never computes a price locally — every figure is fetched', async () => {
    await mountScreen()
    expect(getPricingPreview).toHaveBeenCalled()
  })

  it('shows the cheaper option first and preselects it', async () => {
    const wrapper = await mountScreen()
    const quotes = wrapper.findAll('[data-test="seat-purchase-quote"]')
    expect(quotes.length).toBe(2)
    expect(quotes[0].text()).toContain('Siège élève — pack jours')
    expect(quotes[0].classes()).toContain('selected')
  })

  it('drops the day pack when the trainer asks for a month', async () => {
    const wrapper = await mountScreen()
    getPricingPreview.mockClear()

    await wrapper.find('[data-test="seat-purchase-duration"]').setValue('month')
    await new Promise(r => setTimeout(r, 350))
    await flushPromises()

    const ids = getPricingPreview.mock.calls.map(c => c[0].subscriptionPlanId)
    expect(ids).toContain('plan-monthly')
    expect(ids, 'a day pack cannot express a month').not.toContain('plan-pack')
  })

  it('explains rather than showing a form the purchase would refuse', async () => {
    getPurchasableSeatPlans.mockResolvedValue({
      can_purchase: false, reason: 'your plan does not allow it', plans: [],
    })
    const wrapper = await mountScreen()

    expect(wrapper.find('[data-test="seat-purchase-ineligible"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="seat-purchase-learners"]').exists()).toBe(false)
    expect(getPricingPreview).not.toHaveBeenCalled()
  })
})
