/// <reference types="vitest" />
/**
 * The scenario editor is for scenario managers (#213). The route declares
 * `meta.requiresScenarioManager`, and the router sends anyone who fails
 * `useScenarioEditorAccess().canAccessScenarioEditor` to
 * `/terminal-sessions?error=insufficient_permissions`, where the page shows a
 * toast for that query. This drives the real router.
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
const canAccess = vi.hoisted(() => ({ value: false }))
const memberships = vi.hoisted(() => ({ isLoaded: true, ensureLoaded: vi.fn() }))

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
vi.mock('../../src/composables/useScenarioEditorAccess', () => ({
  useScenarioEditorAccess: () => ({ canAccessScenarioEditor: canAccess }),
}))
vi.mock('../../src/stores/userMemberships', () => ({ useUserMembershipsStore: () => memberships }))
// The page itself is not under test; the router only needs something to load.
vi.mock('../../src/components/Pages/ScenarioEditor.vue', () => ({ default: {} }))

import router from '../../src/router'

async function landOn(path: string): Promise<string | undefined> {
  await router.push(path).catch(() => undefined)
  return router.currentRoute.value.name as string | undefined
}

describe('Router guard — scenario editor manager check (#213)', () => {
  beforeEach(async () => {
    canAccess.value = false
    memberships.isLoaded = true
    memberships.ensureLoaded.mockClear()
    // Start away from TerminalSessions, so landing there proves a redirect.
    await router.replace('/organizations').catch(() => undefined)
  })

  it('declares meta.requiresScenarioManager: true on the scenario-editor route', () => {
    expect(router.resolve('/scenario-editor').meta.requiresScenarioManager).toBe(true)
  })

  it('redirects to TerminalSessions with insufficient_permissions when canAccessScenarioEditor is false', async () => {
    expect(await landOn('/scenario-editor')).toBe('TerminalSessions')
    expect(router.currentRoute.value.query).toEqual({ error: 'insufficient_permissions' })
  })

  it('allows navigation when canAccessScenarioEditor is true', async () => {
    canAccess.value = true

    expect(await landOn('/scenario-editor')).toBe('ScenarioEditor')
  })

  it('decides only once the memberships are loaded', async () => {
    canAccess.value = true

    await landOn('/scenario-editor')

    expect(memberships.ensureLoaded).toHaveBeenCalled()
  })

  it('lets the page through when the memberships could not be loaded', async () => {
    memberships.isLoaded = false

    expect(await landOn('/scenario-editor')).toBe('ScenarioEditor')
  })

  it('does NOT block routes that do not declare requiresScenarioManager', async () => {
    expect(await landOn('/user-terminal-keys')).toBe('UserTerminalKeys')
  })
})
