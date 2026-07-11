import { describe, it, expect } from 'vitest'
import {
  summarizeRemaining,
  summarizeRemainingBudget,
  formatBudgetAsSizes,
  CANONICAL_SIZE_CATALOG,
  capacityRank,
  formatMemoryMb,
  pickLargestSelectableSize,
  formatCompactDuration,
  formatElapsed,
} from '../../src/utils/quotaFormatters'
// Minimal shape — `summarizeRemaining` only reads `key` and `remaining_count`.
type RemainingFixture = { key: string; remaining_count?: number }

function size(
  key: string,
  remainingCount: number | undefined
): RemainingFixture {
  return remainingCount === undefined ? { key } : { key, remaining_count: remainingCount }
}

describe('summarizeRemaining', () => {
  it('returns up to 3 sizes ordered by capacity descending, omitting zero-remaining sizes', () => {
    const sizes: RemainingFixture[] = [
      size('xs', 50),
      size('s', 25),
      size('m', 12),
      size('l', 6),
      size('xl', 3),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('3 XL OR 6 L OR 12 M')
  })

  it('keeps capacity-descending order even when small sizes have higher remaining_count', () => {
    // XS has 200 remaining but XL still wins the top slot because it has higher
    // capacity. A naive "top N by remaining_count" implementation would render
    // "200 XS OR 100 S OR 50 M" — the test proves we do NOT do that.
    const sizes: RemainingFixture[] = [
      size('xs', 200),
      size('s', 100),
      size('m', 50),
      size('l', 4),
      size('xl', 1),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('1 XL OR 4 L OR 50 M')
  })

  it('shows only the small sizes when large sizes are exhausted', () => {
    // XL + L are full → they must not appear; the summary cascades to the
    // smaller sizes in capacity-descending order.
    const sizes: RemainingFixture[] = [
      size('xl', 0),
      size('l', 0),
      size('m', 4),
      size('s', 9),
      size('xs', 18),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('4 M OR 9 S OR 18 XS')
  })

  it('omits sizes whose remaining_count is 0', () => {
    const sizes: RemainingFixture[] = [
      size('xl', 0),
      size('l', 6),
      size('m', 12),
      size('s', 25),
      size('xs', 0),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('6 L OR 12 M OR 25 S')
  })

  it('omits sizes whose remaining_count is undefined', () => {
    const sizes: RemainingFixture[] = [
      size('xl', undefined),
      size('l', 6),
      size('m', undefined),
      size('s', 25),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('6 L OR 25 S')
  })

  it('returns empty string when all remaining_count are 0', () => {
    const sizes: RemainingFixture[] = [
      size('xl', 0),
      size('l', 0),
      size('m', 0),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('')
  })

  it('returns empty string when sizes list is empty', () => {
    expect(summarizeRemaining([], 'OR')).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(summarizeRemaining(undefined, 'OR')).toBe('')
  })

  it('uses the provided joiner (localized OR / OU)', () => {
    const sizes: RemainingFixture[] = [
      size('l', 2),
      size('m', 4),
    ]
    expect(summarizeRemaining(sizes, 'OU')).toBe('2 L OU 4 M')
  })

  it('orders by capacity descending even when remaining_count is identical', () => {
    const sizes: RemainingFixture[] = [
      size('xs', 5),
      size('l', 5),
      size('m', 5),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('5 L OR 5 M OR 5 XS')
  })

  it('handles unknown size keys by placing them last', () => {
    const sizes: RemainingFixture[] = [
      size('weird', 100),
      size('m', 10),
      size('l', 5),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('5 L OR 10 M OR 100 WEIRD')
  })

  it('respects top-3 cap even when more sizes qualify', () => {
    const sizes: RemainingFixture[] = [
      size('xl', 1),
      size('l', 2),
      size('m', 3),
      size('s', 4),
      size('xs', 5),
    ]
    const out = summarizeRemaining(sizes, 'OR')
    // Top 3 by capacity descending: xl, l, m
    expect(out).toBe('1 XL OR 2 L OR 3 M')
    expect(out).not.toContain('XS')
    expect(out).not.toContain(' S')
  })
})

describe('formatBudgetAsSizes', () => {
  it('renders the top three sizes in descending capacity order for a budget plan', () => {
    // max_cpu=8000 mCPU, max_memory_mb=4096
    //   xl: cpu=4000 → 2, ram=4096 → 1 → min 1
    //   l : cpu=4000 → 2, ram=2048 → 2 → min 2
    //   m : cpu=2000 → 4, ram=1024 → 4 → min 4
    //   s : cpu=1000 → 8, ram=512  → 8 → min 8
    //   xs: cpu=500  → 16, ram=256 → 16 → min 16
    // Top-3 by capacity descending: xl, l, m → "1 XL OR 2 L OR 4 M"
    const plan = { max_cpu: 8000, max_memory_mb: 4096 }
    expect(formatBudgetAsSizes(plan, CANONICAL_SIZE_CATALOG, 'OR')).toBe('1 XL OR 2 L OR 4 M')
  })

  it('returns "1 L OR 2 M OR 4 S" for a typical Solo-tier budget', () => {
    // A budget plan that lets a solo trainer run 1 L session.
    // With max_cpu=8000 mCPU, max_memory_mb=2048:
    //   xl: ram=2048 → 0 → skip
    //   l : ram=2048 → 1, cpu=8000/4000 → 2 → min 1
    //   m : ram=2048 → 2, cpu=8000/2000 → 4 → min 2
    //   s : ram=2048 → 4, cpu=8000/1000 → 8 → min 4
    //   xs: ram=2048 → 8, cpu=8000/500 → 16 → min 8
    // Top-3: l, m, s → "1 L OR 2 M OR 4 S"
    expect(
      formatBudgetAsSizes(
        { max_cpu: 8000, max_memory_mb: 2048 },
        CANONICAL_SIZE_CATALOG,
        'OR'
      )
    ).toBe('1 L OR 2 M OR 4 S')
  })

  it('respects the binding RAM axis when CPU is overprovisioned', () => {
    // max_cpu is huge but max_memory_mb limits the big sizes.
    // max_cpu=32000 mCPU, max_memory_mb=2048:
    //   xl: cpu=4000 → 8, ram=4096 → 0 → 0 (skip)
    //   l : cpu=4000 → 8, ram=2048 → 1 → 1
    //   m : cpu=2000 → 16, ram=1024 → 2 → 2
    //   s : cpu=1000 → 32, ram=512 → 4 → 4
    //   xs: cpu=500 → 64, ram=256 → 8 → 8
    // Top-3: l, m, s
    const plan = { max_cpu: 32000, max_memory_mb: 2048 }
    expect(formatBudgetAsSizes(plan, CANONICAL_SIZE_CATALOG, 'OR')).toBe('1 L OR 2 M OR 4 S')
  })

  it('respects the binding CPU axis when RAM is overprovisioned', () => {
    // max_cpu=2000 mCPU, max_memory_mb=99999:
    //   xl: cpu=2000/4000 → 0 → skip
    //   l : cpu=2000/4000 → 0 → skip
    //   m : cpu=2000/2000 → 1, ram=99999/1024 → 97 → 1
    //   s : cpu=2000/1000 → 2, ram=99999/512 → 195 → 2
    //   xs: cpu=2000/500 → 4, ram=99999/256 → 390 → 4
    // Top-3: m, s, xs
    const plan = { max_cpu: 2000, max_memory_mb: 99999 }
    expect(formatBudgetAsSizes(plan, CANONICAL_SIZE_CATALOG, 'OR')).toBe('1 M OR 2 S OR 4 XS')
  })

  it('returns empty string when both max_cpu and max_memory_mb are 0 (unlimited budget)', () => {
    // Unlimited budget is signalled by 0 on both axes — callers render
    // "Unlimited capacity" instead. The function must not return Infinity
    // counts or some nonsensical "∞ XL" string.
    const plan = { max_cpu: 0, max_memory_mb: 0 }
    expect(formatBudgetAsSizes(plan, CANONICAL_SIZE_CATALOG, 'OR')).toBe('')
  })

  it('uses the provided localized joiner', () => {
    expect(
      formatBudgetAsSizes(
        { max_cpu: 8000, max_memory_mb: 4096 },
        CANONICAL_SIZE_CATALOG,
        'OU'
      )
    ).toBe('1 XL OU 2 L OU 4 M')
  })

  it('skips sizes that do not fit at all (count < 1)', () => {
    // Tiny budget: only XS fits. The summary contains only "N XS".
    const plan = { max_cpu: 500, max_memory_mb: 256 }
    expect(formatBudgetAsSizes(plan, CANONICAL_SIZE_CATALOG, 'OR')).toBe('1 XS')
  })

  it('returns empty string when the budget is too small for any catalog size', () => {
    // Pathological case: budget below the smallest size's minimum.
    // max_cpu=500 OK for XS, but max_memory_mb=100 is below XS's 256 → 0 → skip.
    const plan = { max_cpu: 500, max_memory_mb: 100 }
    expect(formatBudgetAsSizes(plan, CANONICAL_SIZE_CATALOG, 'OR')).toBe('')
  })
})

describe('summarizeRemainingBudget', () => {
  // The usage panel needs "how much can I still launch" as a size-count line,
  // derived from the REMAINING budget (max − used). It must reuse the same
  // size-count math as the plan cards (formatBudgetAsSizes) so the two never
  // drift — but it also has to tell apart two states that formatBudgetAsSizes
  // collapses onto the same 0-budget input:
  //   - "unlimited"  → the plan has no cap on that axis (server sends max = 0)
  //   - "exhausted"  → the plan HAS a cap and it is fully consumed (remaining 0)
  // Rendering "≈ 0 ×" (or, worse, "unlimited") for a used-up capped plan would
  // be nonsense, so the helper returns a discriminated { kind, sizes } instead
  // of a bare string.

  it('returns the remaining capacity as a size-count string for a partly-used capped plan', () => {
    // max 8000 mCPU / 4096 MiB, half consumed → remaining 4000 / 2048.
    // Remaining size math MUST equal formatBudgetAsSizes on the remaining
    // budget (SSOT with the plan cards): "1 L OR 2 M OR 4 S".
    const remainingSizes = formatBudgetAsSizes(
      { max_cpu: 4000, max_memory_mb: 2048 },
      CANONICAL_SIZE_CATALOG,
      'OR'
    )
    const result = summarizeRemainingBudget(
      { max_cpu: 8000, max_memory_mb: 4096, used_cpu: 4000, used_memory_mb: 2048 },
      CANONICAL_SIZE_CATALOG,
      'OR'
    )
    expect(result.kind).toBe('sizes')
    expect(result.sizes).toBe(remainingSizes)
    expect(result.sizes).toBe('1 L OR 2 M OR 4 S')
  })

  it('reports "unlimited" when both axes are uncapped (max = 0)', () => {
    const result = summarizeRemainingBudget(
      { max_cpu: 0, max_memory_mb: 0, used_cpu: 0, used_memory_mb: 0 },
      CANONICAL_SIZE_CATALOG,
      'OR'
    )
    expect(result.kind).toBe('unlimited')
    expect(result.sizes).toBe('')
  })

  it('reports "exhausted" (NOT "unlimited") when a capped plan is fully consumed', () => {
    // THE bug this guards: remaining CPU is 0 here, but the plan is capped
    // (max 8000 ≠ 0). Feeding 0 straight into formatBudgetAsSizes would read
    // as "unlimited" and print an infinite-capacity line for a used-up plan.
    const result = summarizeRemainingBudget(
      { max_cpu: 8000, max_memory_mb: 4096, used_cpu: 8000, used_memory_mb: 4096 },
      CANONICAL_SIZE_CATALOG,
      'OR'
    )
    expect(result.kind).toBe('exhausted')
    expect(result.sizes).toBe('')
  })

  it('reports "exhausted" when over-consumed (used exceeds max)', () => {
    const result = summarizeRemainingBudget(
      { max_cpu: 8000, max_memory_mb: 4096, used_cpu: 9000, used_memory_mb: 5000 },
      CANONICAL_SIZE_CATALOG,
      'OR'
    )
    expect(result.kind).toBe('exhausted')
  })

  it('reports "exhausted" when the remaining budget is below the smallest catalog size', () => {
    // Remaining 200 mCPU / 96 MiB — positive, but nothing fits (XS needs
    // 500 / 256). formatBudgetAsSizes returns '' here, which must surface as
    // "exhausted", not an empty sizes line the caller has to guess about.
    const result = summarizeRemainingBudget(
      { max_cpu: 8000, max_memory_mb: 4096, used_cpu: 7800, used_memory_mb: 4000 },
      CANONICAL_SIZE_CATALOG,
      'OR'
    )
    expect(result.kind).toBe('exhausted')
    expect(result.sizes).toBe('')
  })

  it('treats a single uncapped axis as unlimited on that axis and sizes by the capped one', () => {
    // CPU uncapped (max 0), RAM capped at 4096 with 2048 used → remaining RAM
    // 2048 binds the count. Must NOT be mistaken for exhausted just because
    // the CPU axis reads 0.
    const result = summarizeRemainingBudget(
      { max_cpu: 0, max_memory_mb: 4096, used_cpu: 0, used_memory_mb: 2048 },
      CANONICAL_SIZE_CATALOG,
      'OR'
    )
    expect(result.kind).toBe('sizes')
    expect(result.sizes).toBe('1 L OR 2 M OR 4 S')
  })

  it('reports "exhausted" when the capped axis is used up even if the other axis is uncapped', () => {
    // CPU uncapped, RAM capped and fully consumed → exhausted. This pins the
    // disambiguation: a 0 on an UNCAPPED axis means unlimited, a 0 remaining on
    // a CAPPED axis means used-up.
    const result = summarizeRemainingBudget(
      { max_cpu: 0, max_memory_mb: 4096, used_cpu: 0, used_memory_mb: 4096 },
      CANONICAL_SIZE_CATALOG,
      'OR'
    )
    expect(result.kind).toBe('exhausted')
  })

  it('uses the provided localized joiner for the sizes string', () => {
    const result = summarizeRemainingBudget(
      { max_cpu: 8000, max_memory_mb: 4096, used_cpu: 4000, used_memory_mb: 2048 },
      CANONICAL_SIZE_CATALOG,
      'OU'
    )
    expect(result.sizes).toBe('1 L OU 2 M OU 4 S')
  })
})

describe('capacityRank', () => {
  it('returns a lower index for larger sizes (xl < l < m < s < xs)', () => {
    // Lower rank = larger size, so it sorts to the front in ascending sort.
    expect(capacityRank('xl')).toBeLessThan(capacityRank('l'))
    expect(capacityRank('l')).toBeLessThan(capacityRank('m'))
    expect(capacityRank('m')).toBeLessThan(capacityRank('s'))
    expect(capacityRank('s')).toBeLessThan(capacityRank('xs'))
  })

  it('returns the sentinel rank for unknown size keys, placing them last', () => {
    // Unknown keys must not crowd out known sizes in summaries / sorted tables.
    const unknown = capacityRank('weird')
    expect(unknown).toBeGreaterThan(capacityRank('xs'))
  })

  it('is case-insensitive', () => {
    expect(capacityRank('XL')).toBe(capacityRank('xl'))
    expect(capacityRank('M')).toBe(capacityRank('m'))
  })
})

describe('formatMemoryMb', () => {
  it('renders zero and negative inputs as "0 MiB"', () => {
    expect(formatMemoryMb(0)).toBe('0 MiB')
    expect(formatMemoryMb(-100)).toBe('0 MiB')
  })

  it('renders sub-GiB values in MiB', () => {
    expect(formatMemoryMb(512)).toBe('512 MiB')
    expect(formatMemoryMb(1023)).toBe('1023 MiB')
  })

  it('renders GiB-scale values under 10 GiB with one decimal', () => {
    // 4096 MiB = 4.0 GiB. The decimal makes 4.5 GiB / 6.5 GiB readable too.
    expect(formatMemoryMb(1024)).toBe('1.0 GiB')
    expect(formatMemoryMb(4096)).toBe('4.0 GiB')
    expect(formatMemoryMb(6656)).toBe('6.5 GiB')
  })

  it('renders 10 GiB and above without decimals', () => {
    // Large budgets read better without a trailing ".0".
    expect(formatMemoryMb(10240)).toBe('10 GiB')
    expect(formatMemoryMb(16384)).toBe('16 GiB')
    expect(formatMemoryMb(24576)).toBe('24 GiB')
  })
})

describe('pickLargestSelectableSize', () => {
  type SizeFixture = { key: string; allowed: boolean }
  const isAllowed = (s: SizeFixture) => s.allowed

  it('picks the largest allowed size when smaller sizes are locked', () => {
    // Backend order is smallest→largest; XS/S locked, M/L/XL allowed.
    const sizes: SizeFixture[] = [
      { key: 'xs', allowed: false },
      { key: 's', allowed: false },
      { key: 'm', allowed: true },
      { key: 'l', allowed: true },
      { key: 'xl', allowed: true },
    ]
    expect(pickLargestSelectableSize(sizes, isAllowed)?.key).toBe('xl')
  })

  it('skips the largest size when it is locked and picks the next largest', () => {
    const sizes: SizeFixture[] = [
      { key: 'xs', allowed: true },
      { key: 's', allowed: true },
      { key: 'm', allowed: true },
      { key: 'l', allowed: true },
      { key: 'xl', allowed: false },
    ]
    expect(pickLargestSelectableSize(sizes, isAllowed)?.key).toBe('l')
  })

  it('returns undefined when no size is selectable', () => {
    const sizes: SizeFixture[] = [
      { key: 'xs', allowed: false },
      { key: 'm', allowed: false },
    ]
    expect(pickLargestSelectableSize(sizes, isAllowed)).toBeUndefined()
  })

  it('returns undefined for empty / nullish input', () => {
    expect(pickLargestSelectableSize([], isAllowed)).toBeUndefined()
    expect(pickLargestSelectableSize(undefined, isAllowed)).toBeUndefined()
    expect(pickLargestSelectableSize(null, isAllowed)).toBeUndefined()
  })

  it('is independent of input order', () => {
    const sizes: SizeFixture[] = [
      { key: 'm', allowed: true },
      { key: 'xl', allowed: true },
      { key: 's', allowed: true },
    ]
    expect(pickLargestSelectableSize(sizes, isAllowed)?.key).toBe('xl')
  })
})

describe('formatCompactDuration', () => {
  const HOUR = 3600
  const DAY = 86400

  it('returns the fallback for non-finite / negative input', () => {
    expect(formatCompactDuration(NaN)).toBe('')
    expect(formatCompactDuration(Infinity)).toBe('')
    expect(formatCompactDuration(-1)).toBe('')
    expect(formatCompactDuration(-1, '—')).toBe('—')
    // A Go zero-time fed as "seconds elapsed" is hugely negative.
    expect(formatCompactDuration(-63_000_000_000, '—')).toBe('—')
  })

  it('renders seconds under a minute', () => {
    expect(formatCompactDuration(0)).toBe('0s')
    expect(formatCompactDuration(42)).toBe('42s')
    expect(formatCompactDuration(59)).toBe('59s')
  })

  it('transitions to minutes at 60s and stays minutes under an hour', () => {
    expect(formatCompactDuration(60)).toBe('1m')
    expect(formatCompactDuration(59 * 60)).toBe('59m')
  })

  it('transitions to the compact hour form at 60m and stays under a day', () => {
    expect(formatCompactDuration(60 * 60)).toBe('1h00')
    expect(formatCompactDuration(72 * 60)).toBe('1h12')
    // 23h59m → still hours.
    expect(formatCompactDuration(23 * HOUR + 59 * 60)).toBe('23h59')
  })

  it('transitions to days at 24h and shows leftover hours when non-trivial', () => {
    expect(formatCompactDuration(24 * HOUR)).toBe('1d')
    expect(formatCompactDuration(25 * HOUR)).toBe('1d 1h')
    expect(formatCompactDuration(6 * DAY)).toBe('6d')
    expect(formatCompactDuration(6 * DAY + 5 * HOUR)).toBe('6d 5h')
  })

  it('transitions to weeks at 7d and to years at 365d', () => {
    expect(formatCompactDuration(7 * DAY)).toBe('1w')
    expect(formatCompactDuration(364 * DAY)).toBe('52w')
    expect(formatCompactDuration(365 * DAY)).toBe('1y')
    // The 2026-year garbage value now scales to a sane "Ny".
    expect(formatCompactDuration(2026 * 365 * DAY)).toBe('2026y')
  })
})

describe('formatElapsed', () => {
  // Fixed "now" so the multi-day / week / year cases are deterministic.
  const NOW = Date.UTC(2026, 0, 1, 12, 0, 0)

  it('returns "—" for a Go zero-time (THE bug)', () => {
    // Date.parse('0001-01-01T00:00:00Z') is a huge NEGATIVE epoch that passes
    // Number.isFinite — the old code rendered ~2026 years of elapsed time.
    expect(formatElapsed('0001-01-01T00:00:00Z', NOW)).toBe('—')
  })

  it('returns "—" for empty / unparseable / pre-2000 input', () => {
    expect(formatElapsed('', NOW)).toBe('—')
    expect(formatElapsed('not-a-date', NOW)).toBe('—')
    expect(formatElapsed('1999-12-31T23:59:59Z', NOW)).toBe('—')
  })

  it('renders a recent time as seconds / minutes', () => {
    expect(formatElapsed(new Date(NOW - 30_000).toISOString(), NOW)).toBe('30s')
    expect(formatElapsed(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe('5m')
  })

  it('scales multi-day / multi-week / multi-year elapsed times', () => {
    const DAY = 86_400_000
    expect(formatElapsed(new Date(NOW - 3 * DAY).toISOString(), NOW)).toBe('3d')
    expect(formatElapsed(new Date(NOW - 14 * DAY).toISOString(), NOW)).toBe('2w')
    expect(formatElapsed(new Date(NOW - 800 * DAY).toISOString(), NOW)).toBe('2y')
  })
})
