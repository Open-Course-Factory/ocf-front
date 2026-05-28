/**
 * Tests for computeMaxFromRows() — the helper that converts admin size-count
 * rows into raw `max_cpu` (mCPU) + `max_memory_mb` (MiB) values for the
 * SubscriptionPlan payload.
 *
 * Sum semantics (reversed from D7 max() on 2026-05-28): for rows
 * [1 XL, 1 XS], MaxCPU = 1×4000 + 1×500 = 4500 mCPU and
 * MaxMemoryMB = 1×4096 + 1×256 = 4352 MiB ("students get this total capacity,
 * mix any way they want within it" — additive across rows on each axis).
 */

import { describe, it, expect } from 'vitest'
import { computeMaxFromRows, CANONICAL_SIZE_CATALOG } from '../../src/utils/quotaFormatters'

describe('computeMaxFromRows', () => {
  it('returns zero budget for an empty row list', () => {
    const result = computeMaxFromRows([])
    expect(result).toEqual({ max_cpu: 0, max_memory_mb: 0 })
  })

  it('computes a single XL×1 row as the catalog XL values (4000 mCPU, 4096 MB)', () => {
    const result = computeMaxFromRows([{ size_key: 'xl', count: 1 }])
    expect(result).toEqual({ max_cpu: 4000, max_memory_mb: 4096 })
  })

  it('computes a single M×3 row by multiplying the catalog values (6000 mCPU, 3072 MB)', () => {
    // Single row, multi-count — same result either max() or sum() would give.
    const result = computeMaxFromRows([{ size_key: 'm', count: 3 }])
    expect(result).toEqual({ max_cpu: 6000, max_memory_mb: 3072 })
  })

  it('adds rows together on both axes (1 XL + 1 XS = 4500 mCPU, 4352 MB)', () => {
    // The 2026-05-28 user test case: "1 XL plus 1 XS" must give MORE
    // capacity than "1 XL alone", not the same. Sum semantics:
    // 4000+500=4500 mCPU, 4096+256=4352 MB.
    const result = computeMaxFromRows([
      { size_key: 'xl', count: 1 },
      { size_key: 'xs', count: 1 }
    ])
    expect(result).toEqual({ max_cpu: 4500, max_memory_mb: 4352 })
  })

  it('sums across rows when one row contributes more CPU and another more RAM (L×1 + M×2 = 8000 mCPU, 4096 MB)', () => {
    // L×1 contributes 4000 mCPU + 2048 MB; M×2 contributes 4000 mCPU + 2048 MB.
    // Sum: 8000 mCPU / 4096 MB. Under the old max() semantics this would have
    // collapsed to 4000 mCPU / 2048 MB.
    const result = computeMaxFromRows([
      { size_key: 'l', count: 1 },
      { size_key: 'm', count: 2 }
    ])
    expect(result).toEqual({ max_cpu: 8000, max_memory_mb: 4096 })
  })

  it('sums when CPU and memory peaks are on different rows (2 L + 1 XL = 12000 mCPU, 8192 MB)', () => {
    // Rows: [2 L (8000 mCPU, 4096 MB), 1 XL (4000 mCPU, 4096 MB)]
    // CPU axis: 2×4000 + 1×4000 = 12000
    // RAM axis: 2×2048 + 1×4096 = 8192
    const result = computeMaxFromRows([
      { size_key: 'l', count: 2 },
      { size_key: 'xl', count: 1 }
    ])
    expect(result).toEqual({ max_cpu: 12000, max_memory_mb: 8192 })
  })

  it('ignores rows with count 0', () => {
    const result = computeMaxFromRows([
      { size_key: 'l', count: 1 },
      { size_key: 'xl', count: 0 }
    ])
    expect(result).toEqual({ max_cpu: 4000, max_memory_mb: 2048 })
  })

  it('ignores rows with unknown size_key', () => {
    const result = computeMaxFromRows([
      { size_key: 'l', count: 1 },
      { size_key: 'nonsense', count: 5 }
    ])
    expect(result).toEqual({ max_cpu: 4000, max_memory_mb: 2048 })
  })

  it('treats negative counts as zero (defensive)', () => {
    const result = computeMaxFromRows([
      { size_key: 'l', count: -3 },
      { size_key: 'm', count: 1 }
    ])
    expect(result).toEqual({ max_cpu: 2000, max_memory_mb: 1024 })
  })

  it('exposes the canonical size catalog matching the ocf-core mCPU budget catalog', () => {
    // Mirrors ocf-core/src/payment/catalog/sizes.go (SSOT, mCPU units).
    // tt-backend/backend/db.go dbSeedSizes describes the same tiers in vCPU +
    // allowance — the mCPU column is the derived budget cost.
    expect(CANONICAL_SIZE_CATALOG.xs).toEqual({ cpu: 500, memory_mb: 256 })
    expect(CANONICAL_SIZE_CATALOG.s).toEqual({ cpu: 1000, memory_mb: 512 })
    expect(CANONICAL_SIZE_CATALOG.m).toEqual({ cpu: 2000, memory_mb: 1024 })
    expect(CANONICAL_SIZE_CATALOG.l).toEqual({ cpu: 4000, memory_mb: 2048 })
    expect(CANONICAL_SIZE_CATALOG.xl).toEqual({ cpu: 4000, memory_mb: 4096 })
  })
})
