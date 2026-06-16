import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

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

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn()
}))

import { useInvoicesStore } from '../../src/stores/invoices'

// downloadInvoice must open the invoice's pre-signed Stripe URL directly
// (download_url, falling back to stripe_hosted_url) rather than hitting the
// auth-protected, /api/v1-prefixed backend route via window.open — which the
// axios interceptor, and therefore the JWT auth header, never sees.
describe('invoices store - downloadInvoice', () => {
  let openSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    openSpy.mockRestore()
  })

  // Replace the store's loaded invoices with the given fixtures.
  const seedInvoices = (store: ReturnType<typeof useInvoicesStore>, invoices: any[]) => {
    store.entities.splice(0, store.entities.length, ...invoices)
  }

  const cases: Array<{ name: string; invoice: any; expectedUrl: string }> = [
    {
      name: 'opens download_url (Stripe PDF) when present',
      invoice: {
        id: 'inv-1',
        download_url: 'https://pay.stripe.com/invoice/abc/pdf',
        stripe_hosted_url: 'https://invoice.stripe.com/i/abc'
      },
      expectedUrl: 'https://pay.stripe.com/invoice/abc/pdf'
    },
    {
      name: 'falls back to stripe_hosted_url when download_url is absent',
      invoice: {
        id: 'inv-2',
        stripe_hosted_url: 'https://invoice.stripe.com/i/abc'
      },
      expectedUrl: 'https://invoice.stripe.com/i/abc'
    }
  ]

  it.each(cases)('$name', async ({ invoice, expectedUrl }) => {
    const store = useInvoicesStore()
    seedInvoices(store, [invoice])

    const result = await store.downloadInvoice(invoice.id)

    expect(openSpy).toHaveBeenCalledTimes(1)
    // First arg is the URL the browser navigates to — must be the Stripe URL,
    // NOT the broken `/invoices/${id}/download` SPA-origin path.
    expect(openSpy.mock.calls[0][0]).toBe(expectedUrl)
    expect(result).toBe(true)
  })

  it('does not open a window and returns false when the invoice is not found', async () => {
    const store = useInvoicesStore()
    seedInvoices(store, [
      { id: 'inv-1', download_url: 'https://pay.stripe.com/invoice/abc/pdf' }
    ])

    const result = await store.downloadInvoice('missing-id')

    expect(openSpy).not.toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('does not open a window and returns false when the invoice has no urls', async () => {
    const store = useInvoicesStore()
    seedInvoices(store, [{ id: 'inv-3' }])

    const result = await store.downloadInvoice('inv-3')

    expect(openSpy).not.toHaveBeenCalled()
    expect(result).toBe(false)
  })
})
