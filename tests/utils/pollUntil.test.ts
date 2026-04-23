import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { pollUntil } from '../../src/utils/pollUntil'

describe('pollUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('matches on the first attempt and resolves immediately with matched:true', async () => {
    const getter = vi.fn().mockResolvedValue({ id: 'sub-1', plan: 'pro' })
    const predicate = (v: any) => v.plan === 'pro'

    const resultPromise = pollUntil(getter, predicate, { intervalMs: 500, maxAttempts: 10 })
    // Flush microtasks — no timer should be needed on first match
    await vi.advanceTimersByTimeAsync(0)
    const result = await resultPromise

    expect(result.matched).toBe(true)
    expect(result.value).toEqual({ id: 'sub-1', plan: 'pro' })
    expect(getter).toHaveBeenCalledTimes(1)
  })

  it('matches after N attempts — calls getter N+1 times, returns matched:true with final value', async () => {
    // Match on the 4th call (index 3) — getter should be called exactly 4 times
    const values = [
      { plan: 'old' },
      { plan: 'old' },
      { plan: 'old' },
      { plan: 'new' }
    ]
    const getter = vi.fn().mockImplementation(async () => values.shift())
    const predicate = (v: any) => v?.plan === 'new'

    const resultPromise = pollUntil(getter, predicate, { intervalMs: 500, maxAttempts: 20 })
    // Advance by 3 intervals (500ms each) to cover the 3 waits between 4 attempts
    await vi.advanceTimersByTimeAsync(1500)
    const result = await resultPromise

    expect(result.matched).toBe(true)
    expect(result.value).toEqual({ plan: 'new' })
    expect(getter).toHaveBeenCalledTimes(4)
  })

  it('returns matched:false with the last read value when predicate never matches within maxAttempts', async () => {
    const getter = vi.fn().mockResolvedValue({ plan: 'old' })
    const predicate = (v: any) => v.plan === 'new'

    const resultPromise = pollUntil(getter, predicate, { intervalMs: 100, maxAttempts: 5 })
    // 5 attempts × ~100ms between them — advance generously
    await vi.advanceTimersByTimeAsync(1000)
    const result = await resultPromise

    expect(result.matched).toBe(false)
    expect(result.value).toEqual({ plan: 'old' })
    expect(getter).toHaveBeenCalledTimes(5)
  })

  it('respects intervalMs between attempts (no completion before the interval elapses)', async () => {
    // Getter always returns non-matching value so it loops maxAttempts times
    const getter = vi.fn().mockResolvedValue({ plan: 'old' })
    const predicate = (v: any) => v.plan === 'new'

    let resolved = false
    const resultPromise = pollUntil(getter, predicate, { intervalMs: 500, maxAttempts: 3 })
      .then((r) => {
        resolved = true
        return r
      })

    // After the first attempt (sync), nothing else should have run yet
    await vi.advanceTimersByTimeAsync(0)
    expect(getter).toHaveBeenCalledTimes(1)
    expect(resolved).toBe(false)

    // Advance just under interval — still should not have fired a 2nd call
    await vi.advanceTimersByTimeAsync(400)
    expect(getter).toHaveBeenCalledTimes(1)

    // Cross the 500ms threshold — second call fires
    await vi.advanceTimersByTimeAsync(200) // total elapsed ~600ms
    expect(getter).toHaveBeenCalledTimes(2)

    // Flush remaining intervals so the test can finish cleanly
    await vi.advanceTimersByTimeAsync(2000)
    const result = await resultPromise

    expect(result.matched).toBe(false)
    expect(getter).toHaveBeenCalledTimes(3)
  })

  it('propagates getter errors without swallowing them', async () => {
    let call = 0
    const boom = new Error('network failure')
    const getter = vi.fn().mockImplementation(async () => {
      call++
      if (call === 2) throw boom
      return { plan: 'old' }
    })
    const predicate = (v: any) => v?.plan === 'new'

    const resultPromise = pollUntil(getter, predicate, { intervalMs: 100, maxAttempts: 10 })
    // Let the attempt cycle run until the throw
    const rejection = expect(resultPromise).rejects.toBe(boom)
    await vi.advanceTimersByTimeAsync(500)
    await rejection

    expect(getter).toHaveBeenCalledTimes(2)
  })

  it('calls getter with no arguments and awaits the returned promise', async () => {
    const getter = vi.fn().mockImplementation(async (...args: any[]) => {
      expect(args.length).toBe(0)
      return { plan: 'pro' }
    })
    const predicate = (v: any) => v.plan === 'pro'

    const resultPromise = pollUntil(getter, predicate)
    await vi.advanceTimersByTimeAsync(0)
    const result = await resultPromise

    expect(result.matched).toBe(true)
    expect(getter).toHaveBeenCalledTimes(1)
    expect(getter).toHaveBeenCalledWith()
  })

  it('returns the LAST value read on timeout, not undefined', async () => {
    // Getter returns a different value on every call — last one should be preserved
    let counter = 0
    const getter = vi.fn().mockImplementation(async () => {
      counter++
      return { plan: 'old', attempt: counter }
    })
    const predicate = (v: any) => v.plan === 'new'

    const resultPromise = pollUntil(getter, predicate, { intervalMs: 100, maxAttempts: 4 })
    await vi.advanceTimersByTimeAsync(1000)
    const result = await resultPromise

    expect(result.matched).toBe(false)
    expect(result.value).toBeDefined()
    expect(result.value).toEqual({ plan: 'old', attempt: 4 })
  })
})
