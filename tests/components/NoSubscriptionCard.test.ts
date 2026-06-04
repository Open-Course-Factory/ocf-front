/**
 * Tests for the no-subscription CTA panel (NoSubscriptionCard.vue), the
 * panel shown to users with no active subscription after the dashboard
 * consolidation.
 *
 * Contract pinned here: the "Start Free Trial" control is rendered and
 * clicking it emits `activateFreePlan` — the user-observable signal the
 * dashboard listens to in order to provision the free plan. If the button
 * stops emitting, a user can no longer start a free trial from this panel.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mocks (must be before component imports) ----

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

import NoSubscriptionCard from '../../src/components/Subscription/Dashboard/NoSubscriptionCard.vue'

/**
 * NoSubscriptionCard reads its copy through `useSubscriptionTranslations`,
 * which merges the subscription-plans store messages into the active i18n
 * instance lazily. In tests we preload the keys the panel renders so the
 * assertions can match real wording instead of raw translation keys.
 */
const subscriptionPlansMessages = {
  en: {
    subscriptionPlans: {
      current_subscription_plan: 'Current plan',
      no_active_subscription: 'No active subscription',
      subscribe_to_start: 'Subscribe to start',
      startFreeTrial: 'Start Free Trial',
      activating: 'Activating...',
      view_plans: 'View Plans',
      reactivate_subscription: 'Reactivate Subscription',
    },
  },
  fr: { subscriptionPlans: {} },
}

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: subscriptionPlansMessages,
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountCard() {
  setActivePinia(createPinia())
  return mount(NoSubscriptionCard, {
    props: { lastCanceledSubscription: null, isActivatingFreePlan: false },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        'router-link': {
          template: '<a class="router-link-stub"><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}

describe('NoSubscriptionCard — free-trial CTA', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Start Free Trial button and emits activateFreePlan on click', async () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('Start Free Trial')

    const trialBtn = wrapper
      .findAll('button')
      .find(b => b.text().includes('Start Free Trial'))
    expect(trialBtn).toBeTruthy()

    await trialBtn!.trigger('click')
    expect(wrapper.emitted('activateFreePlan')).toBeTruthy()
    expect(wrapper.emitted('activateFreePlan')).toHaveLength(1)
  })
})
