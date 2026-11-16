/**
 * EntityCard — the generic card shows dates and prices in the app language.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EntityCard from '../../src/components/Cards/EntityCard.vue'
import i18n from '../../src/i18n'

const appLocale = i18n.global.locale.value
afterEach(() => {
  i18n.global.locale.value = appLocale
})

describe('EntityCard — dates and prices follow the app language', () => {
  it.each([
    ['en', '€19.99', '15/03/2026'],
    ['fr', '19,99 €', '15/03/2026'],
  ] as const)('shows a %s user %s and %s', (locale, price, date) => {
    const pinia = createPinia()
    setActivePinia(pinia)
    i18n.global.locale.value = locale

    const wrapper = mount(EntityCard, {
      props: {
        // Mid-morning UTC: the same calendar day in every zone from UTC-10 to UTC+13.
        entity: { name: 'Invoice', price_amount: 1999, paid_date: '2026-03-15T10:00:00Z' },
        entityStore: { $id: 'invoices' } as any,
      },
      global: { plugins: [i18n, pinia] },
    })

    expect(wrapper.text()).toContain(price)
    expect(wrapper.find('.date-value').text()).toContain(date)
  })
})
