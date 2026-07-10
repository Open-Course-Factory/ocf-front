/**
 * RED — PaymentMethods page polish (issue #264, 2026-07-10 review, frontend
 * finding I6).
 *
 * Two user-visible bugs on src/components/Pages/PaymentMethods.vue:
 *
 *  1. Empty-state flash: the "no payment methods" block is gated only on
 *     `entityStore.entities.length === 0` with no `!isLoading` guard, so it
 *     flashes on first load before the sync/load resolves. Contract: while the
 *     store is loading and there are still zero entities, the empty state must
 *     NOT be shown. Guard: once loading is done and there are genuinely zero
 *     entities, the empty state IS shown (the fix must be a loading guard, not
 *     deletion of the empty state).
 *
 *  2. Untranslated card fallback: a card with no `card_brand` renders the raw
 *     English token 'CARD' (PaymentMethods.vue:167). Contract: it must render a
 *     translated label sourced from the component's own useTranslations block.
 *     Proposed key: `paymentMethods.cardLabel` = 'Card' (en) / 'Carte' (fr).
 *     Guard: a card WITH a brand still renders that brand uppercased.
 *
 * Translations resolve through a real i18n instance (useTranslations is NOT
 * mocked) so the assertions match the real rendered string a user sees, not a
 * raw key.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'

// Mutable store state, driven per test.
const h = vi.hoisted(() => ({
  entities: [] as any[],
  isLoading: false,
}))

vi.mock('../../src/stores/paymentMethods', () => ({
  usePaymentMethodsStore: () => ({
    get entities() { return h.entities },
    get isLoading() { return h.isLoading },
    getCardIcon: () => 'fas fa-credit-card',
    isExpiringSoon: () => false,
    syncAndLoadPaymentMethods: vi.fn().mockResolvedValue(undefined),
    setAsDefault: vi.fn().mockResolvedValue(true),
  })
}))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    createPortalSession: vi.fn().mockResolvedValue(undefined),
  })
}))

vi.mock('../../src/composables/usePageLoad', () => ({
  usePageLoad: () => ({
    error: ref(''),
    withErrorHandling: async (fn: any) => { await fn() },
  })
}))

vi.mock('../../src/composables/useLoadingState', () => ({
  useLoadingState: () => ({
    isLoading: ref(false),
    withLoading: async (fn: any) => { await fn() },
  })
}))

import PaymentMethods from '../../src/components/Pages/PaymentMethods.vue'

// Entity renders the page's #actions slot once per payment method — that's
// where the card brand/label is displayed.
const EntityStub = {
  props: ['entityName', 'entityStore'],
  template:
    '<div class="entity-stub"><div v-for="e in (entityStore && entityStore.entities) || []" :key="e.id" class="pm-row"><slot name="actions" :entity="e" /></div></div>',
}

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountPage() {
  return mount(PaymentMethods, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        Entity: EntityStub,
        ErrorAlert: true,
      }
    }
  })
}

async function flush(wrapper: any) {
  await Promise.resolve()
  await wrapper.vm.$nextTick()
}

const CARD_NO_BRAND = {
  id: 'pm-nobrand',
  type: 'card',
  card_last4: '4242',
  card_exp_month: 12,
  card_exp_year: 2030,
  is_default: false,
  is_active: true,
}

const CARD_VISA = {
  id: 'pm-visa',
  type: 'card',
  card_brand: 'visa',
  card_last4: '1111',
  card_exp_month: 1,
  card_exp_year: 2031,
  is_default: false,
  is_active: true,
}

describe('PaymentMethods page — loading guard on the empty state (#264)', () => {
  beforeEach(() => {
    h.entities = []
    h.isLoading = false
  })

  it('does not show the empty state while payment methods are loading', async () => {
    h.isLoading = true
    h.entities = []
    const wrapper = mountPage()
    await flush(wrapper)

    // RED today: empty state is gated only on entities.length === 0, so it
    // flashes during the initial load.
    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })

  it('[guard] shows the empty state once loading finishes with no payment methods', async () => {
    h.isLoading = false
    h.entities = []
    const wrapper = mountPage()
    await flush(wrapper)

    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })
})

describe('PaymentMethods page — translated card fallback (#264)', () => {
  beforeEach(() => {
    h.entities = []
    h.isLoading = false
  })

  it('renders a translated label for a card with no brand instead of the raw CARD token', async () => {
    h.entities = [CARD_NO_BRAND]
    const wrapper = mountPage()
    await flush(wrapper)

    const brand = wrapper.find('.card-brand').text()
    // RED today: renders the hardcoded English token 'CARD'.
    expect(brand).not.toBe('CARD')
    // Proposed key paymentMethods.cardLabel = 'Card' (en).
    expect(brand).toBe('Card')
  })

  it('[guard] renders the real brand uppercased for a known brand', async () => {
    h.entities = [CARD_VISA]
    const wrapper = mountPage()
    await flush(wrapper)

    expect(wrapper.find('.card-brand').text()).toBe('VISA')
  })
})
