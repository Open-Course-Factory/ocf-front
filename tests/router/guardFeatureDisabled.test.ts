/// <reference types="vitest" />
/**
 * A route whose feature flag is off redirects. For a signed-in user it went to
 * Login, whose own guard bounces a signed-in user on to /terminal-sessions by
 * path, so the `feature_disabled` query was lost on the way. The sibling guards
 * (requiresAdmin, requiredPermissions) send a signed-in user straight to
 * TerminalSessions with the reason in the query. This drives the real router.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const user = vi.hoisted(() => ({
  isAuthenticated: true,
  needsPasswordChange: false,
  emailVerified: true,
  userId: 'user-1' as string | null,
  userRoles: [] as string[],
  permissions: [] as string[],
  loadUserData: vi.fn(),
}))

const flags = vi.hoisted(() => ({ enabled: true }))

vi.mock('../../src/stores/currentUser', () => ({ useCurrentUserStore: () => user }))
vi.mock('../../src/services/features', () => ({
  featureFlagService: {
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    isEnabled: vi.fn(() => flags.enabled),
  },
}))
vi.mock('../../src/composables/useSettingsNavigation', () => ({
  useSettingsNavigation: () => ({ storePreviousRoute: vi.fn() }),
}))
vi.mock('../../src/composables/useFeatureFlags', () => ({ getCurrentActorRoles: () => ref([]) }))

import router from '../../src/router'

describe('the disabled-feature guard', () => {
  beforeEach(async () => {
    flags.enabled = true
    user.isAuthenticated = true
    user.userId = 'user-1'
    await router.replace('/terminal-sessions').catch(() => undefined)
  })

  it('sends a signed-in user straight to TerminalSessions and keeps the reason', async () => {
    flags.enabled = false

    await router.push('/courses').catch(() => undefined)

    expect(router.currentRoute.value.name).toBe('TerminalSessions')
    expect(router.currentRoute.value.query).toMatchObject({
      error: 'feature_disabled',
      feature: 'course_conception',
    })
  })

  // Every requiresFeature route also requiresAuth, so the auth guard stops an
  // anonymous visitor before the feature guard is reached.
  it('lets the auth guard stop an anonymous visitor first', async () => {
    user.isAuthenticated = false
    user.userId = null
    await router.replace('/login').catch(() => undefined)
    flags.enabled = false

    await router.push('/courses').catch(() => undefined)

    expect(router.currentRoute.value.name).toBe('Login')
  })
})
