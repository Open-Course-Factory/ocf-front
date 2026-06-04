/**
 * Tests for unlimited-scope rendering of SessionComposer.
 *
 * On an unlimited plan, ocf-core's GET /terminals/session-options returns every
 * size with `allowed: true` and `remaining_count: 0`, plus a top-level
 * `quota.scope: "unlimited"` meaning "ignore the per-size counts — the user is
 * unconstrained". The composer must therefore keep those size pills SELECTABLE
 * (not disabled, not marked exhausted) when scope is unlimited.
 *
 * Regression guard for the contract mismatch where the composer treated
 * `remaining_count === 0` as "exhausted" without consulting `quota.scope`,
 * greying out every size on an unlimited plan and blocking launch.
 *
 * Covers:
 *   - unlimited scope + remaining_count 0  => pill SELECTABLE (not disabled).
 *   - budget scope (user) + remaining_count 0 => pill DISABLED (preserved).
 *   - `allowed: false` => pill LOCKED regardless of scope.
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

describe('SessionComposer — unlimited scope', () => {
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

  it('keeps allowed size pills selectable when scope is unlimited even with remaining_count 0', async () => {
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
        remaining_cpu: 2147483647, remaining_memory_mb: 2147483647,
        scope: 'unlimited'
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

  it('lets the user pick an unlimited-scope size that reports remaining_count 0', async () => {
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
        remaining_cpu: 2147483647, remaining_memory_mb: 2147483647,
        scope: 'unlimited'
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

  it('keeps an unallowed size locked regardless of scope (unlimited)', async () => {
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
        remaining_cpu: 2147483647, remaining_memory_mb: 2147483647,
        scope: 'unlimited'
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
