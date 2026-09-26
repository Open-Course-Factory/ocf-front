/**
 * The client half of resuming a scenario run by rebuilding its environment.
 *
 * POST /scenario-sessions/:id/resume gets the learner back into an open run
 * whatever became of its terminal: a live one is returned as is, a paused one
 * is started in place, and a run whose container is gone is rebuilt on a new
 * terminal at its current step. A rebuild answers `status: 'provisioning'`,
 * phase `replay`, and `provisioning_timeout_seconds` — how long the replay may
 * take, which can exceed the launch poller's fixed 6 minutes. The poller must
 * wait that long, and no longer: a bounded wait, never an endless one.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
vi.mock('axios', () => ({
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    patch: vi.fn()
  }
}))

import { scenarioSessionService, pollProvisioningStatus } from '../../src/services/domain/scenario/scenarioSessionService'

beforeEach(() => {
  mockGet.mockReset()
  mockPost.mockReset()
})

describe('scenarioSessionService.resumeSession', () => {
  const REBUILDING = {
    terminal_session_id: 'term-new',
    scenario_session_id: 'sess-1',
    status: 'provisioning',
    provisioning_phase: 'replay',
    provisioning_timeout_seconds: 900
  }

  it('posts to the run it was given, with the launch timeout', async () => {
    mockPost.mockResolvedValue({ data: REBUILDING })

    await scenarioSessionService.resumeSession('sess-1')

    expect(mockPost).toHaveBeenCalledTimes(1)
    const [url, , config] = mockPost.mock.calls[0]
    expect(url).toBe('/scenario-sessions/sess-1/resume')
    // A rebuild creates a terminal before answering, as a launch does.
    expect(config?.timeout).toBe(180000)
  })

  it('returns the new terminal and the replay budget', async () => {
    mockPost.mockResolvedValue({ data: REBUILDING })

    const result = await scenarioSessionService.resumeSession('sess-1')

    expect(result).toEqual(REBUILDING)
  })

  it('propagates a refusal so the caller can explain it', async () => {
    const refusal = { response: { status: 409, data: { reason: 'run_over' } } }
    mockPost.mockRejectedValue(refusal)

    await expect(scenarioSessionService.resumeSession('sess-1')).rejects.toBe(refusal)
  })
})

describe('pollProvisioningStatus — deadline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // The backend answers `provisioning` for the first `reads` polls, then
  // `active`.
  function readyAfter(reads: number) {
    let n = 0
    mockGet.mockImplementation(async () => {
      n++
      return { data: { id: 'sess-1', status: n <= reads ? 'provisioning' : 'active' } }
    })
  }

  function infoReads() {
    return mockGet.mock.calls.filter(([url]) => url === '/scenario-sessions/sess-1/info').length
  }

  it('waits past the old fixed 6 minutes when the deadline allows it', async () => {
    // A 15-minute replay budget; the build finishes after ~10 minutes of
    // 3-second polls — beyond the 120 attempts the poller used to allow.
    readyAfter(200)

    const done = pollProvisioningStatus('sess-1', undefined, undefined, { deadlineSeconds: 900 })
    const settled = vi.fn()
    done.then(() => settled('ok'), (err) => settled(err.message))

    await vi.advanceTimersByTimeAsync(201 * 3000 + 1000)

    expect(settled).toHaveBeenCalledWith('ok')
  })

  it('gives up at the deadline, not later', async () => {
    readyAfter(Number.MAX_SAFE_INTEGER)

    const done = pollProvisioningStatus('sess-1', undefined, undefined, { deadlineSeconds: 30 })
    const settled = vi.fn()
    done.then(() => settled('ok'), (err) => settled(err.message))

    await vi.advanceTimersByTimeAsync(31 * 1000)

    expect(settled).toHaveBeenCalledWith('SETUP_TIMEOUT')
    // Polled every 3 s for 30 s — a bounded wait, not the default 120 reads.
    expect(infoReads()).toBeLessThanOrEqual(11)
  })

  it('keeps today\'s 6-minute bound when no deadline is given', async () => {
    readyAfter(Number.MAX_SAFE_INTEGER)

    const done = pollProvisioningStatus('sess-1')
    const settled = vi.fn()
    done.then(() => settled('ok'), (err) => settled(err.message))

    await vi.advanceTimersByTimeAsync(6 * 60 * 1000 - 1000)
    expect(settled).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(2000)
    expect(settled).toHaveBeenCalledWith('SETUP_TIMEOUT')
    expect(infoReads()).toBe(120)
  })
})
