/**
 * Tests for scenarioSessionService.previewScenario (#346).
 *
 * The client half of POST /scenarios/{id}/preview. An author can preview the
 * whole scenario, or "test from this step": the backend then builds a fresh
 * machine as a learner resuming at that step would get it, and starts the run
 * on it. The step travels as `from_step_order`, the step's Order — never an
 * index, since orders are 0- or 1-based depending on how the scenario was
 * authored.
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
  mockPost.mockResolvedValue({
    data: { scenario_session_id: 'run-1', terminal_session_id: 'term-1', status: 'active' }
  })
})

/** The body the service posted. */
function postedBody(): Record<string, unknown> {
  return mockPost.mock.calls[0][1]
}

describe('scenarioSessionService.previewScenario', () => {
  it('sends the step to start from, alongside the organization it runs in', async () => {
    await scenarioSessionService.previewScenario('scn-1', { organization_id: 'org-1', from_step_order: 2 })

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockPost.mock.calls[0][0]).toBe('/scenarios/scn-1/preview')
    expect(postedBody()).toEqual({ organization_id: 'org-1', from_step_order: 2 })
  })

  // Order 0 is the first step of a 0-based scenario: a legitimate value that is
  // also falsy. Dropping it would silently preview from the start instead.
  it('sends from_step_order 0 rather than dropping it', async () => {
    await scenarioSessionService.previewScenario('scn-1', { organization_id: 'org-1', from_step_order: 0 })

    expect(postedBody()).toHaveProperty('from_step_order', 0)
  })

  // The whole-scenario preview is unchanged: no step, so the backend starts
  // the run on the first one.
  it('sends no step for a whole-scenario preview', async () => {
    await scenarioSessionService.previewScenario('scn-1', { organization_id: 'org-1' })

    expect(postedBody()).toEqual({ organization_id: 'org-1' })
    expect(postedBody()).not.toHaveProperty('from_step_order')
  })

  // Building through several steps' setup scripts takes at least as long as a
  // launch, so the long provisioning timeout still applies.
  it('keeps the long provisioning timeout', async () => {
    await scenarioSessionService.previewScenario('scn-1', { from_step_order: 3 })

    expect(mockPost.mock.calls[0][2]).toMatchObject({ timeout: 180000 })
  })

  it('returns the terminal the editor navigates to', async () => {
    const result = await scenarioSessionService.previewScenario('scn-1', { from_step_order: 1 })

    expect(result.terminal_session_id).toBe('term-1')
  })

  // A refusal (unknown step, not allowed, a run already in progress) must reach
  // the editor so it can say why, rather than being swallowed here.
  it('propagates a refusal to the caller', async () => {
    const refusal = Object.assign(new Error('Request failed with status code 400'), {
      response: { status: 400, data: { error_message: 'Scenario has no step 9' } }
    })
    mockPost.mockRejectedValue(refusal)

    await expect(scenarioSessionService.previewScenario('scn-1', { from_step_order: 9 })).rejects.toBe(refusal)
  })
})
