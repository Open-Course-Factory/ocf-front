/**
 * How SessionComposer renders the sizes against the plan budget: the per-size
 * counts (budget mode) and what it does when the budget scope is unknown.
 * One describe per former file; each keeps its notes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

// ---- Mocks (must be set up before component import) ----

const mockGetDistributions = vi.fn()
const mockGetSessionOptions = vi.fn()

vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    getDistributions: (...args: any[]) => mockGetDistributions(...args),
    getSessionOptions: (...args: any[]) => mockGetSessionOptions(...args),
    startComposedSession: vi.fn(),
    startSession: vi.fn(),
    stopSession: vi.fn(),
    deleteSession: vi.fn(),
  }
}))

import SessionComposer from '../../src/components/Terminal/SessionComposer.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountComposer() {
  return mount(SessionComposer, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        'router-link': { template: '<a><slot /></a>' },
      }
    }
  })
}

function size(key: string, opts: { allowed?: boolean; remaining_count?: number; reason?: string } = {}) {
  return {
    key,
    name: key.toUpperCase(),
    cpu: 1,
    cpu_allowance: '100%',
    memory: '1GiB',
    disk: '4GiB',
    processes: 100,
    sort_order: 0,
    allowed: opts.allowed ?? true,
    ...(opts.reason !== undefined ? { reason: opts.reason } : {}),
    ...(opts.remaining_count !== undefined ? { remaining_count: opts.remaining_count } : {}),
  }
}

const ubuntu = { name: 'Ubuntu', prefix: 'u', description: 'Ubuntu LTS', is_global: true, default_size_key: 'l' }

// Find the rendered .size-pill for a given size key by its uppercased label.
function pillForKey(wrapper: ReturnType<typeof mountComposer>, key: string) {
  return wrapper.findAll('.size-pill').find(p => p.text().trim().startsWith(key.toUpperCase()))!
}

// What every former file started from; each describe sets its own answers.
beforeEach(() => {
  mockGetDistributions.mockReset()
  mockGetSessionOptions.mockReset()
})

/**
 * Tests for the budget-aware rendering of SessionComposer.
 *
 * Covers:
 *   - Each pill renders a `×N` badge for the per-size `remaining_count`.
 *   - Sizes whose `remaining_count === 0` are rendered disabled (cannot be
 *     selected).
 *   - The top-line "You can spawn …" summary is shown for any non-empty budget.
 */
