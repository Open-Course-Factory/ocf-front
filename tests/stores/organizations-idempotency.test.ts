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

describe('organizations store — idempotency', () => {
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

  describe('setCurrentOrganization — Bug M6: no guard against redundant API calls', () => {
    it('should NOT trigger subscription refresh when selecting the already-active org', () => {
      const store = useOrganizationsStore()

      // Set up the store with an org
      store.entities.push({
        id: 'org-1',
        name: 'test-org',
        display_name: 'Test Org',
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

      // First call — should trigger refresh
      store.setCurrentOrganization('org-1')
      expect(mockGetCurrentSubscription).toHaveBeenCalledTimes(1)
      expect(mockLoadEffectiveFeatures).toHaveBeenCalledTimes(1)

      vi.clearAllMocks()

      // Second call with SAME org — should NOT trigger refresh
      // BUG: setCurrentOrganization does not check if the org is already selected.
      // It unconditionally fires getCurrentSubscription() and loadEffectiveFeatures()
      // even when the org ID hasn't changed.
      store.setCurrentOrganization('org-1')
      expect(mockGetCurrentSubscription).not.toHaveBeenCalled()
      expect(mockLoadEffectiveFeatures).not.toHaveBeenCalled()
    })

    it('should trigger subscription refresh when selecting a DIFFERENT org', () => {
      const store = useOrganizationsStore()

      store.entities.push(
        {
          id: 'org-1',
          name: 'test-org-1',
          display_name: 'Test Org 1',
          organization_type: 'team',
          owner_user_id: 'user-1',
          is_active: true,
          max_groups: 5,
          max_members: 10,
          group_count: 0,
          member_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any,
        {
          id: 'org-2',
          name: 'test-org-2',
          display_name: 'Test Org 2',
          organization_type: 'team',
          owner_user_id: 'user-1',
          is_active: true,
          max_groups: 5,
          max_members: 10,
          group_count: 0,
          member_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any
      )

      // First call
      store.setCurrentOrganization('org-1')
      vi.clearAllMocks()

      // Different org — SHOULD trigger refresh
      store.setCurrentOrganization('org-2')
      expect(mockGetCurrentSubscription).toHaveBeenCalledTimes(1)
      expect(mockLoadEffectiveFeatures).toHaveBeenCalledTimes(1)
    })
  })
})
