/**
 * InvoiceCleanup — the preview lists each invoice's amount and date in the app
 * language. Amounts arrive in cents, as the CSV export reads them.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const post = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: {
    get: vi.fn(), post, patch: vi.fn(), delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))
vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (k: string) => k }),
}))
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}))

import InvoiceCleanup from '../../src/components/Pages/Admin/InvoiceCleanup.vue'
import i18n from '../../src/i18n'

async function previewIn(locale: 'en' | 'fr') {
  post.mockResolvedValue({
    data: {
      dry_run: true,
      currency: 'eur',
      total_amount_cleaned: 1999,
      // Mid-morning UTC: the same calendar day in every zone from UTC-10 to UTC+13.
      cleaned_details: [{ invoice_id: 'in_1', amount: 1999, currency: 'eur', original_status: 'open', created_at: '2026-03-15T10:00:00Z' }],
    },
  })
  const pinia = createPinia()
  setActivePinia(pinia)
  i18n.global.locale.value = locale
  const wrapper = mount(InvoiceCleanup, { global: { plugins: [i18n, pinia] } })
  await wrapper.find('.action-buttons .btn-primary').trigger('click')
  await flushPromises()
  return wrapper.find('.results-table-section tbody tr').findAll('td')
}

describe('InvoiceCleanup — preview amounts and dates follow the app language', () => {
  it.each([
    ['en', '€19.99', '15/03/2026'],
    ['fr', '19,99 €', '15/03/2026'],
  ] as const)('shows a %s user %s on %s', async (locale, amount, date) => {
    const cells = (await previewIn(locale)).map(td => td.text())

    expect(cells).toContain(amount)
    expect(cells).toContain(date)
  })
})
