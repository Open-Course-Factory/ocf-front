import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

// Mocks MUST be defined BEFORE imports
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
  handleStoreError: vi.fn((err: any, fallbackKey: string) => {
    if (err?.response?.data?.error_message) return err.response.data.error_message
    if (err?.response?.data?.message) return err.response.data.message
    if (err?.message) return err.message
    return fallbackKey
  })
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
  useAdminViewMode: () => ({
    isAdmin: ref(false),
    shouldFilterAsStandardUser: ref(false)
  })
}))

vi.mock('../../src/utils/asyncWrapper', () => ({
  createAsyncWrapper: () => async (fn: () => Promise<any>) => fn()
}))

// Track calls to dependent stores
const mockGetCurrentSubscription = vi.fn().mockResolvedValue({})
const mockLoadEffectiveFeatures = vi.fn().mockResolvedValue({})

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    getCurrentSubscription: mockGetCurrentSubscription,
    getUsageMetrics: vi.fn().mockResolvedValue([]),
    currentSubscription: null
  })
}))

const mockHasFeature = vi.fn().mockReturnValue(true)
vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    loadEffectiveFeatures: mockLoadEffectiveFeatures,
    hasFeature: mockHasFeature,
    currentUser: { id: 'user-1', organization_memberships: [] }
  })
}))

// Mock router (dynamically imported by setCurrentOrganization for redirect logic)
const mockCurrentRoute = ref<{ path: string; meta: Record<string, any> }>({ path: '/', meta: {} })
const mockRouterPush = vi.fn()
vi.mock('../../src/router', () => ({
  default: {
    currentRoute: mockCurrentRoute,
    push: mockRouterPush
  }
}))

// Mock userSettings store (dynamically imported for default page redirect)
const mockSettings = { default_landing_page: '/terminal-sessions' }
const mockAvailablePages = ref([
  { value: '/terminal-sessions', label: 'Terminal Sessions' },
  { value: '/courses', label: 'Courses' },
  { value: '/subscription-dashboard', label: 'Subscription Dashboard' }
])
vi.mock('../../src/stores/userSettings', () => ({
  useUserSettingsStore: () => ({
    settings: mockSettings,
    availablePages: mockAvailablePages
  })
}))

vi.mock('../../src/utils/formatters', () => ({
  formatDate: (date: string) => date
}))

vi.mock('../../src/services/features', () => ({
  featureFlagService: {
    isMetricVisible: vi.fn(() => true)
  }
}))

vi.mock('../../src/composables/useStatusFormatters', () => ({
  useStatusFormatters: () => ({
    getStatusClass: (status: string) => `status-${status}`,
    getStatusIcon: (status: string) => `icon-${status}`
  })
}))

import { useOrganizationsStore } from '../../src/stores/organizations'

