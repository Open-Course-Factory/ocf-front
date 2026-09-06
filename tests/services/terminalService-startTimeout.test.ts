/**
 * Starting a session takes as long as creating the container, and the first
 * session of a distribution on a backend pulls the image first: 38 s in
 * production, against the 30 s default timeout, so the browser reported a
 * "Startup Error" for a session that had started fine.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn(), eject: vi.fn() }, response: { use: vi.fn(), eject: vi.fn() } }
  }
}))

import axios from 'axios'
import { terminalService, START_SESSION_TIMEOUT_MS } from '../../src/services/domain/terminal/terminalService'

describe('terminalService.startComposedSession', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockResolvedValue({ data: { session_id: 's-1' } })
  })

  it('waits longer than the default timeout, long enough for an image pull', async () => {
    await terminalService.startComposedSession({ distribution: 'Debian', size: 'xl' } as any)

    const [, , config] = vi.mocked(axios.post).mock.calls[0]
    expect(config?.timeout).toBe(START_SESSION_TIMEOUT_MS)
    expect(START_SESSION_TIMEOUT_MS).toBeGreaterThanOrEqual(120_000)
  })
})
