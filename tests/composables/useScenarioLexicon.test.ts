import { describe, it, expect } from 'vitest'
import { languageName } from '../../src/composables/useScenarioLexicon'

/**
 * A scenario's languages are listed by their own name ("Français", not
 * "French" or "français"), whatever the interface language: they are labels
 * in a list, so they start with a capital.
 */
describe('languageName', () => {
  it('names a language in itself, capitalised', () => {
    expect(languageName('fr')).toBe('Français')
    expect(languageName('en')).toBe('English')
    expect(languageName('es')).toBe('Español')
  })

  it('names a regional variant with its region', () => {
    expect(languageName('pt-BR')).toBe('Português (Brasil)')
  })

  it('accepts a code in any case', () => {
    expect(languageName('EN')).toBe('English')
  })

  it('capitalises a well-formed code Intl does not know', () => {
    expect(languageName('xx')).toBe('Xx')
  })

  it('returns a malformed code unchanged', () => {
    expect(languageName('not a code')).toBe('not a code')
  })

  it('returns an empty string for an empty code', () => {
    expect(languageName('')).toBe('')
  })
})
