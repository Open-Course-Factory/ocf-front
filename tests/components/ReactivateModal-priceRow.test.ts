/**
 * Regression test for issue #265: the ReactivateModal price row.
 *
 * ReactivateModal.vue reads the plan price/interval as FLAT fields on the
 * subscription object (`subscription.plan_price`, `subscription.billing_interval`,
 * `subscription.currency`). The real UserSubscriptionOutput DTO nests those under
 * `subscription_plan` (`price_amount`, `billing_interval`, `currency`) — the same
 * shape every sibling component (ActiveSubscriptionSource, AllSubscriptions) reads.
 *
 * Because the price row is guarded by `v-if="subscription.plan_price"`, the wrong
 * field name makes the whole row silently vanish: the user confirms a reactivation
 * without seeing what they will be charged.
 *
 * These tests mount the modal with an HONEST fixture (nested subscription_plan) and
 * assert the price row IS rendered with the formatted price + interval. They are RED
 * until the component reads the nested fields.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// The subscriptionPlans store is instantiated by the modal; stub axios so no real
// HTTP is attempted on store init.
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

import ReactivateModal from '../../src/components/Subscription/Modals/ReactivateModal.vue'

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    // The modal supplies its own labels via useSubscriptionTranslations; an empty
    // bundle is enough to satisfy the plugin.
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

/**
 * A subscription shaped like the REAL backend DTO: price/interval/currency live
 * under `subscription_plan`, not on the root object.
 */
function realDtoSubscription() {
  return {
    id: 'sub-1',
    status: 'active',
    cancel_at_period_end: true,
    subscription_type: 'personal',
    current_period_end: '2026-08-01T00:00:00Z',
    subscription_plan: {
      id: 'plan-solo',
      name: 'Solo',
      price_amount: 1200, // cents → 12,00 €
      currency: 'EUR',
      billing_interval: 'month',
    },
  }
}

function mountModal(subscription: any, locale: 'en' | 'fr' = 'en') {
  setActivePinia(createPinia())
  return mount(ReactivateModal, {
    props: { visible: true, subscription },
    global: { plugins: [createTestI18n(locale)] },
  })
}

describe('ReactivateModal — reactivation summary price row (issue #265)', () => {
  it('renders the plan price and interval in the reactivation summary', () => {
    const wrapper = mountModal(realDtoSubscription())
    const text = wrapper.text()

    // formatCurrency(1200, 'EUR', 'fr-FR') → "12,00 €" (the space is a narrow
    // no-break space, so assert the numeric part and the symbol separately).
    expect(text).toContain('12,00')
    expect(text).toContain('€')
    // The billing interval must be shown next to the price.
    expect(text).toContain('month')
  })

  it('renders the plan name from the nested subscription_plan', () => {
    // Same nested-vs-flat bug: the modal reads subscription.plan_name (flat), which
    // the DTO does not provide — the plan name comes from subscription_plan.name.
    const wrapper = mountModal(realDtoSubscription())
    expect(wrapper.text()).toContain('Solo')
  })
})
