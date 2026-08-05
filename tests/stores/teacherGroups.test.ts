/**
 * The "Mes classes" console reads every class the teacher owns or manages from
 * ONE request (issue #309). This store is that request's single cache: the
 * console renders from it, and the group cards on /class-groups read their live
 * session counts from it too, so neither surface fans out per-group calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

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

// Reactive like the real store's computed, so a switch genuinely invalidates
// what was derived from it rather than the test reading a fresh value by luck.
const activeOrganization = ref<{ id: string; display_name: string } | null>(null)
vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    get currentOrganization() {
      return activeOrganization.value
    },
  }),
}))

import axios from 'axios'
import { useTeacherGroupsStore } from '../../src/stores/teacherGroups'

const mockGet = vi.mocked(axios.get)

function summary(overrides: Record<string, any> = {}) {
  return {
    group_id: 'group-1',
    name: 'devops-2026',
    display_name: 'DevOps 2026',
    organization_id: 'org-here',
    caller_role: 'owner',
    is_active: true,
    is_expired: false,
    // Twelve apprenants and their teacher, who is a member of the class too:
    // the two counts differ on purpose so a consumer reading one for the other
    // is caught here (#480).
    member_count: 13,
    learner_count: 12,
    live_session_count: 3,
    assignments: [],
    ...overrides,
  }
}

describe('teacherGroups store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    activeOrganization.value = { id: 'org-here', display_name: 'FormaTech' }
  })

  it('loads the managed classes from a single request', async () => {
    mockGet.mockResolvedValueOnce({ data: [summary()] })
    const store = useTeacherGroupsStore()

    await store.loadGroups()

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith('/teacher/groups')
    expect(store.groups).toHaveLength(1)
    expect(store.groups[0].display_name).toBe('DevOps 2026')
  })

  it('fetches once however many consumers ask for the data', async () => {
    mockGet.mockResolvedValue({ data: [summary()] })
    const store = useTeacherGroupsStore()

    await Promise.all([store.ensureLoaded(), store.ensureLoaded()])
    await store.ensureLoaded()

    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('refetches for a caller that will not accept data older than its refresh rate', async () => {
    vi.useFakeTimers()
    try {
      mockGet.mockResolvedValue({ data: [summary({ live_session_count: 1 })] })
      const store = useTeacherGroupsStore()
      await store.ensureLoaded()

      vi.advanceTimersByTime(31000)
      mockGet.mockResolvedValue({ data: [summary({ live_session_count: 6 })] })
      await store.ensureLoaded(30000)

      expect(mockGet).toHaveBeenCalledTimes(2)
      expect(store.liveSessionCountOf('group-1')).toBe(6)
    } finally {
      vi.useRealTimers()
    }
  })

  it('refetches after markStale even when the cache is still young', async () => {
    // The regression: a teacher added three learners, came back to the
    // console within the polling interval, and read the pre-add member count.
    mockGet.mockResolvedValue({ data: [summary({ member_count: 1 })] })
    const store = useTeacherGroupsStore()
    await store.ensureLoaded(30000)

    mockGet.mockResolvedValue({ data: [summary({ member_count: 4 })] })
    store.markStale()
    await store.ensureLoaded(30000)

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(store.groups[0].member_count).toBe(4)
  })

  it('reuses a load that just happened rather than repeating it', async () => {
    mockGet.mockResolvedValue({ data: [summary()] })
    const store = useTeacherGroupsStore()
    await store.ensureLoaded()

    await store.ensureLoaded(30000)

    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('refetches on an explicit reload even once loaded', async () => {
    mockGet.mockResolvedValue({ data: [summary({ live_session_count: 1 })] })
    const store = useTeacherGroupsStore()
    await store.ensureLoaded()

    mockGet.mockResolvedValueOnce({ data: [summary({ live_session_count: 7 })] })
    await store.loadGroups()

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(store.liveSessionCountOf('group-1')).toBe(7)
  })

  it('reports a live session count only for classes the caller manages', async () => {
    mockGet.mockResolvedValueOnce({ data: [summary({ group_id: 'mine', live_session_count: 4 })] })
    const store = useTeacherGroupsStore()

    await store.loadGroups()

    expect(store.liveSessionCountOf('mine')).toBe(4)
    expect(store.liveSessionCountOf('someone-elses-class')).toBeUndefined()
  })

  it('reports a zero live count as zero, not as "not managed"', async () => {
    mockGet.mockResolvedValueOnce({ data: [summary({ live_session_count: 0 })] })
    const store = useTeacherGroupsStore()

    await store.loadGroups()

    expect(store.liveSessionCountOf('group-1')).toBe(0)
  })

  it('reports the apprenants of a class, not its roster', async () => {
    // The teacher and their assistant are members too (#480); the banner that
    // states "X/N connectés" over this number must not count them.
    mockGet.mockResolvedValueOnce({ data: [summary({ member_count: 14, learner_count: 12 })] })
    const store = useTeacherGroupsStore()

    await store.loadGroups()

    expect(store.learnerCountOf('group-1')).toBe(12)
  })

  it('falls back to the roster while the backend does not report the apprenants', async () => {
    // Pre-!361 payloads carry no learner_count. Reading absent as zero would
    // report every class of such a deployment as having nobody in it.
    const { learner_count, ...beforeLearnerCount } = summary({ member_count: 12 })
    mockGet.mockResolvedValueOnce({ data: [beforeLearnerCount] })
    const store = useTeacherGroupsStore()

    await store.loadGroups()

    expect(store.learnerCountOf('group-1')).toBe(12)
  })

  it('reports a class of teaching staff as having no apprenant, not as unknown', async () => {
    mockGet.mockResolvedValueOnce({ data: [summary({ member_count: 1, learner_count: 0 })] })
    const store = useTeacherGroupsStore()

    await store.loadGroups()

    expect(store.learnerCountOf('group-1')).toBe(0)
    expect(store.learnerCountOf('someone-elses-class')).toBeUndefined()
  })

  it('treats a teacher with no classes as loaded, not as an error', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    const store = useTeacherGroupsStore()

    await store.loadGroups()

    expect(store.groups).toEqual([])
    expect(store.managesAnyClass).toBe(false)
    expect(store.isLoaded).toBe(true)
    expect(store.error).toBe('')
  })

  it('knows the caller manages classes as soon as one comes back', async () => {
    mockGet.mockResolvedValueOnce({ data: [summary()] })
    const store = useTeacherGroupsStore()

    await store.loadGroups()

    expect(store.managesAnyClass).toBe(true)
  })

  it('survives a null body instead of blowing up on .length', async () => {
    mockGet.mockResolvedValueOnce({ data: null })
    const store = useTeacherGroupsStore()

    await store.loadGroups()

    expect(store.groups).toEqual([])
    expect(store.error).toBe('')
  })

  it('surfaces the backend message on failure', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { error_message: 'Boom' } } })
    const store = useTeacherGroupsStore()

    await store.loadGroups()

    expect(store.groups).toEqual([])
    expect(store.error).toBe('Boom')
    expect(store.isLoading).toBe(false)
  })

  it('keeps the classes it already had when a refresh fails', async () => {
    mockGet.mockResolvedValueOnce({ data: [summary({ live_session_count: 2 })] })
    const store = useTeacherGroupsStore()
    await store.loadGroups()

    mockGet.mockRejectedValueOnce(new Error('network blip'))
    await store.loadGroups()

    expect(store.groups).toHaveLength(1)
    expect(store.liveSessionCountOf('group-1')).toBe(2)
    expect(store.error).toBe('network blip')
  })

  it('lets a failed load be retried', async () => {
    mockGet.mockRejectedValueOnce(new Error('offline'))
    const store = useTeacherGroupsStore()
    await store.ensureLoaded()

    mockGet.mockResolvedValueOnce({ data: [summary()] })
    await store.ensureLoaded()

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(store.groups).toHaveLength(1)
    expect(store.error).toBe('')
  })

  describe('organization scoping', () => {
    it('keeps only the classes of the active organization', async () => {
      mockGet.mockResolvedValueOnce({ data: [
        summary({ group_id: 'here', organization_id: 'org-here' }),
        summary({ group_id: 'elsewhere', organization_id: 'org-elsewhere' }),
      ] })
      const store = useTeacherGroupsStore()

      await store.loadGroups()

      expect(store.groupsInCurrentOrganization.map(g => g.group_id)).toEqual(['here'])
      expect(store.managesClassInCurrentOrganization).toBe(true)
    })

    it('follows an organization switch without refetching', async () => {
      mockGet.mockResolvedValueOnce({ data: [
        summary({ group_id: 'here', organization_id: 'org-here' }),
        summary({ group_id: 'elsewhere', organization_id: 'org-elsewhere' }),
      ] })
      const store = useTeacherGroupsStore()
      await store.loadGroups()
      // Read BEFORE the switch, so the assertion after it proves the derived
      // list was invalidated rather than merely computed late.
      expect(store.groupsInCurrentOrganization.map(g => g.group_id)).toEqual(['here'])

      activeOrganization.value = { id: 'org-elsewhere', display_name: 'ESITECH' }

      expect(store.groupsInCurrentOrganization.map(g => g.group_id)).toEqual(['elsewhere'])
      expect(mockGet).toHaveBeenCalledTimes(1)
    })

    it('reports teaching elsewhere when the active organization has none', async () => {
      mockGet.mockResolvedValueOnce({ data: [summary({ organization_id: 'org-elsewhere' })] })
      const store = useTeacherGroupsStore()

      await store.loadGroups()

      expect(store.groupsInCurrentOrganization).toEqual([])
      expect(store.managesClassInCurrentOrganization).toBe(false)
      expect(store.managesClassInAnotherOrganization).toBe(true)
    })

    it('does not claim classes elsewhere when there are none anywhere', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      const store = useTeacherGroupsStore()

      await store.loadGroups()

      expect(store.managesClassInCurrentOrganization).toBe(false)
      expect(store.managesClassInAnotherOrganization).toBe(false)
    })

    it('shows nothing rather than another organization while the context is unknown', async () => {
      activeOrganization.value = null
      mockGet.mockResolvedValueOnce({ data: [summary({ organization_id: 'org-here' })] })
      const store = useTeacherGroupsStore()

      await store.loadGroups()

      expect(store.groupsInCurrentOrganization).toEqual([])
      expect(store.managesClassInCurrentOrganization).toBe(false)
    })

    it('treats a class with no organization as belonging to none', async () => {
      mockGet.mockResolvedValueOnce({ data: [summary({ organization_id: undefined })] })
      const store = useTeacherGroupsStore()

      await store.loadGroups()

      expect(store.groupsInCurrentOrganization).toEqual([])
    })

    it('still counts live sessions for a class outside the active organization', async () => {
      mockGet.mockResolvedValueOnce({ data: [
        summary({ group_id: 'elsewhere', organization_id: 'org-elsewhere', live_session_count: 5 }),
      ] })
      const store = useTeacherGroupsStore()

      await store.loadGroups()

      // The lookup is by group id and its own page decides what to show; scoping
      // it twice would blank a card whose page disagrees by a paint.
      expect(store.liveSessionCountOf('elsewhere')).toBe(5)
    })
  })

  it('forgets everything on reset so a new session starts clean', async () => {
    mockGet.mockResolvedValueOnce({ data: [summary()] })
    const store = useTeacherGroupsStore()
    await store.loadGroups()

    store.reset()

    expect(store.groups).toEqual([])
    expect(store.isLoaded).toBe(false)
    expect(store.managesAnyClass).toBe(false)
  })
})
