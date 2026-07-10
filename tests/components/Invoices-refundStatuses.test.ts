/**
 * RED — refund statuses on the Invoices page (issue #257 / MR !244).
 *
 * Backend (ocf-core !277) can now emit invoice status 'refunded' /
 * 'partially_refunded' plus a new `amount_refunded` (cents) field. The page must:
 *   2. offer a filter option for refunded invoices (today the status <select>
 *      only has all/paid/unpaid/draft/void), and
 *   3. surface a dedicated refunded count in the admin summary (today only
 *      total/paid/unpaid/revenue — a refunded invoice silently vanishes from
 *      every bucket), while
 *   4. showing the refunded amount on a partially-refunded invoice (the card
 *      already shows Amount, so a partial refund with no refunded amount shown
 *      is confusing).
 *
 * Summary-bucket choice (documented for the dev): a refunded invoice's status
 * is not 'paid', so it is ALREADY excluded from the paid count — pinning "not in
 * paid" would be green and meaningless. The RED-worthy, user-visible change is a
 * DEDICATED refunded count (covering 'refunded' + 'partially_refunded'). I pin
 * `getInvoiceStats.refunded`; the guard keeps `.paid` excluding refunds.
 *
 * Pinned loosely (option value / computed field / formatted amount presence),
 * not exact copy or layout. The #guard tests pin that paid invoices render as
 * today.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { formatCurrency } from '../../src/utils/formatters'

const h = vi.hoisted(() => ({
  entities: [] as any[],
}))

// Real currency formatter so a rendered refunded amount is a real formatted
// string (the shared formatCurrency the card already uses for Amount).
vi.mock('../../src/stores/invoices', () => ({
  useInvoicesStore: () => ({
    get entities() { return h.entities },
    isLoading: false,
    formatAmount: (amount: number, currency = 'EUR') => formatCurrency(amount, currency),
    formatDate: () => '-',
    isOverdue: () => false,
    getStatusClass: (s: string) => `class-${s}`,
    getStatusIcon: () => 'fas fa-x',
    getStatusLabel: (s: string) => `label-${s}`,
    loadEntities: vi.fn().mockResolvedValue(undefined),
    syncAndLoadInvoices: vi.fn().mockResolvedValue(undefined),
    downloadInvoice: vi.fn().mockResolvedValue(true),
  })
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (k: string) => k }),
  useStoreTranslations: () => ({ t: (k: string) => k }),
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({
    isAdmin: ref(true),
    shouldFilterAsStandardUser: ref(false),
    shouldShowAllData: ref(true),
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
    withLoading: async (fn: any) => { await fn() },
  })
}))

import Invoices from '../../src/components/Pages/Invoices.vue'

// Stub Entity so it renders the page's #actions slot once per invoice — that's
// where the amount + status badge live.
const EntityStub = {
  props: ['entityName', 'entityStore'],
  template:
    '<div class="entity-stub"><div v-for="e in (entityStore && entityStore.entities) || []" :key="e.id" class="invoice-row"><slot name="actions" :entity="e" /></div></div>',
}

function mountPage() {
  return mount(Invoices, {
    global: {
      stubs: {
        Entity: EntityStub,
        ErrorAlert: true,
        AdminBadge: true,
      }
    }
  })
}

const PAID = { id: 'p1', invoice_number: 'INV-P', amount: 5000, currency: 'EUR', status: 'paid', invoice_date: '2026-01-01' }
const REFUNDED = { id: 'r1', invoice_number: 'INV-R', amount: 5000, currency: 'EUR', status: 'refunded', amount_refunded: 5000, invoice_date: '2026-01-02' }
const PARTIAL = { id: 'pp1', invoice_number: 'INV-PP', amount: 5000, currency: 'EUR', status: 'partially_refunded', amount_refunded: 1234, invoice_date: '2026-01-03' }

describe('Invoices page — refund statuses (#257)', () => {
  beforeEach(() => {
    h.entities = []
  })

  it('#2 the status filter offers a refunded option', async () => {
    h.entities = [REFUNDED]
    const wrapper = mountPage()
    await flush(wrapper)

    const optionValues = wrapper.find('#statusFilter').findAll('option').map((o) => o.attributes('value'))
    expect(optionValues).toContain('refunded')
  })

  it('#3 the admin summary exposes a dedicated refunded count (refunded + partially_refunded)', async () => {
    h.entities = [PAID, REFUNDED, PARTIAL]
    const wrapper = mountPage()
    await flush(wrapper)

    const stats = (wrapper.vm as any).getInvoiceStats
    expect(stats.refunded).toBe(2)
    // Guard: refunds must NOT inflate the paid bucket.
    expect(stats.paid).toBe(1)
  })

  it('#4 a partially-refunded invoice shows the refunded amount (shared formatCurrency)', async () => {
    h.entities = [PARTIAL]
    const wrapper = mountPage()
    await flush(wrapper)

    const rowText = wrapper.find('.invoice-row').text()
    // amount_refunded = 1234 cents → "12,34" (fr-FR). Distinct from the "50,00"
    // main amount, so this only passes once the refunded amount is rendered.
    expect(rowText).toContain('12,34')
    // Guard: the main amount is still shown.
    expect(rowText).toContain('50,00')
  })

  it('#5 [guard] paid invoices still filter and render as today', async () => {
    h.entities = [PAID]
    const wrapper = mountPage()
    await flush(wrapper)

    const optionValues = wrapper.find('#statusFilter').findAll('option').map((o) => o.attributes('value'))
    expect(optionValues).toContain('paid')
    // Paid invoice still shows its amount.
    expect(wrapper.find('.invoice-row').text()).toContain('50,00')
  })
})

async function flush(wrapper: any) {
  await Promise.resolve()
  await wrapper.vm.$nextTick()
}
