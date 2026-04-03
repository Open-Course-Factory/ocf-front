import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Bug M5: FR tooltip says "Non disponible dans l'organisation actuelle"
 * but gives no hint about what action to take.
 *
 * A good tooltip should tell users HOW to access the feature, e.g.:
 * "Disponible dans {orgName} — changez d'organisation pour y accéder"
 *
 * This test verifies the French translations include an actionable hint
 * so users know they need to switch organizations.
 */
describe('MainNavMenu.vue — Bug M5: FR tooltip should include action hint', () => {
  const filePath = resolve(__dirname, '../../src/components/Menus/MainNavMenu.vue')
  const fileContent = readFileSync(filePath, 'utf-8')

  it('FR tooltip for "feature not in current org" should include an action verb', () => {
    // Extract the French translation for featureNotInCurrentOrg
    const frNotInOrgMatch = fileContent.match(
      /featureNotInCurrentOrg:\s*['"]([^'"]+)['"]/
    )
    expect(frNotInOrgMatch).not.toBeNull()
    const frNotInOrg = frNotInOrgMatch![1]

    // BUG: Current text is "Non disponible dans l'organisation actuelle"
    // It should include a call-to-action like "changez d'organisation",
    // "sélectionnez", "basculez", or similar verb directing the user.
    const actionVerbs = [
      'changez', 'changer', 'sélectionnez', 'sélectionner',
      'basculez', 'basculer', 'passez', 'passer', 'accéder',
      'accédez', 'switchez', 'switcher'
    ]
    const hasActionHint = actionVerbs.some(verb =>
      frNotInOrg.toLowerCase().includes(verb)
    )

    expect(hasActionHint).toBe(true)
  })

  it('FR tooltip for "feature available in org" should include an action verb', () => {
    // Extract the French translation for featureAvailableInOrg
    const frAvailableMatch = fileContent.match(
      /featureAvailableInOrg:\s*['"]([^'"]+)['"]/
    )
    expect(frAvailableMatch).not.toBeNull()
    const frAvailable = frAvailableMatch![1]

    // BUG: Current text is "Disponible dans {orgName}" — tells users WHERE
    // but not WHAT TO DO. Should say something like:
    // "Disponible dans {orgName} — changez d'organisation pour y accéder"
    const actionVerbs = [
      'changez', 'changer', 'sélectionnez', 'sélectionner',
      'basculez', 'basculer', 'passez', 'passer', 'accéder',
      'accédez', 'switchez', 'switcher'
    ]
    const hasActionHint = actionVerbs.some(verb =>
      frAvailable.toLowerCase().includes(verb)
    )

    expect(hasActionHint).toBe(true)
  })

  it('EN tooltip for "feature not in current org" should include an action hint', () => {
    // Extract the English translation
    const enNotInOrgMatch = fileContent.match(
      /featureNotInCurrentOrg:\s*['"]([^'"]+)['"]/
    )
    expect(enNotInOrgMatch).not.toBeNull()
    const enNotInOrg = enNotInOrgMatch![1]

    // Should include "switch", "change", "select", or similar action word
    const actionVerbs = [
      'switch', 'change', 'select', 'go to', 'navigate'
    ]
    const hasActionHint = actionVerbs.some(verb =>
      enNotInOrg.toLowerCase().includes(verb)
    )

    expect(hasActionHint).toBe(true)
  })
})
