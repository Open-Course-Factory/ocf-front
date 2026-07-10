/**
 * RED — paymentMethods store fallbacks (issue #264, 2026-07-10 review, finding
 * I6, item 2).
 *
 * `formatPaymentMethod` produces the label shown for a payment method in select
 * dropdowns (via getSelectDatas). It currently emits raw English tokens:
 *   - src/stores/paymentMethods.ts:114  →  'CARD'    (card with no brand)
 *   - src/stores/paymentMethods.ts:120  →  'Unknown' (non-card / unknown type)
 * Both reach the UI untranslated in both locales.
 *
 * Contract: those fallbacks must route through the store's translations rather
 * than hardcoded strings. Proposed keys (add to the store's useStoreTranslations
 * block, both locales):
 *   - paymentMethods.cardLabel   = 'Card' (en) / 'Carte' (fr)
 *   - paymentMethods.unknownType = 'Unknown' (en) / 'Inconnu' (fr)
 *
 * As with the other store tests, translations are mocked to a passthrough
 * (t: key => key), so the assertion pins that the fallback goes through t()
 * with the expected key instead of emitting the raw token.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
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

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

import { usePaymentMethodsStore } from '../../src/stores/paymentMethods'

describe('paymentMethods store - formatPaymentMethod fallbacks (#264)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('uses a translated label (not the raw CARD token) for a card with no brand', () => {
    const store = usePaymentMethodsStore()

    const label = store.formatPaymentMethod({ type: 'card', card_last4: '4242' })

    // RED today: the label is built from the hardcoded 'CARD' token.
    expect(label).not.toContain('CARD')
    expect(label).toContain('paymentMethods.cardLabel')
  })

  it('uses a translated label (not the raw Unknown token) for an unknown type', () => {
    const store = usePaymentMethodsStore()

    const label = store.formatPaymentMethod({})

    // RED today: returns the hardcoded 'Unknown' token.
    expect(label).not.toContain('Unknown')
    expect(label).toContain('paymentMethods.unknownType')
  })

  it('[guard] still renders a real brand uppercased for a card with a brand', () => {
    const store = usePaymentMethodsStore()

    const label = store.formatPaymentMethod({
      type: 'card',
      card_brand: 'visa',
      card_last4: '4242',
      card_exp_month: 12,
      card_exp_year: 2030,
    })

    expect(label).toContain('VISA')
    expect(label).toContain('4242')
  })
})
