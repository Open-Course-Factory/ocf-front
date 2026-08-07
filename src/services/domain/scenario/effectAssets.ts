/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Resolves scenario step effect references to parsed asciicast recordings.
 *
 * Two kinds of reference coexist (campaign decision, 2026-08):
 *  - a bare preset name ("intro-decrypt") → the canned library bundled under
 *    src/assets/tte/, lazy-imported so each recording is its own chunk;
 *  - anything else → an API asset path (e.g. /project-files/<id>/content,
 *    the axios interceptor adds /api/v1 and auth).
 *
 * Every failure resolves to null: an effect must never break a step.
 */

import axios from 'axios'
import { parseCast, type ParsedCast } from '../../../utils/asciicast'

/** Default presets used when the demo feature flag enables effects on steps
 *  that declare none (scenario_step_effects — standalone-demo path until the
 *  backend serves per-step effect URLs). */
export const DEFAULT_INTRO_PRESET = 'intro-decrypt'
export const DEFAULT_OUTRO_PRESET = 'outro-fireworks'

const presetLoaders: Record<string, () => Promise<string>> = {}
for (const [path, loader] of Object.entries(
  import.meta.glob('../../../assets/tte/*.cast', { query: '?raw', import: 'default' })
)) {
  const name = path.split('/').pop()!.replace(/\.cast$/, '')
  presetLoaders[name] = loader as () => Promise<string>
}

/** A reference is a preset name (vs an asset path) when it has no slash. */
export function isPresetEffect(ref: string): boolean {
  return !ref.includes('/')
}

export function presetNames(): string[] {
  return Object.keys(presetLoaders).sort()
}

const cache = new Map<string, Promise<ParsedCast | null>>()

async function load(ref: string): Promise<ParsedCast | null> {
  try {
    let text: string
    if (isPresetEffect(ref)) {
      const loader = presetLoaders[ref]
      if (!loader) {
        console.warn(`Unknown effect preset: ${ref}`)
        return null
      }
      text = await loader()
    } else {
      const response = await axios.get(ref, {
        responseType: 'text',
        // .cast is JSON-lines: axios's default transform would JSON.parse the
        // header line on some bodies — keep the raw text untouched
        transformResponse: [(data) => data]
      })
      text = response.data
    }
    const cast = parseCast(text)
    if (!cast) console.warn(`Invalid asciicast recording: ${ref}`)
    return cast
  } catch (err) {
    console.warn(`Failed to load effect ${ref}:`, err)
    return null
  }
}

/** Fetch + parse an effect reference, memoized. Failed loads are not cached
 *  so a transient network error can recover on the next step. */
export function getCast(ref: string): Promise<ParsedCast | null> {
  const cached = cache.get(ref)
  if (cached) return cached
  const promise = load(ref).then((cast) => {
    if (!cast) cache.delete(ref)
    return cast
  })
  cache.set(ref, promise)
  return promise
}
