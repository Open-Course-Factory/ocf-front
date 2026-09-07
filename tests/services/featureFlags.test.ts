import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock axios at the HTTP boundary BEFORE importing the service so that
// the singleton's calls go through the mocked axios.
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

import axios from 'axios'
import { FeatureFlagService } from '../../src/services/features/featureFlags'

const mockedAxios = vi.mocked(axios)

/**
 * Reset the FeatureFlagService singleton between tests so each test starts
 * from a clean cache state. The class uses a private static `instance` field
 * and a private `lastFetch` timestamp; we cast to `any` to reset both.
 */
function resetSingleton(): FeatureFlagService {
  ;(FeatureFlagService as any).instance = undefined
  return FeatureFlagService.getInstance()
}

/**
 * Build a fake backend response that flips `course_conception` to enabled.
 * The default flag state for `course_conception` is `enabled: false`, so a
 * successful fetch is observable as a state change.
 */
function backendEnablesCourseConception() {
  return {
    data: {
      data: [
        {
          id: 'feat-1',
          key: 'course_conception',
          name: 'course_conception',
          enabled: true,
          description: 'enabled by backend'
        }
      ]
    }
  }
}

describe('FeatureFlagService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * BEHAVIOR PROTECTED: When the app calls fetchFromBackend() repeatedly
   * within the 5-minute TTL (e.g. on every navigation), only ONE network
   * request should hit the backend. Without this cache, a busy SPA would
   * hammer /features on every route change.
   *
   * GUT-CHECK: If the `if (!force && cacheValid)` early-return at line ~289
   * is removed, the second fetch issues a second axios.get and this test
   * fails (call count would be 2).
   */
  it('skips the network on a second fetch within the TTL (cache hit)', async () => {
    const service = resetSingleton()
    mockedAxios.get.mockResolvedValue(backendEnablesCourseConception())

    // First call: cache cold, must hit backend and apply the response.
    await service.fetchFromBackend()
    expect(service.getAllFlags().course_conception.enabled).toBe(true)

    // Second call: cache warm (TTL not expired in real time), must NOT hit backend.
    await service.fetchFromBackend()

    expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    expect(mockedAxios.get).toHaveBeenCalledWith('/features')
  })

  /**
   * BEHAVIOR PROTECTED: When several callers (e.g. multiple components
   * mounting at the same time) call fetchFromBackend() simultaneously while
   * the cache is cold, only ONE network request should fire. Without
   * deduplication, app startup would issue N parallel /features requests.
   *
   * Concurrent callers share the in-flight promise (see the next test for
   * what they observe on resume). The contract here is (a) only one network
   * call fires, and (b) once it resolves, the flag state reflects the
   * backend response.
   *
   * GUT-CHECK: If the `fetchInFlight` guard is removed, all 5 calls fire
   * axios.get and the call-count assertion fails.
   */
  it('deduplicates concurrent fetches while one is in flight', async () => {
    const service = resetSingleton()

    // Hold the network response with a deferred promise so all 5 callers
    // find a fetch already in flight before the first call resolves.
    let resolveAxios!: (value: unknown) => void
    const inflight = new Promise(resolve => { resolveAxios = resolve })
    mockedAxios.get.mockReturnValue(inflight as any)

    // Fire 5 concurrent fetches. None can complete until we resolve `inflight`.
    const callers = [
      service.fetchFromBackend(),
      service.fetchFromBackend(),
      service.fetchFromBackend(),
      service.fetchFromBackend(),
      service.fetchFromBackend()
    ]

    // Now release the network call.
    resolveAxios(backendEnablesCourseConception())
    await Promise.all(callers)

    // Only ONE network request should have fired despite 5 callers.
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)

    // After the in-flight call resolves, the flag state reflects the response.
    expect(service.getAllFlags().course_conception.enabled).toBe(true)
  })

  /**
   * BEHAVIOR PROTECTED: a caller that awaits fetchFromBackend() while another
   * fetch is in flight must not resume before the data has landed. The old
   * guard returned undefined immediately, so a route guard awaiting the
   * flags could read the cold default state (#189).
   */
  it('makes every concurrent caller wait for the shared in-flight fetch', async () => {
    const service = resetSingleton()

    let resolveAxios!: (value: unknown) => void
    mockedAxios.get.mockReturnValue(new Promise(resolve => { resolveAxios = resolve }) as any)

    const first = service.fetchFromBackend()
    // The second caller reads the flag the moment its own await returns.
    const secondSees = service.fetchFromBackend().then(
      () => service.getAllFlags().course_conception.enabled
    )

    resolveAxios(backendEnablesCourseConception())
    await first

    expect(await secondSees).toBe(true)
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)
  })

  /**
   * BEHAVIOR PROTECTED: After a user logs in, the cached anonymous-or-stale
   * feature-flag state must be invalidated and a fresh fetch issued. Without
   * this, a freshly-logged-in user would see flags computed before their
   * auth context was established (e.g. role-restricted flags would stay off).
   *
   * GUT-CHECK: If `refreshAfterLogin` no longer triggers a fetch (e.g. body
   * gutted, or `fetchFromBackend(true)` changed to `fetchFromBackend()` so
   * the still-warm cache short-circuits it), the second axios.get never
   * fires and the call count stays at 1 — this test then fails.
   */
  it('invalidates the cache after login so the next fetch refetches', async () => {
    const service = resetSingleton()
    mockedAxios.get.mockResolvedValue(backendEnablesCourseConception())

    // Prime the cache with a normal fetch.
    await service.fetchFromBackend()
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)

    // Simulate login: cache must be invalidated and a fresh request fired,
    // even though the TTL has not expired in wall-clock time.
    await service.refreshAfterLogin()

    expect(mockedAxios.get).toHaveBeenCalledTimes(2)
  })

  /**
   * BEHAVIOR PROTECTED: a flag the backend knows and the frontend defaults do
   * not is registered on the fly (#102). The defaults only cover the gap
   * before the first response; they are not a whitelist. Without this, a new
   * backend flag was silently dropped and every gate on it read false.
   */
  it('registers a backend flag the defaults never declared', async () => {
    const service = resetSingleton()
    mockedAxios.get.mockResolvedValue({
      data: {
        data: [
          { id: 'feat-9', key: 'brand_new_thing', name: 'brand_new_thing', module: 'labs', enabled: true, description: 'from backend' }
        ]
      }
    } as any)

    await service.fetchFromBackend(true)

    expect(service.isEnabled('brand_new_thing')).toBe(true)
    expect(service.getAllFlags().brand_new_thing).toMatchObject({
      id: 'feat-9',
      module: 'labs',
      description: 'from backend'
    })
  })
})
