/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Minimal asciicast v2 parser for pre-rendered terminal effect recordings
 * (terminaltexteffects renders captured as .cast files — see
 * scripts/generate-tte-presets.py and useTteReplay.ts).
 *
 * Format: JSON lines. First line is the header object
 * {"version": 2, "width": N, "height": N, ...}; every following line is an
 * event array [time_seconds, type, data]. Only "o" (output) events matter
 * for replay.
 */

export interface CastEvent {
  /** Seconds since recording start. */
  t: number
  /** Raw terminal bytes (ANSI sequences included). */
  data: string
}

export interface ParsedCast {
  width: number
  height: number
  /** Timestamp of the last event, in seconds. */
  duration: number
  events: CastEvent[]
}

/**
 * Parse an asciicast v2 document. Returns null when the input is not a
 * usable recording (wrong version, no header, no output events) — an effect
 * asset must never break the caller, so malformed event lines are skipped
 * rather than fatal.
 */
export function parseCast(text: string): ParsedCast | null {
  const lines = text.split('\n')
  const headerIndex = lines.findIndex((line) => line.trim() !== '')
  if (headerIndex === -1) return null

  let header: any
  try {
    header = JSON.parse(lines[headerIndex])
  } catch {
    return null
  }
  if (
    header?.version !== 2 ||
    typeof header.width !== 'number' || header.width <= 0 ||
    typeof header.height !== 'number' || header.height <= 0
  ) {
    return null
  }

  const events: CastEvent[] = []
  let lastT = 0
  for (const line of lines.slice(headerIndex + 1)) {
    if (line.trim() === '') continue
    let event: any
    try {
      event = JSON.parse(line)
    } catch {
      continue
    }
    if (!Array.isArray(event) || typeof event[0] !== 'number' || typeof event[2] !== 'string') {
      continue
    }
    if (event[1] !== 'o') continue
    // Guard monotonicity so the replay scheduler never sees time going backwards
    lastT = Math.max(lastT, event[0])
    events.push({ t: lastT, data: event[2] })
  }

  if (events.length === 0) return null

  return {
    width: header.width,
    height: header.height,
    duration: events[events.length - 1].t,
    events
  }
}
