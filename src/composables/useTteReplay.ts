/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Replays a pre-rendered terminal effect recording (asciicast v2, typically a
 * terminaltexteffects render) into an xterm.js instance, display-only.
 *
 * The whole replay happens inside the ALTERNATE screen buffer
 * (DECSET/DECRST 1049), like `less` or `vim`: the learner's primary buffer,
 * scrollback and cursor are untouched and restored exactly on exit, and the
 * PTY never sees a byte. The caller is responsible for holding back incoming
 * PTY output while `isPlaying` is true (see TerminalViewer.vue) so live shell
 * output cannot paint into — and then vanish with — the alternate buffer.
 */

import { ref, type Ref } from 'vue'
import type { ParsedCast } from '../utils/asciicast'

export type ReplayOutcome = 'completed' | 'skipped' | 'unsupported'

export interface ReplayOptions {
  /** Recordings longer than this play sped-up so they fit. Default 4000 ms. */
  maxDurationMs?: number
}

/** The slice of the xterm.js Terminal API the replayer needs. */
export interface ReplayTerminal {
  cols: number
  rows: number
  write(data: string): void
  buffer?: { active?: { type?: string } }
}

export interface Replayer {
  isPlaying: Ref<boolean>
  /**
   * Play a recording. A play issued while another is running skips the
   * running one first — this serialization is what guarantees outro → intro
   * ordering without any cross-component coordination.
   */
  play(cast: ParsedCast, opts?: ReplayOptions): Promise<ReplayOutcome>
  /** Abort the running replay (restores the shell view immediately). No-op when idle. */
  skip(): void
}

const ENTER_ALT_SCREEN = '\x1b[?1049h\x1b[2J\x1b[H\x1b[?25l'
const EXIT_ALT_SCREEN = '\x1b[?25h\x1b[?1049l'

const DEFAULT_MAX_DURATION_MS = 4_000
/** Events closer than this are written in one chunk (~one 60fps frame). */
const COALESCE_WINDOW_MS = 16

const EFFECTS_DISABLED_KEY = 'ocf-scenario-effects-disabled'

/** OS-level accessibility preference: never animate when reduce is requested. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Per-user opt-out, honored independently of the OS preference. */
export function effectsDisabledByUser(): boolean {
  try {
    return localStorage.getItem(EFFECTS_DISABLED_KEY) === '1'
  } catch {
    return false
  }
}

export function createReplayer(
  getTerminal: () => ReplayTerminal | null,
  hooks: {
    /**
     * Called synchronously right after the shell view is restored, on every
     * outcome — the caller flushes queued PTY output here, before any new
     * socket message can be written directly.
     */
    onFinish?: () => void
  } = {}
): Replayer {
  const isPlaying = ref(false)

  let timer: ReturnType<typeof setTimeout> | null = null
  let finish: ((outcome: 'completed' | 'skipped') => void) | null = null

  function endReplay(outcome: 'completed' | 'skipped') {
    if (!isPlaying.value) return
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    isPlaying.value = false
    getTerminal()?.write(EXIT_ALT_SCREEN)
    hooks.onFinish?.()
    const resolve = finish
    finish = null
    resolve?.(outcome)
  }

  function skip() {
    endReplay('skipped')
  }

  function play(cast: ParsedCast, opts: ReplayOptions = {}): Promise<ReplayOutcome> {
    // Serialize: preempt the running replay before starting the next one
    skip()

    const term = getTerminal()
    if (!term) return Promise.resolve('unsupported')
    if (prefersReducedMotion() || effectsDisabledByUser()) return Promise.resolve('unsupported')
    // The learner is inside a full-screen app (vim, less…) — its alternate
    // buffer is the one on screen, replaying over it would corrupt the view
    if (term.buffer?.active?.type === 'alternate') return Promise.resolve('unsupported')
    // Recordings are cursor-addressed at a fixed canvas: a smaller live
    // terminal would wrap lines into garbage, so silently don't play
    if (term.cols < cast.width || term.rows < cast.height) return Promise.resolve('unsupported')

    const maxDurationMs = opts.maxDurationMs ?? DEFAULT_MAX_DURATION_MS
    const speed = Math.max(1, (cast.duration * 1000) / maxDurationMs)

    // Pre-compute write chunks: coalesce events that land inside the same
    // frame window so long recordings don't schedule hundreds of timers
    const chunks: { atMs: number; data: string }[] = []
    for (const event of cast.events) {
      const atMs = (event.t * 1000) / speed
      const last = chunks[chunks.length - 1]
      if (last && atMs - last.atMs < COALESCE_WINDOW_MS) {
        last.data += event.data
      } else {
        chunks.push({ atMs, data: event.data })
      }
    }

    isPlaying.value = true
    term.write(ENTER_ALT_SCREEN)

    return new Promise<ReplayOutcome>((resolve) => {
      finish = resolve
      const startedAt = performance.now()
      let index = 0

      const scheduleNext = () => {
        if (index >= chunks.length) {
          endReplay('completed')
          return
        }
        const chunk = chunks[index++]
        const delay = Math.max(0, chunk.atMs - (performance.now() - startedAt))
        timer = setTimeout(() => {
          timer = null
          // The terminal can be disposed mid-replay (navigation, cleanup)
          const t = getTerminal()
          if (!t) {
            endReplay('skipped')
            return
          }
          t.write(chunk.data)
          scheduleNext()
        }, delay)
      }

      scheduleNext()
    })
  }

  return { isPlaying, play, skip }
}
