/**
 * Behavioral / contract tests for the direct-to-Stripe checkout refactor on
 * SubscriptionPlansCustomer.vue (issue #5).
 *
 * These pin the OUTGOING checkout payload at the backend boundary — the args
 * passed to the subscriptions store's `createCheckoutSession` /
 * `upgradePlan` — plus the user-observable rendered state (disabled Subscribe
 * button + verify hint when the email is unverified). That payload is the
 * exact bug class this refactor must not regress:
 *   - coupon dropped (4th arg)
 *   - wrong success/cancel URLs (2nd/3rd arg)
 *   - missing allow_replace on free→paid (5th arg) → backend 400
 *   - paid→paid redirected to Stripe → double charge
 *   - unverified user able to start a paid checkout
 *
 * They are NOT hollow "the mock was called" assertions: each one frames a
 * concrete contract the user depends on (a coupon they typed reaches Stripe,
 * a free plan gets replaced instead of erroring, an unverified user is
 * blocked from paying).
 *
 * EXPECTED STATE against current code:
 *   #1, #2, #5  → RED   (coupon modal, direct-to-Stripe paid handler, and the
 *                        disabled-when-unverified state do not exist yet)
 *   #4          → GREEN (regression guard: paid→paid already calls upgradePlan
 *                        and must keep NOT redirecting to Stripe)
 *
 * ---------------------------------------------------------------------------
 * CONTRACT for the frontend-dev (the DOM hooks these tests drive):
 *   - Each paid Subscribe button is reachable via its rendered text
 *     (getPlanButtonText → "Subscribe" / "Start Trial" / "Upgrade").
 *   - The new coupon step exposes:
 *       [data-test="coupon-input"]   — the optional coupon <input>
 *       [data-test="coupon-confirm"] — the confirm/Subscribe button that fires
 *                                      createCheckoutSession
 *   - The unverified gate renders:
 *       a Subscribe button with the `disabled` attribute, AND
 *       [data-test="verify-email-hint"] — a hint/link pointing the user to
 *                                         email verification.
 * If you choose different hooks, update these tests in lock-step — the
 * assertions (payload args, disabled state) are the contract; the selectors
 * are just how we reach them.
 * ---------------------------------------------------------------------------
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mocks (must be declared before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({
    isAdmin: { value: false },
    shouldFilterAsStandardUser: { value: true },
    shouldShowAllData: { value: false },
  }),
}))

// All spies / mutable state referenced inside vi.mock factories must be created
// via vi.hoisted — vi.mock is hoisted to the top of the file, so plain `const`s
// below it are not yet initialized when the factories run.
const {
  createCheckoutSession,
  upgradePlan,
  cancelSubscription,
  subState,
  userState,
  routerPush,
  showError,
  showSuccess,
  showConfirm,
} = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
  upgradePlan: vi.fn().mockResolvedValue(undefined),
  cancelSubscription: vi.fn().mockResolvedValue(undefined),
  // currentSubscription / hasActiveSubscription are mutated per-test.
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
    cancelSubscription,
  }),
}))

// --- current-user store stub: drives the email-verification gate ---
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    get emailVerified() {
      return userState.emailVerified
    },
  }),
}))

// --- plans store stub ---
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

// --- router stub: assert paid→paid does NOT navigate to Stripe/Checkout ---
vi.mock('../../src/router/index', () => ({
  default: { push: routerPush },
}))
vi.mock('../../src/router/index.ts', () => ({
  default: { push: routerPush },
}))

// --- notification stub: auto-confirm every dialog so the flow proceeds ---
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showError, showSuccess, showConfirm }),
}))

import SubscriptionPlansCustomer from '../../src/components/Pages/SubscriptionPlansCustomer.vue'

// --- happy-dom origin used by the handler to build the success/cancel URLs ---
const ORIGIN = window.location.origin

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

const FREE_PLAN = {
  id: 'plan-free',
  name: 'Free',
  price_amount: 0,
  currency: 'eur',
  billing_interval: 'month',
  is_active: true,
  priority: 0,
}

const PAID_PLAN = {
  id: 'plan-solo',
  name: 'Solo',
  price_amount: 1200,
  currency: 'eur',
  billing_interval: 'month',
  is_active: true,
  priority: 10,
}

const PAID_PLAN_B = {
  id: 'plan-pro',
  name: 'Pro',
  price_amount: 3900,
  currency: 'eur',
  billing_interval: 'month',
  is_active: true,
  priority: 20,
}

function mountPage(plans: any[]) {
  planEntities.length = 0
  planEntities.push(...plans)
  setActivePinia(createPinia())
  return mount(SubscriptionPlansCustomer, {
    global: {
      plugins: [createTestI18n()],
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

// Click the (grid) Subscribe button for `planName` by its rendered text.
async function clickSubscribe(wrapper: any, planName: string) {
  const card = wrapper
    .findAll('.plan-card-compact')
    .find((c: any) => c.text().includes(planName))
  expect(card, `plan card for ${planName} should render`).toBeTruthy()
  const btn = card.find('button.btn-subscribe-compact')
  expect(btn.exists(), `Subscribe button for ${planName} should render`).toBe(true)
  await btn.trigger('click')
  await wrapper.vm.$nextTick()
  return btn
}

// Walk the coupon step (new modal): fill the coupon, confirm. Falls back to a
// no-op if the hooks don't exist yet — the test then fails on the payload
// assertion (RED), which is the contract we care about.
async function completeCouponStep(wrapper: any, coupon?: string) {
  await wrapper.vm.$nextTick()
  if (coupon !== undefined) {
    const input = wrapper.find('[data-test="coupon-input"]')
    if (input.exists()) await input.setValue(coupon)
  }
  const confirm = wrapper.find('[data-test="coupon-confirm"]')
  if (confirm.exists()) {
    await confirm.trigger('click')
    await wrapper.vm.$nextTick()
    await flushPromises()
  }
}

async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Confirm the declarative plan-change modal (free→paid and paid→paid now route
// through it before proceeding — see issue #263). Replaces the auto-confirmed
// showConfirm mock that used to advance these flows.
async function confirmPlanChange(wrapper: any) {
  const confirm = wrapper.find('[data-test="confirm-plan-change"]')
  expect(confirm.exists(), 'plan-change confirmation modal should render').toBe(true)
  await confirm.trigger('click')
  await wrapper.vm.$nextTick()
  await flushPromises()
}

describe('SubscriptionPlansCustomer — direct-to-Stripe checkout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    createCheckoutSession.mockReset().mockResolvedValue({ url: 'https://stripe.test/session' })
    upgradePlan.mockReset().mockResolvedValue(undefined)
    cancelSubscription.mockReset().mockResolvedValue(undefined)
    showError.mockReset()
    showSuccess.mockReset()
    showConfirm.mockReset().mockResolvedValue(true)
    routerPush.mockReset()
    subState.current = null
    subState.hasActive = false
    subState.error = null
    userState.emailVerified = true
  })

  // ---- #1 Coupon reaches checkout (+ correct success/cancel URLs) ----
  describe('#1 coupon + URLs reach createCheckoutSession (new paid, no sub)', () => {
    it('passes the typed coupon as the 4th arg and the /checkout-success and /checkout-canceled URLs', async () => {
      userState.emailVerified = true
      subState.current = null
      subState.hasActive = false

      const wrapper = mountPage([PAID_PLAN])
      await flushPromises()
      await wrapper.vm.$nextTick()

      await clickSubscribe(wrapper, 'Solo')
      await completeCouponStep(wrapper, 'SUMMER25')

      expect(createCheckoutSession).toHaveBeenCalledTimes(1)
      const [planId, successUrl, cancelUrl, coupon] = createCheckoutSession.mock.calls[0]
      expect(planId).toBe('plan-solo')
      expect(successUrl).toBe(`${ORIGIN}/checkout-success`)
      // Cancel URL now carries the picked plan so the canceled page can offer a
      // Retry that returns straight to it (issue #270).
      expect(cancelUrl).toBe(`${ORIGIN}/checkout-canceled?planId=plan-solo`)
      expect(coupon).toBe('SUMMER25')
    })

    it('passes undefined as the 4th arg when the coupon field is left empty', async () => {
      userState.emailVerified = true
      subState.current = null
      subState.hasActive = false

      const wrapper = mountPage([PAID_PLAN])
      await flushPromises()
      await wrapper.vm.$nextTick()

      await clickSubscribe(wrapper, 'Solo')
      await completeCouponStep(wrapper, '')

      expect(createCheckoutSession).toHaveBeenCalledTimes(1)
      const coupon = createCheckoutSession.mock.calls[0][3]
      expect(coupon).toBeUndefined()
    })
  })

  // ---- #2 Free→paid replaces the free subscription (allow_replace=true) ----
  it('#2 free→paid passes allowReplace=true (5th arg) so the backend replaces the free sub', async () => {
    userState.emailVerified = true
    // Active FREE subscription on the Free plan.
    subState.current = {
      subscription_plan_id: 'plan-free',
      subscription_plan: { id: 'plan-free', name: 'Free', priority: 0 },
      plan_name: 'Free',
      subscription_type: 'personal',
    }
    subState.hasActive = true

    const wrapper = mountPage([FREE_PLAN, PAID_PLAN])
    await flushPromises()
    await wrapper.vm.$nextTick()

    await clickSubscribe(wrapper, 'Solo')
    await confirmPlanChange(wrapper)
    await completeCouponStep(wrapper, '')

    expect(createCheckoutSession).toHaveBeenCalledTimes(1)
    const call = createCheckoutSession.mock.calls[0]
    expect(call[0]).toBe('plan-solo')
    expect(call[1]).toBe(`${ORIGIN}/checkout-success`)
    // Cancel URL now carries the picked plan (issue #270).
    expect(call[2]).toBe(`${ORIGIN}/checkout-canceled?planId=plan-solo`)
    expect(call[4]).toBe(true)
    // Must NOT route into the removed in-app Checkout wizard.
    expect(routerPush).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Checkout' })
    )
  })

  // ---- #4 paid→paid is untouched (regression guard — expected GREEN) ----
  it('#4 paid→paid calls upgradePlan("always_invoice"), never createCheckoutSession, never redirects', async () => {
    userState.emailVerified = true
    // Active PAID subscription on Solo; target a different paid plan (Pro).
    subState.current = {
      subscription_plan_id: 'plan-solo',
      subscription_plan: { id: 'plan-solo', name: 'Solo', priority: 10 },
      plan_name: 'Solo',
      subscription_type: 'personal',
    }
    subState.hasActive = true

    const wrapper = mountPage([PAID_PLAN, PAID_PLAN_B])
    await flushPromises()
    await wrapper.vm.$nextTick()

    await clickSubscribe(wrapper, 'Pro')
    await confirmPlanChange(wrapper)

    expect(upgradePlan).toHaveBeenCalledTimes(1)
    expect(upgradePlan).toHaveBeenCalledWith('plan-pro', 'always_invoice')
    expect(createCheckoutSession).not.toHaveBeenCalled()
    // No Stripe redirect — redirecting here would double-charge.
    expect(routerPush).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Checkout' })
    )
  })

  // ---- #5 Unverified email gate ----
  describe('#5 email-verification gate on the paid Subscribe action', () => {
    it('renders the Subscribe button disabled and a verify hint when the email is unverified', async () => {
      userState.emailVerified = false
      subState.current = null
      subState.hasActive = false

      const wrapper = mountPage([PAID_PLAN])
      await flushPromises()
      await wrapper.vm.$nextTick()

      const card = wrapper
        .findAll('.plan-card-compact')
        .find((c: any) => c.text().includes('Solo'))
      const btn = card.find('button.btn-subscribe-compact')
      expect(btn.attributes('disabled')).toBeDefined()

      expect(wrapper.find('[data-test="verify-email-hint"]').exists()).toBe(true)
    })

    it('does not start a checkout while the email is unverified', async () => {
      userState.emailVerified = false
      subState.current = null
      subState.hasActive = false

      const wrapper = mountPage([PAID_PLAN])
      await flushPromises()
      await wrapper.vm.$nextTick()

      // Even if the disabled attr is bypassed, the handler must guard.
      await (wrapper.vm as any).selectPlan(PAID_PLAN)
      await flushPromises()

      expect(createCheckoutSession).not.toHaveBeenCalled()
    })

    it('enables the Subscribe button once the email is verified', async () => {
      userState.emailVerified = true
      subState.current = null
      subState.hasActive = false

      const wrapper = mountPage([PAID_PLAN])
      await flushPromises()
      await wrapper.vm.$nextTick()

      const card = wrapper
        .findAll('.plan-card-compact')
        .find((c: any) => c.text().includes('Solo'))
      const btn = card.find('button.btn-subscribe-compact')
      expect(btn.attributes('disabled')).toBeUndefined()
    })
  })

  // ---- Volume (bulk) pricing visibility gate ----
  // WHY: 2026-07-10. `hasBulkPurchaseFeature` gated the "Voir les tarifs en
  // volume" entry point behind `isAdmin`. Real trainers are Casbin `Member`s,
  // never platform admins, so the exact users the Trainer plan's degressive
  // pricing targets never saw the PricingCalculator entry point. The section
  // must show for ANY plan with `use_tiered_pricing === true`, regardless of
  // admin status. These render as a NON-admin (the default useAdminViewMode
  // mock above returns isAdmin=false), i.e. as a real trainer would.
  const TIERED_PLAN = {
    id: 'plan-trainer',
    name: 'Formateur',
    price_amount: 3900,
    currency: 'eur',
    billing_interval: 'month',
    is_active: true,
    priority: 15,
    use_tiered_pricing: true,
  }

  const FLAT_PLAN = {
    id: 'plan-flat',
    name: 'Flat',
    price_amount: 1200,
    currency: 'eur',
    billing_interval: 'month',
    is_active: true,
    priority: 12,
    use_tiered_pricing: false,
  }

  describe('volume pricing section visibility', () => {
    function findCard(wrapper: any, planName: string) {
      return wrapper
        .findAll('.plan-card-compact')
        .find((c: any) => c.text().includes(planName))
    }

    it('shows the volume pricing section to non-admin users for a tiered-pricing plan', async () => {
      const wrapper = mountPage([TIERED_PLAN])
      await flushPromises()
      await wrapper.vm.$nextTick()

      const card = findCard(wrapper, 'Formateur')
      expect(card, 'plan card should render').toBeTruthy()
      // The entry point to the PricingCalculator — its section and the
      // "view bulk pricing" button must be present for a real trainer.
      expect(card.find('.bulk-purchase-section').exists()).toBe(true)
      expect(card.find('button.btn-bulk-purchase').exists()).toBe(true)
    })

    it('does not show the volume pricing section for plans without tiered pricing', async () => {
      const wrapper = mountPage([FLAT_PLAN])
      await flushPromises()
      await wrapper.vm.$nextTick()

      const card = findCard(wrapper, 'Flat')
      expect(card, 'plan card should render').toBeTruthy()
      expect(card.find('.bulk-purchase-section').exists()).toBe(false)
    })
  })

  // ---- Checkout modal i18n key resolution ----
  // WHY: 2026-07-10 payment go-live review. The coupon/checkout modal is the
  // last screen a paying customer sees before Stripe. Its strings are
  // registered under a top-level `checkout` namespace, but the template reads
  // them under `plans.checkout.*` — so every label resolves to a raw dotted
  // key (e.g. "plans.checkout.subscribeTo") shown verbatim to the customer.
  // These pin the RESOLVED text so a broken key path can't slip through again.
  // They read visible rendered text (not data-test selectors) on purpose — a
  // selector-only test would happily pass on a raw key.
  describe('checkout modal renders resolved strings, not raw i18n keys', () => {
    async function openCouponModal() {
      const wrapper = mountPage([PAID_PLAN])
      await flushPromises()
      await wrapper.vm.$nextTick()
      await clickSubscribe(wrapper, 'Solo')
      await wrapper.vm.$nextTick()
      await flushPromises()
      return wrapper
    }

    it('renders the resolved modal title, not the raw plans.checkout.subscribeTo key', async () => {
      const wrapper = await openCouponModal()

      const title = wrapper.find('.base-modal-title')
      expect(title.exists(), 'checkout modal title should render').toBe(true)
      expect(title.text()).not.toContain('plans.checkout.')
      // Registered EN string is "Subscribe to {plan}".
      expect(title.text()).toContain('Subscribe to Solo')
    })

    it('renders the resolved coupon label, not the raw plans.checkout.couponCode key', async () => {
      const wrapper = await openCouponModal()

      const label = wrapper.find('label[for="couponCode"]')
      expect(label.exists(), 'coupon label should render').toBe(true)
      expect(label.text()).not.toContain('plans.checkout.')
      expect(label.text()).toBe('Coupon Code')
    })

    it('renders the resolved coupon placeholder, not the raw plans.checkout.couponPlaceholder key', async () => {
      const wrapper = await openCouponModal()

      const input = wrapper.find('[data-test="coupon-input"]')
      expect(input.exists(), 'coupon input should render').toBe(true)
      const placeholder = input.attributes('placeholder') ?? ''
      expect(placeholder).not.toContain('plans.checkout.')
      expect(placeholder).toBe('Enter coupon code')
    })

    it('renders the resolved cancel button, not the raw plans.checkout.cancel key', async () => {
      const wrapper = await openCouponModal()

      const cancel = wrapper.find('.btn-cancel-checkout')
      expect(cancel.exists(), 'cancel button should render').toBe(true)
      expect(cancel.text()).not.toContain('plans.checkout.')
      expect(cancel.text()).toBe('Cancel')
    })
  })
})
