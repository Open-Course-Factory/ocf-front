/**
 * Store field labels exist in English and in French.
 *
 * The store test files mock useStoreTranslations, so they cannot see whether a
 * label key is really declared. Here the stores register their messages in the
 * REAL i18n instance, and each key is looked up in both locales.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

import i18n from '../../src/i18n'
import { useSubscriptionPlansStore } from '../../src/stores/subscriptionPlans'
import { useBillingAddressesStore } from '../../src/stores/billingAddresses'

const LOCALES = ['en', 'fr'] as const

function expectTranslated(key: string) {
  for (const locale of LOCALES) {
    expect(i18n.global.te(key, locale), `${key} in ${locale}`).toBe(true)
  }
}

describe('store field labels are translated in both locales', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it.each(['max_cpu', 'max_memory_mb', 'created_at', 'updated_at'])(
    'subscriptionPlans.%s',
    (field) => {
      useSubscriptionPlansStore()
      expectTranslated(`subscriptionPlans.${field}`)
    }
  )

  it.each(['company_name', 'siret', 'vat_number'])('billingAddresses.%s', (field) => {
    useBillingAddressesStore()
    expectTranslated(`billingAddresses.${field}`)
  })
})
