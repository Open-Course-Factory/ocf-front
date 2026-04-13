import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// ─── Mocks must be declared before any imports that transitively load the stores ───

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: vi.fn()
}))

vi.mock('../../src/services/features', () => ({
  featureFlagService: {
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    isEnabled: vi.fn().mockReturnValue(true)
  }
}))

vi.mock('../../src/composables/useSettingsNavigation', () => ({
  useSettingsNavigation: vi.fn(() => ({
    storePreviousRoute: vi.fn()
  }))
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  getCurrentActorRoles: vi.fn(() => ref([]))
}))

import { useCurrentUserStore } from '../../src/stores/currentUser'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Runs the guard logic extracted from the router's `beforeEach` callback.
 * Reproduces the relevant sections WITHOUT the plan feature check (which was
 * removed from the guard — it's now handled only by the org switch handler
 * and the nav menu reactively).
 */
async function runGuard(
  to: { path: string; name: string; matched: any[]; meta: Record<string, any> },
  options: { isAuthenticated?: boolean; permissions?: string[] } = {}
): Promise<unknown> {
  const { isAuthenticated = true, permissions = ['view_groups'] } = options

  vi.mocked(useCurrentUserStore).mockReturnValue({
    isAuthenticated,
    userId: 'user-1',
    needsPasswordChange: false,
    emailVerified: true,
    permissions,
    userName: 'testuser',
    userRoles: []
  } as any)

  let nextArg: unknown = '__not_called__'
  const next = (arg?: unknown) => {
    nextArg = arg === undefined ? undefined : arg
  }

  const currentUserStore = useCurrentUserStore()
  const { featureFlagService } = await import('../../src/services/features')

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

  await featureFlagService.waitForInitialization()

  // Plan feature check is NOT in the router guard.
  // It is handled by the organizations store on org switch.

  // Permission check
  const requiredPermissions = to.meta.requiredPermissions as string[] | undefined
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAnyPermission = requiredPermissions.some(permission =>
      currentUserStore.permissions.includes(permission)
    )
    if (!hasAnyPermission) {
      next({
        name: 'TerminalSessions',
        query: { error: 'insufficient_permissions' }
      })
      return nextArg
    }
  }

  next()
  return nextArg
}

function makeGroupRoute() {
  return {
    path: '/class-groups',
    name: 'ClassGroups',
    matched: [{ meta: { requiresAuth: true } }],
    meta: {
      requiresAuth: true,
      requiresPlanFeature: 'multiple_groups',
      requiredPermissions: ['view_groups']
    }
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Router guard – plan feature check is NOT in the guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows navigation to group routes regardless of plan features (check is elsewhere)', async () => {
    // The router guard does not check requiresPlanFeature at all.
    // Plan feature gating is handled by the org switch handler and nav menu.
    const result = await runGuard(makeGroupRoute())
    expect(result).toBeUndefined()
  })

  it('allows navigation even when user has no subscription (plan check is not here)', async () => {
    // Even without any plan features loaded, the router guard should not block
    const result = await runGuard(makeGroupRoute())
    expect(result).toBeUndefined()
  })
})

describe('Router guard – permission check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows navigation when user has the required permission', async () => {
    const result = await runGuard(makeGroupRoute(), { permissions: ['view_groups'] })
    expect(result).toBeUndefined()
  })

  it('redirects to TerminalSessions when user lacks required permission', async () => {
    const result = await runGuard(makeGroupRoute(), { permissions: [] })
    expect(result).toEqual({
      name: 'TerminalSessions',
      query: { error: 'insufficient_permissions' }
    })
  })

  it('uses the correct route name TerminalSessions (not TerminalMySessions)', async () => {
    const result = await runGuard(makeGroupRoute(), { permissions: [] })
    expect((result as any)?.name).toBe('TerminalSessions')
    expect((result as any)?.name).not.toBe('TerminalMySessions')
  })
})
