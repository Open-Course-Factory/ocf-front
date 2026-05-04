import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/*
 * Tests for the `useImpersonationStore`.
 *
 * The store manages admin-impersonation state on the frontend. The backend
 * issues an impersonation token via POST /admin/impersonate/start which the
 * frontend remembers across reloads via sessionStorage (key
 * `ocf_impersonate_target`).
 *
 * State machine:
 *  - hydrate(): on app boot, reads sessionStorage and sets `targetUserId`
 *    so the next /auth/me call carries the impersonation header. We do NOT
 *    pre-call /admin/impersonate/active here — we trust sessionStorage and
 *    let the next /auth/me confirm via `applyAuthMeData`.
 *  - start(targetUserId): POST /admin/impersonate/start, persists the target
 *    to sessionStorage on success.
 *  - stop(silent?): POST /admin/impersonate/stop, ALWAYS clears local state
 *    even on failure (so a backend-side expiry can't strand the frontend).
 *    `silent=true` skips the network call (used by axios interceptor when the
 *    backend already told us the session is gone).
 *  - applyAuthMeData(data): called by currentUser store after /auth/me. If the
 *    response has `impersonated_by`, populate impersonator + target. If the
 *    response lacks `impersonated_by` but local state thinks we're impersonating,
 *    that means the session expired server-side — clear local state.
 *
 * Endpoints (NO `/api/v1/` prefix — the axios interceptor adds it):
 *  - POST admin/impersonate/start { target_user_id }
 *  - POST admin/impersonate/stop
 */

// ---- Boundary mocks ------------------------------------------------------

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

// ---- Real imports --------------------------------------------------------

import axios from 'axios'
import {
  useImpersonationStore,
  SESSION_STORAGE_KEY,
} from '../../src/stores/impersonation'

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

const START_URL = 'admin/impersonate/start'
const STOP_URL = 'admin/impersonate/stop'

// ---- Fixtures ------------------------------------------------------------

const targetSummary = {
  id: 'target-id',
  username: 'jane.doe',
  display_name: 'Jane Doe',
  email: 'jane@example.com',
  avatar: 'https://example.com/jane.png',
}

const adminSummary = {
  id: 'admin-id',
  username: 'admin.user',
  display_name: 'Admin User',
  email: 'admin@example.com',
  avatar: 'https://example.com/admin.png',
}

