/**
 * Tests for the capacity rendering on SubscriptionCard.vue.
 *
 * Contract:
 *   - For plans with a non-zero budget, the card renders a size-count
 *     summary like "Includes up to 1 XL OR 2 L OR 4 M simultaneous
 *     sessions".
 *   - For plans with max_cpu === 0 AND max_memory_mb === 0 (unlimited),
 *     the card renders the "Unlimited capacity" string.
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

import SubscriptionCard from '../../src/components/Subscription/Dashboard/SubscriptionCard.vue'

/**
 * Preload the subscription-plans translation keys the card reads through
 * `useSubscriptionTranslations`. In production these are merged by the
 * store at first use; in tests we register them up front so assertions
 * can match the rendered wording (e.g. "concurrent terminals").
 */
const subscriptionPlansMessages = {
  en: {
    subscriptionPlans: {
      current_subscription_plan: 'Current plan',
      sessionDuration: 'session duration',
      storage: 'storage',
      networkAccess: 'Network Access',
      planFeatures: 'Plan Features',
      subscriptionType_personal: 'Personal',
      subscriptionType_assigned: 'Assigned',
      active: 'Active',
    },
  },
  fr: {
    subscriptionPlans: {
      current_subscription_plan: 'Plan actuel',
      sessionDuration: 'durée de session',
      storage: 'stockage',
      networkAccess: 'Accès Réseau',
      planFeatures: 'Fonctionnalités du Plan',
      subscriptionType_personal: 'Personnel',
      subscriptionType_assigned: 'Attribué',
      active: 'Actif',
    },
  },
}

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: subscriptionPlansMessages,
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountCard(subscription: any) {
  setActivePinia(createPinia())
  return mount(SubscriptionCard, {
    props: {
      subscription,
      hasActiveSubscription: true,
      lastCanceledSubscription: null,
      allSubscriptions: [],
    },
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

describe('SubscriptionCard — budget capacity rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders a size-count summary for a budget-mode plan', () => {
    // max_cpu=8, max_memory_mb=4096 → "1 XL OR 2 L OR 4 M"
    const wrapper = mountCard({
      id: 'sub-1',
      status: 'active',
      subscription_type: 'personal',
      subscription_plan_id: 'plan-1',
      subscription_plan: {
        id: 'plan-1',
        name: 'Solo',
        max_cpu: 8,
        max_memory_mb: 4096,
        max_session_duration_minutes: 120,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('1 XL OR 2 L OR 4 M')
    expect(text).toContain('simultaneous sessions')
    // Legacy "concurrent terminals" wording must NOT show up.
    expect(text).not.toContain('concurrent terminals')
  })

  it('renders the localized OR joiner for the active locale', () => {
    // Same plan, FR locale. The same component is exercised with French.
    const i18n = createTestI18n('fr')
    setActivePinia(createPinia())
    const wrapper = mount(SubscriptionCard, {
      props: {
        subscription: {
          id: 'sub-1',
          status: 'active',
          subscription_type: 'personal',
          subscription_plan_id: 'plan-1',
          subscription_plan: {
            id: 'plan-1',
            name: 'Solo',
            max_cpu: 8,
            max_memory_mb: 4096,
          },
        },
        hasActiveSubscription: true,
        lastCanceledSubscription: null,
        allSubscriptions: [],
      },
      global: {
        plugins: [i18n],
        stubs: {
          'router-link': { template: '<a><slot /></a>', props: ['to'] },
        },
      },
    })
    expect(wrapper.text()).toContain('1 XL OU 2 L OU 4 M')
  })

  it('renders the unlimited-capacity string when both max_cpu and max_memory_mb are 0', () => {
    const wrapper = mountCard({
      id: 'sub-1',
      status: 'active',
      subscription_type: 'personal',
      subscription_plan_id: 'plan-1',
      subscription_plan: {
        id: 'plan-1',
        name: 'Enterprise',
        max_cpu: 0,
        max_memory_mb: 0,
      },
    })

    expect(wrapper.text()).toContain('Unlimited capacity')
  })

})
