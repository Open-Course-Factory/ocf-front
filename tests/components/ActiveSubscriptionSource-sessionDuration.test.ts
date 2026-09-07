/**
 * The session-duration limit shown on the subscription dashboard is a
 * contractual number: a plan capped at 90 minutes must read "1h 30min",
 * never "1h". The component used to keep a private formatter that dropped
 * the remainder below the hour.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'

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

function mountWithDuration(minutes: number, locale: 'en' | 'fr' = 'en') {
  setActivePinia(createPinia())
  return mount(ActiveSubscriptionSource, {
    props: {
      primarySubscription: {
        id: 'sub-1',
        status: 'active',
        subscription_type: 'personal',
        subscription_plan_id: 'plan-1',
        subscription_plan: {
          id: 'plan-1',
          name: 'Solo',
          max_session_duration_minutes: minutes,
        },
      },
      totalSubscriptions: 1,
      allSubscriptions: [],
    },
    global: {
      plugins: [
        createI18n({
          legacy: false,
          locale,
          fallbackLocale: 'en',
          messages: { en: {}, fr: {} },
          missingWarn: false,
          fallbackWarn: false,
        }),
      ],
      stubs: {
        'router-link': { template: '<a><slot /></a>', props: ['to'] },
      },
    },
  })
}

describe('ActiveSubscriptionSource — session duration limit', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('keeps the minutes below the hour', () => {
    expect(mountWithDuration(90).text()).toContain('1h 30min session duration')
  })

  it('renders whole hours without a remainder', () => {
    expect(mountWithDuration(480).text()).toContain('8h session duration')
  })

  it('renders durations under an hour in minutes', () => {
    expect(mountWithDuration(45).text()).toContain('45min session duration')
  })

  it('formats in French for the French locale', () => {
    expect(mountWithDuration(90, 'fr').text()).toContain('1 h 30 durée de session')
  })
})
