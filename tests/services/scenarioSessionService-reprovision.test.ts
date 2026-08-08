/**
 * Tests for scenarioSessionService.reprovisionStep.
 *
 * This is the client half of POST /scenario-sessions/{id}/reprovision-step,
 * the only recovery path for a step whose setup failed. The advance is never
 * rolled back — the flag is burned and the progress row is committed — so
 * re-running the setup is the only thing that can put the session back into a
 * playable state. Reloading the step just re-fetches the description of a level
 * that was never built.
 *
 * The contract is pinned here because the method was called from the panel
 * before it existed on the service, which is a runtime TypeError rather than a
 * degraded retry, and `vite build` does not typecheck.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockPost = vi.fn()
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: (...a: any[]) => mockPost(...a),
    patch: vi.fn()
  }
}))

import { scenarioSessionService } from '../../src/services/domain/scenario/scenarioSessionService'

beforeEach(() => {
  mockPost.mockReset()
  mockPost.mockResolvedValue({ data: { step_order: 3, status: 'active' } })
})

describe('scenarioSessionService.reprovisionStep', () => {
  it('exists on the service', () => {
    // Guards the class of bug this fixes: the panel called a method the
    // service did not define, so the retry button threw instead of retrying.
    expect(typeof scenarioSessionService.reprovisionStep).toBe('function')
  })

  it('posts to the session it was given, without forcing by default', async () => {
    await scenarioSessionService.reprovisionStep('sess-1')

    expect(mockPost).toHaveBeenCalledWith(
      '/scenario-sessions/sess-1/reprovision-step',
      { force: false }
    )
  })

  // FORCE=1 tells a step script to redo work its idempotency markers would
  // otherwise skip, so it must only travel when it was actually asked for.
  it('forwards force when asked', async () => {
    await scenarioSessionService.reprovisionStep('sess-1', true)

    expect(mockPost).toHaveBeenCalledWith(
      '/scenario-sessions/sess-1/reprovision-step',
      { force: true }
    )
  })

  // The status decides what the caller does next: 'provisioning' means the
  // retry was left running and the client must poll, anything else means it
  // already finished inline.
  it('returns the backend status so the caller knows whether to poll', async () => {
    mockPost.mockResolvedValue({ data: { step_order: 2, status: 'provisioning' } })

    const result = await scenarioSessionService.reprovisionStep('sess-1')

    expect(result).toEqual({ step_order: 2, status: 'provisioning' })
  })

  // A rejected retry must reach the caller: the panel turns it back into the
  // failure state rather than leaving a spinner running forever.
  it('propagates a rejection rather than swallowing it', async () => {
    mockPost.mockRejectedValue(new Error('400'))

    await expect(scenarioSessionService.reprovisionStep('sess-1')).rejects.toThrow('400')
  })
})
