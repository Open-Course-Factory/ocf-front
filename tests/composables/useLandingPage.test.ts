/**
 * A teacher's day starts on their classes (issue #309).
 *
 * Landing was hard-wired to /terminal-sessions for anyone without an explicit
 * preference, which is the learner's page: a trainer had to navigate to their
 * classes on every single login. Somebody who owns or manages at least one
 * class now lands on the console instead — but an explicit choice always wins,
 * and a learner still lands where they always did.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const enabledFlags = new Set<string>(['class_groups', 'terminal_management', 'course_conception'])

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

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    isEnabled: (flag: string) => enabledFlags.has(flag),
  }),
}))

vi.mock('../../src/utils/asyncWrapper', () => ({
  createAsyncWrapper: () => async (fn: () => Promise<any>) => fn(),
}))

// The organization context decides which classes count, so the test drives it
// directly. `loadOrganizations` behaves like the real one: it is what
// establishes `currentOrganization` when nothing has loaded it yet.
let currentOrganization: { id: string; display_name: string } | null = null
let organizationsToLoad: { id: string; display_name: string } | null = null
let organizationLoadFails = false
const loadOrganizations = vi.fn(async () => {
  if (organizationLoadFails) throw new Error('organizations unavailable')
  currentOrganization = organizationsToLoad
  return []
})
vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    get currentOrganization() {
      return currentOrganization
    },
    loadOrganizations,
  }),
}))

import axios from 'axios'
import { resolveLandingPage } from '../../src/composables/useLandingPage'
import { useUserSettingsStore } from '../../src/stores/userSettings'

const mockGet = vi.mocked(axios.get)

const ACTIVE_ORG = { id: 'org-here', display_name: 'FormaTech' }
const OTHER_ORG = { id: 'org-elsewhere', display_name: 'ESITECH' }

function classIn(organizationId: string) {
  return {
    group_id: `group-${organizationId}`,
    name: 'devops',
    display_name: 'DevOps 2026',
    organization_id: organizationId,
    caller_role: 'owner',
    is_active: true,
    is_expired: false,
    member_count: 8,
    live_session_count: 0,
    assignments: [],
  }
}

const oneClass = [classIn(ACTIVE_ORG.id)]

function backend({ settings = {}, classes = [] as any[], classesFail = false }) {
  mockGet.mockImplementation(async (url: string) => {
    if (url === '/users/me/settings') return { data: settings }
    if (url === '/teacher/groups') {
      if (classesFail) throw new Error('teacher endpoint down')
      return { data: classes }
    }
    throw new Error(`unexpected request: ${url}`)
  })
}

async function landingPageFor(options: Parameters<typeof backend>[0]) {
  setActivePinia(createPinia())
  backend(options)
  await useUserSettingsStore().loadSettings()
  return resolveLandingPage()
}

describe('resolveLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    enabledFlags.clear()
    enabledFlags.add('class_groups')
    enabledFlags.add('terminal_management')
    enabledFlags.add('course_conception')
    currentOrganization = ACTIVE_ORG
    organizationsToLoad = ACTIVE_ORG
    organizationLoadFails = false
  })

  it('sends a teacher who manages a class to the console', async () => {
    expect(await landingPageFor({ classes: oneClass })).toBe('/my-classes')
  })

  it('sends a user who manages nothing to their terminal sessions', async () => {
    expect(await landingPageFor({ classes: [] })).toBe('/terminal-sessions')
  })

  describe('organization scoping', () => {
    it('ignores classes that live in another organization', async () => {
      // Landing on a console scoped to an organization without classes would
      // show the empty state — the very page this check exists to avoid.
      const page = await landingPageFor({ classes: [classIn(OTHER_ORG.id)] })

      expect(page).toBe('/terminal-sessions')
    })

    it('lands on the console when only one of the classes is in the active org', async () => {
      const page = await landingPageFor({
        classes: [classIn(OTHER_ORG.id), classIn(ACTIVE_ORG.id)],
      })

      expect(page).toBe('/my-classes')
    })

    it('loads the organizations when nothing has yet, straight after login', async () => {
      currentOrganization = null

      const page = await landingPageFor({ classes: oneClass })

      expect(loadOrganizations).toHaveBeenCalledTimes(1)
      expect(page).toBe('/my-classes')
    })

    it('does not reload organizations that are already there', async () => {
      await landingPageFor({ classes: oneClass })

      expect(loadOrganizations).not.toHaveBeenCalled()
    })

    it('falls back to terminal sessions when the organizations cannot be loaded', async () => {
      currentOrganization = null
      organizationLoadFails = true

      const page = await landingPageFor({ classes: oneClass })

      expect(page).toBe('/terminal-sessions')
    })

    it('does not probe the classes at all when there is no organization to scope to', async () => {
      currentOrganization = null
      organizationLoadFails = true

      await landingPageFor({ classes: oneClass })

      expect(mockGet).not.toHaveBeenCalledWith('/teacher/groups')
    })

    it('lands a teacher whose only class is in their personal organization', async () => {
      // A solo trainer's classes sit in their personal org, which is the active
      // one — nothing about the scoping should treat that case differently.
      currentOrganization = { id: 'org-personal', display_name: 'Marc' }
      const page = await landingPageFor({ classes: [classIn('org-personal')] })

      expect(page).toBe('/my-classes')
    })

    it('sends a teacher whose classes carry no organization to their sessions', async () => {
      const classWithoutOrg = { ...classIn(ACTIVE_ORG.id), organization_id: undefined }

      const page = await landingPageFor({ classes: [classWithoutOrg] })

      expect(page).toBe('/terminal-sessions')
    })
  })

  it('honours an explicit choice over the console', async () => {
    const page = await landingPageFor({
      settings: { default_landing_page: '/courses' },
      classes: oneClass,
    })

    expect(page).toBe('/courses')
  })

  it('does not even ask about classes when the user chose a page', async () => {
    await landingPageFor({ settings: { default_landing_page: '/courses' }, classes: oneClass })

    expect(mockGet).not.toHaveBeenCalledWith('/teacher/groups')
  })

  it('ignores a saved page that is no longer on offer', async () => {
    enabledFlags.delete('class_groups')

    const page = await landingPageFor({
      settings: { default_landing_page: '/class-groups' },
      classes: oneClass,
    })

    expect(page).toBe('/terminal-sessions')
  })

  it('leaves the console out entirely when the class_groups flag is off', async () => {
    enabledFlags.delete('class_groups')

    const page = await landingPageFor({ classes: oneClass })

    expect(page).toBe('/terminal-sessions')
    expect(mockGet).not.toHaveBeenCalledWith('/teacher/groups')
  })

  it('falls back to terminal sessions when the class probe fails', async () => {
    expect(await landingPageFor({ classesFail: true })).toBe('/terminal-sessions')
  })

  it('probes the classes once, so the console it lands on reuses the answer', async () => {
    setActivePinia(createPinia())
    backend({ classes: oneClass })
    await useUserSettingsStore().loadSettings()

    await resolveLandingPage()
    await resolveLandingPage()

    const probes = mockGet.mock.calls.filter(([url]) => url === '/teacher/groups')
    expect(probes).toHaveLength(1)
  })
})
