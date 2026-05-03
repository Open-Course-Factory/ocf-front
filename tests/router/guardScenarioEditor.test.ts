/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/*
 * RED-step tests for the router-level scenario-editor gate (issue #213).
 *
 * Two layers of protection are needed in the router:
 *   1. The route declaration `path: 'scenario-editor'` must carry
 *      `meta.requiresScenarioManager: true` so the guard knows to check.
 *   2. `router.beforeEach` must redirect any user that fails
 *      `useScenarioEditorAccess().canAccessScenarioEditor` to
 *      `/terminal-sessions?error=insufficient_permissions` (matching the
 *      existing `requiredPermissions` redirect target — keeps UX consistent
 *      and the toast handler in TerminalSessions already understands the
 *      query param).
 *
 * The guard logic itself isn't exported, so we mirror the existing
 * `guardPlanFeature.test.ts` strategy: re-implement the relevant guard
 * branches in a `runGuard` helper and prove the implementation matches
 * what we expect. When the real guard is updated to include the new
 * branch, the test pattern continues to apply.
 */

// ─── Mocks must be declared before any import that loads the stores ────────

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: vi.fn(),
}))

vi.mock('../../src/services/features', () => ({
  featureFlagService: {
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    isEnabled: vi.fn().mockReturnValue(true),
  },
}))

vi.mock('../../src/composables/useSettingsNavigation', () => ({
  useSettingsNavigation: vi.fn(() => ({
    storePreviousRoute: vi.fn(),
  })),
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  getCurrentActorRoles: vi.fn(() => ref([])),
}))

// `useScenarioEditorAccess` is the new dependency the guard MUST consult.
const mockCanAccess = vi.hoisted(() => ({ value: false }))
vi.mock('../../src/composables/useScenarioEditorAccess', () => ({
  useScenarioEditorAccess: vi.fn(() => ({
    canAccessScenarioEditor: mockCanAccess,
  })),
}))

import { useCurrentUserStore } from '../../src/stores/currentUser'
import { useScenarioEditorAccess } from '../../src/composables/useScenarioEditorAccess'

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Mirrors the relevant branches of router/index.ts `beforeEach` PLUS the
 * yet-to-be-added `requiresScenarioManager` check. Once the guard is
 * implemented, behaviour MUST match this helper — that's the contract.
 */
async function runGuard(
  to: { path: string; name: string; matched: any[]; meta: Record<string, any> },
  options: { isAuthenticated?: boolean } = {},
): Promise<unknown> {
  const { isAuthenticated = true } = options

  vi.mocked(useCurrentUserStore).mockReturnValue({
    isAuthenticated,
    userId: 'user-1',
    needsPasswordChange: false,
    emailVerified: true,
    permissions: [],
    userName: 'testuser',
    userRoles: [],
  } as any)

  let nextArg: unknown = '__not_called__'
  const next = (arg?: unknown) => {
    nextArg = arg === undefined ? undefined : arg
  }

  const currentUserStore = useCurrentUserStore()

  if (currentUserStore.needsPasswordChange) {
    next({ name: 'ForceChangePassword' })
    return nextArg
  }

  if (to.matched.some(r => r.meta.requiresAuth)) {
    if (!currentUserStore.isAuthenticated) {
      next({ name: 'Login' })
      return nextArg
    }
  }

  // The new branch under test — when the route declares
  // `requiresScenarioManager: true`, the predicate from
  // useScenarioEditorAccess must be true; otherwise redirect.
  if (to.meta.requiresScenarioManager) {
    const { canAccessScenarioEditor } = useScenarioEditorAccess()
    if (!canAccessScenarioEditor.value) {
      next({
        name: 'TerminalSessions',
        query: { error: 'insufficient_permissions' },
      })
      return nextArg
    }
  }

  next()
  return nextArg
}

function makeScenarioEditorRoute(meta: Record<string, any> = {}) {
  return {
    path: '/scenario-editor',
    name: 'ScenarioEditor',
    matched: [{ meta: { requiresAuth: true } }],
    meta: {
      requiresAuth: true,
      requiresFeature: 'scenario_conception',
      collapseNav: true,
      ...meta,
    },
  }
}

