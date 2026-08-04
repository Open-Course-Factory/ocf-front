/**
 * The Groups nav category must not offer the raw /group-members CRUD table
 * (issue #307).
 *
 * It is a bare entity grid of membership rows with no group context — the same
 * data the group's own Members tab presents properly — so it only widens the
 * teacher's menu without leading anywhere useful. The ROUTE stays: it is still
 * reachable directly and nothing else about it changes.
 *
 * Strategy follows the precedent set by MainNavMenu.test.ts and
 * MainNavMenu-scenarioEditor.test.ts: mounting MainNavMenu needs 15+ stubbed
 * stores, so the menu declaration is asserted at the source. What a user
 * actually clicks through is covered by the Playwright specs.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const menuSource = readFileSync(
  resolve(__dirname, '../../src/components/Menus/MainNavMenu.vue'),
  'utf-8',
)
const routerSource = readFileSync(
  resolve(__dirname, '../../src/router/index.ts'),
  'utf-8',
)

describe('MainNavMenu — Groups category', () => {
  it('declares no menu item for the raw /group-members table', () => {
    expect(menuSource).not.toMatch(/route:\s*['"]\/group-members['"]/)
  })

  it('still declares the two group entries that lead somewhere', () => {
    expect(menuSource).toMatch(/route:\s*['"]\/class-groups['"]/)
    expect(menuSource).toMatch(/route:\s*['"]\/class-groups-hierarchy['"]/)
  })

  it('leaves the /group-members route registered', () => {
    expect(routerSource).toMatch(/path:\s*['"]group-members['"]/)
  })
})
