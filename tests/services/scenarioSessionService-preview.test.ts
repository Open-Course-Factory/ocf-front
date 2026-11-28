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

// unkernel needs JSPI; Node only has it from version 24.
const wasm = WebAssembly as unknown as Record<string, unknown>
function setJspi(on: boolean) {
  for (const name of ['promising', 'Suspending']) {
    if (on) Object.defineProperty(wasm, name, { value: () => {}, configurable: true })
    else delete wasm[name]
  }
}

describe('scenarioSessionService.previewScenario', () => {
  // A browser that can run a machine says nothing about it.
  beforeEach(() => setJspi(true))

  // ocf-core then sends a By account scenario to a container (plan rule 7).
  it('says when this browser cannot run a machine of its own', async () => {
    setJspi(false)
    await scenarioSessionService.previewScenario('scn-1')
    expect(postedBody()).toEqual({ local_machine_unavailable: 'browser' })
  })

  it('sends the step to start from, alongside the organization it runs in', async () => {
    await scenarioSessionService.previewScenario('scn-1', { organization_id: 'org-1', from_step_order: 2 })

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockPost.mock.calls[0][0]).toBe('/scenarios/scn-1/preview')
    expect(postedBody()).toEqual({ organization_id: 'org-1', from_step_order: 2 })
  })
})