describe('useImpersonationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockedAxios.post.mockReset()
    mockedAxios.get.mockReset()
    sessionStorage.clear()
  })

  // ---- State + getters --------------------------------------------------

  it('initial state has targetUserId null and isImpersonating false', () => {
    const store = useImpersonationStore()
    expect(store.targetUserId).toBeNull()
    expect(store.target).toBeNull()
    expect(store.impersonator).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.isImpersonating).toBe(false)
  })

  it('isImpersonating becomes true after start()', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { target: targetSummary } })

    const store = useImpersonationStore()
    expect(store.isImpersonating).toBe(false)

    await store.start('target-id')

    expect(store.isImpersonating).toBe(true)
    expect(store.targetUserId).toBe('target-id')
  })

  // ---- hydrate() --------------------------------------------------------

  it('hydrate reads sessionStorage and sets targetUserId', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'fake-target-id')

    const store = useImpersonationStore()
    store.hydrate()

    expect(store.targetUserId).toBe('fake-target-id')
    expect(store.isImpersonating).toBe(true)
    // hydrate does NOT call /admin/impersonate/active — we trust sessionStorage
    // and let the next /auth/me confirm via applyAuthMeData
    expect(mockedAxios.get).not.toHaveBeenCalled()
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  it('hydrate is a no-op when sessionStorage is empty', () => {
    const store = useImpersonationStore()
    store.hydrate()

    expect(store.targetUserId).toBeNull()
    expect(store.isImpersonating).toBe(false)
    expect(mockedAxios.get).not.toHaveBeenCalled()
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  it('hydrate handles malformed sessionStorage value gracefully', () => {
    // Empty string — should be treated as "no target"
    sessionStorage.setItem(SESSION_STORAGE_KEY, '')
    let store = useImpersonationStore()
    store.hydrate()
    expect(store.targetUserId).toBeNull()
    expect(store.isImpersonating).toBe(false)

    // Garbage / whitespace — should still hydrate (any non-empty value is a
    // best-effort target id; the next /auth/me will confirm or clear).
    setActivePinia(createPinia())
    sessionStorage.setItem(SESSION_STORAGE_KEY, '   ')
    store = useImpersonationStore()
    expect(() => store.hydrate()).not.toThrow()
    // Whitespace-only is not a real id; treat as empty
    expect(store.targetUserId).toBeNull()

    // Pure garbage — does not throw; will be cleared on next /auth/me
    setActivePinia(createPinia())
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'not-a-uuid-but-not-empty')
    store = useImpersonationStore()
    expect(() => store.hydrate()).not.toThrow()
  })

  // ---- start() ----------------------------------------------------------

  it('start posts to admin/impersonate/start with target_user_id', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { target: targetSummary } })

    const store = useImpersonationStore()
    await store.start('target-id')

    expect(mockedAxios.post).toHaveBeenCalledTimes(1)
    const [url, body] = mockedAxios.post.mock.calls[0]
    expect(url).toBe(START_URL)
    expect(body).toEqual({ target_user_id: 'target-id' })
  })

  it('start writes targetUserId to sessionStorage on success', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { target: targetSummary } })

    const store = useImpersonationStore()
    await store.start('target-id')

    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe('target-id')
  })

  it('start populates target from response.data.target', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { target: targetSummary } })

    const store = useImpersonationStore()
    const result = await store.start('target-id')

    expect(store.target).toEqual(targetSummary)
    expect(result).toEqual(targetSummary)
  })

  it('start sets loading and clears error during the call', async () => {
    let loadingDuringCall: boolean | undefined
    let errorDuringCall: string | null | undefined

    // Pre-populate an error to confirm start() clears it
    const store = useImpersonationStore()
    store.error = 'previous error'

    mockedAxios.post.mockImplementationOnce(() => {
      loadingDuringCall = store.loading
      errorDuringCall = store.error
      return Promise.resolve({ data: { target: targetSummary } })
    })

    await store.start('target-id')

    expect(loadingDuringCall).toBe(true)
    expect(errorDuringCall).toBeNull()
    // After completion, loading must be back to false
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('start propagates errors and sets error state', async () => {
    const failure = {
      response: { status: 403, data: { error_message: 'forbidden' } },
      message: 'Request failed with status 403',
    }
    mockedAxios.post.mockRejectedValueOnce(failure)

    const store = useImpersonationStore()

    await expect(store.start('target-id')).rejects.toBeDefined()

    expect(store.error).not.toBeNull()
    expect(store.error).not.toBe('')
    // On failure, sessionStorage MUST NOT be written
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(store.targetUserId).toBeNull()
    expect(store.target).toBeNull()
    // Loading must be reset even on error
    expect(store.loading).toBe(false)
  })

  // ---- stop() -----------------------------------------------------------

  it('stop posts to admin/impersonate/stop', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} })

    const store = useImpersonationStore()
    // Set up an active impersonation to stop
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'target-id')
    store.targetUserId = 'target-id'
    store.target = { ...targetSummary }

    await store.stop()

    expect(mockedAxios.post).toHaveBeenCalledTimes(1)
    expect(mockedAxios.post.mock.calls[0][0]).toBe(STOP_URL)
  })

  it('stop clears state and sessionStorage on success', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} })

    const store = useImpersonationStore()
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'target-id')
    store.targetUserId = 'target-id'
    store.target = { ...targetSummary }
    store.impersonator = { ...adminSummary }

    await store.stop()

    expect(store.targetUserId).toBeNull()
    expect(store.target).toBeNull()
    expect(store.impersonator).toBeNull()
    expect(store.isImpersonating).toBe(false)
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('stop clears state and sessionStorage even if the request fails', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 500 },
      message: 'server error',
    })

    const store = useImpersonationStore()
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'target-id')
    store.targetUserId = 'target-id'
    store.target = { ...targetSummary }
    store.impersonator = { ...adminSummary }

    // Should not reject — stop() always clears local state to avoid stranding
    // the frontend if the backend has already expired the session.
    await store.stop()

    expect(store.targetUserId).toBeNull()
    expect(store.target).toBeNull()
    expect(store.impersonator).toBeNull()
    expect(store.isImpersonating).toBe(false)
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('stop with silent=true does NOT call axios', async () => {
    const store = useImpersonationStore()
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'target-id')
    store.targetUserId = 'target-id'
    store.target = { ...targetSummary }
    store.impersonator = { ...adminSummary }

    await store.stop(true)

    expect(mockedAxios.post).not.toHaveBeenCalled()
    // State is still cleared
    expect(store.targetUserId).toBeNull()
    expect(store.target).toBeNull()
    expect(store.impersonator).toBeNull()
    expect(store.isImpersonating).toBe(false)
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  // ---- applyAuthMeData() -----------------------------------------------

  it('applyAuthMeData populates impersonator from impersonated_by', () => {
    const store = useImpersonationStore()
    // Simulate that we already started impersonating
    store.targetUserId = 'target-id'

    store.applyAuthMeData({
      id: 'target-id',
      username: 'jane.doe',
      display_name: 'Jane Doe',
      email: 'jane@example.com',
      avatar: 'https://example.com/jane.png',
      impersonated_by: {
        id: 'admin-id',
        username: 'admin.user',
        display_name: 'Admin User',
        email: 'admin@example.com',
        avatar: 'https://example.com/admin.png',
      },
    })

    expect(store.impersonator).toEqual(adminSummary)
  })

  it('applyAuthMeData populates target from the rest of the response when impersonating', () => {
    const store = useImpersonationStore()
    store.targetUserId = 'target-id'

    store.applyAuthMeData({
      id: 'target-id',
      username: 'jane.doe',
      display_name: 'Jane Doe',
      email: 'jane@example.com',
      avatar: 'https://example.com/jane.png',
      impersonated_by: {
        id: 'admin-id',
        username: 'admin.user',
        display_name: 'Admin User',
        email: 'admin@example.com',
        avatar: 'https://example.com/admin.png',
      },
    })

    // target is built from the top-level fields of the /auth/me response
    expect(store.target).toEqual(targetSummary)
  })

  it('applyAuthMeData clears state when targetUserId set but response has no impersonated_by', () => {
    const store = useImpersonationStore()
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'target-id')
    store.targetUserId = 'target-id'
    store.target = { ...targetSummary }
    store.impersonator = { ...adminSummary }

    // /auth/me response without impersonated_by — server-side session expired
    store.applyAuthMeData({
      id: 'admin-id',
      username: 'admin.user',
      display_name: 'Admin User',
      email: 'admin@example.com',
    })

    expect(store.targetUserId).toBeNull()
    expect(store.target).toBeNull()
    expect(store.impersonator).toBeNull()
    expect(store.isImpersonating).toBe(false)
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })
})
