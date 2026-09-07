/**
 * Source-inspection test in the style of MainNavMenu-myClasses.test.ts:
 * mounting the full navigation needs a dozen stubbed stores, so the rule is
 * pinned at the source.
 *
 * The groups entry used to be gated twice: by the backend's classroom verdict
 * (canRunClassrooms) AND by a plan feature ('multiple_groups') that drove a
 * second, independent disabled/lock computation. Two rules for one square of
 * UI only agreed by accident (#319). The verdict is the single rule now.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const menuSource = readFileSync(resolve(__dirname, '../../src/components/Menus/MainNavMenu.vue'), 'utf-8')
const groupsCategory = menuSource.match(/key: 'groups',[\s\S]*?items: \[/)?.[0] ?? ''

describe('MainNavMenu — the groups entry follows the classroom verdict alone', () => {
  it('declares no plan feature on the groups category', () => {
    expect(groupsCategory.length).toBeGreaterThan(0)
    expect(groupsCategory).not.toMatch(/planFeature/)
    expect(menuSource).not.toMatch(/multiple_groups/)
  })

  it('still locks the entry on the backend verdict', () => {
    expect(menuSource).toMatch(/category\.key === 'groups' && !canRunClassrooms\.value/)
  })

  it('has no second lock computation for groups', () => {
    expect(menuSource).not.toMatch(/category\.key === 'groups' && !shouldShowGroupsMenu\.value\) \{\s*disabled = true/)
  })
})
