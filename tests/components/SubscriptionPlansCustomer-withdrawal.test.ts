/**
 * The withdrawal waiver at checkout.
 *
 * A consumer buying a digital service in the EU keeps a 14-day right to
 * withdraw. A service that starts immediately can only keep the money if the
 * buyer expressly asked for that immediate start AND acknowledged losing the
 * right once the service has been performed. The terms now say so — these tests
 * pin the place where the buyer actually says it, because a clause in a document
 * nobody clicks is not consent.
 *
 * What is pinned: no acknowledgment, no Stripe session. Not the wording, not the
 * markup — the boundary call.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({
    isAdmin: { value: false },
    shouldFilterAsStandardUser: { value: true },
    shouldShowAllData: { value: false },
  }),
}))

const { createCheckoutSession, upgradePlan, subState, userState, routerPush, showError, showSuccess, showConfirm } =
  vi.hoisted(() => ({
    createCheckoutSession: vi.fn(),
    upgradePlan: vi.fn().mockResolvedValue(undefined),
    subState: { current: null as any, hasActive: false, error: null as string | null },
    userState: { emailVerified: true },
    routerPush: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showConfirm: vi.fn().mockResolvedValue(true),
  }))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    get currentSubscription() {
      return subState.current
    },
    get allSubscriptions() {
      return subState.current ? [subState.current] : []
    },
    get error() {
      return subState.error
    },
    hasActiveSubscription: () => subState.hasActive,
    getCurrentSubscription: vi.fn().mockResolvedValue(undefined),
    getAllSubscriptions: vi.fn().mockResolvedValue(undefined),
    createCheckoutSession,
    upgradePlan,
    cancelSubscription: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    get emailVerified() {
      return userState.emailVerified
    },
  }),
}))

const planEntities: any[] = []
vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({
    entities: planEntities,
    isLoading: false,
    error: null,
    formatPrice: (amount: number, currency: string) => `${amount} ${currency}`,
    formatBillingInterval: (i: string) => i,
    canViewPlan: () => true,
    ensurePlansLoaded: vi.fn().mockResolvedValue(undefined),
    selectPlan: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../src/router/index', () => ({ default: { push: routerPush } }))
vi.mock('../../src/router/index.ts', () => ({ default: { push: routerPush } }))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showError, showSuccess, showConfirm }),
}))

import SubscriptionPlansCustomer from '../../src/components/Pages/SubscriptionPlansCustomer.vue'

const PAID_PLAN = {
  id: 'plan-solo',
  name: 'Solo',
  price_amount: 1200,
  currency: 'eur',
  billing_interval: 'month',
  is_active: true,
  priority: 10,
}

function mountPage(plans: any[]) {
  planEntities.length = 0
  planEntities.push(...plans)
  setActivePinia(createPinia())
  return mount(SubscriptionPlansCustomer, {
    global: {
      plugins: [
        createI18n({
          legacy: false,
          locale: 'en',
          fallbackLocale: 'en',
          messages: { en: {}, fr: {} },
          missingWarn: false,
          fallbackWarn: false,
        }),
      ],
      stubs: {
        AdminBadge: true,
        'router-link': {
          props: ['to'],
          template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  })
}

async function openCheckout(wrapper: any, planName: string) {
  const card = wrapper.findAll('.plan-card-compact').find((c: any) => c.text().includes(planName))
  expect(card, `plan card for ${planName} should render`).toBeTruthy()
  await card.find('button.btn-subscribe-compact').trigger('click')
  await wrapper.vm.$nextTick()
}

describe('withdrawal waiver at checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    subState.current = null
    subState.hasActive = false
    subState.error = null
    userState.emailVerified = true
    createCheckoutSession.mockResolvedValue({ url: 'https://checkout.stripe.com/x' })
  })

  it('offers the acknowledgment, unticked, when checkout opens', async () => {
    const wrapper = mountPage([PAID_PLAN])
    await openCheckout(wrapper, 'Solo')

    const waiver = wrapper.find('[data-test="withdrawal-waiver"]')
    expect(waiver.exists(), 'the buyer must be asked, not assumed to agree').toBe(true)
    expect((waiver.element as HTMLInputElement).checked).toBe(false)
  })

  it('refuses to create a Stripe session until the buyer acknowledges', async () => {
    const wrapper = mountPage([PAID_PLAN])
    await openCheckout(wrapper, 'Solo')

    await wrapper.find('[data-test="coupon-confirm"]').trigger('click')
    await flushPromises()

    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('lets the purchase through once acknowledged', async () => {
    const wrapper = mountPage([PAID_PLAN])
    await openCheckout(wrapper, 'Solo')

    await wrapper.find('[data-test="withdrawal-waiver"]').setValue(true)
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-test="coupon-confirm"]').trigger('click')
    await flushPromises()

    expect(createCheckoutSession).toHaveBeenCalledTimes(1)
  })

  it('does not carry consent over from an abandoned checkout', async () => {
    const wrapper = mountPage([PAID_PLAN])

    await openCheckout(wrapper, 'Solo')
    await wrapper.find('[data-test="withdrawal-waiver"]').setValue(true)
    await wrapper.vm.$nextTick()

    // Walk away, then come back: consent was given for a contract that was never
    // concluded, so the second purchase has to ask again.
    const cancel = wrapper.findAll('button').find((b: any) => b.classes().includes('btn-cancel-checkout'))
    await cancel!.trigger('click')
    await wrapper.vm.$nextTick()

    await openCheckout(wrapper, 'Solo')
    const waiver = wrapper.find('[data-test="withdrawal-waiver"]')
    expect((waiver.element as HTMLInputElement).checked).toBe(false)
  })

  it('points at the terms from the checkout step', async () => {
    const wrapper = mountPage([PAID_PLAN])
    await openCheckout(wrapper, 'Solo')

    const links = wrapper.findAll('.router-link-stub').map((l: any) => l.attributes('data-to'))
    expect(links.some((to: string | undefined) => (to ?? '').includes('/terms'))).toBe(true)
  })
})
