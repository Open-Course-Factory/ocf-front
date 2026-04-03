import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

// Use vi.hoisted to create mocks that are available in vi.mock factories
const { mockFeatureFlagService } = vi.hoisted(() => {
  const mockFeatureFlagService = {
    isEnabled: vi.fn((flagName: string) => {
      return flagName === 'terminal_sessions' || flagName === 'class_groups'
    }),
    getAllFlags: vi.fn(() => ({})),
    fetchFromBackend: vi.fn().mockResolvedValue(undefined),
    refreshAfterLogin: vi.fn().mockResolvedValue(undefined),
    refreshCache: vi.fn().mockResolvedValue(undefined),
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    updateFlag: vi.fn().mockResolvedValue(undefined),
    isMetricVisible: vi.fn(() => true),
    isFeatureVisible: vi.fn(() => true),
    getVisibleMetricTypes: vi.fn(() => new Set(['terminal_sessions', 'scenarios'])),
    clearLocalStorage: vi.fn(),
    syncUsageLimits: vi.fn().mockResolvedValue(undefined),
  }
  return { mockFeatureFlagService }
})

vi.mock('../../src/services/features', () => ({
  featureFlagService: mockFeatureFlagService,
  isFeatureEnabled: vi.fn((flagName: string, actor?: any) => {
    return mockFeatureFlagService.isEnabled(flagName, actor)
  }),
}))

// Mock the currentUser store
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: vi.fn(() => ({
    userId: 'user-123',
    userRoles: ['member'],
    permissions: [],
  }))
}))

// Mock useAdminViewMode
vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: vi.fn(() => ({
    shouldFilterAsStandardUser: ref(false),
    isAdmin: ref(false),
  }))
}))

import { useFeatureFlags, getCurrentActorRoles } from '../../src/composables/useFeatureFlags'
import { useCurrentUserStore } from '../../src/stores/currentUser'