describe('SessionComposer — budget mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetDistributions.mockResolvedValue([ubuntu])
    // Seed localStorage so the composer auto-restores Ubuntu on mount, which
    // triggers selectDistribution() -> getSessionOptions() automatically. This
    // avoids the alternative of locating and clicking the distribution card.
    localStorage.setItem('ocf-last-session-config', JSON.stringify({
      distribution: 'Ubuntu', size: 'l', features: {}
    }))
  })

  it('renders ×N badges on every size pill when budget mode is active', async () => {
    mockGetSessionOptions.mockResolvedValue({
      distribution: ubuntu,
      allowed_sizes: [
        size('xs', { remaining_count: 50 }),
        size('s', { remaining_count: 25 }),
        size('m', { remaining_count: 12 }),
        size('l', { remaining_count: 6 }),
        size('xl', { remaining_count: 3 }),
      ],
      allowed_features: [],
      quota: {
        max_cpu: 8, max_memory_mb: 16384,
        used_cpu: 0, used_memory_mb: 0,
        remaining_cpu: 8, remaining_memory_mb: 16384,
        scope: 'user'
      }
    })

    const wrapper = mountComposer()
    await flushPromises()
    // wait for selectDistribution -> getSessionOptions
    await flushPromises()
    await flushPromises()

    const badges = wrapper.findAll('.pill-badge')
    expect(badges.length).toBe(5)
    const badgeTexts = badges.map(b => b.text())
    expect(badgeTexts).toContain('×3')
    expect(badgeTexts).toContain('×6')
    expect(badgeTexts).toContain('×12')
    expect(badgeTexts).toContain('×25')
    expect(badgeTexts).toContain('×50')
  })

  it('shows the "You can spawn …" summary line above the pills in budget mode', async () => {
    mockGetSessionOptions.mockResolvedValue({
      distribution: ubuntu,
      allowed_sizes: [
        size('l', { remaining_count: 3 }),
        size('m', { remaining_count: 6 }),
        size('s', { remaining_count: 12 }),
      ],
      allowed_features: [],
      quota: {
        max_cpu: 8, max_memory_mb: 16384,
        used_cpu: 0, used_memory_mb: 0,
        remaining_cpu: 8, remaining_memory_mb: 16384,
        scope: 'user'
      }
    })

    const wrapper = mountComposer()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const summary = wrapper.find('.budget-summary')
    expect(summary.exists()).toBe(true)
    expect(summary.text()).toContain('3 L')
    expect(summary.text()).toContain('6 M')
    expect(summary.text()).toContain('12 S')
  })

  it('shows the "budget exhausted" hint when every remaining_count is zero', async () => {
    mockGetSessionOptions.mockResolvedValue({
      distribution: ubuntu,
      allowed_sizes: [
        size('xs', { remaining_count: 0, allowed: true, reason: 'budget_cpu_exceeded' }),
        size('s', { remaining_count: 0, allowed: true, reason: 'budget_cpu_exceeded' }),
        size('m', { remaining_count: 0, allowed: true, reason: 'budget_memory_exceeded' }),
      ],
      allowed_features: [],
      quota: {
        max_cpu: 2, max_memory_mb: 2048,
        used_cpu: 2, used_memory_mb: 2048,
        remaining_cpu: 0, remaining_memory_mb: 0,
        scope: 'user'
      }
    })

    const wrapper = mountComposer()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    expect(wrapper.find('.budget-summary-exhausted').exists()).toBe(true)
  })

  it('marks size pills whose remaining_count is 0 as exhausted (dimmed, aria-disabled)', async () => {
    mockGetSessionOptions.mockResolvedValue({
      distribution: ubuntu,
      allowed_sizes: [
        size('xs', { remaining_count: 50 }),
        size('s', { remaining_count: 0 }),
        size('m', { remaining_count: 0 }),
      ],
      allowed_features: [],
      quota: {
        max_cpu: 1, max_memory_mb: 1024,
        used_cpu: 0, used_memory_mb: 0,
        remaining_cpu: 1, remaining_memory_mb: 1024,
        scope: 'user'
      }
    })

    const wrapper = mountComposer()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const pills = wrapper.findAll('.size-pill')
    // 3 pills total — find the exhausted ones
    const exhaustedPills = pills.filter(p => p.classes().includes('exhausted'))
    expect(exhaustedPills.length).toBe(2)
    for (const p of exhaustedPills) {
      // Exhausted pills are no longer natively disabled — the user can still
      // select them to inspect specs. They are flagged aria-disabled instead.
      expect(p.attributes('disabled')).toBeUndefined()
      expect(p.attributes('aria-disabled')).toBe('true')
    }
  })

  it('lets the user select an exhausted size to view its specs but keeps readiness false', async () => {
    mockGetSessionOptions.mockResolvedValue({
      distribution: ubuntu,
      allowed_sizes: [
        // Everything exhausted so auto-select picks nothing — start blocked.
        size('s', { remaining_count: 0, allowed: true, reason: 'budget_cpu_exceeded' }),
        size('m', { remaining_count: 0, allowed: true, reason: 'budget_cpu_exceeded' }),
      ],
      allowed_features: [],
      quota: {
        max_cpu: 1, max_memory_mb: 1024,
        used_cpu: 1, used_memory_mb: 1024,
        remaining_cpu: 0, remaining_memory_mb: 0,
        scope: 'user'
      }
    })

    const wrapper = mountComposer()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const vm = wrapper.vm as any
    // Nothing launchable → nothing auto-selected → not ready.
    expect(vm.selectedSize).toBeNull()
    expect(vm.isReady).toBe(false)

    // Click an exhausted pill — it must become the selection (specs visible)…
    const exhaustedPill = wrapper.findAll('.size-pill').find(p => p.classes().includes('exhausted'))
    expect(exhaustedPill).toBeTruthy()
    await exhaustedPill!.trigger('click')
    await flushPromises()

    expect(vm.selectedSize).not.toBeNull()
    // …but readiness stays false so the parent's Start button is disabled.
    expect(vm.isReady).toBe(false)
    // The specs line renders for the (now-selected) size.
    expect(wrapper.find('.size-detail').exists()).toBe(true)
    // And the "specs only" hint explains why it can't be launched.
    expect(wrapper.find('[data-test="size-unavailable-hint"]').exists()).toBe(true)
  })

  it('orders pills descending by capacity in budget mode (XL first)', async () => {
    mockGetSessionOptions.mockResolvedValue({
      distribution: ubuntu,
      allowed_sizes: [
        size('xs', { remaining_count: 50 }),
        size('xl', { remaining_count: 3 }),
        size('s', { remaining_count: 25 }),
        size('l', { remaining_count: 6 }),
        size('m', { remaining_count: 12 }),
      ],
      allowed_features: [],
      quota: {
        max_cpu: 8, max_memory_mb: 16384,
        used_cpu: 0, used_memory_mb: 0,
        remaining_cpu: 8, remaining_memory_mb: 16384,
        scope: 'user'
      }
    })

    const wrapper = mountComposer()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const pills = wrapper.findAll('.size-pill')
    const labels = pills.map(p => {
      // first token before badge / icons
      const txt = p.text().trim()
      return txt.split(/\s/)[0]
    })
    expect(labels).toEqual(['XL', 'L', 'M', 'S', 'XS'])
  })
})

