/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { describe, it, expect } from 'vitest'
import { parseCast } from '../../src/utils/asciicast'

const header = JSON.stringify({ version: 2, width: 80, height: 24 })

function cast(...lines: string[]): string {
  return [header, ...lines].join('\n')
}

describe('parseCast', () => {
  it('parses header dimensions, events and duration', () => {
    const parsed = parseCast(cast(
      JSON.stringify([0.0, 'o', '[2J']),
      JSON.stringify([1.5, 'o', 'hello'])
    ))
    expect(parsed).not.toBeNull()
    expect(parsed!.width).toBe(80)
    expect(parsed!.height).toBe(24)
    expect(parsed!.duration).toBe(1.5)
    expect(parsed!.events).toEqual([
      { t: 0, data: '[2J' },
      { t: 1.5, data: 'hello' }
    ])
  })

  it('tolerates blank lines and skips malformed event lines', () => {
    const parsed = parseCast(cast(
      '',
      'not json at all',
      JSON.stringify({ t: 1 }),
      JSON.stringify([0.5, 'o', 'ok']),
      ''
    ))
    expect(parsed!.events).toEqual([{ t: 0.5, data: 'ok' }])
  })

  it('keeps only output events', () => {
    const parsed = parseCast(cast(
      JSON.stringify([0.1, 'i', 'typed']),
      JSON.stringify([0.2, 'o', 'shown']),
      JSON.stringify([0.3, 'r', '80x24'])
    ))
    expect(parsed!.events).toEqual([{ t: 0.2, data: 'shown' }])
  })

  it('clamps out-of-order timestamps so time never goes backwards', () => {
    const parsed = parseCast(cast(
      JSON.stringify([1.0, 'o', 'a']),
      JSON.stringify([0.2, 'o', 'b'])
    ))
    expect(parsed!.events.map((e) => e.t)).toEqual([1.0, 1.0])
    expect(parsed!.duration).toBe(1.0)
  })

  it.each([
    ['empty input', ''],
    ['whitespace only', '  \n \n'],
    ['header is not JSON', 'garbage\n[0,"o","x"]'],
    ['wrong version', JSON.stringify({ version: 1, width: 80, height: 24 }) + '\n[0,"o","x"]'],
    ['missing width', JSON.stringify({ version: 2, height: 24 }) + '\n[0,"o","x"]'],
    ['zero height', JSON.stringify({ version: 2, width: 80, height: 0 }) + '\n[0,"o","x"]'],
    ['no output events', cast(JSON.stringify([0.1, 'i', 'typed']))]
  ])('returns null for %s', (_label, input) => {
    expect(parseCast(input)).toBeNull()
  })
})