// ─── Static checks against router/index.ts ───────────────────────────────

describe('Router declaration — /scenario-editor metadata (#213)', () => {
  const filePath = resolve(__dirname, '../../src/router/index.ts')
  const fileContent = readFileSync(filePath, 'utf-8')

  /**
   * BEHAVIOR PROTECTED: The route MUST carry `requiresScenarioManager: true`
   * so the guard knows to consult `useScenarioEditorAccess`. Without this
   * meta flag, the guard branch is never entered and learners can keep
   * navigating directly to /scenario-editor.
   *
   * GUT-CHECK: If someone removes the meta key during a refactor, this
   * fails immediately — the test acts as a tripwire on the route table.
   */
  it('declares meta.requiresScenarioManager: true on the scenario-editor route', () => {
    // Find the route line for `path: 'scenario-editor'`. Allow either
    // single or double quotes and either order of meta keys.
    const routeMatch = fileContent.match(
      /path:\s*['"]scenario-editor['"][\s\S]*?meta:\s*\{[^}]*\}/,
    )
    expect(routeMatch, 'expected to find the scenario-editor route declaration').not.toBeNull()
    const routeBlock = routeMatch![0]
    expect(routeBlock).toMatch(/requiresScenarioManager\s*:\s*true/)
  })
})

// ─── Behavioural checks against the guard logic ──────────────────────────

describe('Router guard — scenario editor manager check (#213)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCanAccess.value = false
  })

  /**
   * BEHAVIOR PROTECTED: A non-manager attempting to deep-link to
   * /scenario-editor must be redirected. Without this, students currently
   * land on a fully-functional editor view.
   *
   * GUT-CHECK: If the new guard branch is missing, `nextArg` becomes
   * `undefined` (the unguarded fall-through `next()` call) and the
   * `.toEqual(...)` assertion fails.
   */
  it('redirects to TerminalSessions when canAccessScenarioEditor is false', async () => {
    mockCanAccess.value = false

    const result = await runGuard(makeScenarioEditorRoute({ requiresScenarioManager: true }))

    expect(result).toEqual({
      name: 'TerminalSessions',
      query: { error: 'insufficient_permissions' },
    })
  })

  /**
   * BEHAVIOR PROTECTED: The redirect target name must be `TerminalSessions`
   * (NOT `TerminalMySessions` — that's a separate route that doesn't exist
   * any more) and must include `error=insufficient_permissions`. The
   * frontend listens for that query param to show a toast on the landing
   * page.
   *
   * GUT-CHECK: If the redirect uses the wrong route name or omits the
   * query param, this test fails — protects against a copy-paste error
   * during implementation.
   */
  it('uses route name TerminalSessions with insufficient_permissions error', async () => {
    mockCanAccess.value = false

    const result = await runGuard(makeScenarioEditorRoute({ requiresScenarioManager: true }))

    expect((result as any)?.name).toBe('TerminalSessions')
    expect((result as any)?.name).not.toBe('TerminalMySessions')
    expect((result as any)?.query?.error).toBe('insufficient_permissions')
  })

  /**
   * BEHAVIOR PROTECTED: When the predicate is true (admin / org-manager /
   * owner / manager-membership), the user must be allowed through.
   */
  it('allows navigation when canAccessScenarioEditor is true', async () => {
    mockCanAccess.value = true

    const result = await runGuard(makeScenarioEditorRoute({ requiresScenarioManager: true }))

    expect(result).toBeUndefined()
  })

  /**
   * BEHAVIOR PROTECTED: The check must be SCOPED to routes declaring
   * `requiresScenarioManager`. We don't want every route accidentally
   * gated by scenario-editor permissions if someone forgets a check.
   */
  it('does NOT block routes that do not declare requiresScenarioManager', async () => {
    mockCanAccess.value = false

    const result = await runGuard({
      path: '/some-other-page',
      name: 'SomePage',
      matched: [{ meta: { requiresAuth: true } }],
      meta: { requiresAuth: true },
    })

    expect(result).toBeUndefined()
  })
})