describe('useFeatureFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default mock behaviors
    mockFeatureFlagService.isEnabled.mockImplementation((flagName: string) => {
      return flagName === 'terminal_sessions' || flagName === 'class_groups'
    })
    mockFeatureFlagService.isMetricVisible.mockReturnValue(true)
    mockFeatureFlagService.isFeatureVisible.mockReturnValue(true)
    mockFeatureFlagService.getVisibleMetricTypes.mockReturnValue(new Set(['terminal_sessions', 'scenarios']))

    vi.mocked(useCurrentUserStore).mockReturnValue({
      userId: 'user-123',
      userRoles: ['member'],
      permissions: [],
    } as any)
  })

  describe('isEnabled', () => {
    it('returns true for an enabled flag', () => {
      const { isEnabled } = useFeatureFlags()
      expect(isEnabled('terminal_sessions')).toBe(true)
    })

    it('returns false for a non-existent/disabled flag', () => {
      const { isEnabled } = useFeatureFlags()
      expect(isEnabled('nonexistent_flag')).toBe(false)
    })
  })

  describe('areEnabled', () => {
    it('returns true when all flags are enabled', () => {
      const { areEnabled } = useFeatureFlags()
      expect(areEnabled(['terminal_sessions', 'class_groups'])).toBe(true)
    })

    it('returns false when not all flags are enabled', () => {
      const { areEnabled } = useFeatureFlags()
      expect(areEnabled(['terminal_sessions', 'nonexistent'])).toBe(false)
    })

    it('returns true for empty array', () => {
      const { areEnabled } = useFeatureFlags()
      expect(areEnabled([])).toBe(true)
    })
  })

  describe('anyEnabled', () => {
    it('returns true when at least one flag is enabled', () => {
      const { anyEnabled } = useFeatureFlags()
      expect(anyEnabled(['nonexistent', 'terminal_sessions'])).toBe(true)
    })

    it('returns false when no flags are enabled', () => {
      const { anyEnabled } = useFeatureFlags()
      expect(anyEnabled(['nonexistent1', 'nonexistent2'])).toBe(false)
    })

    it('returns false for empty array', () => {
      const { anyEnabled } = useFeatureFlags()
      expect(anyEnabled([])).toBe(false)
    })
  })

  describe('refreshAfterLogin', () => {
    it('calls service.refreshAfterLogin', async () => {
      const { refreshAfterLogin } = useFeatureFlags()
      await refreshAfterLogin()
      expect(mockFeatureFlagService.refreshAfterLogin).toHaveBeenCalledOnce()
    })
  })

  describe('fetchFromBackend', () => {
    it('calls service.fetchFromBackend without force by default', async () => {
      const { fetchFromBackend } = useFeatureFlags()
      await fetchFromBackend()
      expect(mockFeatureFlagService.fetchFromBackend).toHaveBeenCalledWith(undefined)
    })

    it('calls service.fetchFromBackend with force=true', async () => {
      const { fetchFromBackend } = useFeatureFlags()
      await fetchFromBackend(true)
      expect(mockFeatureFlagService.fetchFromBackend).toHaveBeenCalledWith(true)
    })
  })

  describe('waitForInitialization', () => {
    it('calls service.waitForInitialization', async () => {
      const { waitForInitialization } = useFeatureFlags()
      await waitForInitialization()
      expect(mockFeatureFlagService.waitForInitialization).toHaveBeenCalledOnce()
    })
  })

  describe('syncUsageLimits', () => {
    it('calls service.syncUsageLimits', async () => {
      const { syncUsageLimits } = useFeatureFlags()
      await syncUsageLimits()
      expect(mockFeatureFlagService.syncUsageLimits).toHaveBeenCalledOnce()
    })
  })

  describe('clearLocalStorage', () => {
    it('delegates to service.clearLocalStorage', () => {
      const { clearLocalStorage } = useFeatureFlags()
      clearLocalStorage()
      expect(mockFeatureFlagService.clearLocalStorage).toHaveBeenCalledOnce()
    })
  })

  describe('isMetricVisible', () => {
    it('delegates to service.isMetricVisible with actor', () => {
      const { isMetricVisible } = useFeatureFlags()
      const result = isMetricVisible('terminal_sessions')
      expect(result).toBe(true)
      expect(mockFeatureFlagService.isMetricVisible).toHaveBeenCalledWith(
        'terminal_sessions',
        expect.objectContaining({ userId: 'user-123' })
      )
    })

    it('returns false when service returns false', () => {
      mockFeatureFlagService.isMetricVisible.mockReturnValue(false)
      const { isMetricVisible } = useFeatureFlags()
      expect(isMetricVisible('hidden_metric')).toBe(false)
    })
  })

  describe('isFeatureVisible', () => {
    it('delegates to service.isFeatureVisible with actor', () => {
      const { isFeatureVisible } = useFeatureFlags()
      const result = isFeatureVisible('terminal_access')
      expect(result).toBe(true)
      expect(mockFeatureFlagService.isFeatureVisible).toHaveBeenCalledWith(
        'terminal_access',
        expect.objectContaining({ userId: 'user-123' })
      )
    })
  })

  describe('getVisibleMetricTypes', () => {
    it('delegates to service.getVisibleMetricTypes', () => {
      const { getVisibleMetricTypes } = useFeatureFlags()
      const result = getVisibleMetricTypes()
      expect(result).toEqual(new Set(['terminal_sessions', 'scenarios']))
      expect(mockFeatureFlagService.getVisibleMetricTypes).toHaveBeenCalled()
    })
  })

  describe('filterByFeatureFlags', () => {
    it('filters entities by their type field using isMetricVisible', () => {
      mockFeatureFlagService.isMetricVisible.mockImplementation((metricType: string) => {
        return metricType !== 'hidden_type'
      })

      const { filterByFeatureFlags } = useFeatureFlags()
      const entities = [
        { id: 1, type: 'visible_type', name: 'Entity A' },
        { id: 2, type: 'hidden_type', name: 'Entity B' },
        { id: 3, type: 'visible_type', name: 'Entity C' },
      ]

      const result = filterByFeatureFlags(entities, 'type')
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(3)
    })

    it('keeps entities that have no type field value', () => {
      const { filterByFeatureFlags } = useFeatureFlags()
      const entities = [
        { id: 1, type: null, name: 'No type' },
        { id: 2, type: '', name: 'Empty type' },
        { id: 3, type: 'some_type', name: 'Has type' },
      ]

      const result = filterByFeatureFlags(entities, 'type')
      // null and '' are falsy, so they pass the "if (!entityType) return true" check
      expect(result.some(e => e.id === 1)).toBe(true)
      expect(result.some(e => e.id === 2)).toBe(true)
    })

    it('returns empty array for empty input', () => {
      const { filterByFeatureFlags } = useFeatureFlags()
      expect(filterByFeatureFlags([], 'type')).toEqual([])
    })
  })

  describe('updateFlag', () => {
    it('calls service.updateFlag when user is administrator', async () => {
      vi.mocked(useCurrentUserStore).mockReturnValue({
        userId: 'admin-1',
        userRoles: ['administrator'],
        permissions: [],
      } as any)

      const { updateFlag } = useFeatureFlags()
      await updateFlag('terminal_sessions', { enabled: true })
      expect(mockFeatureFlagService.updateFlag).toHaveBeenCalledWith(
        'terminal_sessions',
        { enabled: true }
      )
    })

    it('does not call service.updateFlag when user is not administrator', async () => {
      vi.mocked(useCurrentUserStore).mockReturnValue({
        userId: 'user-1',
        userRoles: ['member'],
        permissions: [],
      } as any)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { updateFlag } = useFeatureFlags()
      await updateFlag('terminal_sessions', { enabled: true })
      expect(mockFeatureFlagService.updateFlag).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('flags computed', () => {
    it('returns the result of service.getAllFlags', () => {
      const mockFlags = { terminal_sessions: { enabled: true } }
      mockFeatureFlagService.getAllFlags.mockReturnValue(mockFlags)

      const { flags } = useFeatureFlags()
      expect(flags.value).toEqual(mockFlags)
    })
  })

  describe('getCurrentActor', () => {
    it('returns the current actor with userId and roles', () => {
      const { getCurrentActor } = useFeatureFlags()
      const actor = getCurrentActor()
      expect(actor.userId).toBe('user-123')
      expect(actor.roles).toEqual(['member'])
      expect(actor.role).toBe('member')
    })
  })

  describe('createReactiveFlag', () => {
    it('returns a computed ref for a feature flag', () => {
      const { createReactiveFlag } = useFeatureFlags()
      const flag = createReactiveFlag('terminal_sessions')
      expect(flag.value).toBe(true)
    })

    it('returns false for a disabled flag', () => {
      const { createReactiveFlag } = useFeatureFlags()
      const flag = createReactiveFlag('nonexistent')
      expect(flag.value).toBe(false)
    })
  })
})

describe('getCurrentActorRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCurrentUserStore).mockReturnValue({
      userId: 'user-123',
      userRoles: ['member'],
      permissions: [],
    } as any)
  })

  it('returns a computed with userId and roles from currentUser store', () => {
    const actor = getCurrentActorRoles()
    expect(actor.value.userId).toBe('user-123')
    expect(actor.value.roles).toEqual(['member'])
    expect(actor.value.role).toBe('member')
  })

  it('defaults to ["member"] when userRoles is empty', () => {
    vi.mocked(useCurrentUserStore).mockReturnValue({
      userId: 'user-123',
      userRoles: [],
      permissions: [],
    } as any)

    const actor = getCurrentActorRoles()
    expect(actor.value.roles).toEqual(['member'])
    expect(actor.value.role).toBe('member')
  })

  it('defaults to ["member"] when userRoles is undefined', () => {
    vi.mocked(useCurrentUserStore).mockReturnValue({
      userId: 'user-123',
      userRoles: undefined,
      permissions: [],
    } as any)

    const actor = getCurrentActorRoles()
    expect(actor.value.roles).toEqual(['member'])
  })
})
