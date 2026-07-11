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

/**
 * Minimal structural shape consumed by `summarizeRemaining`. Both
 * `SessionOptionSize` (from session-options) and `SizeRemaining` (from
 * org-usage) satisfy it — we only need the catalog key and the per-size
 * remaining count.
 */
interface RemainingSizeLike {
  key: string
  remaining_count?: number
}

/**
 * Order convention: descending by capacity. L and XL share CPU; sorting by
 * capacity descending keeps the "most impressive" number first in the summary
 * (e.g. when L's remaining_count is higher than XL's because L doesn't carry
 * the full XL memory footprint). See memory entry
 * `project_resource_quota_refactor.md`.
 */
const CAPACITY_ORDER = ['xl', 'l', 'm', 's', 'xs'] as const

/**
 * Returns the catalog rank of a size key in capacity-descending order
 * (XL → 0, L → 1, M → 2, S → 3, XS → 4). Unknown keys are sorted last so
 * they never crowd out known sizes.
 *
 * Use as a sort comparator: `sort((a, b) => capacityRank(a.key) - capacityRank(b.key))`
 * gives largest-first ordering.
 *
 * Single source of truth for size ordering across budget-mode UI
 * (SessionComposer, OrgTerminalUsagePanel, ...).
 */
export function capacityRank(key: string): number {
  const idx = CAPACITY_ORDER.indexOf(key.toLowerCase() as typeof CAPACITY_ORDER[number])
  return idx === -1 ? CAPACITY_ORDER.length : idx
}

/**
 * Pick the largest selectable size from a list, by capacity (smallest
 * `capacityRank` = largest size: xl > l > m > s > xs).
 *
 * The launcher's fallback preselection must land on the biggest size the user
 * can actually launch — `Array.prototype.find` returns the first in backend
 * order (smallest→largest), wrongly landing on M when XS/S are locked. This
 * filters to selectable sizes and returns the one with the smallest rank.
 *
 * `isSelectable` lets the caller pass its own gate (plan-allowed AND not
 * budget-exhausted). Returns `undefined` when no size is selectable.
 */
export function pickLargestSelectableSize<T extends { key: string }>(
  sizes: T[] | undefined | null,
  isSelectable: (size: T) => boolean
): T | undefined {
  if (!sizes || sizes.length === 0) return undefined
  return sizes
    .filter(isSelectable)
    .reduce<T | undefined>((largest, size) => {
      if (!largest) return size
      return capacityRank(size.key) < capacityRank(largest.key) ? size : largest
    }, undefined)
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
  sizes: RemainingSizeLike[] | undefined | null,
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
 * Format memory in MiB as a human-friendly "N GiB" / "N.N GiB" / "N MiB" string.
 *
 * Rules (chosen to keep small budgets readable without trailing decimals on
 * large ones):
 * - `mb <= 0`            → `"0 MiB"`
 * - `1024 <= mb < 10240` → `"N.N GiB"` (one decimal, e.g. `4096 → "4.0 GiB"`)
 * - `mb >= 10240`        → `"N GiB"` (no decimal, e.g. `16384 → "16 GiB"`)
 * - otherwise            → `"N MiB"` (e.g. `512 → "512 MiB"`)
 */
export function formatMemoryMb(mb: number): string {
  if (mb <= 0) return '0 MiB'
  if (mb >= 1024) {
    const gib = mb / 1024
    return `${gib.toFixed(gib >= 10 ? 0 : 1)} GiB`
  }
  return `${mb} MiB`
}

/**
 * Single source of truth for compact duration formatting across the product.
 *
 * Scales a duration to the largest sensible unit so long-running or
 * long-remaining sessions never render as huge hour counts (e.g. the old
 * `formatElapsed` could emit `17754497h24` ≈ 2026 years when fed a Go
 * zero-time). Output is intentionally terse for dense session lists.
 *
 * Unit convention: BARE, LANGUAGE-NEUTRAL ABBREVIATIONS (`s`/`m`/`h`/`d`/`w`/`y`)
 * — matching the pre-existing `s`/`m`/`h` units already shipped in this file.
 * This keeps the helper a pure, i18n-free util (no translated words baked in);
 * callers needing localized words can wrap the output, but the abbreviations
 * read the same in en and fr.
 *
 * Output rules:
 *   - non-finite or `< 0`  → `fallback` (default `''`; callers pick `'—'` / `'0s'`)
 *   - `< 60s`              → `"Ns"`        (e.g. `42s`)
 *   - `< 60m`              → `"Nm"`        (e.g. `23m`)
 *   - `< 24h`              → `"NhMM"`      (2-digit minutes, e.g. `1h12` — matches the legacy hour form)
 *   - `< 7d`               → `"Nd"` / `"Nd Hh"` (the `Hh` remainder only when the leftover hours are non-zero)
 *   - `< 365d`             → `"Nw"`        (whole weeks)
 *   - `>= 365d`            → `"Ny"`        (whole years, 365-day years)
 *
 * Pure and deterministic — no `Date.now()`, no locale, no side effects.
 *
 * @param seconds  - elapsed/remaining duration in seconds
 * @param fallback - returned for negative / non-finite input (default `''`)
 */
export function formatCompactDuration(seconds: number, fallback: string = ''): string {
  if (!Number.isFinite(seconds) || seconds < 0) return fallback

  const totalSeconds = Math.floor(seconds)
  if (totalSeconds < 60) {
    return `${totalSeconds}s`
  }

  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) {
    return `${totalMinutes}m`
  }

  const totalHours = Math.floor(totalMinutes / 60)
  if (totalHours < 24) {
    const minutes = totalMinutes % 60
    return `${totalHours}h${minutes.toString().padStart(2, '0')}`
  }

  const totalDays = Math.floor(totalHours / 24)
  if (totalDays < 7) {
    const hours = totalHours % 24
    return hours > 0 ? `${totalDays}d ${hours}h` : `${totalDays}d`
  }

  if (totalDays < 365) {
    return `${Math.floor(totalDays / 7)}w`
  }

  return `${Math.floor(totalDays / 365)}y`
}

