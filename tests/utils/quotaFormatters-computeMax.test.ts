/**
 * Tests for computeMaxFromRows() — the helper that converts admin size-count
 * rows into raw `max_cpu` + `max_memory_mb` values for the SubscriptionPlan
 * payload.
 *
 * Sum semantics (reversed from D7 max() on 2026-05-28): for rows
 * [1 XL, 1 XS], MaxCPU = 1×4 + 1×1 = 5 and MaxMemoryMB = 1×4096 + 1×256 =
 * 4352 ("students get this total capacity, mix any way they want within it"
 * — additive across rows on each axis).
 */

import { describe, it, expect } from 'vitest'
import { computeMaxFromRows, CANONICAL_SIZE_CATALOG } from '../../src/utils/quotaFormatters'

describe('computeMaxFromRows', () => {
  it('returns zero budget for an empty row list', () => {
    const result = computeMaxFromRows([])
    expect(result).toEqual({ max_cpu: 0, max_memory_mb: 0 })
  })

  it('computes a single XL×1 row as the catalog XL values (4 cpu, 4096 MB)', () => {
    const result = computeMaxFromRows([{ size_key: 'xl', count: 1 }])
    expect(result).toEqual({ max_cpu: 4, max_memory_mb: 4096 })
  })

  it('computes a single M×3 row by multiplying the catalog values (6 cpu, 3072 MB)', () => {
    // Single row, multi-count — same result either max() or sum() would give.
    const result = computeMaxFromRows([{ size_key: 'm', count: 3 }])
    expect(result).toEqual({ max_cpu: 6, max_memory_mb: 3072 })
  })

  it('adds rows together on both axes (1 XL + 1 XS = 5 cpu, 4352 MB)', () => {
    // The 2026-05-28 user test case: "1 XL plus 1 XS" must give MORE
    // capacity than "1 XL alone", not the same. Sum semantics: 4+1=5 cpu,
    // 4096+256=4352 MB.
    const result = computeMaxFromRows([
      { size_key: 'xl', count: 1 },
      { size_key: 'xs', count: 1 }
    ])
    expect(result).toEqual({ max_cpu: 5, max_memory_mb: 4352 })
  })

  it('sums across rows when one row contributes more CPU and another more RAM (L×1 + M×2 = 8 cpu, 4096 MB)', () => {
    // L×1 contributes 4 cpu + 2048 MB; M×2 contributes 4 cpu + 2048 MB.
    // Sum: 8 cpu / 4096 MB. Under the old max() semantics this would have
    // collapsed to 4 cpu / 2048 MB.
    const result = computeMaxFromRows([
      { size_key: 'l', count: 1 },
      { size_key: 'm', count: 2 }
    ])
    expect(result).toEqual({ max_cpu: 8, max_memory_mb: 4096 })
  })

  it('sums when CPU and memory peaks are on different rows (2 L + 1 XL = 12 cpu, 8192 MB)', () => {
    // Rows: [2 L (8 cpu, 4096 MB), 1 XL (4 cpu, 4096 MB)]
    // CPU axis: 2×4 + 1×4 = 12
    // RAM axis: 2×2048 + 1×4096 = 8192
    const result = computeMaxFromRows([
      { size_key: 'l', count: 2 },
      { size_key: 'xl', count: 1 }
    ])
    expect(result).toEqual({ max_cpu: 12, max_memory_mb: 8192 })
  })

  it('ignores rows with count 0', () => {
    const result = computeMaxFromRows([
      { size_key: 'l', count: 1 },
      { size_key: 'xl', count: 0 }
    ])
    expect(result).toEqual({ max_cpu: 4, max_memory_mb: 2048 })
  })

  it('ignores rows with unknown size_key', () => {
    const result = computeMaxFromRows([
      { size_key: 'l', count: 1 },
      { size_key: 'nonsense', count: 5 }
    ])
    expect(result).toEqual({ max_cpu: 4, max_memory_mb: 2048 })
  })

  it('treats negative counts as zero (defensive)', () => {
    const result = computeMaxFromRows([
      { size_key: 'l', count: -3 },
      { size_key: 'm', count: 1 }
    ])
    expect(result).toEqual({ max_cpu: 2, max_memory_mb: 1024 })
  })

  it('exposes the canonical size catalog matching the backend seed', () => {
    // Mirrors tt-backend/backend/db.go dbSeedSizes and
    // ocf-core/src/payment/backfill/quota.go sizeCatalog.
    expect(CANONICAL_SIZE_CATALOG.xs).toEqual({ cpu: 1, memory_mb: 256 })
    expect(CANONICAL_SIZE_CATALOG.s).toEqual({ cpu: 1, memory_mb: 512 })
    expect(CANONICAL_SIZE_CATALOG.m).toEqual({ cpu: 2, memory_mb: 1024 })
    expect(CANONICAL_SIZE_CATALOG.l).toEqual({ cpu: 4, memory_mb: 2048 })
    expect(CANONICAL_SIZE_CATALOG.xl).toEqual({ cpu: 4, memory_mb: 4096 })
  })
})
