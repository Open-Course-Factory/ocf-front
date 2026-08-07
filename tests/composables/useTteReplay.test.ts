/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createReplayer,
  prefersReducedMotion,
  effectsDisabledByUser,
  type ReplayTerminal
} from '../../src/composables/useTteReplay'
import type { ParsedCast } from '../../src/utils/asciicast'

const ENTER = '\x1b[?1049h\x1b[2J\x1b[H\x1b[?25l'
const EXIT = '\x1b[?25h\x1b[?1049l'

function makeTerminal(overrides: Partial<ReplayTerminal> = {}): ReplayTerminal & { writes: string[] } {
  const writes: string[] = []
  return {
    cols: 80,
    rows: 24,
    buffer: { active: { type: 'normal' } },
    write(data: string) {
      writes.push(data)
    },
    writes,
    ...overrides
  }
}

function makeCast(events: Array<[number, string]>, width = 80, height = 24): ParsedCast {
  return {
    width,
    height,
    duration: events.length ? events[events.length - 1][0] : 0,
    events: events.map(([t, data]) => ({ t, data }))
  }
}

describe('createReplayer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('plays a recording inside the alternate screen and resolves completed', async () => {
    const term = makeTerminal()
    const replayer = createReplayer(() => term)

    const promise = replayer.play(makeCast([[0, 'frame1'], [1, 'frame2']]))
    expect(replayer.isPlaying.value).toBe(true)
    expect(term.writes[0]).toBe(ENTER)

    await vi.advanceTimersByTimeAsync(1_100)
    await expect(promise).resolves.toBe('completed')
    expect(replayer.isPlaying.value).toBe(false)
    expect(term.writes).toEqual([ENTER, 'frame1', 'frame2', EXIT])
  })

  it('coalesces events closer than a frame window into one write', async () => {
    const term = makeTerminal()
    const replayer = createReplayer(() => term)

    const promise = replayer.play(makeCast([[0, 'a'], [0.001, 'b'], [0.5, 'c']]))
    await vi.advanceTimersByTimeAsync(600)
    await expect(promise).resolves.toBe('completed')
    expect(term.writes).toEqual([ENTER, 'ab', 'c', EXIT])
  })

  it('skip() restores the shell view immediately and resolves skipped', async () => {
    const term = makeTerminal()
    const onFinish = vi.fn()
    const replayer = createReplayer(() => term, { onFinish })

    const promise = replayer.play(makeCast([[0, 'frame1'], [2, 'frame2']]))
    await vi.advanceTimersByTimeAsync(10)
    replayer.skip()

    await expect(promise).resolves.toBe('skipped')
    expect(replayer.isPlaying.value).toBe(false)
    expect(term.writes[term.writes.length - 1]).toBe(EXIT)
    expect(term.writes).not.toContain('frame2')
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('skip() when idle is a no-op', () => {
    const term = makeTerminal()
    const onFinish = vi.fn()
    const replayer = createReplayer(() => term, { onFinish })
    replayer.skip()
    expect(term.writes).toEqual([])
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('a new play preempts the running one (outro → intro ordering)', async () => {
    const term = makeTerminal()
    const replayer = createReplayer(() => term)

    const first = replayer.play(makeCast([[0, 'outro'], [3, 'outro-end']]))
    await vi.advanceTimersByTimeAsync(10)
    const second = replayer.play(makeCast([[0, 'intro']]))

    await expect(first).resolves.toBe('skipped')
    await vi.advanceTimersByTimeAsync(100)
    await expect(second).resolves.toBe('completed')
    // The first replay exited its alt screen before the second entered
    expect(term.writes).toEqual([ENTER, 'outro', EXIT, ENTER, 'intro', EXIT])
  })

  it('compresses recordings longer than maxDurationMs', async () => {
    const term = makeTerminal()
    const replayer = createReplayer(() => term)

    // 8 s recording, 4 s budget → plays at 2x
    const promise = replayer.play(makeCast([[0, 'a'], [8, 'b']]), { maxDurationMs: 4_000 })
    await vi.advanceTimersByTimeAsync(4_100)
    await expect(promise).resolves.toBe('completed')
    expect(term.writes).toEqual([ENTER, 'a', 'b', EXIT])
  })

  it('is unsupported without a terminal', async () => {
    const replayer = createReplayer(() => null)
    await expect(replayer.play(makeCast([[0, 'x']]))).resolves.toBe('unsupported')
  })

  it('is unsupported when the live terminal is smaller than the recording canvas', async () => {
    const term = makeTerminal({ cols: 60 })
    const replayer = createReplayer(() => term)
    await expect(replayer.play(makeCast([[0, 'x']]))).resolves.toBe('unsupported')
    expect(term.writes).toEqual([])
  })

  it('is unsupported while the learner is inside a full-screen app (alt buffer)', async () => {
    const term = makeTerminal({ buffer: { active: { type: 'alternate' } } })
    const replayer = createReplayer(() => term)
    await expect(replayer.play(makeCast([[0, 'x']]))).resolves.toBe('unsupported')
    expect(term.writes).toEqual([])
  })

  it('is unsupported when the user prefers reduced motion', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    const term = makeTerminal()
    const replayer = createReplayer(() => term)
    await expect(replayer.play(makeCast([[0, 'x']]))).resolves.toBe('unsupported')
    expect(term.writes).toEqual([])
  })

  it('is unsupported when the user disabled effects in localStorage', async () => {
    localStorage.setItem('ocf-scenario-effects-disabled', '1')
    const term = makeTerminal()
    const replayer = createReplayer(() => term)
    await expect(replayer.play(makeCast([[0, 'x']]))).resolves.toBe('unsupported')
    expect(term.writes).toEqual([])
  })

  it('resolves skipped when the terminal is disposed mid-replay', async () => {
    let term: ReturnType<typeof makeTerminal> | null = makeTerminal()
    const replayer = createReplayer(() => term)

    const promise = replayer.play(makeCast([[0, 'a'], [2, 'b']]))
    await vi.advanceTimersByTimeAsync(10)
    term = null
    await vi.advanceTimersByTimeAsync(3_000)
    await expect(promise).resolves.toBe('skipped')
  })
})

describe('preference helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('prefersReducedMotion follows the media query', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    expect(prefersReducedMotion()).toBe(false)
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    expect(prefersReducedMotion()).toBe(true)
  })

  it('effectsDisabledByUser reads the opt-out key', () => {
    expect(effectsDisabledByUser()).toBe(false)
    localStorage.setItem('ocf-scenario-effects-disabled', '1')
    expect(effectsDisabledByUser()).toBe(true)
  })
})
