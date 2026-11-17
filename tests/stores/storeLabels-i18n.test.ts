/**
 * Store labels exist in English and in French.
 *
 * The store test files mock useStoreTranslations, so they cannot see whether a
 * label is really declared. Here each store registers its messages in the REAL
 * i18n instance, and the two locales must declare the same keys.
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

/** Every leaf key of a message tree, as dotted paths. */
function keyPaths(messages: Record<string, any>, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    value && typeof value === 'object' && !('loc' in value) && !Array.isArray(value)
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  ).sort()
}

function namespaceKeys(locale: string, namespace: string): string[] {
  return keyPaths((i18n.global.getLocaleMessage(locale) as Record<string, any>)[namespace] ?? {})
}

// Limit: a key missing in both locales is not caught.
describe('store labels are declared in both locales', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it.each([
    ['subscriptionPlans', useSubscriptionPlansStore],
    ['billingAddresses', useBillingAddressesStore]
  ] as const)('%s has the same keys in French and in English', (namespace, useStore) => {
    useStore()

    const english = namespaceKeys('en', namespace)
    expect(english.length).toBeGreaterThan(0)
    expect(namespaceKeys('fr', namespace)).toEqual(english)
  })
})
