/**
 * PublicOffers — the pricing page a prospect can reach without an account (#294).
 *
 * The property that matters most is negative: hidden plans must never surface
 * here. Seat products and bespoke school/OF plans are is_catalog=false precisely
 * so they stay off this page, and the catalogue endpoint is already scoped — this
 * pins that the page adds no way around that, and invents no prices of its own.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const { axiosGet } = vi.hoisted(() => ({ axiosGet: vi.fn() }))

vi.mock('axios', () => ({
  default: {
    get: axiosGet, post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (k: string) => k, te: () => true, locale: { value: 'en' } }),
  useStoreTranslations: () => ({ t: (k: string) => k, te: () => true, locale: { value: 'en' } }),
}))

vi.mock('../../src/composables/usePlanFormatters', () => ({
  usePlanFormatters: () => ({
    derivePlanBullets: (plan: any) => [`bullets-for-${plan.name}`],
    formatBillingInterval: (i: string) => i,
  }),
}))

import PublicOffers from '../../src/components/Pages/PublicOffers.vue'

const CATALOG = [
  { id: 'p-trial', name: 'Trial', description: '', currency: 'eur', billing_interval: 'month', price_amount: 0, priority: 0 },
  { id: 'p-solo', name: 'Solo', description: '', currency: 'eur', billing_interval: 'month', price_amount: 1200, priority: 10 },
  {
    id: 'p-formateur', name: 'Formateur', description: '', currency: 'eur',
    billing_interval: 'month', price_amount: 1990, priority: 20, group_management_enabled: true,
  },
]

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

describe('PublicOffers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosGet.mockResolvedValue({ data: { data: CATALOG } })
  })

  it('renders one card per catalogue plan plus the structures card', async () => {
    const wrapper = mount(PublicOffers, { global: { stubs } })
    await flushPromises()

    // 3 plans + the contact card.
    expect(wrapper.findAll('[data-test="offer-card"]').length).toBe(3)
    expect(wrapper.find('[data-test="offer-contact-card"]').exists()).toBe(true)
  })

  it('reads the scoped public catalogue and adds no way around it', async () => {
    mount(PublicOffers, { global: { stubs } })
    await flushPromises()

    expect(axiosGet).toHaveBeenCalledWith('/subscription-plans')
    // No admin listing, no seat endpoint: whatever the server chooses to expose
    // publicly is the whole of what this page can show.
    const paths = axiosGet.mock.calls.map(c => c[0])
    expect(paths).not.toContain('/subscription-batches/purchasable-plans')
  })

  it('mentions seats without quoting a price, on the plan that can buy them', async () => {
    const wrapper = mount(PublicOffers, { global: { stubs } })
    await flushPromises()

    const notes = wrapper.findAll('[data-test="offer-seats-note"]')
    expect(notes.length, 'only the group-management plan carries the seats note').toBe(1)

    // Seat plans are hidden; a "from" figure here would be a second copy of a
    // number that drifts from the real ladder.
    const html = wrapper.html()
    expect(html).not.toMatch(/1[.,]65/)
    expect(html).not.toMatch(/9[.,]00/)
  })

  it('offers structures a conversation rather than a price', async () => {
    const wrapper = mount(PublicOffers, { global: { stubs } })
    await flushPromises()

    const cta = wrapper.find('[data-test="offer-contact-cta"]')
    expect(cta.exists()).toBe(true)
    expect(cta.attributes('href')).toMatch(/^mailto:/)
  })

  it('says so when the catalogue cannot be loaded', async () => {
    axiosGet.mockRejectedValue(new Error('offline'))
    const wrapper = mount(PublicOffers, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[data-test="offers-error"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="offer-card"]').length).toBe(0)
  })
})
