/**
 * Contract test for the "assigned (organization-managed) subscription" rule on
 * SubscriptionPlansCustomer.vue (issue #266, 2026-07-10 review, finding I5).
 *
 * The rule "is this a managed-by-org subscription?" is duplicated across the
 * frontend. Everywhere it is spelled:
 *     subscription_type === 'assigned' || !!subscription_batch_id
 * (SubscriptionDashboard.vue, ActiveSubscriptionSource.vue, TerminalStarter)
 * except on THIS page, where `isAssignedUser` checks ONLY
 *     subscription_type === 'assigned'
 *
 * Consequence for the user: a learner whose subscription was assigned via a
 * batch (has `subscription_batch_id` set) but whose `subscription_type` is not
 * 'assigned' sees the full self-service purchase page (plans grid + Subscribe
 * buttons) instead of the simplified "managed by your organization" view. They
 * could try to buy a plan they don't control.
 *
 * These assertions read USER-VISIBLE rendered state — which of the two mutually
 * exclusive views renders (`.assigned-user-view` vs `.plans-grid-compact`) — so
 * they survive the upcoming refactor that centralizes the rule into a shared
 * helper.
 *
 * EXPECTED STATE against current code:
 *   - batch-assigned (no subscription_type) → RED  (page shows the purchase grid)
 *   - subscription_type === 'assigned'      → GREEN (regression guard: the
 *                                                     existing half of the rule)
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

// All state referenced inside vi.mock factories must be created via vi.hoisted —
// vi.mock is hoisted above the plain consts below.
const { subState, userState, routerPush, showError, showSuccess, showConfirm } =
  vi.hoisted(() => ({
    // currentSubscription is mutated per-test.
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
    createCheckoutSession: vi.fn().mockResolvedValue({ url: 'https://stripe.test/session' }),
    upgradePlan: vi.fn().mockResolvedValue(undefined),
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

async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('SubscriptionPlansCustomer — managed-by-org (assigned) view', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    showError.mockReset()
    showSuccess.mockReset()
    showConfirm.mockReset().mockResolvedValue(true)
    routerPush.mockReset()
    subState.current = null
    subState.hasActive = false
    subState.error = null
    userState.emailVerified = true
  })

  it('shows the managed-by-org view to a batch-assigned learner without subscription_type', async () => {
    // Assigned via a batch: subscription_batch_id is set, but subscription_type
    // was never stamped 'assigned'. Every other screen treats this as assigned;
    // this page must too, or the learner sees a purchase page they can't use.
    subState.current = {
      subscription_plan_id: 'plan-solo',
      subscription_plan: { id: 'plan-solo', name: 'Solo' },
      plan_name: 'Solo',
      subscription_batch_id: '11111111-1111-1111-1111-111111111111',
      // subscription_type intentionally absent
    }
    subState.hasActive = true

    const wrapper = mountPage([PAID_PLAN])
    await flushPromises()
    await wrapper.vm.$nextTick()

    // The user sees the simplified managed-by-org card...
    expect(
      wrapper.find('.assigned-user-view').exists(),
      'batch-assigned learner should see the managed-by-org view',
    ).toBe(true)
    // ...and NOT the self-service purchase grid.
    expect(
      wrapper.find('.plans-grid-compact').exists(),
      'batch-assigned learner must not see the purchase grid',
    ).toBe(false)
  })

  it('shows the assigned view when subscription_type is assigned', async () => {
    // Regression guard: the existing half of the rule must keep working.
    subState.current = {
      subscription_plan_id: 'plan-solo',
      subscription_plan: { id: 'plan-solo', name: 'Solo' },
      plan_name: 'Solo',
      subscription_type: 'assigned',
    }
    subState.hasActive = true

    const wrapper = mountPage([PAID_PLAN])
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.assigned-user-view').exists()).toBe(true)
    expect(wrapper.find('.plans-grid-compact').exists()).toBe(false)
  })
})
