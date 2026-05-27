/**
 * Quota / budget formatting helpers.
 *
 * These helpers convert the new budget-mode shape of the session-options
 * response into customer-facing strings. Customer-facing copy MUST stay in
 * size-count language ("3 L OR 6 M") — never raw CPU/GB (see memory entry
 * `feedback_quota_ux_size_count.md`).
 *
 * Shared between MR-FRONT-A (composer + starter) and MR-FRONT-B
 * (OrgTerminalUsagePanel). Keep this file free of Vue-specific imports so
 * either side can consume it.
 */

import type { SessionOptionSize } from '../types/terminal'

/**
 * Order convention: descending by capacity. L and XL share CPU; sorting by
 * capacity descending keeps the "most impressive" number first in the summary
 * (e.g. when L's remaining_count is higher than XL's because L doesn't carry
 * the full XL memory footprint). See memory entry
 * `project_resource_quota_refactor.md`.
 */
const CAPACITY_ORDER: ReadonlyArray<string> = ['xl', 'l', 'm', 's', 'xs']

function capacityRank(key: string): number {
  const idx = CAPACITY_ORDER.indexOf(key.toLowerCase())
  // Unknown keys go to the very end so they never crowd out known sizes.
  return idx === -1 ? CAPACITY_ORDER.length : idx
}

/**
 * Format remaining capacity as a size-count summary string,
 * e.g. "3 XL OR 6 L OR 12 M".
 *
 * Picks up to 3 sizes ordered by capacity descending (xl > l > m > s > xs),
 * skipping any size whose `remaining_count` is 0 or undefined. Unknown size
 * keys are sorted after the catalog (they don't crowd out known sizes).
 *
 * Returns the empty string when no size has `remaining_count > 0` — callers
 * should treat that as "budget exhausted".
 *
 * The sort is deliberately capacity-descending (not by `remaining_count`):
 * the largest available size is the most informative anchor for the user
 * ("you can still launch an XL"), and capacity ties resolve to the larger
 * size deterministically.
 *
 * @param sizes - allowed_sizes from a session-options response
 * @param joiner - localized "OR" / "OU" word (caller passes the translated value)
 */
export function summarizeRemaining(
  sizes: SessionOptionSize[] | undefined | null,
  joiner: string
): string {
  if (!sizes || sizes.length === 0) return ''

  // Pick sizes that have a positive remaining_count.
  const positive = sizes.filter(
    s => typeof s.remaining_count === 'number' && s.remaining_count > 0
  )
  if (positive.length === 0) return ''

  // Order by capacity descending (xl > l > m > s > xs), then take top 3.
  const ordered = [...positive].sort((a, b) => capacityRank(a.key) - capacityRank(b.key))
  const topThree = ordered.slice(0, 3)

  return topThree
    .map(s => `${s.remaining_count} ${s.key.toUpperCase()}`)
    .join(` ${joiner} `)
}

/**
 * Single source of truth for the count-mode vs budget-mode distinction.
 *
 * Budget mode is signalled structurally by the presence of the top-level
 * `quota` block in the session-options / org-usage response. Count mode is the
 * absence of that field. This keeps consumers free of magic sentinel checks
 * (the previous `scope === 'unlimited'` variant caused C8 — two callers
 * disagreed on the rule).
 */
export function isBudgetMode(response?: { quota?: unknown } | null): boolean {
  return response?.quota != null
}

/**
 * Canonical size catalog used by the admin plan-editor composer.
 *
 * Mirrors the backend seeds — keep in sync with:
 *   - tt-backend/backend/db.go (dbSeedSizes)
 *   - ocf-core/src/payment/backfill/quota.go (sizeCatalog)
 *
 * Adding a new size requires updating BOTH backends AND this constant.
 */
export const CANONICAL_SIZE_CATALOG: Record<string, { cpu: number; memory_mb: number }> = {
  xs: { cpu: 1, memory_mb: 256 },
  s: { cpu: 1, memory_mb: 512 },
  m: { cpu: 2, memory_mb: 1024 },
  l: { cpu: 4, memory_mb: 2048 },
  xl: { cpu: 4, memory_mb: 4096 }
}

/**
 * One row of the admin size-quota composer: "students can spawn `count`
 * machines of size `size_key`".
 */
export interface SizeQuotaRow {
  size_key: string
  count: number
}

/**
 * Sum semantics: convert size-count rows to a raw CPU+RAM budget.
 *
 * For rows [1 XL, 1 XS] the result is the sum across rows on each axis:
 * `MaxCPU = (1×4) + (1×1) = 5`, `MaxMemoryMB = (1×4096) + (1×256) = 4352`.
 *
 * Mental model for the admin: each row contributes to a total capacity
 * envelope. Students then split that envelope freely — they can spawn the
 * exact bundles described, or any other combination of sizes that fits
 * within the totals (e.g. trading 1 L for 2 M).
 *
 * Reverses the D7 max() decision (logged 2026-05-13) per the 2026-05-28
 * user test: admins were confused that "1 XL + 1 XS" gave the same budget
 * as "1 XL alone". Additive semantics matches the "total capacity, mix
 * freely" mental model the customer-facing copy already uses.
 *
 * Rows with `count <= 0` or an unknown `size_key` are silently ignored.
 *
 * Empty input returns `{ max_cpu: 0, max_memory_mb: 0 }` — callers may decide
 * to treat that as "no rows yet, save disabled" or as "unlimited" depending
 * on the surrounding UI context.
 */
export function computeMaxFromRows(
  rows: SizeQuotaRow[],
  catalog: Record<string, { cpu: number; memory_mb: number }> = CANONICAL_SIZE_CATALOG
): { max_cpu: number; max_memory_mb: number } {
  let max_cpu = 0
  let max_memory_mb = 0
  for (const row of rows) {
    const entry = catalog[row.size_key]
    if (!entry) continue
    const count = row.count > 0 ? row.count : 0
    if (count === 0) continue
    max_cpu += count * entry.cpu
    max_memory_mb += count * entry.memory_mb
  }
  return { max_cpu, max_memory_mb }
}
