import { describe, it, expect } from 'vitest'
import { summarizeRemaining, isBudgetMode } from '../../src/utils/quotaFormatters'
import type { SessionOptionSize } from '../../src/types/terminal'

function size(
  key: string,
  remainingCount: number | undefined,
  allowed = true
): SessionOptionSize {
  return {
    key,
    name: key.toUpperCase(),
    cpu: 1,
    cpu_allowance: '100%',
    memory: '1GiB',
    disk: '4GiB',
    processes: 100,
    sort_order: 0,
    allowed,
    ...(remainingCount !== undefined ? { remaining_count: remainingCount } : {}),
  }
}

describe('summarizeRemaining', () => {
  it('returns up to 3 sizes ordered by capacity descending, omitting zero-remaining sizes', () => {
    const sizes: SessionOptionSize[] = [
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
    const sizes: SessionOptionSize[] = [
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
    const sizes: SessionOptionSize[] = [
      size('xl', 0),
      size('l', 0),
      size('m', 4),
      size('s', 9),
      size('xs', 18),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('4 M OR 9 S OR 18 XS')
  })

  it('omits sizes whose remaining_count is 0', () => {
    const sizes: SessionOptionSize[] = [
      size('xl', 0),
      size('l', 6),
      size('m', 12),
      size('s', 25),
      size('xs', 0),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('6 L OR 12 M OR 25 S')
  })

  it('omits sizes whose remaining_count is undefined (count mode)', () => {
    const sizes: SessionOptionSize[] = [
      size('xl', undefined),
      size('l', 6),
      size('m', undefined),
      size('s', 25),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('6 L OR 25 S')
  })

  it('returns empty string when all remaining_count are 0', () => {
    const sizes: SessionOptionSize[] = [
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
    const sizes: SessionOptionSize[] = [
      size('l', 2),
      size('m', 4),
    ]
    expect(summarizeRemaining(sizes, 'OU')).toBe('2 L OU 4 M')
  })

  it('orders by capacity descending even when remaining_count is identical', () => {
    const sizes: SessionOptionSize[] = [
      size('xs', 5),
      size('l', 5),
      size('m', 5),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('5 L OR 5 M OR 5 XS')
  })

  it('handles unknown size keys by placing them last', () => {
    const sizes: SessionOptionSize[] = [
      size('weird', 100),
      size('m', 10),
      size('l', 5),
    ]
    expect(summarizeRemaining(sizes, 'OR')).toBe('5 L OR 10 M OR 100 WEIRD')
  })

  it('respects top-3 cap even when more sizes qualify', () => {
    const sizes: SessionOptionSize[] = [
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

describe('isBudgetMode', () => {
  it('returns true for any non-null quota regardless of scope', () => {
    // The contract: presence of the quota field IS the budget-mode signal —
    // no special-casing of scope values. Both 'user' and 'organization' must
    // resolve to budget mode.
    expect(
      isBudgetMode({
        quota: { max_cpu: 4, max_memory_mb: 8192, used_cpu: 0, used_memory_mb: 0, remaining_cpu: 4, remaining_memory_mb: 8192, scope: 'user' },
      })
    ).toBe(true)
    expect(
      isBudgetMode({
        quota: { max_cpu: 8, max_memory_mb: 16384, used_cpu: 1, used_memory_mb: 1024, remaining_cpu: 7, remaining_memory_mb: 15360, scope: 'organization' },
      })
    ).toBe(true)
  })

  it('returns true when quota is present with zero-value caps (unlimited sentinel preserved at value level)', () => {
    // max_cpu === 0 / max_memory_mb === 0 means "no cap on that axis" — the
    // response is still in budget mode, just with an unlimited budget. The
    // function must not look at the values inside quota.
    expect(
      isBudgetMode({
        quota: { max_cpu: 0, max_memory_mb: 0, used_cpu: 0, used_memory_mb: 0, remaining_cpu: 2147483647, remaining_memory_mb: 2147483647, scope: 'user' },
      })
    ).toBe(true)
  })

  it('returns false when quota is undefined (count mode)', () => {
    expect(isBudgetMode({})).toBe(false)
  })

  it('returns false when quota is null', () => {
    expect(isBudgetMode({ quota: null as unknown as undefined })).toBe(false)
  })

  it('returns false for undefined input', () => {
    expect(isBudgetMode(undefined)).toBe(false)
  })

  it('returns false for null input', () => {
    expect(isBudgetMode(null)).toBe(false)
  })
})
