import type { MemberRole } from '../types/base'

// Mirrors ocf-core's roleHierarchy (src/auth/access/helpers.go) — one rank
// table for org and group roles. An unknown role ranks 0, as there.
const ROLE_PRIORITY: Record<MemberRole, number> = { member: 10, teacher: 30, manager: 50, owner: 100 }

export const isRoleAtLeast = (role: string | null | undefined, min: MemberRole): boolean =>
  !!role && (ROLE_PRIORITY[role as MemberRole] ?? 0) >= ROLE_PRIORITY[min]

export type RoleCounts = Partial<Record<MemberRole, number>>

/** How many members hold each role. */
export const countRoles = (members: ReadonlyArray<{ role: string }> = []): RoleCounts => {
  const counts: RoleCounts = {}
  for (const { role } of members) {
    counts[role as MemberRole] = (counts[role as MemberRole] ?? 0) + 1
  }
  return counts
}

/** The roles present in counts, highest rank first. */
export const rolesByRank = (counts: RoleCounts): MemberRole[] =>
  (Object.keys(counts) as MemberRole[])
    .filter(role => counts[role])
    .sort((a, b) => (ROLE_PRIORITY[b] ?? 0) - (ROLE_PRIORITY[a] ?? 0))
