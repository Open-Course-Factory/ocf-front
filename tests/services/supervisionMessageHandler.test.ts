/**
 * RED tests for the shared supervision onmessage handler factory (review Important
 * #1 — the last copy-paste in the supervision kit).
 *
 * The frame decode+dispatch boilerplate — `isBinary = data instanceof ArrayBuffer`
 * → TextDecoder → routeSupervisionFrame → branch terminal / control — is currently
 * duplicated verbatim in two places:
 *   - SupervisionViewer.vue      (socket.onmessage, ~L278-295)
 *   - TerminalViewer.vue         (attachSupervisedSocket, ~L655-665)
 * A change to one that misses the other re-opens the safety-critical bug the router
 * exists to prevent (control JSON leaking into the shell, or a wrong indicator).
 *
 * This pins ONE pure factory both components will be refactored onto. It is tested
 * directly — no component mount, no xterm, no socket — because the only thing that
 * matters here is the decode+route+dispatch decision.
 *
 * Production surface these tests define (to be implemented by frontend-dev), added
 * to src/services/domain/terminal/supervisionProtocol.ts:
 *
 *   export function createSupervisionMessageHandler(opts: {
 *     getState: () => SupervisionState
 *     setState: (s: SupervisionState) => void
 *     onTerminal: (text: string) => void
 *     onObserversChange?: (n: number) => void
 *   }): (event: MessageEvent) => void
 *
 * Behavioural contract (mirrors the current SupervisionViewer handler):
 *   - TEXT frame        → onTerminal(text); state is NOT touched (setState uncalled).
 *   - BINARY control    → setState(routedState); onTerminal NOT called; and
 *                         onObserversChange(n) fires IFF the observer count changed
 *                         relative to getState() at receive time.
 *   - malformed BINARY  → nothing is called (dropped).
 *   - binary is detected by `event.data instanceof ArrayBuffer`; only `.data` is read.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  createSupervisionMessageHandler,
  initialSupervisionState,
  type SupervisionState,
} from '../../src/services/domain/terminal/supervisionProtocol'

// A binary control frame as it arrives on the wire: JSON, delivered as ArrayBuffer.
function binaryEvent(payload: Record<string, unknown>): { data: ArrayBuffer } {
  const json = JSON.stringify({ type: 'attachment', ...payload })
  return { data: new TextEncoder().encode(json).buffer }
}

// A binary frame whose bytes are not valid JSON (malformed control metadata).
function malformedBinaryEvent(): { data: ArrayBuffer } {
  return { data: new TextEncoder().encode('\x00\x01 not json').buffer }
}

// A text frame: raw PTY output, delivered as a plain string.
function textEvent(text: string): { data: string } {
  return { data: text }
}

// Honest state stub: getState reflects the latest setState, so a handler that reads
// state, routes, and writes back behaves like the live component ref.
function stateHarness(initial: SupervisionState = initialSupervisionState()) {
  let state = initial
  const setState = vi.fn((s: SupervisionState) => { state = s })
  const getState = () => state
  return { getState, setState, current: () => state }
}

describe('createSupervisionMessageHandler — TEXT frames go to the terminal', () => {
  it('calls onTerminal with the raw text and leaves the state untouched', () => {
    const { getState, setState } = stateHarness()
    const onTerminal = vi.fn()
    const onObserversChange = vi.fn()
    const handle = createSupervisionMessageHandler({ getState, setState, onTerminal, onObserversChange })

    handle(textEvent('user@host:~$ ls -la\r\n') as unknown as MessageEvent)

    expect(onTerminal).toHaveBeenCalledTimes(1)
    expect(onTerminal).toHaveBeenCalledWith('user@host:~$ ls -la\r\n')
    // A text frame must NEVER be parsed as control — no state write.
    expect(setState).not.toHaveBeenCalled()
    expect(onObserversChange).not.toHaveBeenCalled()
  })

  it('routes a TEXT frame that HAPPENS to contain control JSON to the terminal', () => {
    const { getState, setState } = stateHarness()
    const onTerminal = vi.fn()
    const handle = createSupervisionMessageHandler({ getState, setState, onTerminal })

    // A learner echoing control-shaped JSON into their shell must not flip the indicator.
    const looksLikeControl = JSON.stringify({ type: 'attachment', event: 'took_hand' })
    handle(textEvent(looksLikeControl) as unknown as MessageEvent)

    expect(onTerminal).toHaveBeenCalledWith(looksLikeControl)
    expect(setState).not.toHaveBeenCalled()
  })
})

describe('createSupervisionMessageHandler — BINARY control frames drive the indicator', () => {
  it('routes a control frame to setState with the routed state and never to the terminal', () => {
    const { getState, setState } = stateHarness()
    const onTerminal = vi.fn()
    const handle = createSupervisionMessageHandler({ getState, setState, onTerminal })

    handle(binaryEvent({ event: 'joined', observers: 2 }) as unknown as MessageEvent)

    expect(onTerminal).not.toHaveBeenCalled()
    expect(setState).toHaveBeenCalledTimes(1)
    const written = setState.mock.calls[0][0] as SupervisionState
    expect(written.watched).toBe(true)
    expect(written.observers).toBe(2)
    expect(written.controlled).toBe(false)
    expect(written.ended).toBe(false)
  })

  it('fires onObserversChange with the new count when the observer count changes', () => {
    const { getState, setState } = stateHarness(
      { watched: false, controlled: false, observers: 0, ended: false },
    )
    const onObserversChange = vi.fn()
    const handle = createSupervisionMessageHandler({
      getState, setState, onTerminal: vi.fn(), onObserversChange,
    })

    handle(binaryEvent({ event: 'joined', observers: 2 }) as unknown as MessageEvent)

    expect(onObserversChange).toHaveBeenCalledTimes(1)
    expect(onObserversChange).toHaveBeenCalledWith(2)
  })

  it('does NOT fire onObserversChange when the observer count is unchanged', () => {
    // took_hand flips `controlled` but leaves the observer count where it was.
    const { getState, setState } = stateHarness(
      { watched: true, controlled: false, observers: 1, ended: false },
    )
    const onObserversChange = vi.fn()
    const handle = createSupervisionMessageHandler({
      getState, setState, onTerminal: vi.fn(), onObserversChange,
    })

    handle(binaryEvent({ event: 'took_hand' }) as unknown as MessageEvent)

    // The state still updates (controlled → true) ...
    expect(setState).toHaveBeenCalledTimes(1)
    expect((setState.mock.calls[0][0] as SupervisionState).controlled).toBe(true)
    // ... but the observer badge must not be pinged when the count did not move.
    expect(onObserversChange).not.toHaveBeenCalled()
  })

  it('marks the session ended on a session_ended control frame', () => {
    const { getState, setState } = stateHarness(
      { watched: true, controlled: true, observers: 1, ended: false },
    )
    const handle = createSupervisionMessageHandler({
      getState, setState, onTerminal: vi.fn(),
    })

    handle(binaryEvent({ event: 'session_ended' }) as unknown as MessageEvent)

    expect(setState).toHaveBeenCalledTimes(1)
    expect((setState.mock.calls[0][0] as SupervisionState).ended).toBe(true)
  })

  it('works without an onObserversChange callback (it is optional)', () => {
    const { getState, setState } = stateHarness()
    const handle = createSupervisionMessageHandler({
      getState, setState, onTerminal: vi.fn(),
    })

    expect(() => handle(binaryEvent({ event: 'joined', observers: 3 }) as unknown as MessageEvent))
      .not.toThrow()
    expect(setState).toHaveBeenCalledTimes(1)
  })
})

describe('createSupervisionMessageHandler — malformed binary frames are dropped', () => {
  it('calls nothing when the binary frame is not valid JSON', () => {
    const { getState, setState } = stateHarness()
    const onTerminal = vi.fn()
    const onObserversChange = vi.fn()
    const handle = createSupervisionMessageHandler({ getState, setState, onTerminal, onObserversChange })

    expect(() => handle(malformedBinaryEvent() as unknown as MessageEvent)).not.toThrow()

    expect(onTerminal).not.toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
    expect(onObserversChange).not.toHaveBeenCalled()
  })

  it('ignores a binary frame whose JSON is not an attachment control message', () => {
    const { getState, setState } = stateHarness()
    const onTerminal = vi.fn()
    const handle = createSupervisionMessageHandler({ getState, setState, onTerminal })

    handle({ data: new TextEncoder().encode(JSON.stringify({ type: 'resize', cols: 80 })).buffer } as unknown as MessageEvent)

    expect(onTerminal).not.toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
  })
})
