import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

/*
 * Tests for `useScenarioEditorAccess` — the predicate that gates the scenario
 * editor menu item, the `/scenario-editor` route, and the in-page edit
 * controls. Currently, students can navigate to the editor and read scenario
 * content (issue #213); this composable centralizes the access decision.
 *
 * Strategy mirrors `getCurrentActorRoles.test.ts`: real Pinia stores + real
 * `useAdminViewMode` (because they ARE the unit under test). We mock only
 * the boundaries that are not part of the predicate logic — axios, the
 * router, toast, translations, and tokenService — because they're imported
 * transitively but never exercised by the predicate.
 *
 * If the implementation diverges from spec (e.g., forgets a source, returns
 * a non-reactive boolean, or hardcodes false), specific tests below fail.
 */

// ---- Boundary mocks (NOT the unit under test) ----------------------------

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (k: string) => k, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (k: string) => k, te: () => true, locale: ref('en') }),
}))

vi.mock('../../src/services/auth', () => ({
  tokenService: {
    getAccessToken: vi.fn(() => ''),
    setAccessToken: vi.fn(),
    clearTokens: vi.fn(),
    hasValidToken: vi.fn(() => false),
    getTimeUntilExpiry: vi.fn(() => 0),
  },
  authService: { getVerificationStatus: vi.fn() },
}))

vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ show: vi.fn(), update: vi.fn(), remove: vi.fn() }),
}))

vi.mock('../../src/router/index', () => ({
  default: {
    currentRoute: ref({ path: '/', meta: {}, fullPath: '/', name: 'Home' }),
    push: vi.fn(),
  },
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: () => false,
}))

// ---- Real imports — these are the units under test -----------------------

import { useScenarioEditorAccess } from '../../src/composables/useScenarioEditorAccess'
import { useCurrentUserStore } from '../../src/stores/currentUser'
import { useAdminViewMode } from '../../src/composables/useAdminViewMode'
import { useOrganizationsStore } from '../../src/stores/organizations'
import { useUserMembershipsStore } from '../../src/stores/userMemberships'

