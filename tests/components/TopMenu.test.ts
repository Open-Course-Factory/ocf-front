import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Bug: isPersonalOrg function must not recurse.
 *
 * A replace_all accidentally turned the function body into a self-call:
 *   const isPersonalOrg = (org) => isPersonalOrg(org) || ...
 * This causes "too much recursion" and crashes the dropdown.
 *
 * The function must check org.organization_type directly, not call itself.
 */
describe('TopMenu — isPersonalOrg helper', () => {
  const filePath = resolve(__dirname, '../../src/components/Menus/TopMenu.vue')
  const source = readFileSync(filePath, 'utf-8')

  it('isPersonalOrg must not call itself (no recursion)', () => {
    // Extract the isPersonalOrg function definition line
    const match = source.match(/const isPersonalOrg\s*=\s*\([^)]*\)\s*=>\s*(.+)/)
    expect(match, 'isPersonalOrg function not found in TopMenu.vue').toBeTruthy()

    const functionBody = match![1]

    // The function body must NOT contain a call to isPersonalOrg (that would be recursion)
    expect(functionBody).not.toMatch(/isPersonalOrg\s*\(/)
  })

  it('isPersonalOrg must check organization_type field directly', () => {
    const match = source.match(/const isPersonalOrg\s*=\s*\([^)]*\)\s*=>\s*(.+)/)
    const functionBody = match![1]

    // Must reference organization_type directly
    expect(functionBody).toMatch(/organization_type\s*===\s*['"]personal['"]/)
  })

  it('isPersonalOrg must also check is_personal for legacy data', () => {
    const match = source.match(/const isPersonalOrg\s*=\s*\([^)]*\)\s*=>\s*(.+)/)
    const functionBody = match![1]

    // Must reference is_personal for backward compat
    expect(functionBody).toMatch(/is_personal/)
  })
})
