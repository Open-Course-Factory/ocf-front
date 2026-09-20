/**
 * Parity check for the `help.terminals.gettingStarted.size` block.
 *
 * The block describes the budget-based capacity model on customer-facing
 * help pages. Adding a key to one locale but forgetting the other ships a
 * silent fallback, so this test pins the set of keys both locales must
 * provide, and that the copy speaks of capacity (what you can still launch)
 * rather than of a list of allowed sizes.
 */

import { describe, it, expect } from 'vitest'
import { helpEn } from '../../src/locales/help/en'
import { helpFr } from '../../src/locales/help/fr'

function sizeBlock(root: any): any {
  return root?.help?.terminals?.gettingStarted?.size
}

function flatKeys(obj: any, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix]
  return Object.entries(obj).flatMap(([k, v]) =>
    flatKeys(v, prefix ? `${prefix}.${k}` : k)
  )
}

describe('help.terminals.gettingStarted.size — bilingual parity', () => {
  it('exposes the same set of keys in en and fr', () => {
    const en = sizeBlock(helpEn)
    const fr = sizeBlock(helpFr)
    expect(en).toBeDefined()
    expect(fr).toBeDefined()
    expect(flatKeys(fr).sort()).toEqual(flatKeys(en).sort())
  })

  it('explains the budget, the locked sizes and the assigned-seat case in both locales', () => {
    for (const block of [sizeBlock(helpEn), sizeBlock(helpFr)]) {
      expect(block.budget).toBeTruthy()
      expect(block.locked).toBeTruthy()
      expect(block.seat).toBeTruthy()
      expect(block.useCases?.title).toBeTruthy()
    }
  })

  it('speaks of what can still be launched, not of a list of allowed sizes', () => {
    const en = sizeBlock(helpEn)
    const fr = sizeBlock(helpFr)
    expect(en.budget.toLowerCase()).toMatch(/still launch/)
    expect(fr.budget.toLowerCase()).toMatch(/encore lancer/)
  })
})
