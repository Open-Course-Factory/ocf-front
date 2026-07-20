/**
 * RED tests for the supervision control-frame router (issue #288, MR !275).
 *
 * This is the SAFETY-CRITICAL logic of the terminal supervision feature. When a
 * supervisor watches a learner's terminal, the WebSocket carries two kinds of
 * frames that MUST NEVER be confused:
 *
 *   - TEXT frames        → raw PTY output, must be written verbatim to xterm.
 *   - BINARY frames      → JSON control metadata (`{"type":"attachment",...}`)
 *                          that drives the learner indicator (observer count,
 *                          watched/controlled/ended state) and must NEVER be
 *                          written to the terminal.
 *
 * Confusing the two is user-visible (control JSON leaking into the shell, or a
 * supervisor's indicator silently wrong) and safety-relevant (a learner not
 * knowing they are being watched / controlled). These tests pin the pure
 * routing decision so TerminalViewer / SupervisionViewer can wire it to the
 * socket's onmessage without re-deriving the rules.
 *
 * Production surface these tests define (to be implemented by frontend-dev):
 *   src/services/domain/terminal/supervisionProtocol.ts
 *     export interface SupervisionState {
 *       watched: boolean; controlled: boolean; observers: number; ended: boolean
 *     }
 *     export function initialSupervisionState(): SupervisionState
 *     export type SupervisionFrameRoute =
 *       | { route: 'terminal' }
 *       | { route: 'ignore' }
 *       | { route: 'control'; state: SupervisionState }
 *     export function routeSupervisionFrame(
 *       data: string, isBinary: boolean, current: SupervisionState
 *     ): SupervisionFrameRoute
 */

import { describe, it, expect } from 'vitest'
import {
  initialSupervisionState,
  routeSupervisionFrame,
  type SupervisionState,
} from '../../src/services/domain/terminal/supervisionProtocol'

// A binary control frame as it arrives on the wire: JSON text, isBinary=true.
function controlFrame(payload: Record<string, unknown>): string {
  return JSON.stringify({ type: 'attachment', ...payload })
}

describe('supervisionProtocol — initialSupervisionState', () => {
  it('starts with no observers, not watched, not controlled, not ended', () => {
    expect(initialSupervisionState()).toEqual({
      watched: false,
      controlled: false,
      observers: 0,
      ended: false,
    })
  })
})

describe('supervisionProtocol — TEXT frames are terminal output', () => {
  it('routes a plain text frame to the terminal (never parsed as control)', () => {
    const res = routeSupervisionFrame('user@host:~$ ls -la\r\n', false, initialSupervisionState())
    expect(res.route).toBe('terminal')
  })

  it('routes a TEXT frame that HAPPENS to contain control JSON to the terminal', () => {
    // A learner echoing control-shaped JSON must NOT flip the indicator.
    const looksLikeControl = controlFrame({ event: 'took_hand' })
    const res = routeSupervisionFrame(looksLikeControl, false, initialSupervisionState())
    expect(res.route).toBe('terminal')
  })
})

describe('supervisionProtocol — BINARY control frames drive the indicator', () => {
  it('"joined" marks the session watched and records the observer count', () => {
    const res = routeSupervisionFrame(
      controlFrame({ event: 'joined', observers: 2 }),
      true,
      initialSupervisionState(),
    )
    expect(res.route).toBe('control')
    if (res.route !== 'control') return
    expect(res.state.watched).toBe(true)
    expect(res.state.observers).toBe(2)
    expect(res.state.controlled).toBe(false)
    expect(res.state.ended).toBe(false)
  })

  it('"took_hand" marks the session controlled (still watched)', () => {
    const watched: SupervisionState = { watched: true, controlled: false, observers: 1, ended: false }
    const res = routeSupervisionFrame(controlFrame({ event: 'took_hand' }), true, watched)
    expect(res.route).toBe('control')
    if (res.route !== 'control') return
    expect(res.state.controlled).toBe(true)
    expect(res.state.watched).toBe(true)
  })

  it('"released" clears controlled but stays watched', () => {
    const controlled: SupervisionState = { watched: true, controlled: true, observers: 1, ended: false }
    const res = routeSupervisionFrame(controlFrame({ event: 'released' }), true, controlled)
    expect(res.route).toBe('control')
    if (res.route !== 'control') return
    expect(res.state.controlled).toBe(false)
    expect(res.state.watched).toBe(true)
  })

  it('"left" decrements the observer count', () => {
    const twoWatchers: SupervisionState = { watched: true, controlled: false, observers: 2, ended: false }
    const res = routeSupervisionFrame(controlFrame({ event: 'left' }), true, twoWatchers)
    expect(res.route).toBe('control')
    if (res.route !== 'control') return
    expect(res.state.observers).toBe(1)
    expect(res.state.watched).toBe(true)
  })

  it('"left" of the last observer clears the watched indicator', () => {
    const oneWatcher: SupervisionState = { watched: true, controlled: false, observers: 1, ended: false }
    const res = routeSupervisionFrame(controlFrame({ event: 'left' }), true, oneWatcher)
    expect(res.route).toBe('control')
    if (res.route !== 'control') return
    expect(res.state.observers).toBe(0)
    expect(res.state.watched).toBe(false)
  })

  it('"session_ended" marks the session ended', () => {
    const watched: SupervisionState = { watched: true, controlled: true, observers: 1, ended: false }
    const res = routeSupervisionFrame(controlFrame({ event: 'session_ended' }), true, watched)
    expect(res.route).toBe('control')
    if (res.route !== 'control') return
    expect(res.state.ended).toBe(true)
  })

  it('a control frame is NEVER routed to the terminal', () => {
    const res = routeSupervisionFrame(
      controlFrame({ event: 'joined', observers: 1 }),
      true,
      initialSupervisionState(),
    )
    expect(res.route).not.toBe('terminal')
  })
})

describe('supervisionProtocol — malformed / unknown binary frames are ignored safely', () => {
  it('ignores a binary frame that is not valid JSON (no throw, not written)', () => {
    expect(() => routeSupervisionFrame('\x00\x01not-json', true, initialSupervisionState()))
      .not.toThrow()
    const res = routeSupervisionFrame('\x00\x01not-json', true, initialSupervisionState())
    expect(res.route).toBe('ignore')
  })

  it('ignores a binary frame whose JSON is not an attachment control message', () => {
    const res = routeSupervisionFrame(JSON.stringify({ type: 'resize', cols: 80 }), true, initialSupervisionState())
    expect(res.route).toBe('ignore')
  })

  it('ignores an attachment frame with an unknown event (forward-compatible)', () => {
    const res = routeSupervisionFrame(controlFrame({ event: 'quantum_entangled' }), true, initialSupervisionState())
    expect(res.route).toBe('ignore')
  })
})
