/**
 * RED tests for derivePlanBullets — the typed-field pricing-bullet helper.
 *
 * Part of the features[]-strings removal campaign (front phase). Plan
 * `features[]` free-text strings are going away; the customer-facing pricing
 * bullets must instead be GENERATED from the plan's typed columns. This pins
 * the pure seam that both the grid card and (indirectly) the compare table
 * build on.
 *
 * SEAM (pinned): `usePlanFormatters()` returns `derivePlanBullets(plan)` →
 * `string[]`, an ordered list of localized display bullets derived ONLY from
 * typed fields. Contract:
 *
 *   1. Capacity/budget — ALWAYS present (first bullet). Non-zero budget reuses
 *      formatBudgetAsSizes ("N SIZE OR ..."); a 0/0 budget renders the
 *      localized "Unlimited capacity" line.
 *   2. Session duration — present iff plan.max_session_duration_minutes > 0.
 *   3. Network access — present iff plan.network_access_enabled === true.
 *   4. Persistent storage — present iff plan.data_persistence_enabled === true;
 *      the bullet embeds plan.data_persistence_gb and the unit ("1 GB"/"1 Go").
 *   5. Command history — present iff plan.command_history_retention_days > 0;
 *      the bullet embeds the day count.
 *   6. Session supervision — present iff plan.session_supervision_enabled === true.
 *
 * A "zero plan" (bounded budget, every capability flag off / 0) shows ONLY the
 * budget bullet. features[] is never read.
 *
 * EXPECTED STATE against current code: usePlanFormatters does not expose
 * derivePlanBullets, so every case here is RED (calling undefined throws).
 */

import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { usePlanFormatters } from '../../src/composables/usePlanFormatters'

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

/** Run the composable inside a fake setup() so it can access useI18n(). */
function runInSetup<T>(fn: () => T, locale: 'en' | 'fr' = 'en'): T {
  let captured!: T
  const Dummy = defineComponent({
    setup() {
      captured = fn()
      return () => h('div')
    },
  })
  mount(Dummy, { global: { plugins: [createTestI18n(locale)] } })
  return captured
}

function bullets(plan: any, locale: 'en' | 'fr' = 'en'): string[] {
  const { derivePlanBullets } = runInSetup(() => usePlanFormatters(), locale)
  return derivePlanBullets(plan)
}

/** True when at least one bullet matches the predicate. */
function has(list: string[], re: RegExp): boolean {
  return list.some(b => re.test(b))
}

// A small bounded budget: 1000 mCPU / 512 MiB == exactly 1 S.
const S_BUDGET = { max_cpu: 1000, max_memory_mb: 512 }
// 8000 mCPU / 4096 MiB == 1 XL OR 2 L OR 4 M.
const XL_BUDGET = { max_cpu: 8000, max_memory_mb: 4096 }

describe('usePlanFormatters — derivePlanBullets', () => {
  it('returns only the budget bullet for a zero plan (all capability flags off)', () => {
    const list = bullets({
      ...S_BUDGET,
      max_session_duration_minutes: 0,
      network_access_enabled: false,
      data_persistence_enabled: false,
      command_history_retention_days: 0,
      session_supervision_enabled: false,
      features: [],
    })
    expect(Array.isArray(list)).toBe(true)
    expect(list).toHaveLength(1)
    // Budget bullet reuses formatBudgetAsSizes: 1000/512 == 1 S.
    expect(list[0]).toMatch(/1 S/)
  })

  it('renders the unlimited-capacity line as the sole bullet for a 0/0 budget plan', () => {
    const list = bullets({
      max_cpu: 0,
      max_memory_mb: 0,
      max_session_duration_minutes: 0,
      network_access_enabled: false,
      data_persistence_enabled: false,
      command_history_retention_days: 0,
      session_supervision_enabled: false,
    })
    expect(list).toHaveLength(1)
    expect(list[0]).toMatch(/unlimited/i)
  })

  // Table-driven: each capability flag independently adds exactly its bullet.
  const cases: Array<{
    name: string
    plan: Record<string, any>
    present: RegExp
  }> = [
    {
      name: 'session duration',
      plan: { ...S_BUDGET, max_session_duration_minutes: 120 },
      present: /max|hour|heure/i,
    },
    {
      name: 'network access',
      plan: { ...S_BUDGET, network_access_enabled: true },
      present: /internet|network|réseau|reseau/i,
    },
    {
      name: 'persistent storage',
      plan: { ...S_BUDGET, data_persistence_enabled: true, data_persistence_gb: 1 },
      present: /(GB|Go)/,
    },
    {
      name: 'command history',
      plan: { ...S_BUDGET, command_history_retention_days: 30 },
      present: /30/,
    },
    {
      name: 'session supervision',
      plan: { ...S_BUDGET, session_supervision_enabled: true },
      present: /supervis/i,
    },
  ]

  for (const c of cases) {
    it(`adds a ${c.name} bullet when its typed field is set (and only then)`, () => {
      const withFlag = bullets(c.plan)
      const withoutFlag = bullets({ ...S_BUDGET })
      // The flagged plan has exactly one more bullet than the bare budget plan.
      expect(withFlag.length).toBe(withoutFlag.length + 1)
      expect(has(withFlag, c.present)).toBe(true)
      // Bare budget plan does not accidentally show the capability.
      expect(has(withoutFlag, c.present)).toBe(false)
    })
  }

  it('embeds the GB value in the persistent-storage bullet', () => {
    const list = bullets({ ...S_BUDGET, data_persistence_enabled: true, data_persistence_gb: 5 })
    const storage = list.find(b => /(GB|Go)/.test(b))
    expect(storage).toBeDefined()
    expect(storage!).toMatch(/5/)
  })

  it('produces all six bullets for a fully-featured plan', () => {
    const list = bullets({
      ...XL_BUDGET,
      max_session_duration_minutes: 240,
      network_access_enabled: true,
      data_persistence_enabled: true,
      data_persistence_gb: 50,
      command_history_retention_days: 30,
      session_supervision_enabled: true,
      features: ['legacy_capability_a', 'legacy_capability_b'], // must be ignored
    })
    expect(list).toHaveLength(6)
    expect(list[0]).toMatch(/2 L/) // budget first
    expect(has(list, /internet|network|réseau|reseau/i)).toBe(true)
    expect(has(list, /(GB|Go)/)).toBe(true)
    expect(has(list, /supervis/i)).toBe(true)
    // features[] strings never leak in.
    expect(has(list, /legacy_capability_a/i)).toBe(false)
    expect(has(list, /legacy_capability_b/i)).toBe(false)
  })

  it('localizes the supervision bullet in French', () => {
    const list = bullets({ ...S_BUDGET, session_supervision_enabled: true }, 'fr')
    expect(has(list, /supervis/i)).toBe(true)
  })

  it('localizes the unlimited-capacity line in French', () => {
    const list = bullets({ max_cpu: 0, max_memory_mb: 0 }, 'fr')
    expect(has(list, /illimit/i)).toBe(true)
  })
})
