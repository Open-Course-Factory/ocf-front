/**
 * Course, chapter and section detail pages load one entity with its children
 * and parents through `?include=`. A backend that refuses the include on a
 * detail route answers 404, so the store asks once more without it. Pinned
 * for all three stores, which must keep behaving the same.
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
import i18n from '../../src/i18n'
import { useCoursesStore } from '../../src/stores/courses'
import { useChaptersStore } from '../../src/stores/chapters'
import { useSectionsStore } from '../../src/stores/sections'

const mockGet = vi.mocked(axios.get)

const cases = [
  {
    name: 'courses',
    fetch: (id: string) => useCoursesStore().fetchCourseById(id),
    store: () => useCoursesStore(),
    withInclude: '/courses/x1?include=chapters.sections.pages',
    bare: '/courses/x1',
    notFound: 'Course version not found',
    loadError: 'Error loading course version',
  },
  {
    name: 'chapters',
    fetch: (id: string) => useChaptersStore().fetchChapterById(id),
    store: () => useChaptersStore(),
    withInclude: '/chapters/x1?include=sections.pages,courses',
    bare: '/chapters/x1',
    notFound: 'Chapter not found',
    loadError: 'Error loading chapter',
  },
  {
    name: 'sections',
    fetch: (id: string) => useSectionsStore().fetchSectionById(id),
    store: () => useSectionsStore(),
    withInclude: '/sections/x1?include=pages,chapters.courses',
    bare: '/sections/x1',
    notFound: 'Section not found',
    loadError: 'Error loading section',
  },
]

const httpError = (status: number, data: Record<string, unknown> = {}) => ({ response: { status, data } })

describe.each(cases)('$name store — fetch by id', ({ fetch, store, withInclude, bare, notFound, loadError }) => {
  beforeEach(() => {
    i18n.global.locale.value = 'en'
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('asks for the entity with its includes and returns the body', async () => {
    mockGet.mockResolvedValueOnce({ data: { id: 'x1', title: 'with tree' } })

    const result = await fetch('x1')

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith(withInclude)
    expect(result).toEqual({ id: 'x1', title: 'with tree' })
    expect(store().error).toBe('')
    expect(store().isLoading).toBe(false)
  })

  it('retries without includes on a 404 and returns the bare entity', async () => {
    mockGet
      .mockRejectedValueOnce(httpError(404))
      .mockResolvedValueOnce({ data: { id: 'x1', title: 'bare' } })

    const result = await fetch('x1')

    expect(mockGet.mock.calls.map((c) => c[0])).toEqual([withInclude, bare])
    expect(result).toEqual({ id: 'x1', title: 'bare' })
    expect(store().error).toBe('')
    expect(store().isLoading).toBe(false)
  })

  it('returns null with a not-found error when the retry is a 404 too', async () => {
    mockGet.mockRejectedValueOnce(httpError(404)).mockRejectedValueOnce(httpError(404))

    const result = await fetch('x1')

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(result).toBeNull()
    expect(store().error).toBe(notFound)
    expect(store().isLoading).toBe(false)
  })

  it('does not retry on another error and returns null with the server message', async () => {
    mockGet.mockRejectedValueOnce(httpError(500, { error: 'boom' }))

    const result = await fetch('x1')

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(result).toBeNull()
    expect(store().error).toBe('boom')
    expect(store().isLoading).toBe(false)
  })

  it('falls back to data.message, then to a translated message', async () => {
    mockGet.mockRejectedValueOnce(httpError(500, { message: 'msg' }))
    await fetch('x1')
    expect(store().error).toBe('msg')

    mockGet.mockRejectedValueOnce(httpError(500))
    await fetch('x1')
    expect(store().error).toBe(loadError)
  })

  it('returns null with the retry error when the retry fails otherwise', async () => {
    mockGet.mockRejectedValueOnce(httpError(404)).mockRejectedValueOnce(httpError(500, { error: 'down' }))

    const result = await fetch('x1')

    expect(result).toBeNull()
    expect(store().error).toBe('down')
  })
})