describe('organizations store — routing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    // Reset router mock state
    mockCurrentRoute.value = { path: '/', meta: {} }
    mockRouterPush.mockReset()
    // Reset permissions mock
    mockHasFeature.mockReturnValue(true)
    // Reset settings mock
    mockSettings.default_landing_page = '/terminal-sessions'
    mockAvailablePages.value = [
      { value: '/terminal-sessions', label: 'Terminal Sessions' },
      { value: '/courses', label: 'Courses' },
      { value: '/subscription-dashboard', label: 'Subscription Dashboard' }
    ]
  })

  // Helper to create an org entity for tests
  const createOrgEntity = (id: string = 'org-1') => ({
    id,
    name: `test-org-${id}`,
    display_name: `Test Org ${id}`,
    organization_type: 'team',
    owner_user_id: 'user-1',
    is_active: true,
    max_groups: 5,
    max_members: 10,
    group_count: 0,
    member_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as any)

  describe('setCurrentOrganization — Bug: hardcoded routePlanFeatureMap instead of route meta', () => {
    it('should read requiresPlanFeature from current route meta and redirect when feature is unavailable', async () => {
      const store = useOrganizationsStore()
      store.entities.push(createOrgEntity('org-1'))

      // Simulate being on a route that has requiresPlanFeature in its meta
      // This is NOT in the hardcoded routePlanFeatureMap — but it IS in the route meta
      mockCurrentRoute.value = {
        path: '/group-members',
        meta: { requiresPlanFeature: 'multiple_groups' }
      }

      // The feature is NOT available in the new org
      mockHasFeature.mockReturnValue(false)

      await store.setCurrentOrganization('org-1')

      // BUG: The current code uses a hardcoded routePlanFeatureMap which checks
      // path prefixes. '/group-members' is NOT in that map even though the route
      // has requiresPlanFeature: 'multiple_groups' in its meta.
      // The test expects the code to read from route meta instead.
      expect(mockRouterPush).toHaveBeenCalled()
    })

    it('should NOT redirect when current route has no requiresPlanFeature in meta', async () => {
      const store = useOrganizationsStore()
      store.entities.push(createOrgEntity('org-1'))

      // Simulate being on a route with NO requiresPlanFeature
      mockCurrentRoute.value = {
        path: '/courses',
        meta: {}
      }

      mockHasFeature.mockReturnValue(false)

      await store.setCurrentOrganization('org-1')

      // No requiresPlanFeature in meta → should NOT redirect
      expect(mockRouterPush).not.toHaveBeenCalled()
    })

    it('should NOT redirect when the required plan feature IS available', async () => {
      const store = useOrganizationsStore()
      store.entities.push(createOrgEntity('org-1'))

      // Route requires a feature, but the feature IS available
      mockCurrentRoute.value = {
        path: '/class-groups',
        meta: { requiresPlanFeature: 'multiple_groups' }
      }

      mockHasFeature.mockReturnValue(true)

      await store.setCurrentOrganization('org-1')

      // Feature is available → no redirect needed
      expect(mockRouterPush).not.toHaveBeenCalled()
    })
  })

  describe('setCurrentOrganization — Bug: default_landing_page used without validation', () => {
    it('should validate default_landing_page against availablePages before redirecting', async () => {
      const store = useOrganizationsStore()
      store.entities.push(createOrgEntity('org-1'))

      // Simulate being on a route that requires a plan feature the new org lacks
      mockCurrentRoute.value = {
        path: '/class-groups',
        meta: { requiresPlanFeature: 'multiple_groups' }
      }
      mockHasFeature.mockReturnValue(false)

      // Settings has a default_landing_page that is NOT in availablePages
      mockSettings.default_landing_page = '/dashboard'
      mockAvailablePages.value = [
        { value: '/terminal-sessions', label: 'Terminal Sessions' },
        { value: '/courses', label: 'Courses' }
      ]

      await store.setCurrentOrganization('org-1')

      // BUG: Current code does:
      //   settingsStore.settings.default_landing_page || '/terminal-sessions'
      // This would redirect to '/dashboard' which doesn't exist.
      // Correct behavior: validate against availablePages and fall back to
      // '/terminal-sessions' (or first available page) if not found.
      expect(mockRouterPush).toHaveBeenCalledWith('/terminal-sessions')
    })

    it('should use default_landing_page when it IS in availablePages', async () => {
      const store = useOrganizationsStore()
      store.entities.push(createOrgEntity('org-1'))

      // Simulate needing a redirect
      mockCurrentRoute.value = {
        path: '/class-groups',
        meta: { requiresPlanFeature: 'multiple_groups' }
      }
      mockHasFeature.mockReturnValue(false)

      // Settings has a valid default_landing_page
      mockSettings.default_landing_page = '/courses'
      mockAvailablePages.value = [
        { value: '/terminal-sessions', label: 'Terminal Sessions' },
        { value: '/courses', label: 'Courses' }
      ]

      await store.setCurrentOrganization('org-1')

      // '/courses' IS in availablePages, so redirect should use it
      expect(mockRouterPush).toHaveBeenCalledWith('/courses')
    })

    it('should fall back to first available page when default_landing_page is empty and /terminal-sessions is not available', async () => {
      const store = useOrganizationsStore()
      store.entities.push(createOrgEntity('org-1'))

      // Simulate needing a redirect
      mockCurrentRoute.value = {
        path: '/class-groups',
        meta: { requiresPlanFeature: 'multiple_groups' }
      }
      mockHasFeature.mockReturnValue(false)

      // No default set, and /terminal-sessions is not in available pages
      mockSettings.default_landing_page = ''
      mockAvailablePages.value = [
        { value: '/courses', label: 'Courses' },
        { value: '/subscription-dashboard', label: 'Subscription Dashboard' }
      ]

      await store.setCurrentOrganization('org-1')

      // BUG: Current code falls back to '/terminal-sessions' which isn't available.
      // Correct behavior: use first available page ('/courses')
      expect(mockRouterPush).toHaveBeenCalledWith('/courses')
    })
  })
})
