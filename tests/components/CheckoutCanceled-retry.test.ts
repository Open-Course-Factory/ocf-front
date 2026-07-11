/**
 * Behavioral test for the Retry action on CheckoutCanceled.vue (issue #5,
 * Phase 3).
 *
 * Contract: after the checkout refactor there is no in-app `Checkout` route to
 * return to — Subscribe goes straight to Stripe. So the "Retry Payment" action
 * must send the user back to the plans page (route name `SubscriptionPlans`),
 * where they re-start the direct-to-Stripe flow. Today it pushes the (removed)
 * `Checkout` route, which would 404 once that route is deleted.
 *
 * EXPECTED STATE against current code: RED — current `retryCheckout` pushes
 * `{ name: 'Checkout', ... }` when a lastPlanId is present.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }))

// useRoute / useRouter are the only vue-router surface CheckoutCanceled uses.
// A planId in the query enables the Retry button (today it is `:disabled` until
// a lastPlanId is known) so we can drive the click and observe where it routes.
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { planId: 'plan-solo' } }),
  useRouter: () => ({ push: routerPush }),
}))

import CheckoutCanceled from '../../src/components/Flows/CheckoutCanceled.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountCanceled() {
  return mount(CheckoutCanceled, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        'router-link': {
          props: ['to'],
          template: '<a class="router-link-stub"><slot /></a>',
        },
      },
    },
  })
}

describe('CheckoutCanceled — Retry navigation', () => {
  beforeEach(() => {
    routerPush.mockReset()
    // No localStorage carry-over from the removed wizard.
    window.localStorage.clear()
  })

  it('routes Retry to the SubscriptionPlans page, not the removed Checkout route', async () => {
    const wrapper = mountCanceled()
    // onMounted sets lastPlanId from the route; the :disabled binding (and thus
    // the button's clickability) only reflects it after the next DOM flush.
    await wrapper.vm.$nextTick()

    // The Retry control is the only <button> on the page (every other action
    // is a router-link/anchor). It renders "Retry Payment" via the component's
    // own inline i18n.
    const retryBtn = wrapper
      .findAll('button')
      .find(b => b.text().toLowerCase().includes('retry'))
    expect(retryBtn, 'Retry button should render').toBeTruthy()
    expect(retryBtn!.attributes('disabled'), 'Retry should be enabled').toBeUndefined()

    await retryBtn!.trigger('click')

    expect(routerPush).toHaveBeenCalledTimes(1)
    const target = routerPush.mock.calls[0][0]
    expect(target).toMatchObject({ name: 'SubscriptionPlans' })
    expect(target).not.toMatchObject({ name: 'Checkout' })
  })

  // Persona finding (issue #270): Retry drops the plan the user had picked, so
  // they land on the bare plans list and must hunt for it again. The cancel URL
  // carries the planId in its query (`?planId=...`); Retry should forward it so
  // the plans page can restore that context. Today `retryCheckout` pushes
  // `{ name: 'SubscriptionPlans' }` with no query → RED.
  it('forwards the picked planId from the query so the plans page can restore it', async () => {
    const wrapper = mountCanceled()
    await wrapper.vm.$nextTick()

    const retryBtn = wrapper
      .findAll('button')
      .find(b => b.text().toLowerCase().includes('retry'))
    await retryBtn!.trigger('click')

    expect(routerPush).toHaveBeenCalledTimes(1)
    expect(routerPush.mock.calls[0][0]).toMatchObject({
      name: 'SubscriptionPlans',
      query: { planId: 'plan-solo' },
    })
  })
})
