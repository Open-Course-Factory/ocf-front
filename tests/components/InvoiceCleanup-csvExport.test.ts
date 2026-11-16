/**
 * InvoiceCleanup — the exported CSV (#392).
 *
 * The export wrapped each cell in quotes without escaping embedded quotes, and
 * let a text cell starting with = + - @ run as a formula in a spreadsheet.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import axios from 'axios'
import { sanitizeCSVField } from '../../src/utils/csv'

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    showConfirm: vi.fn().mockResolvedValue(true)
  })
}))

import InvoiceCleanup from '../../src/components/Pages/Admin/InvoiceCleanup.vue'

function invoice(overrides: Record<string, unknown>) {
  return {
    invoice_id: 'in_1',
    invoice_number: 'INV-1',
    customer_id: 'cus_1',
    amount: 1250,
    currency: 'eur',
    original_status: 'open',
    action_taken: 'void',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

let exported: Blob[] = []

async function exportWith(details: Array<Record<string, unknown>>) {
  vi.mocked(axios.post).mockResolvedValue({
    data: {
      dry_run: true,
      processed_invoices: details.length,
      cleaned_invoices: details.length,
      total_amount_cleaned: 0,
      cleaned_details: details,
      skipped_details: [],
      failed_details: []
    }
  })
  const wrapper = mount(InvoiceCleanup, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })]
    }
  })
  await wrapper.find('.action-buttons .btn-primary').trigger('click')
  await flushPromises()
  await wrapper.find('.results-actions button').trigger('click')
  expect(exported).toHaveLength(1)
  return (await exported[0].text()).split('\n')
}

describe('InvoiceCleanup CSV export (#392)', () => {
  beforeEach(() => {
    exported = []
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((blob: Blob) => { exported.push(blob); return 'blob:mock' }),
      revokeObjectURL: vi.fn()
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('escapes a double quote inside a cell', async () => {
    const lines = await exportWith([invoice({ invoice_number: 'INV "A"' })])

    expect(lines[1]).toContain(',"INV ""A""",')
  })

  it('neutralises a text cell that would run as a formula', async () => {
    const number = '=HYPERLINK("http://x")'
    const lines = await exportWith([invoice({ invoice_number: number })])

    expect(lines[1]).toContain(',' + sanitizeCSVField(number) + ',')
  })

  it('keeps a negative amount a plain number, without the formula prefix', async () => {
    const lines = await exportWith([invoice({ amount: -1250 })])

    expect(lines[1]).toContain(',"-12.50",')
  })
})
