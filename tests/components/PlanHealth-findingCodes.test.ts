/**
 * Every finding code the backend can emit must have a sentence in both locales.
 *
 * The server sends a stable code and the numbers only it knows; the page writes
 * the sentence so it reads in the operator's language. That split has one
 * failure mode: a code with no matching key renders the key itself. Vue-i18n
 * does not throw for a missing key — it returns the path — so the page shows
 * `planHealth.codes.zero_budget` to an operator and nothing anywhere complains.
 *
 * This repo already carries one instance of that bug on another page, which is
 * why the contract is pinned here rather than left to review.
 *
 * The list below is the backend's, from src/payment/services/planHealth.go. A
 * code added there without a translation here fails this test.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

// ---- Mocks (must be before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

import axios from 'axios'
import PlanHealth from '../../src/components/Pages/Admin/PlanHealth.vue'

// Mirrors the const block in src/payment/services/planHealth.go.
const BACKEND_FINDING_CODES = [
  { code: 'zero_budget', severity: 'blocking', detail: 'no CPU budget' },
  { code: 'affords_no_size', severity: 'blocking', detail: '100 mCPU / 64 MB is below the smallest catalog size' },
  { code: 'dangling_plan_reference', severity: 'blocking', detail: '3 live subscription(s) still reference this deleted plan' },
  { code: 'catalog_without_price', severity: 'warning', detail: 'offered in the catalogue but carries no Stripe price' },
  { code: 'axis_imbalance', severity: 'advisory', detail: 'at size xs: 12 session(s) by CPU, 24 by memory — CPU binds' },
]

function createTestI18n(locale: 'en' | 'fr') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    // The component supplies its own messages through useTranslations.
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

async function mountWith(findings: typeof BACKEND_FINDING_CODES, locale: 'en' | 'fr') {
  ;(axios.get as any).mockResolvedValue({
    data: [
      {
        plan_id: 'plan-1',
        name: 'Formateur',
        is_active: true,
        is_catalog: true,
        is_deleted: false,
        max_cpu: 6000,
        max_memory_mb: 6144,
        findings,
      },
    ],
  })

  const wrapper = mount(PlanHealth, {
    global: { plugins: [createTestI18n(locale)] },
  })
  await flushPromises()
  return wrapper
}

describe('PlanHealth — finding code coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  for (const locale of ['en', 'fr'] as const) {
    it(`renders a real sentence for every backend code in ${locale}`, async () => {
      const wrapper = await mountWith(BACKEND_FINDING_CODES, locale)
      const sentences = wrapper.findAll('.ocf-planhealth-sentence').map((n) => n.text())

      expect(sentences).toHaveLength(BACKEND_FINDING_CODES.length)
      for (const [index, entry] of BACKEND_FINDING_CODES.entries()) {
        const rendered = sentences[index]
        expect(
          rendered.includes('planHealth.codes'),
          `${entry.code} has no ${locale} translation — the page would show the raw i18n key`
        ).toBe(false)
        expect(rendered.length).toBeGreaterThan(0)
      }
    })

    it(`substitutes the server-supplied detail in ${locale}`, async () => {
      const wrapper = await mountWith(BACKEND_FINDING_CODES, locale)
      const rendered = wrapper.text()

      for (const entry of BACKEND_FINDING_CODES) {
        expect(
          rendered.includes(entry.detail),
          `${entry.code} dropped its detail — the numbers the server alone knows are lost`
        ).toBe(true)
      }
      expect(rendered).not.toContain('{detail}')
    })
  }

  it('shows nothing when no plan has anything wrong', async () => {
    ;(axios.get as any).mockResolvedValue({ data: [] })

    const wrapper = mount(PlanHealth, {
      global: { plugins: [createTestI18n('en')] },
    })
    await flushPromises()

    expect(wrapper.findAll('.ocf-planhealth-card')).toHaveLength(0)
    expect(wrapper.find('.ocf-planhealth-clear').exists()).toBe(true)
  })

  // An advisory is not a fault. Counting it beside the blocking ones would
  // overstate how much is wrong on a page an operator opens to triage.
  it('counts blocking findings without the advisory', async () => {
    const wrapper = await mountWith(BACKEND_FINDING_CODES, 'en')
    const count = wrapper.find('.ocf-planhealth-badge-blocking').text()

    expect(count).toBe('3')
  })
})
