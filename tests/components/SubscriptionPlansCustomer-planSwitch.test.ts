/**
 * Contract tests for the plan-switch flow hardening on
 * SubscriptionPlansCustomer.vue (issue #263).
 *
 * Two bugs in selectPlan() are pinned here by OUTCOME (not by internal timer
 * mechanics), so the tests survive the refactor that fixes them:
 *
 *   1. Downgrade-to-free RACE (current L724-769):
 *        cancelSubscription(immediate) → hardcoded setTimeout(1500) → activate
 *        the free plan (createCheckoutSession).
 *      The free plan is activated after a FIXED 1.5s delay regardless of whether
 *      the cancellation has actually landed on the backend. If it hasn't, the
 *      user is left cancelled — possibly with NO free plan. The fix must AWAIT a
 *      confirmed-cancelled state (pollUntil already exists in the codebase) and,
 *      if that state never arrives, surface an error WITHOUT activating.
 *
 *      Pinned outcomes:
 *        (a) ordering — the free-plan activation must observe an already
 *            cancelled subscription state at the moment it fires. Current code
 *            fires at T+1.5s while the sub is still active → RED.
 *        (b) never-confirms — if the cancelled state never arrives, NO free
 *            plan is activated and an error is surfaced. Current code activates
 *            blindly at T+1.5s and reports success → RED.
 *
 *   2. Native/imperative confirm() dialogs on the free→paid upgrade and the
 *      paid→paid proration confirmations (current code awaits `showConfirm`, an
 *      imperative ElMessageBox). The fix replaces them with a declarative
 *      BaseModal confirmation (like the existing coupon modal in this
 *      component).
 *
 *      Pinned outcomes:
 *        - clicking a paid plan while on another paid plan renders a declarative
 *          confirmation modal carrying the proration message; the imperative
 *          `showConfirm` dialog is NOT used; upgradePlan runs only once that
 *          modal is confirmed.
 *        - clicking a paid plan while on the free plan renders the same
 *          declarative confirmation modal instead of the imperative dialog.
 *
 * ---------------------------------------------------------------------------
 * CONTRACT for the frontend-dev (DOM/behaviour hooks these tests drive):
 *   - A single reusable plan-change confirmation modal (BaseModal) replaces the
 *     imperative showConfirm on both the free→paid and paid→paid branches. It
 *     exposes:
 *       [data-test="confirm-plan-change"]  — the confirm button that proceeds
 *       [data-test="cancel-plan-change"]   — the cancel button that aborts
 *     and renders the proration copy (t('subscriptions.prorationAlwaysInvoiceDesc'))
 *     in its body on the paid→paid path.
 *   - The downgrade-to-free branch replaces `setTimeout(1500)` with pollUntil
 *     over the subscription state and only calls createCheckoutSession once the
 *     store reports the subscription is no longer active; on timeout it calls
 *     showError and does NOT call createCheckoutSession.
 * If you choose different hooks, update these tests in lock-step — the
 * assertions (ordering, no-activation-on-timeout, declarative modal) are the
 * contract; the selectors are just how we reach them.
 *
 * NOTE for the GREEN phase: the two sibling files' #2 (free→paid) and #4
 * (paid→paid) tests drive these same branches through the auto-confirmed
 * `showConfirm` mock. Once the confirmation becomes a BaseModal, those two must
 * be updated to click [data-test="confirm-plan-change"] — the payload
 * assertions stay, only the confirmation interaction is inserted.
 * ---------------------------------------------------------------------------
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

// Spies / mutable state referenced inside vi.mock factories must be created via
// vi.hoisted — vi.mock is hoisted above the plain consts below.
const {
  createCheckoutSession,
  upgradePlan,
  cancelSubscription,
  getCurrentSubscription,
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
  getCurrentSubscription: vi.fn().mockResolvedValue(undefined),
  // current / hasActive are mutated per-test (and, in the race tests, flipped
  // partway through to model an eventually-consistent backend).
  subState: { current: null as any, hasActive: false, error: null as string | null },
  userState: { emailVerified: true },
  routerPush: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  // Auto-confirms the imperative dialog. On the GREEN code this is NEVER called
  // for the free→paid / paid→paid confirmations — they become a BaseModal.
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
    getCurrentSubscription,
    getAllSubscriptions: vi.fn().mockResolvedValue(undefined),
    createCheckoutSession,
    upgradePlan,
    cancelSubscription,
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

vi.mock('../../src/router/index', () => ({
  default: { push: routerPush },
}))
vi.mock('../../src/router/index.ts', () => ({
  default: { push: routerPush },
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showError, showSuccess, showConfirm }),
}))

import SubscriptionPlansCustomer from '../../src/components/Pages/SubscriptionPlansCustomer.vue'

const ORIGIN = window.location.origin

// Register the proration strings so the confirmation modal body renders
// assertable copy (with the default empty messages vue-i18n echoes the key).
function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en: {
        subscriptions: {
          changePlanWarning: 'You are about to change your subscription plan.',
          prorationAlwaysInvoiceDesc:
            'You will be charged a prorated amount immediately for this change.',
        },
      },
      fr: {},
    },
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

// An active, personal (non-assigned) paid subscription on the Solo plan.
function paidSoloSubscription() {
  return {
    id: 'sub-1',
    subscription_plan_id: 'plan-solo',
    subscription_plan: { id: 'plan-solo', name: 'Solo', priority: 10 },
    plan_name: 'Solo',
    subscription_type: 'personal',
  }
}

// An active, personal (non-assigned) free subscription on the Free plan.
function freeSubscription() {
  return {
    id: 'sub-free',
    subscription_plan_id: 'plan-free',
    subscription_plan: { id: 'plan-free', name: 'Free', priority: 0 },
    plan_name: 'Free',
    subscription_type: 'personal',
  }
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

async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

beforeEach(() => {
  setActivePinia(createPinia())
  createCheckoutSession.mockReset().mockResolvedValue({ url: 'https://stripe.test/session' })
  upgradePlan.mockReset().mockResolvedValue(undefined)
  cancelSubscription.mockReset().mockResolvedValue(undefined)
  getCurrentSubscription.mockReset().mockResolvedValue(undefined)
  showError.mockReset()
  showSuccess.mockReset()
  showConfirm.mockReset().mockResolvedValue(true)
  routerPush.mockReset()
  subState.current = null
  subState.hasActive = false
  subState.error = null
  userState.emailVerified = true
})

afterEach(() => {
  vi.useRealTimers()
})

// =========================================================================
// Bug 1 — downgrade-to-free must await a confirmed cancellation
// =========================================================================
describe('SubscriptionPlansCustomer — downgrade-to-free awaits confirmed cancellation', () => {
  it('activates the free plan only after the cancellation is confirmed (never while the sub is still active)', async () => {
    // Start on an active paid plan.
    subState.current = paidSoloSubscription()
    subState.hasActive = true

    const wrapper = mountPage([FREE_PLAN, PAID_PLAN])
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Record the subscription state observed at the instant the free plan is
    // activated. The contract: activation must happen only after the sub is
    // reported cancelled — i.e. hasActive === false at activation time.
    let activeAtActivation: boolean | null = null
    createCheckoutSession.mockImplementation(async () => {
      activeAtActivation = subState.hasActive
      return { free_plan: true }
    })

    vi.useFakeTimers()

    // The backend reflects the cancellation only at T+3s — LATER than the
    // current code's fixed 1.5s activation window.
    setTimeout(() => {
      subState.hasActive = false
      subState.current = null
    }, 3000)

    const p = (wrapper.vm as any).selectPlan(FREE_PLAN)
    // Advance past both the flip (3s) and any bounded poll budget.
    await vi.advanceTimersByTimeAsync(6000)
    await p

    expect(createCheckoutSession, 'the free plan must eventually be activated').toHaveBeenCalledTimes(1)
    // RED today: current code activates at T+1.5s, while hasActive is still true
    // (the flip is at T+3s) → activeAtActivation === true.
    expect(
      activeAtActivation,
      'free-plan activation must observe an already-cancelled subscription, not race a still-active one',
    ).toBe(false)
  })

  it('surfaces an error and does NOT activate the free plan when the cancellation never confirms', async () => {
    // Start on an active paid plan; the cancellation NEVER lands (state stays
    // active for the whole flow).
    subState.current = paidSoloSubscription()
    subState.hasActive = true

    const wrapper = mountPage([FREE_PLAN, PAID_PLAN])
    await flushPromises()
    await wrapper.vm.$nextTick()

    createCheckoutSession.mockResolvedValue({ free_plan: true })

    vi.useFakeTimers()

    const p = (wrapper.vm as any).selectPlan(FREE_PLAN)
    // Exhaust any reasonable poll budget (pollUntil default ~10s).
    await vi.advanceTimersByTimeAsync(20000)
    await p

    // The cancellation itself is still attempted.
    expect(cancelSubscription).toHaveBeenCalledTimes(1)
    // RED today: current code activates the free plan blindly at T+1.5s.
    expect(
      createCheckoutSession,
      'must not activate a free plan when the cancellation was never confirmed',
    ).not.toHaveBeenCalled()
    // RED today: current code reports success instead of an error.
    expect(showError, 'the user must be told the downgrade could not complete').toHaveBeenCalled()
    expect(showSuccess).not.toHaveBeenCalled()
  })
})

// =========================================================================
// Bug 2 — declarative BaseModal confirmations replace imperative showConfirm
// =========================================================================
describe('SubscriptionPlansCustomer — plan-change confirmations use a modal, not an imperative dialog', () => {
  it('confirms a paid→paid change in a modal carrying the proration message, then upgrades', async () => {
    // Active paid plan (Solo); target a different paid plan (Pro).
    subState.current = paidSoloSubscription()
    subState.hasActive = true

    const wrapper = mountPage([PAID_PLAN, PAID_PLAN_B])
    await flushPromises()
    await wrapper.vm.$nextTick()

    await clickSubscribe(wrapper, 'Pro')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // RED today: the paid→paid branch awaits the imperative showConfirm dialog.
    expect(
      showConfirm,
      'the confirmation must be a declarative modal, not the imperative showConfirm dialog',
    ).not.toHaveBeenCalled()

    const confirmBtn = wrapper.find('[data-test="confirm-plan-change"]')
    expect(
      confirmBtn.exists(),
      'a declarative plan-change confirmation modal should render',
    ).toBe(true)

    // The proration copy must be visible so the user knows they are billed now.
    expect(wrapper.text()).toContain('prorated amount immediately')

    // The upgrade must NOT fire until the user confirms in the modal.
    expect(upgradePlan, 'upgrade must wait for explicit confirmation').not.toHaveBeenCalled()

    await confirmBtn.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(upgradePlan).toHaveBeenCalledTimes(1)
    expect(upgradePlan).toHaveBeenCalledWith('plan-pro', 'always_invoice')
  })

  it('confirms a free→paid upgrade in a modal, not the imperative dialog', async () => {
    // Active FREE plan; target a paid plan (Solo).
    subState.current = freeSubscription()
    subState.hasActive = true

    const wrapper = mountPage([FREE_PLAN, PAID_PLAN])
    await flushPromises()
    await wrapper.vm.$nextTick()

    await clickSubscribe(wrapper, 'Solo')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // RED today: the free→paid branch awaits the imperative showConfirm dialog
    // (then opens the coupon modal directly).
    expect(
      showConfirm,
      'the free→paid confirmation must be a declarative modal, not showConfirm',
    ).not.toHaveBeenCalled()

    expect(
      wrapper.find('[data-test="confirm-plan-change"]').exists(),
      'a declarative plan-change confirmation modal should render before checkout',
    ).toBe(true)
  })
})
