import { expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import SubscriptionPlansCustomer from '../../src/components/Pages/SubscriptionPlansCustomer.vue'

/**
 * Shared fixtures and helpers for the SubscriptionPlansCustomer test files.
 *
 * NOTE: `vi.mock(...)` calls cannot live here: Vitest hoists them to the top
 * of the file they appear in, and these files do not mock the stores the same
 * way (which store calls are spies, fake timers, registered messages). Each
 * file keeps its own `vi.mock` block and hands its `planEntities` array to
 * `mountPlansPage`.
 */

export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

export const FREE_PLAN = {
  id: 'plan-free',
  name: 'Free',
  price_amount: 0,
  currency: 'eur',
  billing_interval: 'month',
  is_active: true,
  priority: 0,
}

export const PAID_PLAN = {
  id: 'plan-solo',
  name: 'Solo',
  price_amount: 1200,
  currency: 'eur',
  billing_interval: 'month',
  is_active: true,
  priority: 10,
}

export const PAID_PLAN_B = {
  id: 'plan-pro',
  name: 'Pro',
  price_amount: 3900,
  currency: 'eur',
  billing_interval: 'month',
  is_active: true,
  priority: 20,
}

/**
 * Mount the page on `plans`. `planEntities` is the array the file's mocked
 * plans store serves; `i18n` lets a file register the messages it asserts on.
 */
export function mountPlansPage(planEntities: any[], plans: any[], i18n = createTestI18n()) {
  planEntities.length = 0
  planEntities.push(...plans)
  setActivePinia(createPinia())
  return mount(SubscriptionPlansCustomer, {
    global: {
      plugins: [i18n],
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

/** Click the (grid) Subscribe button for `planName` by its rendered text. */
export async function clickSubscribe(wrapper: any, planName: string) {
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