/**
 * Tests for unknown-scope rendering of SessionComposer.
 *
 * When ocf-core cannot compute a budget — the quota service is unreachable, or
 * no plan resolved — GET /terminals/session-options returns every size with
 * `remaining_count: 0` and a top-level `quota.scope: "unknown"` meaning "these
 * counts are not real". The composer must keep those size pills SELECTABLE
 * (not disabled, not marked exhausted).
 *
 * Being optimistic is deliberate: the start request is enforced server-side by
 * EnforceBudgetTx regardless, so a transient read failure must not freeze the
 * launcher for everyone.
 *
 * Regression guard for the contract mismatch where the composer treated
 * `remaining_count === 0` as "exhausted" without consulting `quota.scope`,
 * greying out every size and blocking launch. That guard is unchanged; the
 * scope value it keys off was renamed from "unlimited" when plans lost the
 * ability to be uncapped at all.
 *
 * Covers:
 *   - unknown scope + remaining_count 0  => pill SELECTABLE (not disabled).
 *   - budget scope (user) + remaining_count 0 => pill DISABLED (preserved).
 *   - `allowed: false` => pill LOCKED regardless of scope.
 */
describe('SessionComposer — unknown scope', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetDistributions.mockResolvedValue([ubuntu])
    // Seed localStorage so the composer auto-restores Ubuntu on mount, which
    // triggers selectDistribution() -> getSessionOptions() automatically.
    localStorage.setItem('ocf-last-session-config', JSON.stringify({
      distribution: 'Ubuntu', size: 'l', features: {}
    }))
  })

  it('keeps allowed size pills selectable when scope is unknown even with remaining_count 0', async () => {
    mockGetSessionOptions.mockResolvedValue({
      distribution: ubuntu,
      // Unlimited plan: backend marks everything allowed but reports 0 remaining.
      allowed_sizes: [
        size('xs', { allowed: true, remaining_count: 0 }),
        size('s', { allowed: true, remaining_count: 0 }),
        size('m', { allowed: true, remaining_count: 0 }),
        size('l', { allowed: true, remaining_count: 0 }),
        size('xl', { allowed: true, remaining_count: 0 }),
      ],
      allowed_features: [],
      quota: {
        max_cpu: 0, max_memory_mb: 0,
        used_cpu: 0, used_memory_mb: 0,
        remaining_cpu: 0, remaining_memory_mb: 0,
        scope: 'unknown'
      }
    })

    const wrapper = mountComposer()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const pills = wrapper.findAll('.size-pill')
    expect(pills.length).toBe(5)

    // Every allowed pill must be clickable: not disabled, not marked exhausted.
    for (const p of pills) {
      expect(p.attributes('disabled')).toBeUndefined()
      expect(p.classes()).not.toContain('exhausted')
    }
  })

  it('lets the user pick an unknown-scope size that reports remaining_count 0', async () => {
    mockGetSessionOptions.mockResolvedValue({
      distribution: ubuntu,
      allowed_sizes: [
        size('m', { allowed: true, remaining_count: 0 }),
        size('l', { allowed: true, remaining_count: 0 }),
      ],
      allowed_features: [],
      quota: {
        max_cpu: 0, max_memory_mb: 0,
        used_cpu: 0, used_memory_mb: 0,
        remaining_cpu: 0, remaining_memory_mb: 0,
        scope: 'unknown'
      }
    })

    const wrapper = mountComposer()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const mPill = pillForKey(wrapper, 'm')
    expect(mPill.attributes('disabled')).toBeUndefined()

    await mPill.trigger('click')
    // The clicked pill becomes the selected one.
    expect(mPill.classes()).toContain('selected')
  })

  it('still marks remaining_count 0 pills as exhausted in budget mode (scope user)', async () => {
    mockGetSessionOptions.mockResolvedValue({
      distribution: ubuntu,
      allowed_sizes: [
        size('xs', { allowed: true, remaining_count: 50 }),
        size('s', { allowed: true, remaining_count: 0 }),
        size('m', { allowed: true, remaining_count: 0 }),
      ],
      allowed_features: [],
      quota: {
        max_cpu: 1, max_memory_mb: 1024,
        used_cpu: 0, used_memory_mb: 0,
        remaining_cpu: 1, remaining_memory_mb: 1024,
        scope: 'user'
      }
    })

    const wrapper = mountComposer()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const exhausted = wrapper.findAll('.size-pill').filter(p => p.classes().includes('exhausted'))
    expect(exhausted.length).toBe(2)
    for (const p of exhausted) {
      // Exhausted pills stay selectable (specs inspection) but are flagged
      // aria-disabled rather than natively disabled.
      expect(p.attributes('disabled')).toBeUndefined()
      expect(p.attributes('aria-disabled')).toBe('true')
    }
    // The size with capacity is not flagged unavailable.
    expect(pillForKey(wrapper, 'xs').attributes('aria-disabled')).toBe('false')
  })

  it('keeps an unallowed size locked regardless of scope (unknown)', async () => {
    mockGetSessionOptions.mockResolvedValue({
      distribution: ubuntu,
      allowed_sizes: [
        size('m', { allowed: true, remaining_count: 0 }),
        size('xl', { allowed: false, remaining_count: 0, reason: 'plan_limit' }),
      ],
      allowed_features: [],
      quota: {
        max_cpu: 0, max_memory_mb: 0,
        used_cpu: 0, used_memory_mb: 0,
        remaining_cpu: 0, remaining_memory_mb: 0,
        scope: 'unknown'
      }
    })

    const wrapper = mountComposer()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const xlPill = pillForKey(wrapper, 'xl')
    // Plan-locked: keeps its dimmed visual class and is flagged aria-disabled,
    // but remains clickable so the user can inspect its specs.
    expect(xlPill.classes()).toContain('disabled')
    expect(xlPill.attributes('disabled')).toBeUndefined()
    expect(xlPill.attributes('aria-disabled')).toBe('true')

    // The allowed size is not flagged unavailable.
    expect(pillForKey(wrapper, 'm').attributes('aria-disabled')).toBe('false')
  })
})
