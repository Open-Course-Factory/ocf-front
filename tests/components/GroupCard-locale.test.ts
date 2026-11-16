/**
 * GroupCard — the class card shows its dates in the app language.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import GroupCard from '../../src/components/Cards/GroupCard.vue'
import i18n from '../../src/i18n'

const appLocale = i18n.global.locale.value
afterEach(() => {
  i18n.global.locale.value = appLocale
})

describe('GroupCard — dates follow the app language', () => {
  it.each([
    ['en', '15/03/2026'],
    ['fr', '15/03/2026'],
  ] as const)('shows a %s user the creation date as %s', (locale, date) => {
    const pinia = createPinia()
    setActivePinia(pinia)
    i18n.global.locale.value = locale

    const wrapper = mount(GroupCard, {
      // Mid-morning UTC: the same calendar day in every zone from UTC-10 to UTC+13.
      props: { entity: { id: 'g-1', name: 'B3', created_at: '2026-03-15T10:00:00Z' } },
      global: { plugins: [i18n, pinia] },
    })

    expect(wrapper.find('.meta-date').text()).toContain(date)
  })
})
