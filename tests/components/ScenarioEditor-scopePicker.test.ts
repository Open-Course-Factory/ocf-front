import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/*
 * Source-inspection tests for the scope picker in ScenarioEditor.vue
 * (issue #216).
 *
 * Background:
 * The "Where to create" modal lets a manager pick an org or group scope
 * when creating a new scenario. Previously, `orgScopes` / `groupScopes`
 * computed three sources:
 *   1. owner_user_id === currentUser.userId   (creator-match — wrong)
 *   2. userRoles starts with `class-group_manager:` / `organization_manager:`
 *      (dead Casbin prefix — never produced by the backend)
 *   3. /me/memberships fallback (fragile because of Promise.all wipe)
 *
 * The bug: a user added as owner of a group they didn't create was
 * filtered out (Source 1 fails because owner_user_id is the CREATOR;
 * Source 2 is dead; Source 3 was wiped by an unrelated endpoint failure).
 *
 * The fix: trust the backend's GET /api/v1/class-groups and
 * GET /organizations responses directly — both already apply the
 * correct membership filter via `user_member_id`. No frontend
 * re-filtering is needed.
 *
 * Strategy mirrors `MainNavMenu-scenarioEditor.test.ts`: source-inspect
 * the SFC. Mounting the full ScenarioEditor in a unit test would require
 * stubbing 20+ stores (VueFlow, scenarios, classGroups, organizations,
 * memberships, currentUser, etc.). A Playwright spec is the right
 * place to validate the rendered picker end-to-end; these tests just
 * pin the source-level fix.
 */

const filePath = resolve(__dirname, '../../src/components/Pages/ScenarioEditor.vue')
const fileContent = readFileSync(filePath, 'utf-8')

// Slice the source so we look at the scope-picker block, not the whole 2000-line file.
// `orgScopes` and `groupScopes` are defined sequentially; we capture from
// the first appearance of `const orgScopes` to the next `const platformScopeAvailable`.
const scopeBlockMatch = fileContent.match(
  /const\s+orgScopes\s*=[\s\S]*?const\s+platformScopeAvailable/,
)
const scopeBlock = scopeBlockMatch?.[0] ?? ''

describe('ScenarioEditor.vue — scope picker trusts backend filter (#216)', () => {
  /**
   * BEHAVIOR PROTECTED: The scope-picker source MUST exist. Sanity-check
   * that the regex sliced the right region — if a future refactor renames
   * the computed, this fails loudly so the rest of the assertions don't
   * silently no-op against an empty string.
   */
  it('locates the orgScopes / groupScopes block in the SFC', () => {
    expect(scopeBlock.length, 'expected orgScopes...platformScopeAvailable region to exist').toBeGreaterThan(0)
    expect(scopeBlock).toMatch(/const\s+groupScopes\s*=/)
  })

  /**
   * BEHAVIOR PROTECTED: The dead Casbin prefix `class-group_manager:` MUST
   * be removed. The backend never produces this binding (verified via grep
   * across ocf-core/src). Keeping the check is dead code that confuses
   * future readers and adds nothing.
   *
   * GUT-CHECK: If anyone re-introduces the prefix, this fails immediately.
   */
  it('does not reference the dead `class-group_manager:` Casbin prefix', () => {
    expect(scopeBlock).not.toMatch(/class-group_manager:/)
  })

  /**
   * BEHAVIOR PROTECTED: The dead Casbin prefix `organization_manager:`
   * MUST also be removed for the same reason — the backend never produces
   * it. (See `grep -rn "organization_manager" ocf-core/src` — only one
   * comment match, no actual binding.)
   */
  it('does not reference the dead `organization_manager:` Casbin prefix', () => {
    expect(scopeBlock).not.toMatch(/organization_manager:/)
  })

  /**
   * BEHAVIOR PROTECTED: The scope picker MUST NOT filter groups by
   * `owner_user_id === userId`. That's the original bug — `owner_user_id`
   * stores the CREATOR, not the current owner. A user added as owner of
   * a group they didn't create was hidden from the picker.
   *
   * GUT-CHECK: If a future refactor reintroduces a creator-match filter,
   * this fails. The backend's `user_member_id` filter is the correct
   * source of truth.
   */
  it('groupScopes does not filter by owner_user_id === userId', () => {
    // Slice just the groupScopes computed body
    const groupScopesMatch = scopeBlock.match(
      /const\s+groupScopes\s*=\s*computed[\s\S]*?(?=const\s+platformScopeAvailable)/,
    )
    expect(groupScopesMatch).not.toBeNull()
    const body = groupScopesMatch![0]
    // The broken pattern: any group field compared to userId.
    expect(body).not.toMatch(/owner_user_id\s*===\s*userId/)
  })

  /**
   * BEHAVIOR PROTECTED: `groupScopes` MUST source from `allGroups` (which
   * wraps `classGroupsStore.entities` — the backend-filtered list). Any
   * other source means the picker is re-applying the broken creator-match
   * logic somewhere else.
   *
   * GUT-CHECK: If `groupScopes` were rewritten to filter by Casbin roles
   * or user-id only, `allGroups` wouldn't appear in its body — fails.
   */
  it('groupScopes sources from allGroups (the backend-filtered list)', () => {
    const groupScopesMatch = scopeBlock.match(
      /const\s+groupScopes\s*=\s*computed[\s\S]*?(?=const\s+platformScopeAvailable)/,
    )
    expect(groupScopesMatch).not.toBeNull()
    const body = groupScopesMatch![0]
    expect(body).toMatch(/allGroups\.value/)
  })

  /**
   * BEHAVIOR PROTECTED: `orgScopes` MUST source from
   * `organizationsStore.userOrganizations` (the backend-filtered list).
   * The backend's GET /organizations applies the same MembershipConfig
   * filter, so the frontend doesn't need to re-filter.
   */
  it('orgScopes sources from organizationsStore.userOrganizations', () => {
    const orgScopesMatch = scopeBlock.match(
      /const\s+orgScopes\s*=\s*computed[\s\S]*?(?=const\s+groupScopes)/,
    )
    expect(orgScopesMatch).not.toBeNull()
    const body = orgScopesMatch![0]
    expect(body).toMatch(/organizationsStore\.userOrganizations/)
  })
})
