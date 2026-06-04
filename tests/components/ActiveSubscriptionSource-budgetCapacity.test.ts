/**
 * Tests for the consolidated active-subscription panel
 * (ActiveSubscriptionSource.vue), which replaced the deleted
 * SubscriptionCard.vue as the single info + actions panel for active
 * subscribers.
 *
 * Two contracts are pinned here:
 *
 * 1. Budget-capacity rendering (retargeted from the old SubscriptionCard
 *    test — same user-visible contract, new component + prop shape):
 *      - For plans with a non-zero budget, the panel renders a size-count
 *        summary like "Includes up to 1 XL OR 2 L OR 4 M simultaneous
 *        sessions".
 *      - The OR joiner is localized for the active locale ("OU" in French).
 *      - For plans with max_cpu === 0 AND max_memory_mb === 0 (unlimited),
 *        the panel renders the "Unlimited capacity" string.
 *
 * 2. Money-flow action gating (the reason this refactor is risky):
 *      - A personal ACTIVE subscription shows Manage + Cancel controls.
 *      - An ASSIGNED (bulk-license) subscription shows NONE of
 *        Manage / Cancel / Reactivate, and shows the read-only "provided by"
 *        indication instead. An assigned (non-paying) user must never be able
 *        to reach cancel/manage.
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

import ActiveSubscriptionSource from '../../src/components/Subscription/Dashboard/ActiveSubscriptionSource.vue'

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    // ActiveSubscriptionSource provides its own messages via useTranslations;
    // an empty bundle here is enough to satisfy the i18n plugin.
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountSource(primarySubscription: any, locale: 'en' | 'fr' = 'en') {
  setActivePinia(createPinia())
  return mount(ActiveSubscriptionSource, {
    props: {
      primarySubscription,
      totalSubscriptions: 1,
      allSubscriptions: [],
    },
    global: {
      plugins: [createTestI18n(locale)],
      stubs: {
        'router-link': {
          template: '<a class="router-link-stub"><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}

describe('ActiveSubscriptionSource — budget capacity rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders a size-count summary for a budget-mode plan', () => {
    // max_cpu=8000 mCPU, max_memory_mb=4096 → "1 XL OR 2 L OR 4 M"
    const wrapper = mountSource({
      id: 'sub-1',
      status: 'active',
      subscription_type: 'personal',
      subscription_plan_id: 'plan-1',
      subscription_plan: {
        id: 'plan-1',
        name: 'Solo',
        max_cpu: 8000,
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
    const wrapper = mountSource(
      {
        id: 'sub-1',
        status: 'active',
        subscription_type: 'personal',
        subscription_plan_id: 'plan-1',
        subscription_plan: {
          id: 'plan-1',
          name: 'Solo',
          max_cpu: 8000,
          max_memory_mb: 4096,
        },
      },
      'fr'
    )

    expect(wrapper.text()).toContain('1 XL OU 2 L OU 4 M')
  })

  it('renders the unlimited-capacity string when both max_cpu and max_memory_mb are 0', () => {
    const wrapper = mountSource({
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

describe('ActiveSubscriptionSource — money-flow action gating', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows Manage and Cancel controls for a personal active subscription', () => {
    const wrapper = mountSource({
      id: 'sub-1',
      status: 'active',
      subscription_type: 'personal',
      cancel_at_period_end: false,
      subscription_plan: {
        id: 'plan-1',
        name: 'Solo',
        max_cpu: 8000,
        max_memory_mb: 4096,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Manage Subscription')
    expect(text).toContain('Cancel Subscription')

    // The Manage button is a real, clickable control (emits 'manage').
    const manageBtn = wrapper
      .findAll('button')
      .find(b => b.text().includes('Manage Subscription'))
    expect(manageBtn).toBeTruthy()
    manageBtn!.trigger('click')
    expect(wrapper.emitted('manage')).toBeTruthy()
  })

  it('hides Manage / Cancel / Reactivate and shows the read-only "provided by" indication for an assigned subscription', () => {
    const wrapper = mountSource({
      id: 'sub-1',
      status: 'active',
      subscription_type: 'assigned',
      batch_owner_name: 'Acme Corp',
      subscription_plan: {
        id: 'plan-1',
        name: 'Solo',
        max_cpu: 8000,
        max_memory_mb: 4096,
      },
    })

    const text = wrapper.text()

    // No payment-management actions for a non-paying assigned user.
    expect(text).not.toContain('Manage Subscription')
    expect(text).not.toContain('Cancel Subscription')
    expect(text).not.toContain('Reactivate Subscription')

    // There must be no clickable manage/cancel/reactivate button at all.
    const actionButtons = wrapper.findAll('button').filter(b => {
      const label = b.text()
      return (
        label.includes('Manage Subscription') ||
        label.includes('Cancel Subscription') ||
        label.includes('Reactivate Subscription')
      )
    })
    expect(actionButtons).toHaveLength(0)

    // The read-only indication is shown instead.
    expect(text).toContain('Provided by')
    expect(text).toContain('Acme Corp')
    expect(text).toContain(
      'assigned to you and is managed by the license owner'
    )
  })

  it('treats a subscription_batch_id (without explicit assigned type) as assigned and hides management actions', () => {
    // Guards the second detection branch in isAssigned: a batch-id alone must
    // also gate out the payment actions.
    const wrapper = mountSource({
      id: 'sub-1',
      status: 'active',
      subscription_type: 'personal',
      subscription_batch_id: 'batch-42',
      subscription_plan: {
        id: 'plan-1',
        name: 'Solo',
        max_cpu: 8000,
        max_memory_mb: 4096,
      },
    })

    const text = wrapper.text()
    expect(text).not.toContain('Manage Subscription')
    expect(text).not.toContain('Cancel Subscription')
    expect(text).not.toContain('Reactivate Subscription')
  })
})
