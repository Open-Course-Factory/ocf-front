import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Mocks MUST be defined BEFORE imports
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

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((err: any, fallbackKey: string) => fallbackKey)
}))

// The i18n mock returns the translation KEY itself. So a field label such as
// t('billingAddresses.company_name') resolves to the string
// "billingAddresses.company_name" — enough to assert the field is wired to a
// translation key (not a raw hardcoded English string).
vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn(),
  getDemoSubscriptionPlans: vi.fn(() => [])
}))

import { useBillingAddressesStore } from '../../src/stores/billingAddresses'
import EntityModal from '../../src/components/Modals/EntityModal.vue'

/**
 * Issue #271 — the billing-address form must expose the optional B2B fields
 * so that professional customers can be invoiced with a company identity.
 *
 * Backend contract (ocf-core BillingAddressOutput / CreateBillingAddressInput):
 *   company_name — string, optional, <= 255
 *   siret        — string, optional, exactly 14 digits when present
 *   vat_number   — string, optional, <= 20 free-form
 * B2C customers leave all three empty.
 *
 * The billing form is EntityModal auto-generated from the store's `fieldList`,
 * so the field-presence and payload contract lives in that fieldList.
 */

const B2B_FIELDS = ['company_name', 'siret', 'vat_number'] as const

describe('billingAddresses store — B2B fields', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fieldList exposes the optional B2B invoicing fields', () => {
    it.each(B2B_FIELDS)('includes "%s" as a visible, creatable and editable field', (name) => {
      const store = useBillingAddressesStore()
      const field = store.fieldList.get(name)

      expect(field).toBeDefined()
      // Must show in the create AND edit auto-forms.
      expect(field!.display).toBe(true)
      expect(field!.toBeSet).toBe(true)
      expect(field!.toBeEdited).toBe(true)
    })

    it.each(B2B_FIELDS)('keeps "%s" optional (B2C customers leave it empty)', (name) => {
      const store = useBillingAddressesStore()
      const field = store.fieldList.get(name)

      // The backend hook is authoritative for format; the field itself must not
      // become a hard client-side required field, otherwise B2C is blocked.
      expect(field!.required).not.toBe(true)
    })

    it.each(B2B_FIELDS)('wires "%s" label to a translation key (not a raw string)', (name) => {
      const store = useBillingAddressesStore()
      const field = store.fieldList.get(name)

      // With the i18n mock returning the key, the label is the key path.
      expect(field!.label).toBe(`billingAddresses.${name}`)
    })
  })

  describe('bilingual labels declared in the store source (en + fr)', () => {
    const storeSource = readFileSync(
      resolve(__dirname, '../../src/stores/billingAddresses.ts'),
      'utf-8'
    )

    it.each(B2B_FIELDS)('declares i18n key "%s" at least twice (en + fr blocks)', (key) => {
      const occurrences = storeSource.split(`${key}:`).length - 1
      expect(occurrences).toBeGreaterThanOrEqual(2)
    })
  })

  describe('address display surfaces the company name when present', () => {
    it('prepends company_name to the formatted address for a B2B address', () => {
      const store = useBillingAddressesStore()
      const formatted = store.formatAddress({
        company_name: 'ACME SARL',
        line1: '1 rue de la Paix',
        postal_code: '75001',
        city: 'Paris',
        country: 'FR'
      })

      expect(formatted).toContain('ACME SARL')
      // Company identity leads the line so the invoice recipient is obvious.
      expect(formatted.indexOf('ACME SARL')).toBeLessThan(formatted.indexOf('1 rue de la Paix'))
    })

    it('omits any empty company segment for a B2C address', () => {
      const store = useBillingAddressesStore()
      const formatted = store.formatAddress({
        line1: '1 rue de la Paix',
        postal_code: '75001',
        city: 'Paris',
        country: 'FR'
      })

      // No leading comma / empty artifact when there is no company.
      expect(formatted.startsWith(',')).toBe(false)
      expect(formatted).toContain('1 rue de la Paix')
    })
  })
})

/**
 * End-to-end form contract: the EntityModal auto-form built from the real
 * billing store must render the three B2B inputs and carry their values into
 * the submitted payload (the A-side of the POST /billing-addresses contract).
 * This is the guard against silent field loss — a field that renders but never
 * reaches the request body.
 */
describe('billingAddresses form (EntityModal) — B2B payload contract', () => {
  function mountForm(store: any) {
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      fallbackLocale: 'en',
      messages: { en: {}, fr: {} },
      missingWarn: false,
      fallbackWarn: false
    })
    return mount(EntityModal, {
      props: {
        visible: true,
        entityStore: store,
        entityName: 'billing-addresses'
      },
      global: {
        plugins: [i18n],
        stubs: { 'v-autocomplete': true }
      }
    })
  }

  async function fillRequiredBase(wrapper: any) {
    await wrapper.find('input#line1').setValue('1 rue de la Paix')
    await wrapper.find('input#city').setValue('Paris')
    await wrapper.find('input#postal_code').setValue('75001')
    await wrapper.find('select#country').setValue('FR')
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the three B2B inputs in create mode', () => {
    const store = useBillingAddressesStore()
    const wrapper = mountForm(store)

    expect(wrapper.find('input#company_name').exists()).toBe(true)
    expect(wrapper.find('input#siret').exists()).toBe(true)
    expect(wrapper.find('input#vat_number').exists()).toBe(true)
  })

  it('carries company_name / siret / vat_number into the submitted payload', async () => {
    const store = useBillingAddressesStore()
    const wrapper = mountForm(store)

    await fillRequiredBase(wrapper)
    await wrapper.find('input#company_name').setValue('ACME SARL')
    await wrapper.find('input#siret').setValue('12345678901234')
    await wrapper.find('input#vat_number').setValue('FR12345678901')

    await wrapper.find('.btn-primary').trigger('click')
    await nextTick()

    const submitted = wrapper.emitted('submit')
    expect(submitted).toBeTruthy()
    const payload = submitted![0][0] as Record<string, string>
    expect(payload.company_name).toBe('ACME SARL')
    expect(payload.siret).toBe('12345678901234')
    expect(payload.vat_number).toBe('FR12345678901')
  })

  it('B2C guard: empty B2B fields still submit and pass through as empty strings', async () => {
    const store = useBillingAddressesStore()
    const wrapper = mountForm(store)

    await fillRequiredBase(wrapper)
    // Leave all three B2B inputs empty.
    await wrapper.find('.btn-primary').trigger('click')
    await nextTick()

    const submitted = wrapper.emitted('submit')
    expect(submitted).toBeTruthy()
    const payload = submitted![0][0] as Record<string, string>
    // Empty B2B fields must not block submission and must be present as empties.
    expect(payload.company_name).toBe('')
    expect(payload.siret).toBe('')
    expect(payload.vat_number).toBe('')
  })
})
