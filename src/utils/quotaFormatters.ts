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
