import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getEffectiveSessionState,
  isSessionActive,
  canConnectToTerminal,
  preConnectError,
  sessionHasNetwork
} from '../../src/utils/sessionState'

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
      // Bug fix: a persistent session auto-stopped after its 60s expiry
      // (state='stopped', expires_at in the past — referring to the previous
      // active run's deadline) must NOT be coerced to 'deleted'. The user
      // needs to see the "Session arrêtée — Resume / Delete" banner so they
      // can resume their preserved container + volume.
      name: "state='stopped' with past expires_at returns 'stopped' (canonical state wins)",
      input: { state: 'stopped', expires_at: PAST },
      expected: 'stopped'
    },
    {
      name: "state='deleted' returns 'deleted'",
      input: { state: 'deleted', expires_at: FUTURE },
      expected: 'deleted'
    },
    {
      name: "state='deleted' with past expires_at returns 'deleted'",
      input: { state: 'deleted', expires_at: PAST },
      expected: 'deleted'
    },
    {
      name: 'no state returns deleted (the legacy status fallback was removed in MR !239)',
      input: {},
      expected: 'deleted'
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

describe('canConnectToTerminal', () => {
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
    session: Parameters<typeof canConnectToTerminal>[0]
    isWebSocketOpen: boolean
    expected: boolean
  }> = [
    {
      name: 'WS closed → false regardless of running session',
      session: { state: 'running', expires_at: FUTURE },
      isWebSocketOpen: false,
      expected: false
    },
    {
      name: 'WS closed + null session → false',
      session: null,
      isWebSocketOpen: false,
      expected: false
    },
    {
      name: 'WS open + null session → trust WS (sessionInfo not yet loaded)',
      session: null,
      isWebSocketOpen: true,
      expected: true
    },
    {
      name: 'WS open + undefined session → trust WS (sessionInfo not yet loaded)',
      session: undefined,
      isWebSocketOpen: true,
      expected: true
    },
    {
      name: 'WS open + state=running + future expiry → true',
      session: { state: 'running', expires_at: FUTURE },
      isWebSocketOpen: true,
      expected: true
    },
    {
      name: 'WS open + state=stopped → false',
      session: { state: 'stopped', expires_at: FUTURE },
      isWebSocketOpen: true,
      expected: false
    },
    {
      name: 'WS open + state=deleted → false',
      session: { state: 'deleted', expires_at: FUTURE },
      isWebSocketOpen: true,
      expected: false
    },
    {
      name: 'WS open + past expiry → false (SSOT invariant)',
      session: { state: 'running', expires_at: PAST },
      isWebSocketOpen: true,
      expected: false
    },
    {
      // Post MR !239: the legacy parallel `status` field was removed from
      // the API. `state` is the only signal; a 'running' state with a
      // future expiry must be connectable.
      name: "WS open + state='running' + future expiry → true",
      session: { state: 'running', expires_at: FUTURE },
      isWebSocketOpen: true,
      expected: true
    },
    {
      name: 'WS open + empty session shape → false (no state means we cannot prove connectable)',
      session: {},
      isWebSocketOpen: true,
      expected: false
    }
  ]

  for (const c of cases) {
    it(c.name, () => {
      expect(canConnectToTerminal(c.session, c.isWebSocketOpen)).toBe(c.expected)
    })
  }
})

describe('preConnectError', () => {
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
    session: Parameters<typeof preConnectError>[0]
    expected: ReturnType<typeof preConnectError>
  }> = [
    {
      name: 'null session → null (no error; caller decides)',
      session: null,
      expected: null
    },
    {
      name: "state='running' + future expiry → null (connectable, no error)",
      session: { state: 'running', expires_at: FUTURE },
      expected: null
    },
    {
      name: "state='stopped' → 'sessionEnded'",
      session: { state: 'stopped', expires_at: FUTURE },
      expected: 'sessionEnded'
    },
    {
      name: "state='deleted' → 'sessionExpired'",
      session: { state: 'deleted', expires_at: FUTURE },
      expected: 'sessionExpired'
    },
    {
      name: "past expiry overrides state → 'sessionExpired' (SSOT invariant)",
      session: { state: 'running', expires_at: PAST },
      expected: 'sessionExpired'
    },
    {
      name: "no state → 'sessionExpired' (default to ended — the legacy status fallback was removed in MR !239)",
      session: {},
      expected: 'sessionExpired'
    }
  ]

  for (const c of cases) {
    it(c.name, () => {
      expect(preConnectError(c.session)).toBe(c.expected)
    })
  }
})

describe('sessionHasNetwork', () => {
  it('returns true when composed_features enables network', () => {
    expect(sessionHasNetwork({ composed_features: '{"network":true}' })).toBe(true)
  })

  it('returns true when network is enabled alongside other features', () => {
    expect(sessionHasNetwork({ composed_features: '{"docker":true,"network":true}' })).toBe(true)
  })

  it('returns false when network is explicitly disabled', () => {
    expect(sessionHasNetwork({ composed_features: '{"network":false}' })).toBe(false)
  })

  it('returns false for an empty feature set', () => {
    expect(sessionHasNetwork({ composed_features: '{}' })).toBe(false)
  })

  it('returns false when a different feature is enabled', () => {
    expect(sessionHasNetwork({ composed_features: '{"docker":true}' })).toBe(false)
  })

  it('returns false when composed_features is missing (legacy session)', () => {
    expect(sessionHasNetwork({})).toBe(false)
    expect(sessionHasNetwork({ composed_features: undefined })).toBe(false)
    expect(sessionHasNetwork({ composed_features: '' })).toBe(false)
  })

  it('returns false for malformed JSON', () => {
    expect(sessionHasNetwork({ composed_features: '{network:true' })).toBe(false)
    expect(sessionHasNetwork({ composed_features: 'not json' })).toBe(false)
  })

  it('returns false for null/undefined session', () => {
    expect(sessionHasNetwork(null)).toBe(false)
    expect(sessionHasNetwork(undefined)).toBe(false)
  })
})
