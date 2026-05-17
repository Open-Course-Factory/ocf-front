/**
 * Tests for computeMaxFromRows() — the helper that converts admin size-count
 * rows into raw `max_cpu` + `max_memory_mb` values for the SubscriptionPlan
 * payload.
 *
 * D7 max() semantics: for rows [1 L, 2 M, 4 S], MaxCPU = max(1×4, 2×2, 4×1) = 4
 * and MaxMemoryMB = max(1×2048, 2×1024, 4×512) = 2048 ("students can spawn
 * ANY ONE of these bundles" — not all simultaneously).
 */

import { describe, it, expect } from 'vitest'
import { computeMaxFromRows, CANONICAL_SIZE_CATALOG } from '../../src/utils/quotaFormatters'

describe('computeMaxFromRows', () => {
  it('returns zero budget for an empty row list', () => {
    const result = computeMaxFromRows([])
    expect(result).toEqual({ max_cpu: 0, max_memory_mb: 0 })
  })

  it('computes a single L×1 row as the catalog L values (4 cpu, 2048 MB)', () => {
    const result = computeMaxFromRows([{ size_key: 'l', count: 1 }])
    expect(result).toEqual({ max_cpu: 4, max_memory_mb: 2048 })
  })

  it('applies max() across rows, not sum (D7 semantics)', () => {
    // Rows: [1 L, 2 M, 4 S]
    // CPU axis: max(1×4, 2×2, 4×1) = max(4, 4, 4) = 4
    // RAM axis: max(1×2048, 2×1024, 4×512) = max(2048, 2048, 2048) = 2048
    const result = computeMaxFromRows([
      { size_key: 'l', count: 1 },
      { size_key: 'm', count: 2 },
      { size_key: 's', count: 4 }
    ])
    expect(result).toEqual({ max_cpu: 4, max_memory_mb: 2048 })
  })

  it('uses max() when CPU and memory peaks are on different rows', () => {
    // Rows: [2 L (8 cpu, 4096 MB), 1 XL (4 cpu, 4096 MB)]
    // CPU axis: max(2×4, 1×4) = max(8, 4) = 8 (peak at L)
    // RAM axis: max(2×2048, 1×4096) = max(4096, 4096) = 4096 (tie)
    const result = computeMaxFromRows([
      { size_key: 'l', count: 2 },
      { size_key: 'xl', count: 1 }
    ])
    expect(result).toEqual({ max_cpu: 8, max_memory_mb: 4096 })
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
