/**
 * The "Mes classes" console reads every class the teacher owns or manages from
 * ONE request (issue #309). This store is that request's single cache: the
 * console renders from it, and the group cards on /class-groups read their live
 * session counts from it too, so neither surface fans out per-group calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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

import axios from 'axios'
import { useTeacherGroupsStore } from '../../src/stores/teacherGroups'

const mockGet = vi.mocked(axios.get)

function summary(overrides: Record<string, any> = {}) {
  return {
    group_id: 'group-1',
    name: 'devops-2026',
    display_name: 'DevOps 2026',
    caller_role: 'owner',
    is_active: true,
    is_expired: false,
    member_count: 12,
    live_session_count: 3,
    assignments: [],
    ...overrides,
  }
}

describe('teacherGroups store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
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
