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

// The verdict the store reads after the switch. Set per test; `null` means no
// verdict arrived at all.
const effectiveFeatures = { value: null as null | { can_run_classrooms: boolean } }
vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    refreshEntitlements: vi.fn().mockResolvedValue(undefined),
    loadEffectiveFeatures: mockLoadEffectiveFeatures,
    get effectiveFeatures() { return effectiveFeatures.value },
    currentUser: { id: 'user-1', organization_memberships: [] }
  })
}))

const mockCurrentRoute = ref<{ path: string; meta: Record<string, any> }>({ path: '/', meta: {} })
const mockRouterPush = vi.fn()
vi.mock('../../src/router', () => ({
  default: {
    currentRoute: mockCurrentRoute,
    push: mockRouterPush
  }
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

/**
 * Leaving a classroom page on an organization switch follows the same rule and
 * the same destination as the router guard that protects the page on direct
 * navigation and reload: the backend's verdict for the new context, read
 * through classroomRefusalRedirect (#320). Plan-feature meta is no longer a
 * rule of its own.
 */
describe('organizations store — routing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    mockCurrentRoute.value = { path: '/', meta: {} }
    mockRouterPush.mockReset()
    effectiveFeatures.value = null
  })

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

  async function switchTo(orgId: string) {
    const store = useOrganizationsStore()
    store.entities.push(createOrgEntity(orgId))
    await store.setCurrentOrganization(orgId)
  }

  it('sends the user to the console when the new organization refuses the classroom page', async () => {
    mockCurrentRoute.value = { path: '/class-groups', meta: { requiresClassroomEntitlement: true } }
    effectiveFeatures.value = { can_run_classrooms: false }

    await switchTo('org-1')

    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'MyClasses' })
  })

  it('stays on the classroom page when the new organization allows it', async () => {
    mockCurrentRoute.value = { path: '/class-groups', meta: { requiresClassroomEntitlement: true } }
    effectiveFeatures.value = { can_run_classrooms: true }

    await switchTo('org-1')

    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('stays put when no verdict arrived, leaving the refusal to the backend', async () => {
    mockCurrentRoute.value = { path: '/class-groups', meta: { requiresClassroomEntitlement: true } }
    effectiveFeatures.value = null

    await switchTo('org-1')

    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('never redirects from a page that is not a classroom page', async () => {
    mockCurrentRoute.value = { path: '/courses', meta: {} }
    effectiveFeatures.value = { can_run_classrooms: false }

    await switchTo('org-1')

    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
