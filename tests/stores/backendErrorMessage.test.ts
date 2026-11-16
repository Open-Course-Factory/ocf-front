import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/*
 * Generic entity GET/DELETE and errors.Respond answer { error_code, error_message }.
 * These stores must show that sentence, not their generic fallback.
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
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userName: 'teacher', secretToken: 'token' }),
}))
vi.mock('../../src/stores/login', () => ({
  useLoginStore: () => ({ email: 'teacher@example.com' }),
}))

import axios from 'axios'
import { useCoursesStore } from '../../src/stores/courses'
import { useChaptersStore } from '../../src/stores/chapters'
import { useSectionsStore } from '../../src/stores/sections'
import { useGenerationsStore } from '../../src/stores/generations'

const mockGet = vi.mocked(axios.get)
const mockPost = vi.mocked(axios.post)
const mockDelete = vi.mocked(axios.delete)

const MESSAGE = 'Quota exceeded for this plan'
const rejection = {
  response: { status: 403, data: { error_code: 403, error_message: MESSAGE } },
  message: 'Request failed with status code 403',
}

describe('stores show the backend error_message', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('courses.fetchCourseById', async () => {
    mockGet.mockRejectedValue(rejection)
    const store = useCoursesStore()
    await store.fetchCourseById('c1')
    expect(store.error).toBe(MESSAGE)
  })

  it('courses.deleteCourseVersion', async () => {
    mockDelete.mockRejectedValue(rejection)
    const store = useCoursesStore()
    await store.deleteCourseVersion('c1')
    expect(store.error).toBe(MESSAGE)
  })

  it('chapters.fetchChapterById', async () => {
    mockGet.mockRejectedValue(rejection)
    const store = useChaptersStore()
    await store.fetchChapterById('ch1')
    expect(store.error).toBe(MESSAGE)
  })

  it('sections.fetchSectionById', async () => {
    mockGet.mockRejectedValue(rejection)
    const store = useSectionsStore()
    await store.fetchSectionById('s1')
    expect(store.error).toBe(MESSAGE)
  })

  it('generations: a refused trigger records the backend sentence on the generation', async () => {
    mockPost.mockImplementation(async (url: string) => {
      if (url === '/courses/generate') throw rejection
      return { status: 201, data: { id: 'g1', status: 'pending' } }
    })
    const store = useGenerationsStore()
    await store.createEntity('/generations', { format: '0' }).catch(() => {})
    await vi.waitFor(() => expect(store.entities[0]?.status).toBe('failed'))
    // The backend already words a full sentence: shown alone, no translated prefix.
    expect(store.entities[0].error_message).toBe(MESSAGE)
  })

  it('generations: a trigger lost to a network error records the translated text alone', async () => {
    mockPost.mockImplementation(async (url: string) => {
      if (url === '/courses/generate') throw { isAxiosError: true, request: {}, message: 'Network Error' }
      return { status: 201, data: { id: 'g1', status: 'pending' } }
    })
    const store = useGenerationsStore()
    await store.createEntity('/generations', { format: '0' }).catch(() => {})
    await vi.waitFor(() => expect(store.entities[0]?.status).toBe('failed'))
    expect(store.entities[0].error_message).toMatch(/^(Could not start the generation|Impossible de lancer la génération)$/)
  })

  it('chapters.fetchChapterById: a network error shows the translated fallback, not axios text', async () => {
    mockGet.mockRejectedValue({ isAxiosError: true, request: {}, message: 'Network Error' })
    const store = useChaptersStore()
    await store.fetchChapterById('ch1')
    expect(store.error).toMatch(/^(Error loading chapter|Erreur lors du chargement du chapitre)$/)
  })
})