/**
 * Earliest timestamp (ms) we treat as a real session time. Anything below this
 * floor (notably Go's zero-time `0001-01-01T00:00:00Z`, which `Date.parse`
 * happily turns into a huge NEGATIVE number that passes `Number.isFinite`) is
 * a never-set field, not a real start — rendering it would yield garbage like
 * `17754497h24` (≈ 2026 years). See memory: invalid-timestamp footgun.
 */
const SANE_TIMESTAMP_FLOOR_MS = Date.UTC(2000, 0, 1)

/**
 * Format the elapsed time since an ISO 8601 timestamp as a short label.
 *
 * Delegates to {@link formatCompactDuration}, so long-running sessions scale to
 * days / weeks / years instead of huge hour counts. For sub-day durations the
 * output is unchanged from before (`Ns` / `Nm` / `NhMM`).
 *
 * Returns `"—"` when the input is empty, unparseable, or an insane timestamp
 * (a never-set Go zero-time / pre-2000 value) so the caller can still render
 * something stable next to a paused/running indicator.
 */
export function formatElapsed(isoTime: string, nowMs: number = Date.now()): string {
  if (!isoTime) return '—'
  const parsed = Date.parse(isoTime)
  if (!Number.isFinite(parsed)) return '—'
  // Reject never-set / nonsensical timestamps (Go zero-time parses to a huge
  // negative epoch that would otherwise show as ~2026 years of elapsed time).
  if (parsed <= 0 || parsed < SANE_TIMESTAMP_FLOOR_MS) return '—'
  const elapsedSeconds = Math.max(0, (nowMs - parsed) / 1000)
  return formatCompactDuration(elapsedSeconds, '—')
}

/**
 * Canonical size catalog used by `formatBudgetAsSizes` and the admin
 * plan-editor composer.
 *
 * UNITS: `cpu` is integer millicores (mCPU), `memory_mb` is MiB. The CPU
 * column mirrors the budget cost in mCPU — e.g. XS = 500 mCPU because the
 * tt-backend XS tier carries a 50% CPU allowance on a 1 vCPU slot.
 *
 * MUST stay in sync with the backend budget catalog:
 *   - ocf-core   `src/payment/catalog/sizes.go` `sizeCatalog` (SSOT — mCPU)
 *   - tt-backend `backend/db.go` `dbSeedSizes` describes the runtime tier
 *     (vCPU + allowance string); the mCPU cost above is derived from it.
 *
 * Order convention matches the rest of this file: descending by capacity
 * (xl > l > m > s > xs). The plan-card summary picks the top-3 sizes that
 * fit within the budget, in this order, so customers see the most impressive
 * single-size bundles first.
 *
 * Adding a new size requires updating ocf-core's catalog, tt-backend's seed,
 * AND this constant together.
 */
export const CANONICAL_SIZE_CATALOG = {
  xs: { cpu: 500, memory_mb: 256 },
  s: { cpu: 1000, memory_mb: 512 },
  m: { cpu: 2000, memory_mb: 1024 },
  l: { cpu: 4000, memory_mb: 2048 },
  xl: { cpu: 4000, memory_mb: 4096 },
} as const

