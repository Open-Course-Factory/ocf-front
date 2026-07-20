/**
 * RED tests for the terminal supervision service surface (issue #288, MR !275).
 *
 * Covers three things a bug would make user-visible:
 *   1. getGroupLiveSessions(groupId) — the list a teacher sees. Must hit the
 *      ocf-core route WITHOUT a hardcoded /api/v1/ prefix (axios interceptor
 *      adds it — a double prefix is a silent 404).
 *   2. buildSuperviseWsUrl(sessionId, token) — the WebSocket URL the supervisor
 *      connects to. Role/control are enforced server-side by ocf-core, so the
 *      client URL just targets /terminals/:id/supervise. ws/wss scheme handling
 *      MUST match the existing console URL builder in TerminalViewer.
 *   3. sendTakeHand / sendReleaseHand — the in-band control envelope. It is sent
 *      as a TEXT frame (a plain JSON string) on the SUPERVISE socket — NOT to
 *      tt-backend, and NOT as a binary frame (unlike the resize message, which
 *      TerminalViewer sends as TextEncoder-encoded binary). Sending it binary or
 *      to the wrong socket = supervisor's keyboard silently does nothing.
 *
 * Production surface these tests define (to be implemented by frontend-dev):
 *   src/services/domain/terminal/supervisionService.ts
 *     export interface LiveSession { session_id: string; user_id: string; user_name?: string; status?: string }
 *     export const supervisionService = {
 *       getGroupLiveSessions(groupId: string): Promise<LiveSession[]>
 *     }
 *     export function buildSuperviseWsUrl(sessionId: string, token?: string): string
 *
 *   src/services/domain/terminal/supervisionProtocol.ts
 *     export const SUPERVISION_MESSAGES = { takeHand: string; releaseHand: string }
 *     export function sendTakeHand(socket: Pick<WebSocket,'send'|'readyState'>): void
 *     export function sendReleaseHand(socket: Pick<WebSocket,'send'|'readyState'>): void
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

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
import { supervisionService, buildSuperviseWsUrl } from '../../src/services/domain/terminal/supervisionService'
import {
  SUPERVISION_MESSAGES,
  sendTakeHand,
  sendReleaseHand,
} from '../../src/services/domain/terminal/supervisionProtocol'

const mockedAxios = vi.mocked(axios)

describe('supervisionService.getGroupLiveSessions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GETs the class-group live sessions route WITHOUT an /api/v1/ prefix', async () => {
    const sessions = [
      { session_id: 's1', user_id: 'u1', user_name: 'Alice', status: 'active' },
      { session_id: 's2', user_id: 'u2', user_name: 'Bob', status: 'active' },
    ]
    mockedAxios.get.mockResolvedValueOnce({ data: sessions })

    const result = await supervisionService.getGroupLiveSessions('group-1')

    expect(mockedAxios.get).toHaveBeenCalledWith('/class-groups/group-1/terminal-sessions')
    const calledUrl = mockedAxios.get.mock.calls[0][0]
    expect(calledUrl).not.toContain('/api/v1/')
    expect(result).toEqual(sessions)
  })

  it('returns the raw session list from the response body', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [{ session_id: 'x', user_id: 'u' }] })
    const result = await supervisionService.getGroupLiveSessions('g')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect(result[0].session_id).toBe('x')
  })
})

describe('buildSuperviseWsUrl', () => {
  const originalApiUrl = import.meta.env.VITE_API_URL
  const originalProtocol = import.meta.env.VITE_PROTOCOL

  beforeEach(() => {
    import.meta.env.VITE_API_URL = 'api.example.com'
  })
  afterEach(() => {
    import.meta.env.VITE_API_URL = originalApiUrl
    import.meta.env.VITE_PROTOCOL = originalProtocol
  })

  it('targets the ocf-core supervise endpoint for the given session id', () => {
    import.meta.env.VITE_PROTOCOL = 'https'
    const url = buildSuperviseWsUrl('sess-42', 'tok')
    expect(url).toContain('/terminals/sess-42/supervise')
    // WS does not pass through the axios interceptor, so the /api/v1/ prefix is
    // explicit here (mirrors the console URL builder in TerminalViewer).
    expect(url).toContain('/api/v1/terminals/sess-42/supervise')
  })

  it('uses wss when VITE_PROTOCOL is https', () => {
    import.meta.env.VITE_PROTOCOL = 'https'
    const url = buildSuperviseWsUrl('sess-42', 'tok')
    expect(url.startsWith('wss://api.example.com')).toBe(true)
  })

  it('uses ws when VITE_PROTOCOL is not https', () => {
    import.meta.env.VITE_PROTOCOL = 'http'
    const url = buildSuperviseWsUrl('sess-42', 'tok')
    expect(url.startsWith('ws://api.example.com')).toBe(true)
  })

  it('appends the auth token as an encoded query param', () => {
    import.meta.env.VITE_PROTOCOL = 'https'
    const url = buildSuperviseWsUrl('sess-42', 'a b/c')
    expect(url).toContain(`token=${encodeURIComponent('a b/c')}`)
  })

  it('omits the token param when no token is provided', () => {
    import.meta.env.VITE_PROTOCOL = 'https'
    const url = buildSuperviseWsUrl('sess-42')
    expect(url).not.toContain('token=')
  })
})

describe('supervisionProtocol — take/release hand messages', () => {
  const OPEN = WebSocket.OPEN

  it('pins the exact control envelope shapes', () => {
    expect(JSON.parse(SUPERVISION_MESSAGES.takeHand)).toEqual({ type: 'take_hand' })
    expect(JSON.parse(SUPERVISION_MESSAGES.releaseHand)).toEqual({ type: 'release_hand' })
  })

  it('sendTakeHand sends {"type":"take_hand"} as a TEXT frame (plain string, not binary)', () => {
    const socket = { send: vi.fn(), readyState: OPEN }
    sendTakeHand(socket)
    expect(socket.send).toHaveBeenCalledTimes(1)
    const arg = socket.send.mock.calls[0][0]
    // TEXT frame: a string, NOT a Uint8Array/ArrayBuffer (which would be binary,
    // like the resize message TerminalViewer encodes with TextEncoder).
    expect(typeof arg).toBe('string')
    expect(arg).not.toBeInstanceOf(Uint8Array)
    expect(JSON.parse(arg)).toEqual({ type: 'take_hand' })
  })

  it('sendReleaseHand sends {"type":"release_hand"} as a TEXT frame', () => {
    const socket = { send: vi.fn(), readyState: OPEN }
    sendReleaseHand(socket)
    const arg = socket.send.mock.calls[0][0]
    expect(typeof arg).toBe('string')
    expect(JSON.parse(arg)).toEqual({ type: 'release_hand' })
  })

  it('does not send when the socket is not OPEN', () => {
    const socket = { send: vi.fn(), readyState: WebSocket.CLOSING }
    sendTakeHand(socket)
    sendReleaseHand(socket)
    expect(socket.send).not.toHaveBeenCalled()
  })
})
