import type { MemberRole } from '../types/base'

// Mirrors ocf-core's roleHierarchy (src/auth/access/helpers.go) — one rank
// table for org and group roles. An unknown role ranks 0, as there.
const ROLE_PRIORITY: Record<MemberRole, number> = { member: 10, teacher: 30, manager: 50, owner: 100 }

export const isRoleAtLeast = (role: string | null | undefined, min: MemberRole): boolean =>
  !!role && (ROLE_PRIORITY[role as MemberRole] ?? 0) >= ROLE_PRIORITY[min]
