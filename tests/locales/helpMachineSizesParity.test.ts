/**
 * Parity check for the rewritten `help.terminals.machineSizes` block.
 *
 * The block describes the budget-based capacity model on customer-facing
 * help pages. Adding a key to one locale but forgetting the other ships a
 * silent fallback, so this test pins the set of keys both locales must
 * provide.
 */

import { describe, it, expect } from 'vitest'
import { helpEn } from '../../src/locales/help/en'
import { helpFr } from '../../src/locales/help/fr'

function machineSizesBlock(root: any): any {
  // Help is structured as help.terminals.gettingStarted.machineSizes.
  return root?.help?.terminals?.gettingStarted?.machineSizes
}

function flatKeys(obj: any, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix]
  return Object.entries(obj).flatMap(([k, v]) =>
    flatKeys(v, prefix ? `${prefix}.${k}` : k)
  )
}

describe('help.terminals.machineSizes — bilingual parity', () => {
  it('exposes the same set of keys in en and fr', () => {
    const en = machineSizesBlock(helpEn)
    const fr = machineSizesBlock(helpFr)
    expect(en).toBeDefined()
    expect(fr).toBeDefined()
    const enKeys = flatKeys(en).sort()
    const frKeys = flatKeys(fr).sort()
    expect(frKeys).toEqual(enKeys)
  })

  it('includes the new budget-model sub-blocks in both locales', () => {
    const en = machineSizesBlock(helpEn)
    const fr = machineSizesBlock(helpFr)
    // The rewrite must introduce a "how capacity is consumed" explanation
    // and a "mix and match" example in both locales.
    expect(en.budgetExplain?.title).toBeTruthy()
    expect(en.budgetExplain?.description).toBeTruthy()
    expect(en.combinationExample?.title).toBeTruthy()
    expect(en.combinationExample?.description).toBeTruthy()
    expect(fr.budgetExplain?.title).toBeTruthy()
    expect(fr.budgetExplain?.description).toBeTruthy()
    expect(fr.combinationExample?.title).toBeTruthy()
    expect(fr.combinationExample?.description).toBeTruthy()
  })

  it('drops the legacy "your plan allows sizes" wording in favor of capacity language', () => {
    // The legacy intro told users which sizes were "available". The new
    // intro must talk about capacity — pin this so a future copy edit does
    // not silently revert to the old mental model.
    const en = machineSizesBlock(helpEn)
    const fr = machineSizesBlock(helpFr)
    expect(en.description.toLowerCase()).toMatch(/capacity/)
    expect(fr.description.toLowerCase()).toMatch(/capacit/)
  })
})
