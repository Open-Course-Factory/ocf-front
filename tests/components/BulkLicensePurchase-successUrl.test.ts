/**
 * RED (behavioral) — BulkLicensePurchase.vue must thread the buyer's current
 * batch count through the Stripe success URL (issue #254 / MR !241 reviewer
 * follow-up).
 *
 * Why: the return from Stripe is a FULL PAGE LOAD, so LicenseManagementDashboard
 * cannot know how many batches the buyer had before the purchase — its in-memory
 * snapshot starts empty. Without that number, a repeat buyer's provisioning poll
 * settles on their OLD batches and shows a premature "purchase complete". The fix
 * carries the pre-purchase count in the redirect URL so the landing page can poll
 * until `batches.length` exceeds it.
 *
 * Contract pinned at the backend boundary — the args passed to the batches
 * store's `createBulkCheckoutSession(planId, quantity, successUrl, cancelUrl,
 * groupId?, couponCode?)`:
 *   - successUrl still targets `/license-management?success=true`
 *   - successUrl additionally carries `prior=<current batch count>` (from the
 *     batches store at purchase time)
 *   - cancelUrl / planId / quantity are unchanged
 *
 * EXPECTED STATE against current code: RED — today successUrl is
 * `${origin}/license-management?success=true` with no `prior` param.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const h = vi.hoisted(() => ({
  createBulkCheckoutSession: vi.fn(),
  loadBatches: vi.fn(),
  loadPlans: vi.fn(),
  loadEntities: vi.fn(),
  // Buyer's existing batches at purchase time (mutated per test).
  batches: [] as any[],
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (k: string) => k }),
}))

vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({
    entities: [],
    isLoading: false,
    loadPlans: h.loadPlans,
  }),
}))

vi.mock('../../src/stores/subscriptionBatches', () => ({
  useSubscriptionBatchesStore: () => ({
    get batches() { return h.batches },
    loadBatches: h.loadBatches,
    createBulkCheckoutSession: h.createBulkCheckoutSession,
  }),
}))

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({
    entities: [],
    loadEntities: h.loadEntities,
  }),
}))

import BulkLicensePurchase from '../../src/components/Pages/BulkLicensePurchase.vue'

function mountBulk() {
  return mount(BulkLicensePurchase, {
    global: {
      stubs: {
        PricingCalculator: true,
        ErrorAlert: true,
        'router-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  })
}

// Drive a purchase: pick a plan (quantity defaults to 10) and run the handler
// the Purchase button calls. Asserting the store args is the same boundary
// contract the existing direct-to-Stripe behavioral tests use.
async function purchase(wrapper: any) {
  ;(wrapper.vm as any).selectPlan('plan-tiered')
  await (wrapper.vm as any).handlePurchase()
  await flushPromises()
}

const ORIGIN = window.location.origin

describe('BulkLicensePurchase — success URL carries the pre-purchase batch count', () => {
  beforeEach(() => {
    h.createBulkCheckoutSession.mockReset().mockResolvedValue({ url: 'https://stripe.test/session' })
    h.loadBatches.mockReset().mockResolvedValue(undefined)
    h.loadPlans.mockReset().mockResolvedValue(undefined)
    h.loadEntities.mockReset().mockResolvedValue(undefined)
    h.batches = []
  })

  it('appends prior=<count> to the success URL when the buyer already owns batches', async () => {
    h.batches = [{ id: 'b1' }, { id: 'b2' }] // repeat buyer: 2 existing batches

    const wrapper = mountBulk()
    await flushPromises()
    await purchase(wrapper)

    expect(h.createBulkCheckoutSession).toHaveBeenCalledTimes(1)
    const [planId, quantity, successUrl, cancelUrl] = h.createBulkCheckoutSession.mock.calls[0]
    expect(planId).toBe('plan-tiered')
    expect(quantity).toBe(10)
    // Landing target and success flag preserved …
    expect(successUrl).toContain('/license-management?success=true')
    // … plus the pre-purchase count so the landing poll waits for a NEW batch.
    expect(successUrl).toContain('prior=2')
    // Cancel URL unchanged.
    expect(cancelUrl).toBe(`${ORIGIN}/bulk-license-purchase`)
    wrapper.unmount()
  })

  it('appends prior=0 for a first-time buyer with no existing batches', async () => {
    h.batches = [] // first purchase

    const wrapper = mountBulk()
    await flushPromises()
    await purchase(wrapper)

    expect(h.createBulkCheckoutSession).toHaveBeenCalledTimes(1)
    const successUrl = h.createBulkCheckoutSession.mock.calls[0][2]
    expect(successUrl).toContain('/license-management?success=true')
    expect(successUrl).toContain('prior=0')
    wrapper.unmount()
  })
})
