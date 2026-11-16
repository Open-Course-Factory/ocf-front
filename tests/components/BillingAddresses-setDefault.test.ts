/**
 * RED — issue #415: "Set as default" on the billing addresses page.
 *
 * API contract (ocf-core):
 *   - POST /billing-addresses/:id/set-default clears the previous default and
 *     sets the new one in one transaction. PATCH /billing-addresses/:id only
 *     knows `is_default`, so PATCH { set_default: true } answers 204 and
 *     changes nothing.
 *   - GET /billing-addresses answers the generic pagination envelope
 *     { data: [...], total, totalPages, currentPage, pageSize, ... }.
 *
 * Entity is stubbed to render the page's #actions slot once per store entity,
 * like tests/components/Invoices-refundStatuses.test.ts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((_err: any, fallbackKey: string) => fallbackKey)
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn()
}))

import axios from 'axios'
import { useBillingAddressesStore } from '../../src/stores/billingAddresses'
import BillingAddresses from '../../src/components/Pages/BillingAddresses.vue'

const EntityStub = {
  props: ['entityName', 'entityStore'],
  template:
    '<div><div v-for="e in entityStore.entities" :key="e.id" :class="\'row-\' + e.id"><slot name="actions" :entity="e" /></div></div>',
}

const oldDefault = { id: 'a1', line1: '1 rue A', city: 'Paris', postal_code: '75001', country: 'FR', is_default: true }
const newDefault = { id: 'a2', line1: '2 rue B', city: 'Lyon', postal_code: '69001', country: 'FR', is_default: false }

function envelope(items: any[]) {
  return {
    data: items,
    total: items.length,
    totalPages: 1,
    currentPage: 1,
    pageSize: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  }
}

async function clickSetDefaultOnSecondAddress() {
  const store = useBillingAddressesStore()
  store.entities.push({ ...oldDefault }, { ...newDefault })
  const wrapper = mount(BillingAddresses, { global: { stubs: { Entity: EntityStub } } })
  await wrapper.find('.row-a2 button').trigger('click')
  await flushPromises()
  return store
}

describe('BillingAddresses page — set as default (#415)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(axios.post).mockResolvedValue({ status: 204, data: null })
    vi.mocked(axios.patch).mockResolvedValue({ status: 204, data: null })
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
      data: envelope([{ ...oldDefault, is_default: false }, { ...newDefault, is_default: true }]),
    })
  })

  it('calls POST /billing-addresses/<id>/set-default and never PATCHes set_default', async () => {
    await clickSetDefaultOnSecondAddress()

    expect(axios.post).toHaveBeenCalledWith('/billing-addresses/a2/set-default')
    const patchedSetDefault = vi.mocked(axios.patch).mock.calls.some(
      ([, body]) => body && Object.prototype.hasOwnProperty.call(body, 'set_default')
    )
    expect(patchedSetDefault).toBe(false)
  })

  it('reloads the list from the envelope data array', async () => {
    const store = await clickSetDefaultOnSecondAddress()

    expect(Array.isArray(store.entities)).toBe(true)
    expect(store.entities.map((e: any) => e.id)).toEqual(['a1', 'a2'])
    expect(store.entities.find((e: any) => e.id === 'a2')?.is_default).toBe(true)
  })

  it('shows the API error_message and keeps the list when set-default fails', async () => {
    vi.mocked(axios.post).mockRejectedValue(Object.assign(new Error('Request failed with status code 404'), {
      response: { status: 404, data: { error_code: 404, error_message: 'Billing address not found' } },
    }))

    const store = useBillingAddressesStore()
    store.entities.push({ ...oldDefault }, { ...newDefault })
    const wrapper = mount(BillingAddresses, { global: { stubs: { Entity: EntityStub } } })
    await wrapper.find('.row-a2 button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.alert-message').text()).toBe('Billing address not found')
    expect(axios.get).not.toHaveBeenCalled()
    expect(store.entities).toEqual([oldDefault, newDefault])
  })
})
