/**
 * SeatPurchase — the trainer's buying screen (#296).
 *
 * Two properties are pinned.
 *
 * 1. The order becomes a QUANTITY using the plan's seat_unit. A day pack is
 *    priced per learner-day, so 10 learners for 3 days is 30 units; a monthly
 *    seat is priced per seat, so the same order is 10. Nothing else in the data
 *    distinguishes the two products — both are billing_interval=month — which is
 *    exactly why ocf-core#330 added the unit.
 *
 * 2. Prices are FETCHED, never computed here. Graduated pricing lives in one
 *    place server-side; a local implementation would quote a number the invoice
 *    then contradicts, which is the divergence ocf-core#442 exists to prevent.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

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

// vi.hoisted: vi.mock factories are lifted above ordinary const declarations, so
// the doubles have to be created in the hoisted scope to be visible to them.
const { getPurchasableSeatPlans, getPricingPreview, createBulkCheckoutSession } = vi.hoisted(() => ({
  getPurchasableSeatPlans: vi.fn(),
  getPricingPreview: vi.fn(),
  createBulkCheckoutSession: vi.fn(),
}))

vi.mock('../../src/services/domain/subscription/bulkLicenseService', () => ({
  bulkLicenseService: { getPurchasableSeatPlans, getPricingPreview, createBulkCheckoutSession },
}))

import SeatPurchase from '../../src/components/Pages/SeatPurchase.vue'

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

async function mountScreen() {
  const wrapper = mount(SeatPurchase)
  await flushPromises()
  await flushPromises()
  return wrapper
}

describe('SeatPurchase', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    getPurchasableSeatPlans.mockResolvedValue({ can_purchase: true, plans: [MONTHLY, PACK] })
    // Server prices: 10 seat-months = 80.00, 30 learner-days = 49.50.
    getPricingPreview.mockImplementation(async ({ quantity }: any) => ({
      total_monthly_cost: quantity === 10 ? 8000 : quantity === 30 ? 4950 : quantity * 100,
    }))
  })

  it('turns the order into a quantity using each plan’s seat unit', async () => {
    await mountScreen()

    const quantities = getPricingPreview.mock.calls.map(c => c[0])
    expect(quantities).toEqual(
      expect.arrayContaining([
        { subscriptionPlanId: 'plan-monthly', quantity: 10 },
        // 10 learners x 3 days — the default duration.
        { subscriptionPlanId: 'plan-pack', quantity: 30 },
      ]),
    )
  })

  it('never computes a price locally — every figure is fetched', async () => {
    await mountScreen()
    expect(
      getPricingPreview,
      'graduated pricing must come from the server, or the quote and the invoice diverge',
    ).toHaveBeenCalled()
  })

  it('recommends the cheaper option first', async () => {
    const wrapper = await mountScreen()
    const quotes = wrapper.findAll('[data-test="seat-purchase-quote"]')
    expect(quotes.length).toBe(2)
    // 49.50 (pack) beats 80.00 (monthly) over three days.
    expect(quotes[0].text()).toContain('49.50')
    expect(quotes[0].text()).toContain('Siège élève — pack jours')
  })

  it('drops the day pack when the trainer asks for a month', async () => {
    const wrapper = await mountScreen()
    getPricingPreview.mockClear()

    await wrapper.find('[data-test="seat-purchase-duration"]').setValue('month')
    await new Promise(r => setTimeout(r, 350))
    await flushPromises()

    const ids = getPricingPreview.mock.calls.map(c => c[0].subscriptionPlanId)
    expect(ids).toContain('plan-monthly')
    expect(ids).not.toContain('plan-pack')
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

  it('sends the computed quantity to checkout, not the learner count', async () => {
    createBulkCheckoutSession.mockResolvedValue({ session_id: 'cs', url: 'https://stripe.test/pay' })
    const wrapper = await mountScreen()

    await wrapper.find('[data-test="seat-purchase-buy-0"]').trigger('click')
    await flushPromises()

    const sent = createBulkCheckoutSession.mock.calls[0][0]
    expect(sent.subscription_plan_id).toBe('plan-pack')
    expect(sent.quantity).toBe(30)
  })
})
