/**
 * PlanConfigModal — seat pricing (ocf-front#295).
 *
 * Two things are pinned here.
 *
 * 1. The admin can configure a seat product: BulkPurchasable marks a plan as
 *    sellable in bulk, independently of catalog visibility, and the graduated
 *    bracket ladder is editable row by row.
 *
 * 2. The modal NEVER computes graduated pricing itself. It asks the backend.
 *    Graduated pricing lives in exactly one place (ocf-core GraduatedCost) and
 *    every surface that shows a price reads it from there — a local
 *    implementation would recreate the preview-vs-invoice divergence that
 *    ocf-core#442 exists to fix. The third test asserts the delegation at the
 *    seam, because it is an architectural constraint rather than a detail.
 *
 * Pinned DOM seams:
 *   - [data-test="plan-bulk-purchasable-toggle"]
 *   - [data-test="plan-use-tiered-toggle"]
 *   - [data-test="plan-bracket-add"] / [data-test="plan-bracket-row"]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((_err: any, fallbackKey: string) => fallbackKey),
}))

vi.mock('../../src/i18n', () => {
  const { createI18n } = require('vue-i18n')
  return {
    default: createI18n({
      legacy: false,
      locale: 'en',
      messages: { en: {}, fr: {} },
      missingWarn: false,
      fallbackWarn: false,
    }),
  }
})

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: { value: 'en' } }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: { value: 'en' } }),
}))

// The pricing preview is the seam under test: stub the store so the assertion is
// "the modal asked the backend", not "the store happens to work".
const previewProspectivePricing = vi.fn()
vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({ previewProspectivePricing }),
}))

import PlanConfigModal from '../../src/components/Modals/PlanConfigModal.vue'

async function mountModal(plan: any = null) {
  const wrapper = mount(PlanConfigModal, {
    props: { visible: false, plan },
    global: {
      stubs: {
        BaseModal: {
          props: ['visible', 'title', 'titleIcon', 'size'],
          template:
            '<div class="base-modal-stub"><slot /><div class="footer-slot"><slot name="footer" /></div></div>',
        },
      },
    },
  })
  await wrapper.setProps({ visible: true })
  await flushPromises()
  return wrapper
}

function savedPayload(wrapper: any) {
  const events = wrapper.emitted('save')
  expect(events, 'the modal must emit a save payload').toBeTruthy()
  return events[events.length - 1][0]
}

describe('PlanConfigModal — seat pricing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    previewProspectivePricing.mockResolvedValue({ currency: 'eur', points: [] })
  })

  it('marks a plan sellable in bulk independently of catalog visibility', async () => {
    const wrapper = await mountModal()

    const toggle = wrapper.find('[data-test="plan-bulk-purchasable-toggle"]')
    expect(toggle.exists()).toBe(true)
    expect((toggle.element as HTMLInputElement).checked).toBe(false)

    await toggle.setValue(true)
    // A seat plan is hidden from the pricing page yet sellable — the whole point
    // of splitting the two flags in ocf-core#441.
    const catalogToggle = wrapper.find('#plan-is-catalog')
    if (catalogToggle.exists()) await catalogToggle.setValue(false)

    await wrapper.find('[data-test="plan-save-button"]').trigger('click')
    await flushPromises()

    const payload = savedPayload(wrapper)
    expect(payload.bulk_purchasable).toBe(true)
    if (catalogToggle.exists()) expect(payload.is_catalog).toBe(false)
  })

  it('reflects an existing plan’s ladder and returns it in the save payload', async () => {
    const wrapper = await mountModal({
      id: 'plan-1',
      name: 'Siège élève',
      bulk_purchasable: true,
      use_tiered_pricing: true,
      pricing_tiers: [
        { min_quantity: 1, max_quantity: 5, unit_amount: 900 },
        { min_quantity: 6, max_quantity: 0, unit_amount: 700 },
      ],
    })

    expect(
      (wrapper.find('[data-test="plan-bulk-purchasable-toggle"]').element as HTMLInputElement).checked,
    ).toBe(true)
    expect(wrapper.findAll('[data-test="plan-bracket-row"]').length).toBe(2)

    await wrapper.find('[data-test="plan-save-button"]').trigger('click')
    await flushPromises()

    const payload = savedPayload(wrapper)
    expect(payload.use_tiered_pricing).toBe(true)
    expect(payload.pricing_tiers).toEqual([
      { min_quantity: 1, max_quantity: 5, unit_amount: 900 },
      { min_quantity: 6, max_quantity: 0, unit_amount: 700 },
    ])
  })

  it('asks the backend to price the ladder instead of computing it locally', async () => {
    const wrapper = await mountModal()

    await wrapper.find('[data-test="plan-use-tiered-toggle"]').setValue(true)
    await wrapper.find('[data-test="plan-bracket-add"]').trigger('click')
    await flushPromises()

    expect(
      previewProspectivePricing,
      'graduated pricing must be computed by ocf-core, never reimplemented here',
    ).toHaveBeenCalled()

    const sent = previewProspectivePricing.mock.calls[0][0]
    expect(Array.isArray(sent.tiers)).toBe(true)
    expect(Array.isArray(sent.quantities)).toBe(true)
    expect(sent.quantities.length).toBeGreaterThan(0)
  })

  it('probes the ladder at its own boundaries, whatever the unit', async () => {
    // A day pack is denominated in learner-days, so its boundaries sit at 30/60.
    // A fixed, seat-shaped probe list (1/5/10/15/20/30) would never cross them and
    // the preview would show one flat price for a perfectly good ladder.
    const wrapper = await mountModal({
      id: 'plan-pack',
      name: 'Siège élève — pack jours',
      use_tiered_pricing: true,
      pricing_tiers: [
        { min_quantity: 1, max_quantity: 30, unit_amount: 165 },
        { min_quantity: 31, max_quantity: 60, unit_amount: 125 },
        { min_quantity: 61, max_quantity: 0, unit_amount: 105 },
      ],
    })
    await flushPromises()

    // The modal recomputes behind a 300ms debounce, and flushPromises only
    // drains microtasks — it never advances timers. So `.at(-1)` used to read
    // whichever call happened to land first, which on a slower runner was the
    // seed ladder (probes [1, 5, 6]) rather than the pack's. Select the call by
    // the ladder it carries, and wait for it, instead of trusting arrival order.
    const packCall = () =>
      previewProspectivePricing.mock.calls
        .map(c => c[0])
        .reverse()
        .find((arg: any) => arg?.tiers?.some((t: any) => t.max_quantity === 30))

    await vi.waitFor(() => expect(packCall()).toBeTruthy())

    const q: number[] = packCall()!.quantities

    // Each boundary is straddled, so every bracket is exercised where it changes.
    for (const boundary of [30, 60]) {
      expect(q, `must probe at ${boundary}`).toContain(boundary)
      expect(q, `must probe just past ${boundary}`).toContain(boundary + 1)
    }
    expect(q).toContain(1)
    expect(q.every(n => n > 0)).toBe(true)
    expect(q).toEqual([...q].sort((a, b) => a - b))
  })

  it('clears the ladder when tiering is switched off, rather than leaving it hidden on the row', async () => {
    const wrapper = await mountModal({
      id: 'plan-2',
      name: 'Siège élève',
      use_tiered_pricing: true,
      pricing_tiers: [{ min_quantity: 1, max_quantity: 0, unit_amount: 900 }],
    })

    await wrapper.find('[data-test="plan-use-tiered-toggle"]').setValue(false)
    await wrapper.find('[data-test="plan-save-button"]').trigger('click')
    await flushPromises()

    const payload = savedPayload(wrapper)
    expect(payload.use_tiered_pricing).toBe(false)
    expect(payload.pricing_tiers).toEqual([])
  })
})
