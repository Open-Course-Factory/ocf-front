/// <reference types="vitest" />
/**
 * Routes that declare `meta.requiredPermissions` are closed to a user who holds
 * none of them. Entitlement gating is the classroom verdict (see
 * classroomGuard.test.ts), not route plan-feature meta. This drives the real
 * router.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const user = vi.hoisted(() => ({
  isAuthenticated: true,
  needsPasswordChange: false,
  emailVerified: true,
  userId: 'user-1',
  userRoles: [] as string[],
  permissions: [] as string[],
  loadUserData: vi.fn(),
}))

vi.mock('../../src/stores/currentUser', () => ({ useCurrentUserStore: () => user }))
vi.mock('../../src/services/features', () => ({
  featureFlagService: {
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    isEnabled: vi.fn().mockReturnValue(true),
  },
}))
vi.mock('../../src/composables/useSettingsNavigation', () => ({
  useSettingsNavigation: () => ({ storePreviousRoute: vi.fn() }),
}))
vi.mock('../../src/composables/useFeatureFlags', () => ({ getCurrentActorRoles: () => ref([]) }))

import router from '../../src/router'

async function landOn(path: string): Promise<string | undefined> {
  await router.push(path).catch(() => undefined)
  return router.currentRoute.value.name as string | undefined
}

describe('Router guard – permission check', () => {
  beforeEach(async () => {
    user.permissions = []
    // Start away from TerminalSessions, so landing there proves a redirect.
    await router.replace('/organizations').catch(() => undefined)
  })

  it('allows navigation when user has the required permission', async () => {
    user.permissions = ['view_groups']

    expect(await landOn('/my-classes')).toBe('MyClasses')
  })

  it('redirects to TerminalSessions when user lacks required permission', async () => {
    expect(await landOn('/my-classes')).toBe('TerminalSessions')
    expect(router.currentRoute.value.query).toEqual({ error: 'insufficient_permissions' })
  })
})