describe('useScenarioEditorAccess (real stores + real admin-view-mode)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAdminViewMode().resetViewMode()
    localStorage.clear()
  })

  afterEach(() => {
    useAdminViewMode().resetViewMode()
    localStorage.clear()
  })

  /**
   * BEHAVIOR PROTECTED: A plain student/member with no managerial signals
   * MUST be denied access. This is the entire reason the gate exists —
   * without it, students currently see the menu item and can read scenario
   * content via /scenario-editor (issue #213).
   *
   * GUT-CHECK: If the predicate were `computed(() => true)` this fails.
   */
  it('returns false for a plain member with no roles or memberships', () => {
    const user = useCurrentUserStore()
    user.userId = 'user-student'
    user.userRoles = []

    const { canAccessScenarioEditor } = useScenarioEditorAccess()

    expect(canAccessScenarioEditor.value).toBe(false)
  })

  /**
   * BEHAVIOR PROTECTED: Platform administrators MUST always pass — admin
   * is the universal escape hatch (matches `useAdminViewMode.isAdmin`).
   *
   * GUT-CHECK: If the predicate dropped the admin branch, an admin with no
   * memberships would be denied; this test fails.
   */
  it('returns true when user is a platform administrator', () => {
    const user = useCurrentUserStore()
    user.userId = 'admin-1'
    user.userRoles = ['administrator']

    const { canAccessScenarioEditor } = useScenarioEditorAccess()

    expect(canAccessScenarioEditor.value).toBe(true)
  })

  /**
   * BEHAVIOR PROTECTED: An admin "viewing as standard user" should NOT see
   * the scenario editor (mirrors how `getCurrentActorRoles` strips the
   * administrator role). Otherwise the toggle would be cosmetic for this
   * surface — admins testing the student experience would still see the
   * editor.
   *
   * GUT-CHECK: If the predicate read `userRoles.includes('administrator')`
   * directly instead of going through `useAdminViewMode`, this fails.
   */
  it('returns false when admin is viewing as standard user (no other manager signal)', () => {
    const user = useCurrentUserStore()
    user.userId = 'admin-1'
    user.userRoles = ['administrator']

    useAdminViewMode().setViewAsStandardUser(true)

    const { canAccessScenarioEditor } = useScenarioEditorAccess()
    expect(canAccessScenarioEditor.value).toBe(false)
  })

  /**
   * BEHAVIOR PROTECTED: The Casbin prefixes `organization_manager:<id>`
   * and `class-group_manager:<id>` are NEVER produced by the backend
   * (verified via grep across ocf-core/src — only one comment match, no
   * actual binding). They were dead-code branches in the predicate and
   * masked the real bug in #216 (a user added as group owner couldn't
   * see the group in the scope picker because the live signal —
   * /me/memberships — wasn't loaded reliably).
   *
   * The fix dropped both prefix checks and made the membership store the
   * canonical role source. These tests pin that the dead prefixes alone
   * (without a backing membership row) do NOT grant access — anything
   * else would re-introduce dead code that future readers waste time
   * understanding.
   *
   * GUT-CHECK: If anyone reintroduces the Casbin-prefix branch, these
   * tests fail.
   */
  it('does NOT grant access for the dead `organization_manager:` Casbin prefix alone', () => {
    const user = useCurrentUserStore()
    user.userId = 'user-1'
    user.userRoles = ['organization_manager:org-abc']

    const { canAccessScenarioEditor } = useScenarioEditorAccess()
    expect(canAccessScenarioEditor.value).toBe(false)
  })

  it('does NOT grant access for the dead `class-group_manager:` Casbin prefix alone', () => {
    const user = useCurrentUserStore()
    user.userId = 'user-1'
    user.userRoles = ['class-group_manager:group-xyz']

    const { canAccessScenarioEditor } = useScenarioEditorAccess()
    expect(canAccessScenarioEditor.value).toBe(false)
  })

  /**
   * BEHAVIOR PROTECTED: Org owners (`owner_user_id === currentUser.userId`)
   * count as managers even without a Casbin role binding — this mirrors
   * the `orgScopes` "Source 1" branch in ScenarioEditor.vue. Some test
   * fixtures and demo orgs only set ownership and skip the Casbin row.
   */
  it('returns true when an organization owner_user_id matches the current user', () => {
    const user = useCurrentUserStore()
    user.userId = 'owner-7'
    user.userRoles = []

    const orgs = useOrganizationsStore()
    // Populate the store via the same in-place mutation `loadOrganizations`
    // uses (`base.entities.splice(...)`) so the reactive array's identity is
    // preserved and `userOrganizations` (a computed over `getEntities()`)
    // sees the new orgs. Replacing `orgs.entities` with a fresh array would
    // shadow the closure-bound ref read by the computed.
    ;(orgs as any).entities.push({
      id: 'org-1',
      name: 'demo',
      display_name: 'Demo Org',
      owner_user_id: 'owner-7',
      organization_type: 'team',
      max_groups: 5,
      max_members: 10,
      is_active: true,
      member_count: 1,
    })

    const { canAccessScenarioEditor } = useScenarioEditorAccess()
    expect(canAccessScenarioEditor.value).toBe(true)
  })

  /**
   * BEHAVIOR PROTECTED: `useUserMembershipsStore.orgMemberships` is the
   * /me/memberships fallback. A user with role `manager` or `owner` for
   * any org MUST pass. Without this branch, users whose Casbin row was
   * never created (legacy invitations) would lose editor access despite
   * being legitimately managers.
   */
  it('returns true when orgMemberships has a manager role', () => {
    const user = useCurrentUserStore()
    user.userId = 'user-1'
    user.userRoles = []

    const memberships = useUserMembershipsStore()
    memberships.orgMemberships = [
      { organization_id: 'org-1', role: 'manager' },
    ]

    const { canAccessScenarioEditor } = useScenarioEditorAccess()
    expect(canAccessScenarioEditor.value).toBe(true)
  })

  /**
   * BEHAVIOR PROTECTED: Same logic, on the group side, with role `owner`.
   */
  it('returns true when groupMemberships has an owner role', () => {
    const user = useCurrentUserStore()
    user.userId = 'user-1'
    user.userRoles = []

    const memberships = useUserMembershipsStore()
    memberships.groupMemberships = [
      { group_id: 'group-1', role: 'owner' },
    ]

    const { canAccessScenarioEditor } = useScenarioEditorAccess()
    expect(canAccessScenarioEditor.value).toBe(true)
  })

  /**
   * BEHAVIOR PROTECTED: Plain `member` role on either side does NOT grant
   * access. Only `manager` and `owner` qualify, matching the existing
   * `canManageOrg` / `canManageGroup` helpers in the memberships store.
   */
  it('returns false when memberships only contain member-level roles', () => {
    const user = useCurrentUserStore()
    user.userId = 'user-1'
    user.userRoles = []

    const memberships = useUserMembershipsStore()
    memberships.orgMemberships = [{ organization_id: 'org-1', role: 'member' }]
    memberships.groupMemberships = [{ group_id: 'group-1', role: 'member' }]

    const { canAccessScenarioEditor } = useScenarioEditorAccess()
    expect(canAccessScenarioEditor.value).toBe(false)
  })

  /**
   * BEHAVIOR PROTECTED: The result MUST be reactive. If a user lands on
   * the page before /me/memberships resolves, the gate must flip from
   * false to true once the data arrives — otherwise the menu would stay
   * hidden until a hard refresh, replicating the pre-fix bug for users
   * whose only signal is the memberships endpoint.
   *
   * GUT-CHECK: If the predicate were a plain function returning a boolean
   * (not a computed ref), the value captured at construction time would
   * stay `false` and this test fails on the second assertion.
   */
  it('is reactive: flips from false to true when memberships load', async () => {
    const user = useCurrentUserStore()
    user.userId = 'user-1'
    user.userRoles = []

    const { canAccessScenarioEditor } = useScenarioEditorAccess()
    expect(canAccessScenarioEditor.value).toBe(false)

    // Simulate /me/memberships resolving with a manager row.
    const memberships = useUserMembershipsStore()
    memberships.orgMemberships = [
      { organization_id: 'org-2', role: 'manager' },
    ]

    await nextTick()
    expect(canAccessScenarioEditor.value).toBe(true)
  })
})
