import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getEffectiveSessionState, isSessionActive } from '../../src/utils/sessionState'

describe('getEffectiveSessionState', () => {
  // Lock the clock so expires_at comparisons are deterministic
  const NOW = new Date('2026-05-10T12:00:00Z').getTime()
  const FUTURE = new Date(NOW + 60 * 60 * 1000).toISOString() // +1h
  const PAST = new Date(NOW - 60 * 60 * 1000).toISOString() // -1h

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const cases: Array<{
    name: string
    input: Parameters<typeof getEffectiveSessionState>[0]
    expected: ReturnType<typeof getEffectiveSessionState>
  }> = [
    {
      name: "state='running' with future expires_at returns 'running'",
      input: { state: 'running', expires_at: FUTURE },
      expected: 'running'
    },
    {
      name: "state='running' with past expires_at returns 'deleted' (invariant kicks in)",
      input: { state: 'running', expires_at: PAST },
      expected: 'deleted'
    },
    {
      name: "state='stopped' with future expires_at returns 'stopped'",
      input: { state: 'stopped', expires_at: FUTURE },
      expected: 'stopped'
    },
    {
      name: "state='deleted' returns 'deleted'",
      input: { state: 'deleted', expires_at: FUTURE },
      expected: 'deleted'
    },
    {
      name: "no state, status='active', future expires_at returns 'running' (legacy fallback)",
      input: { status: 'active', expires_at: FUTURE },
      expected: 'running'
    },
    {
      name: 'no state, no status returns deleted',
      input: {},
      expected: 'deleted'
    },
    {
      // Contract lock: protects against the regression in
      // OrganizationStudentSessionsTab.vue where the badge read session.status
      // directly. A live, running session can legitimately carry a stale
      // legacy status='expired' from server-side bookkeeping; the SSOT helper
      // MUST prefer state and return 'running'.
      name: "state='running' wins over legacy status='expired' (SSOT contract)",
      input: { state: 'running', status: 'expired', expires_at: FUTURE },
      expected: 'running'
    },
    {
      name: "state='stopped' wins over legacy status='active' (SSOT contract)",
      input: { state: 'stopped', status: 'active', expires_at: FUTURE },
      expected: 'stopped'
    }
  ]

  for (const c of cases) {
    it(c.name, () => {
      expect(getEffectiveSessionState(c.input)).toBe(c.expected)
    })
  }

  it('null / undefined session returns deleted', () => {
    expect(getEffectiveSessionState(null)).toBe('deleted')
    expect(getEffectiveSessionState(undefined)).toBe('deleted')
  })
})

describe('isSessionActive', () => {
  const NOW = new Date('2026-05-10T12:00:00Z').getTime()
  const FUTURE = new Date(NOW + 60 * 60 * 1000).toISOString()
  const PAST = new Date(NOW - 60 * 60 * 1000).toISOString()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true when effective state is running', () => {
    expect(isSessionActive({ state: 'running', expires_at: FUTURE })).toBe(true)
  })

  it('returns false when expires_at is past', () => {
    expect(isSessionActive({ state: 'running', expires_at: PAST })).toBe(false)
  })

  it('returns false when state is stopped', () => {
    expect(isSessionActive({ state: 'stopped', expires_at: FUTURE })).toBe(false)
  })
})
