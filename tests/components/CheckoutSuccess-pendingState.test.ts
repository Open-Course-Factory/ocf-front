/**
 * RED — reassuring pending states on CheckoutSuccess.vue (issue #270).
 *
 * CheckoutSuccess polls getCurrentSubscription() for ~10s after Stripe redirects
 * back, waiting for the webhook to sync the subscription. The webhook-lag POLL
 * itself is already covered by CheckoutSuccess-pollingGuard.test.ts. What is NOT
 * covered — and what the persona flagged — is the COPY the just-paid user reads
 * while (and after) that poll runs:
 *
 *   - Today the page shows the generic « Bienvenue … / abonnement activé avec
 *     succès » headline immediately, before anything is confirmed, and if the
 *     webhook is slow it stays on that headline with NO plan/amount — the user
 *     paid and sees an unverified "success" with nothing to back it up.
 *
 * Target contract (state-driven):
 *   1. WHILE polling  → an explicit "payment received, activation in progress"
 *      state, NOT the "activated successfully" claim, NOT the plan details.
 *   2. POLL EXHAUSTED → a reassuring "payment received, activation takes a
 *      moment, it will appear in your dashboard" state with a dashboard link and
 *      a manual refresh affordance — explicitly NOT an error, NOT the bare
 *      "activated successfully" welcome.
 *   3. POLL SUCCEEDS  → the activated welcome + plan name + amount (guard).
 *
 * `t` is stubbed to echo its key, so assertions are on translation KEYS:
 *   - checkoutSuccess.subtitle          → the "activated successfully" claim
 *   - checkoutSuccess.pendingActivating → the in-progress reassurance
 *   - checkoutSuccess.pendingMessage    → the exhausted reassurance
 *   - checkoutSuccess.refresh           → the manual re-check affordance
 *   - checkoutSuccess.title             → the activated welcome headline
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
      // Render `to` as an href so we can assert on link targets.
      stubs: { 'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' } },
    },
  })
}

async function tick(ms = 0) {
  await vi.advanceTimersByTimeAsync(ms)
  await nextTick()
}

describe('CheckoutSuccess — reassuring pending copy [red]', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    h.getCurrentSubscription.mockReset()
    h.sub.current = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('while polling: shows the activation-in-progress reassurance, not a bare "activated" welcome', async () => {
    // Webhook not landed yet → still polling on the first tick.
    h.getCurrentSubscription.mockImplementation(async () => { /* current stays null */ })

    const wrapper = mountSuccess()
    await tick(0) // first attempt done, subscription absent → polling state

    const html = wrapper.html()
    // Reassuring in-progress copy is shown.
    expect(html).toContain('checkoutSuccess.pendingActivating')
    // The premature "activated successfully" claim is NOT shown while pending.
    expect(html).not.toContain('checkoutSuccess.subtitle')
    // No plan details are asserted yet (nothing to confirm).
    expect(html).not.toContain('checkoutSuccess.subscriptionDetails')

    wrapper.unmount()
  })

  it('poll exhausted: shows reassuring pending message + dashboard link + refresh, not an error or bare welcome', async () => {
    // Webhook never lands during the window → poll budget drains.
    h.getCurrentSubscription.mockImplementation(async () => { /* current stays null */ })

    const wrapper = mountSuccess()
    await tick(0)
    await tick(12000) // drain the whole poll budget → exhausted state

    const html = wrapper.html()
    // Reassuring "it will appear in your dashboard" copy.
    expect(html).toContain('checkoutSuccess.pendingMessage')
    // A manual re-check affordance is offered (poll may continue on demand).
    expect(html).toContain('checkoutSuccess.refresh')
    // A link back to the dashboard is present.
    const hrefs = wrapper.findAll('a').map(a => a.attributes('href'))
    expect(hrefs.some(href => href?.includes('/subscription-dashboard'))).toBe(true)
    // Explicitly NOT the false "activated successfully" claim.
    expect(html).not.toContain('checkoutSuccess.subtitle')

    wrapper.unmount()
  })

  it('poll exhausted: the refresh affordance re-polls the subscription', async () => {
    h.getCurrentSubscription.mockImplementation(async () => { /* current stays null */ })

    const wrapper = mountSuccess()
    await tick(0)
    await tick(12000) // exhausted

    const callsBefore = h.getCurrentSubscription.mock.calls.length
    const refreshBtn = wrapper
      .findAll('button')
      .find(b => b.text().toLowerCase().includes('refresh'))
    expect(refreshBtn, 'a refresh button should render in the exhausted state').toBeTruthy()

    await refreshBtn!.trigger('click')
    await tick(0)

    expect(h.getCurrentSubscription.mock.calls.length).toBeGreaterThan(callsBefore)
    wrapper.unmount()
  })

  it('poll succeeds: renders the activated welcome with plan name and amount [guard]', async () => {
    // Subscription lands on the first attempt.
    h.getCurrentSubscription.mockImplementation(async () => {
      h.sub.current = { plan_name: 'Solo', amount: 12, currency: 'EUR' }
    })

    const wrapper = mountSuccess()
    await tick(0)

    const html = wrapper.html()
    // Activated welcome headline is shown only now that activation is confirmed.
    expect(html).toContain('checkoutSuccess.title')
    // Plan + amount confirmation renders.
    expect(html).toContain('Solo')
    expect(html).toContain('12 EUR')

    wrapper.unmount()
  })
})
