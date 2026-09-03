import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

/**
 * The groups tab in the navigation reads three boot-time snapshots:
 * `view_groups` from /auth/permissions, and `can_run_classrooms` plus the
 * `group_management` plan feature from /users/me/features. An action that
 * changes the backend's answer (creating an organization, converting it to a
 * team, buying a plan, creating the first class) must refresh all three, or the
 * tab stays grayed until the user switches organization away and back.
 */

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

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((err: any, fallbackKey: string) => err?.message || fallbackKey)
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn()
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: ref(false), shouldFilterAsStandardUser: ref(false) })
}))

vi.mock('../../src/utils/asyncWrapper', () => ({
  createAsyncWrapper: () => async (fn: () => Promise<any>) => fn()
}))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    getCurrentSubscription: vi.fn().mockResolvedValue({}),
    getUsageMetrics: vi.fn().mockResolvedValue([]),
    currentSubscription: null
  })
}))

// The organization switch ends by importing the router to re-check the current
// page; loading the real router under a full-suite run is slow enough to blow
// the test budget, and nothing here depends on it.
vi.mock('../../src/router', () => ({
  default: { currentRoute: { value: { meta: {}, path: '/' } }, push: vi.fn() }
}))

vi.mock('../../src/utils/formatters', () => ({ formatDate: (date: string) => date }))
vi.mock('../../src/services/features', () => ({ featureFlagService: { isMetricVisible: vi.fn(() => true) } }))
vi.mock('../../src/composables/useStatusFormatters', () => ({
  useStatusFormatters: () => ({ getStatusClass: (s: string) => s, getStatusIcon: (s: string) => s })
}))

// The real store drags the router in. This stub keeps the one behaviour the
// test depends on: loadPermissions asks /auth/permissions and keeps its answer.
const currentUserStub = {
  userId: 'user-1',
  userRoles: ['member'] as string[],
  permissions: [] as string[],
  canCreateOrganization: null as boolean | null,
  loadPermissions: vi.fn(async () => {
    const response = await axios.get('/auth/permissions')
    currentUserStub.permissions = response.data.permissions
    currentUserStub.canCreateOrganization = response.data.can_create_organization
    return currentUserStub.permissions
  })
}
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => currentUserStub
}))

import axios from 'axios'
import { usePermissionsStore } from '../../src/stores/permissions'
import { useOrganizationsStore } from '../../src/stores/organizations'

const mockedGet = vi.mocked(axios.get)
const mockedPost = vi.mocked(axios.post)

function featuresAnswer(features: string[], canRunClassrooms: boolean) {
  return {
    user_id: 'user-1',
    effective_features: { id: 'plan', name: 'Plan', features },
    source_organizations: [],
    has_personal_subscription: true,
    can_run_classrooms: canRunClassrooms
  }
}

function answerBackendWith(entitled: boolean) {
  mockedGet.mockImplementation(async (url: string) => {
    if (url === '/auth/permissions') {
      return {
        status: 200,
        data: {
          user_id: 'user-1',
          roles: ['member'],
          can_create_organization: entitled,
          permissions: entitled ? ['view_groups'] : []
        }
      }
    }
    if (url.startsWith('/users/me/features')) {
      return { data: featuresAnswer(entitled ? ['group_management'] : [], entitled) }
    }
    if (url.startsWith('/organizations')) {
      return { data: { data: [], hasMore: false } }
    }
    throw new Error(`unexpected GET ${url}`)
  })
}

function navInputs(permissionsStore: ReturnType<typeof usePermissionsStore>) {
  return {
    viewGroups: currentUserStub.permissions.includes('view_groups'),
    canRunClassrooms: permissionsStore.effectiveFeatures?.can_run_classrooms === true,
    groupManagement: permissionsStore.hasFeature('group_management')
  }
}

const denied = { viewGroups: false, canRunClassrooms: false, groupManagement: false }
const granted = { viewGroups: true, canRunClassrooms: true, groupManagement: true }

describe('permissions store — refreshEntitlements', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    currentUserStub.permissions = []
    currentUserStub.canCreateOrganization = null

    // Boot-time snapshot: not entitled.
    answerBackendWith(false)
    await usePermissionsStore().loadEffectiveFeatures()
    await currentUserStub.loadPermissions()
  })

  it('reloads the three nav inputs from the backend', async () => {
    const permissionsStore = usePermissionsStore()
    expect(navInputs(permissionsStore)).toEqual(denied)

    answerBackendWith(true)
    await permissionsStore.refreshEntitlements()

    expect(navInputs(permissionsStore)).toEqual(granted)
  })

  it('never rejects: a failed reload leaves the previous answer in place', async () => {
    const permissionsStore = usePermissionsStore()
    mockedGet.mockRejectedValue(new Error('network down'))

    await expect(permissionsStore.refreshEntitlements()).resolves.toBeUndefined()
    expect(navInputs(permissionsStore)).toEqual(denied)
  })

  it('is triggered by creating an organization', async () => {
    const permissionsStore = usePermissionsStore()
    const organizationsStore = useOrganizationsStore()
    mockedPost.mockResolvedValue({ data: { id: 'org-1', name: 'acme', display_name: 'Acme' } })

    answerBackendWith(true)
    await organizationsStore.createOrganization({ name: 'acme', display_name: 'Acme' } as any)

    expect(navInputs(permissionsStore)).toEqual(granted)
  })

  it('is triggered by converting a personal organization to a team', async () => {
    const permissionsStore = usePermissionsStore()
    const organizationsStore = useOrganizationsStore()
    mockedPost.mockResolvedValue({ data: { id: 'org-1', organization_type: 'team' } })

    answerBackendWith(true)
    await organizationsStore.convertToTeamOrganization('org-1')

    expect(navInputs(permissionsStore)).toEqual(granted)
  })

  it('is triggered by switching organization', async () => {
    const permissionsStore = usePermissionsStore()
    const organizationsStore = useOrganizationsStore()

    answerBackendWith(true)
    await organizationsStore.setCurrentOrganization('org-2')

    expect(navInputs(permissionsStore)).toEqual(granted)
  })
})
