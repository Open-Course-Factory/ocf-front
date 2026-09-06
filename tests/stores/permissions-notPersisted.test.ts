import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { piniaPluginPersist } from '../../src/piniaPluginPersist'

/**
 * The permissions store must never come back from localStorage. Its content is
 * what the backend decides for the signed-in user — `can_run_classrooms` above
 * all — and it is reloaded at boot. A restored snapshot reads as "already
 * loaded", so the backend is never asked again, and on a shared browser the
 * snapshot belongs to whoever signed in last: a Découverte owner inherited a
 * Formateur verdict and found the Groups pages open.
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

describe('permissions store — never restored from localStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockedPost.mockResolvedValue({ data: {} })
  })

  it('ignores a persisted snapshot and asks the backend', async () => {
    localStorage.setItem('pinia_state_permissions', JSON.stringify({
      effectiveFeatures: {
        user_id: 'someone-else',
        effective_features: { id: 'plan', name: 'Formateur', features: ['group_management'] },
        source_organizations: [],
        has_personal_subscription: true,
        can_run_classrooms: true
      }
    }))
    const pinia = createPinia()
    pinia.use(piniaPluginPersist)
    createApp({}).use(pinia) // plugins only run once pinia is installed
    setActivePinia(pinia)
    mockedGet.mockResolvedValue({ data: {
      user_id: 'user-1',
      effective_features: { id: 'plan', name: 'Découverte', features: [] },
      source_organizations: [],
      has_personal_subscription: true,
      can_run_classrooms: false
    } })

    const store = usePermissionsStore()
    expect(store.effectiveFeatures).toBeNull()

    const features = await store.ensureEffectiveFeaturesLoaded()
    expect(mockedGet).toHaveBeenCalled()
    expect(features?.can_run_classrooms).toBe(false)
  })

  it('does not write its state to localStorage', async () => {
    const pinia = createPinia()
    pinia.use(piniaPluginPersist)
    createApp({}).use(pinia) // plugins only run once pinia is installed
    setActivePinia(pinia)
    mockedGet.mockResolvedValue({ data: {
      user_id: 'user-1',
      effective_features: { id: 'plan', name: 'Découverte', features: [] },
      source_organizations: [],
      has_personal_subscription: true,
      can_run_classrooms: false
    } })

    await usePermissionsStore().ensureEffectiveFeaturesLoaded()

    expect(localStorage.getItem('pinia_state_permissions')).toBeNull()
  })
})
