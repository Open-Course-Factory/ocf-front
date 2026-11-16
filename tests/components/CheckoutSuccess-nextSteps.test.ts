/**
 * What the just-paid user is offered next.
 *
 * The page used to send everyone to "create your first course", a section that
 * sits behind a feature flag nobody has on, and never mentioned the invoice.
 * The next step follows the plan just bought: a plan that allows teaching leads
 * to creating the organization the classes will live in; any other plan leads
 * to starting a terminal. The invoice and the subscription dashboard are one
 * click away in both cases.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const h = vi.hoisted(() => ({
  getCurrentSubscription: vi.fn(),
  refreshEntitlements: vi.fn(async () => {}),
  sub: { current: null as any },
  planAllowsClassrooms: { value: null as boolean | null },
}))

vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }))
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
  useSubscriptionPlansStore: () => ({ formatPrice: () => '12 EUR' }),
}))
vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({ refreshEntitlements: h.refreshEntitlements }),
}))
vi.mock('../../src/composables/useClassroomEntitlement', () => ({
  useClassroomEntitlement: () => ({ planAllowsClassrooms: h.planAllowsClassrooms }),
}))

import CheckoutSuccess from '../../src/components/Flows/CheckoutSuccess.vue'
import i18n from '../../src/i18n'

function mountSuccess(locale: 'en' | 'fr' = 'en') {
  const pinia = createPinia()
  setActivePinia(pinia)
  i18n.global.locale.value = locale
  return mount(CheckoutSuccess, {
    global: {
      plugins: [i18n, pinia],
      stubs: { 'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' } },
    },
  })
}

function hrefs(wrapper: ReturnType<typeof mountSuccess>) {
  return wrapper.findAll('a').map(a => a.attributes('href'))
}

describe('CheckoutSuccess — next steps follow the plan just bought', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    h.getCurrentSubscription.mockImplementation(async () => {
      h.sub.current = { subscription_plan: { name: 'Formateur', price_amount: 1200, currency: 'EUR', billing_interval: 'month' } }
    })
  })
  afterEach(() => {
    vi.useRealTimers()
    h.sub.current = null
  })

  it('offers to create the organization when the plan allows teaching', async () => {
    h.planAllowsClassrooms.value = true
    const wrapper = mountSuccess()
    await vi.advanceTimersByTimeAsync(0); await nextTick()

    expect(wrapper.find('[data-test="primary-next-step"]').attributes('href')).toBe('/organizations?create=1')
    expect(hrefs(wrapper)).not.toContain('/courses')
    wrapper.unmount()
  })

  it('offers to start a terminal when the plan does not', async () => {
    h.planAllowsClassrooms.value = false
    const wrapper = mountSuccess()
    await vi.advanceTimersByTimeAsync(0); await nextTick()

    expect(wrapper.find('[data-test="primary-next-step"]').attributes('href')).toBe('/terminal-creation')
    expect(hrefs(wrapper)).not.toContain('/courses')
    wrapper.unmount()
  })

  it('links to the invoice and the dashboard once the subscription is active', async () => {
    h.planAllowsClassrooms.value = true
    const wrapper = mountSuccess()
    await vi.advanceTimersByTimeAsync(0); await nextTick()

    expect(hrefs(wrapper)).toContain('/invoices')
    expect(hrefs(wrapper)).toContain('/subscription-dashboard')
    wrapper.unmount()
  })
})

describe('CheckoutSuccess — the period end follows the app language', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    h.planAllowsClassrooms.value = false
    h.getCurrentSubscription.mockImplementation(async () => {
      // Mid-morning UTC: the same calendar day in every zone from UTC-10 to UTC+13.
      h.sub.current = { current_period_end: '2026-03-15T10:00:00Z', subscription_plan: { name: 'Solo' } }
    })
  })
  afterEach(() => {
    vi.useRealTimers()
    h.sub.current = null
  })

  it.each([
    ['en', '15/03/2026'],
    ['fr', '15/03/2026'],
  ] as const)('shows the date to a %s user as %s', async (locale, expected) => {
    const wrapper = mountSuccess(locale)
    await vi.advanceTimersByTimeAsync(0); await nextTick()

    expect(wrapper.find('[data-test="subscription-details"]').text()).toContain(expected)
  })
})
