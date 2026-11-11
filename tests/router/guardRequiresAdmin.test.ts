/// <reference types="vitest" />
/**
 * Admin pages declare `meta.requiresAdmin`, and the menu hides them from
 * members — but the router never read the flag, so any signed-in member could
 * open every admin page by typing its URL. This drives the real router.
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

describe('the requiresAdmin guard', () => {
  beforeEach(async () => {
    user.userRoles = []
    user.loadUserData.mockReset()
    await router.replace('/terminal-sessions').catch(() => undefined)
  })

  it('turns a member away from an admin page opened by URL', async () => {
    user.userRoles = ['member']

    expect(await landOn('/admin/branding')).toBe('TerminalSessions')
    expect(router.currentRoute.value.query.error).toBe('insufficient_permissions')
  })

  it('lets an administrator in', async () => {
    user.userRoles = ['administrator', 'member']

    expect(await landOn('/admin/branding')).toBe('AdminBranding')
  })

  it('loads the roles first on a reload, so an administrator is not refused', async () => {
    user.loadUserData.mockImplementation(async () => {
      user.userRoles = ['administrator']
    })

    expect(await landOn('/admin/branding')).toBe('AdminBranding')
    expect(user.loadUserData).toHaveBeenCalledOnce()
  })

  it('refuses the page, without breaking navigation, when the roles cannot be loaded', async () => {
    user.loadUserData.mockRejectedValue(new Error('network down'))

    expect(await landOn('/admin/branding')).toBe('TerminalSessions')
  })
})
