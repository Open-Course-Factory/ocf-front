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
 * e.g. "3 L OR 6 M OR 12 S".
 *
 * Picks the top 3 sizes by `remaining_count`, ordered by capacity descending
 * (xl, l, m, s, xs). Sizes with `remaining_count === 0` or missing are omitted.
 *
 * Returns the empty string when no size has `remaining_count > 0` — callers
 * should treat that as "budget exhausted".
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
 * True when the session-options response carries the top-level `quota` block
 * (i.e. the backend ran in budget mode for this plan). When false, the legacy
 * count-mode UI should be rendered.
 */
export function isBudgetMode(response?: { quota?: unknown } | null): boolean {
  return !!response && response.quota !== undefined && response.quota !== null
}
