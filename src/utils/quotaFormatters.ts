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
 * Canonical size catalog used by `formatBudgetAsSizes`.
 *
 * MUST stay in sync with the backend catalogs:
 *   - tt-backend `backend/db.go` `dbSeedSizes`
 *   - ocf-core   `src/payment/backfill/quota.go` `sizeCatalog`
 *
 * Order convention matches the rest of this file: descending by capacity
 * (xl > l > m > s > xs). The plan-card summary picks the top-3 sizes that
 * fit within the budget, in this order, so customers see the most impressive
 * single-size bundles first.
 */
export const CANONICAL_SIZE_CATALOG = {
  xs: { cpu: 1, memory_mb: 256 },
  s: { cpu: 1, memory_mb: 512 },
  m: { cpu: 2, memory_mb: 1024 },
  l: { cpu: 4, memory_mb: 2048 },
  xl: { cpu: 4, memory_mb: 4096 },
} as const

export type CanonicalSizeCatalog = typeof CANONICAL_SIZE_CATALOG

/**
 * Format a plan's budget (max_cpu + max_memory_mb) as a size-count summary,
 * e.g. "3 L OR 6 M OR 12 S".
 *
 * For each canonical size, compute how many instances fit in the plan's
 * budget (taking the binding axis between CPU and RAM). Pick the top 3
 * sizes in descending capacity order, formatted as "N SIZE" and joined by
 * the localized joiner.
 *
 * Returns the empty string when:
 *   - the plan is in count mode (`quota_model !== 'budget'`), OR
 *   - both `max_cpu` and `max_memory_mb` are 0 (unlimited budget — caller
 *     renders "Unlimited capacity" instead).
 *
 * @param plan - the subscription plan (only the budget fields are read)
 * @param catalog - canonical size catalog (use {@link CANONICAL_SIZE_CATALOG})
 * @param joiner - localized "OR" / "OU" word (caller passes the translated value)
 */
export function formatBudgetAsSizes(
  plan: { max_cpu?: number; max_memory_mb?: number; quota_model?: string },
  catalog: CanonicalSizeCatalog,
  joiner: string
): string {
  if (plan.quota_model !== 'budget') return ''

  const maxCpu = plan.max_cpu ?? 0
  const maxMemoryMb = plan.max_memory_mb ?? 0
  if (maxCpu === 0 && maxMemoryMb === 0) return ''

  type Entry = { key: string; count: number }
  const entries: Entry[] = []

  // Iterate sizes in capacity-descending order so the top-3 slice keeps the
  // largest available size first (most informative anchor for the user).
  for (const key of CAPACITY_ORDER) {
    const size = catalog[key as keyof CanonicalSizeCatalog]
    if (!size) continue
    const byCpu = maxCpu === 0 ? Infinity : Math.floor(maxCpu / size.cpu)
    const byMem = maxMemoryMb === 0 ? Infinity : Math.floor(maxMemoryMb / size.memory_mb)
    const count = Math.min(byCpu, byMem)
    if (count >= 1 && Number.isFinite(count)) {
      entries.push({ key: key.toUpperCase(), count })
    }
  }

  if (entries.length === 0) return ''

  return entries
    .slice(0, 3)
    .map(e => `${e.count} ${e.key}`)
    .join(` ${joiner} `)
}
