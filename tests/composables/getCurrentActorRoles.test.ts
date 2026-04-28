import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

/*
 * These tests exercise `getCurrentActorRoles` against the REAL reactive
 * sources it observes:
 *   - The Pinia `useCurrentUserStore` (real store, state set per-test)
 *   - The `useAdminViewMode` composable (real ref-backed singleton, driven
 *     through its public API: `setViewAsStandardUser` / `resetViewMode`)
 *
 * Mocking those would only prove that `getCurrentActorRoles` reads `.value`
 * from whatever ref it was handed — the gut-check at antipattern #1 in
 * .claude/agents/tester.md. By using the real collaborators, a regression
 * in either the role-default fallback or the admin-as-standard-user filter
 * branch (useFeatureFlags.ts lines 41-52) breaks these tests.
 *
 * Boundaries we DO mock:
 *   - `axios` and downstream HTTP-using collaborators imported transitively
 *     by `currentUser.ts` (toast, translations, router, auth services).
 *     None of these are exercised by `getCurrentActorRoles` — they are
 *     boundaries we don't want to hit in a unit test.
 */

// ---- Boundary mocks (not the unit under test) ---------------------------

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/auth', () => ({
  tokenService: {
    getAccessToken: vi.fn(() => ''),
    setAccessToken: vi.fn(),
    clearTokens: vi.fn(),
    hasValidToken: vi.fn(() => false),
    getTimeUntilExpiry: vi.fn(() => 0)
  },
  authService: {
    getVerificationStatus: vi.fn()
  }
}))

vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({
    show: vi.fn(),
    update: vi.fn(),
    remove: vi.fn()
  })
}))

vi.mock('../../src/router/index', () => ({
  default: {
    currentRoute: ref({ path: '/', meta: {}, fullPath: '/', name: 'Home' }),
    push: vi.fn()
  }
}))

// `featureFlagService` is imported by `useFeatureFlags.ts` itself; we still
// stub it to avoid touching the real singleton (which calls axios on init).
// `isFeatureEnabled` is NOT used by `getCurrentActorRoles`, so its presence
// here is just to satisfy the import.
vi.mock('../../src/services/features', () => ({
  featureFlagService: {
    getAllFlags: vi.fn(() => ({})),
    isMetricVisible: vi.fn(() => true),
    isFeatureVisible: vi.fn(() => true),
    getVisibleMetricTypes: vi.fn(() => new Set()),
    fetchFromBackend: vi.fn(),
    refreshAfterLogin: vi.fn(),
    waitForInitialization: vi.fn(),
    updateFlag: vi.fn(),
    syncUsageLimits: vi.fn(),
    clearLocalStorage: vi.fn()
  },
  isFeatureEnabled: vi.fn(() => false)
}))

// ---- Real imports — these are the units under test ----------------------

import { getCurrentActorRoles } from '../../src/composables/useFeatureFlags'
import { useCurrentUserStore } from '../../src/stores/currentUser'
import { useAdminViewMode } from '../../src/composables/useAdminViewMode'

describe('getCurrentActorRoles (real store + real admin-view-mode)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // The admin-view-mode composable holds a module-level ref. Reset it to
    // the default ("not viewing as standard user") between tests.
    useAdminViewMode().resetViewMode()
    localStorage.clear()
  })

  afterEach(() => {
    useAdminViewMode().resetViewMode()
    localStorage.clear()
  })

  /**
   * BEHAVIOR PROTECTED: A regular member sees their own userId and roles
   * surfaced unchanged on the actor object. Backward-compat field `role`
   * is the first entry.
   *
   * GUT-CHECK: If the function returned a hard-coded actor instead of
   * reading the store, the userId assertion fails — the store is the only
   * source of "user-123" in this test.
   */
  it('surfaces userId and roles from the real currentUser store', () => {
    const user = useCurrentUserStore()
    user.userId = 'user-123'
    user.userRoles = ['member']

    const actor = getCurrentActorRoles()

    expect(actor.value.userId).toBe('user-123')
    expect(actor.value.roles).toEqual(['member'])
    expect(actor.value.role).toBe('member')
  })

  /**
   * BEHAVIOR PROTECTED: A user whose roles array is empty (e.g. backend
   * omitted the field) is treated as a `member` so they don't lose access
   * to public flags. Same fallback applies when `userRoles` is missing.
   *
   * GUT-CHECK: If the `roles.length > 0` guard were removed, an empty
   * array would propagate, `roles[0]` would be undefined, and `role` would
   * fall back to the literal `'member'` only because of the `|| 'member'`
   * tail — but `roles` itself would assert as `[]`, failing this test.
   */
  it('falls back to ["member"] when the store has no roles', () => {
    const user = useCurrentUserStore()
    user.userId = 'user-123'
    user.userRoles = []

    const actor = getCurrentActorRoles()

    expect(actor.value.roles).toEqual(['member'])
    expect(actor.value.role).toBe('member')
  })

  /**
   * BEHAVIOR PROTECTED: Admin "view as standard user" toggle removes
   * `administrator` from the effective roles — this is the entire purpose
   * of the role-filtering block in useFeatureFlags.ts. Without this, an
   * admin previewing a standard-user view would still see admin-gated
   * flags as enabled and the toggle would be cosmetic.
   *
   * GUT-CHECK: If the `roles.filter(role => role !== 'administrator')`
   * line were removed, `administrator` would survive in the output and
   * this test fails on the `not.toContain` assertion.
   */
  it('strips "administrator" when admin views as standard user', () => {
    const user = useCurrentUserStore()
    user.userId = 'admin-1'
    user.userRoles = ['administrator', 'member']

    // Default: not viewing as standard user — admin role survives.
    const beforeToggle = getCurrentActorRoles()
    expect(beforeToggle.value.roles).toContain('administrator')

    // Flip the real composable's toggle through its public API.
    useAdminViewMode().setViewAsStandardUser(true)

    const afterToggle = getCurrentActorRoles()
    expect(afterToggle.value.roles).not.toContain('administrator')
    expect(afterToggle.value.roles).toContain('member')
  })

  /**
   * BEHAVIOR PROTECTED: An admin whose ONLY role is `administrator` and
   * who toggles "view as standard user" must end up with `member` — they
   * need at least one role to evaluate role-gated flags as a standard
   * user would. Without the `if (!roles.includes('member')) push('member')`
   * line, the filtered actor would have an empty `roles` array and behave
   * like an unauthenticated user.
   *
   * GUT-CHECK: If that push were removed, `roles` would become `[]` after
   * filtering, and `role` would degrade to the `|| 'member'` tail — but
   * the `roles.toEqual(['member'])` assertion below fails.
   */
  it('adds "member" when filtering removes the only role', () => {
    const user = useCurrentUserStore()
    user.userId = 'admin-1'
    user.userRoles = ['administrator']

    useAdminViewMode().setViewAsStandardUser(true)

    const actor = getCurrentActorRoles()

    expect(actor.value.roles).toEqual(['member'])
    expect(actor.value.role).toBe('member')
  })
})
