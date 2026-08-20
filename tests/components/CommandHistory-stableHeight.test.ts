/**
 * The command list must not grow the page as commands arrive.
 *
 * The history panel sits below the terminal in normal flow. With a max-height,
 * the list was as tall as its contents until it reached the cap, so every poll
 * that appended a command made the page taller — the screen shifting under the
 * user while they type, on a history refresh.
 *
 * A fixed height reserves the slot: new entries scroll inside the box and
 * nothing outside it moves.
 *
 * This is a source assertion because jsdom performs no layout — heights there
 * are always zero, so a mounted component cannot show the difference. The
 * geometry itself is exercised by the terminal E2E specs in a real browser.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const source = readFileSync(
  resolve(__dirname, '../../src/components/Terminal/CommandHistory.vue'),
  'utf-8',
)

/** The declarations inside a CSS rule, by selector, from the SFC's <style>. */
function ruleBody(selector: string): string {
  const match = source.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))
  return match?.[1] ?? ''
}

describe('CommandHistory — the list holds a stable height', () => {
  it('sizes the list with height, never max-height', () => {
    const body = ruleBody('.command-list')

    expect(body, 'expected a .command-list rule to exist').not.toBe('')
    expect(body, 'a fixed height keeps appended commands from growing the page').toMatch(
      /(^|[^-])height:\s*\d+px/,
    )
    expect(body, 'max-height lets the list grow with its contents').not.toMatch(/max-height/)
  })

  it('keeps the list scrollable, so reserving the height loses nothing', () => {
    expect(ruleBody('.command-list')).toMatch(/overflow-y:\s*auto/)
  })

  it('reserves a smaller but still fixed height on narrow screens', () => {
    const narrow = source.slice(source.indexOf('@media (max-width: 768px)'))
    const body = narrow.match(/\.command-list\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(body, 'expected the narrow-screen override to exist').not.toBe('')
    expect(body).toMatch(/(^|[^-])height:\s*\d+px/)
    expect(body, 'the override must not reintroduce content-driven growth').not.toMatch(/max-height/)
  })
})