export type CanonicalSizeCatalog = typeof CANONICAL_SIZE_CATALOG

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
 * Returned units mirror the catalog: `max_cpu` in mCPU, `max_memory_mb` in MiB.
 * For rows [1 XL, 1 XS] the result sums across rows on each axis:
 * `MaxCPU = (1×4000) + (1×500) = 4500`, `MaxMemoryMB = (1×4096) + (1×256) = 4352`.
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
  catalog: Record<string, { cpu: number; memory_mb: number }> =
    CANONICAL_SIZE_CATALOG as unknown as Record<string, { cpu: number; memory_mb: number }>
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

/**
 * Format a plan's budget (max_cpu + max_memory_mb) as a size-count summary,
 * e.g. "3 L OR 6 M OR 12 S".
 *
 * For each canonical size, compute how many instances fit in the plan's
 * budget (taking the binding axis between CPU and RAM). Pick the top 3
 * sizes in descending capacity order, formatted as "N SIZE" and joined by
 * the localized joiner.
 *
 * Returns the empty string when both `max_cpu` and `max_memory_mb` are 0
 * (unlimited budget — caller renders "Unlimited capacity" instead).
 *
 * @param plan - the subscription plan (only the budget fields are read)
 * @param catalog - canonical size catalog (use {@link CANONICAL_SIZE_CATALOG})
 * @param joiner - localized "OR" / "OU" word (caller passes the translated value)
 */
export function formatBudgetAsSizes(
  plan: { max_cpu?: number; max_memory_mb?: number },
  catalog: CanonicalSizeCatalog,
  joiner: string
): string {
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

/**
 * Discriminated result of {@link summarizeRemainingBudget}. `sizes` is only
 * populated for `kind === 'sizes'`; it is `''` for the other two states.
 */
export interface RemainingBudgetSummary {
  kind: 'unlimited' | 'exhausted' | 'sizes'
  sizes: string
}

/**
 * Live usage envelope: the plan's caps plus what is currently consumed. A cap
 * of 0 means "uncapped on this axis" (server convention). Both units mirror the
 * catalog — `*_cpu` in mCPU, `*_memory_mb` in MiB.
 */
interface BudgetUsageLike {
  max_cpu?: number
  max_memory_mb?: number
  used_cpu?: number
  used_memory_mb?: number
}

/**
 * Summarize how much capacity is still launchable as a size-count string,
 * derived from the REMAINING budget (max − used) so the usage panel speaks the
 * same size-count language as the plan cards. Delegates the size-fitting to
 * {@link formatBudgetAsSizes} — no parallel implementation.
 *
 * The tricky part is that `0` on an axis is overloaded: it means "unlimited"
 * when it is the plan's CAP (max), but "used up" when it is the REMAINING
 * budget of a capped axis. Feeding a used-up capped plan straight into
 * `formatBudgetAsSizes` (which reads max 0 as unlimited) would print an
 * infinite-capacity line for an exhausted plan — hence this discriminated
 * return instead of a bare string:
 *   - `unlimited` — both axes uncapped (plan has no cap at all)
 *   - `exhausted` — a capped axis has ≤ 0 remaining, or the remaining budget is
 *     positive but below the smallest catalog size (formatBudgetAsSizes → '')
 *   - `sizes`     — otherwise, the remaining budget rendered as "N L OR M …"
 *
 * @param usage - the live budget envelope (caps + consumption)
 * @param catalog - canonical size catalog (use {@link CANONICAL_SIZE_CATALOG})
 * @param joiner - localized "OR" / "OU" word (caller passes the translated value)
 */
export function summarizeRemainingBudget(
  usage: BudgetUsageLike,
  catalog: CanonicalSizeCatalog,
  joiner: string
): RemainingBudgetSummary {
  const cpuCapped = (usage.max_cpu ?? 0) > 0
  const memCapped = (usage.max_memory_mb ?? 0) > 0

  if (!cpuCapped && !memCapped) return { kind: 'unlimited', sizes: '' }

  // Uncapped axis contributes 0 → formatBudgetAsSizes reads that as Infinity, so
  // the capped axis binds the count.
  const remainingCpu = cpuCapped ? (usage.max_cpu ?? 0) - (usage.used_cpu ?? 0) : 0
  const remainingMemoryMb = memCapped ? (usage.max_memory_mb ?? 0) - (usage.used_memory_mb ?? 0) : 0

  if ((cpuCapped && remainingCpu <= 0) || (memCapped && remainingMemoryMb <= 0)) {
    return { kind: 'exhausted', sizes: '' }
  }

  const sizes = formatBudgetAsSizes(
    { max_cpu: remainingCpu, max_memory_mb: remainingMemoryMb },
    catalog,
    joiner
  )
  // Positive-but-too-small remaining budget: nothing fits → exhausted.
  if (sizes === '') return { kind: 'exhausted', sizes: '' }

  return { kind: 'sizes', sizes }
}
