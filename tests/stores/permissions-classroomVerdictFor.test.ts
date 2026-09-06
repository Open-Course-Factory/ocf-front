import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

/**
 * `classroomVerdictFor(orgId)` is the one way a screen asks "may this user run
 * classes in THAT organization?" for an organization other than the one in
 * context — the organization page shows any organization the user belongs to.
 *
 * It reads the backend's verdict off the same endpoint `loadEffectiveFeatures`
 * uses for the current context, so the two cannot answer differently for the
 * same organization; it does not touch the context snapshot, so opening another
 * organization's page must not re-label the sidebar.
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

function verdictAnswer(canRunClassrooms: boolean, reason?: string) {
  return {
    user_id: 'user-1',
    effective_features: { id: 'plan', name: 'Plan', features: [] },
    source_organizations: [],
    has_personal_subscription: true,
    can_run_classrooms: canRunClassrooms,
    classroom_denied_reason: reason
  }
}

describe('permissions store — classroomVerdictFor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockedPost.mockResolvedValue({ data: {} })
  })

  it('asks the backend for the named organization and returns its verdict', async () => {
    mockedGet.mockResolvedValue({ data: verdictAnswer(true) })
    const store = usePermissionsStore()

    await expect(store.classroomVerdictFor('org-x')).resolves.toBe(true)

    expect(mockedGet).toHaveBeenCalledWith('/users/me/features?organization_id=org-x')
  })

  it('returns false on a refusal', async () => {
    mockedGet.mockResolvedValue({ data: verdictAnswer(false, 'personal_organization') })
    const store = usePermissionsStore()

    await expect(store.classroomVerdictFor('org-x')).resolves.toBe(false)
  })

  it('returns false when the backend has no plan to answer with', async () => {
    mockedGet.mockRejectedValue({ response: { status: 404 } })
    const store = usePermissionsStore()

    await expect(store.classroomVerdictFor('org-x')).resolves.toBe(false)
  })

  it('leaves the current-context snapshot alone', async () => {
    mockedGet.mockResolvedValue({ data: verdictAnswer(true) })
    const store = usePermissionsStore()

    await store.classroomVerdictFor('org-x')

    expect(store.effectiveFeatures).toBeNull()
  })
})
