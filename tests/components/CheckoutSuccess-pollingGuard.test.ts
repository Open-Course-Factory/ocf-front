/**
 * GUARD (GREEN) — CheckoutSuccess.vue webhook-lag polling (issue #254).
 *
 * This is a REGRESSION GUARD, not a RED test. CheckoutSuccess.vue already polls
 * `getCurrentSubscription()` (onMounted, ~10×1s) until the subscription appears,
 * which is exactly what keeps a just-paid user from seeing "no subscription"
 * while the Stripe webhook is still in flight. There was no test covering it, so
 * a future refactor could silently drop the poll and reintroduce the bug this
 * issue is about. These pins lock in the observable behavior:
 *   - it RETRIES while the subscription is absent (more than one call), and
 *   - it STOPS once the subscription lands (does not burn the whole budget).
 *
 * Pinned loosely (retry happens / stops when landed) rather than on exact tick
 * counts, so the poll budget can be tuned without churning the test.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const h = vi.hoisted(() => ({
  getCurrentSubscription: vi.fn(),
  formatPrice: vi.fn(() => '12 EUR'),
  sub: { current: null as any },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (k: string) => k }),
}))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    get currentSubscription() { return h.sub.current },
    getCurrentSubscription: h.getCurrentSubscription,
  }),
}))

vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({ formatPrice: h.formatPrice }),
}))

import CheckoutSuccess from '../../src/components/Flows/CheckoutSuccess.vue'

function mountSuccess() {
  return mount(CheckoutSuccess, {
    global: {
      stubs: { 'router-link': { props: ['to'], template: '<a><slot /></a>' } },
    },
  })
}

async function tick(ms = 0) {
  await vi.advanceTimersByTimeAsync(ms)
  await nextTick()
}

describe('CheckoutSuccess — webhook-lag polling [guard]', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    h.getCurrentSubscription.mockReset()
    h.sub.current = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries getCurrentSubscription while the subscription is still absent', async () => {
    // Webhook never lands during the window → the poll keeps trying.
    h.getCurrentSubscription.mockImplementation(async () => { /* current stays null */ })

    const wrapper = mountSuccess()
    await tick(0)      // first attempt
    await tick(12000)  // drain the poll budget

    expect(h.getCurrentSubscription.mock.calls.length).toBeGreaterThanOrEqual(2)
    wrapper.unmount()
  })

  it('stops polling once the subscription lands', async () => {
    // Subscription appears on the 3rd attempt (webhook lands mid-poll).
    let calls = 0
    h.getCurrentSubscription.mockImplementation(async () => {
      calls++
      if (calls >= 3) h.sub.current = { plan_name: 'Solo' }
    })

    const wrapper = mountSuccess()
    await tick(0)      // attempt 1 → null
    await tick(1000)   // attempt 2 → null
    await tick(1000)   // attempt 3 → subscription lands, loop breaks
    await tick(8000)   // extra time: no further polling should occur

    expect(h.getCurrentSubscription).toHaveBeenCalledTimes(3)
    wrapper.unmount()
  })
})
