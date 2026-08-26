import { describe, it, expect } from 'vitest'
import { formatMinutes } from '../../src/utils/formatters'

describe('formatMinutes', () => {
  // The estimate is stored as a number so that these words can be chosen per
  // reader. It used to be the stored string "90 minutes", which a French
  // learner read in English.
  it.each([
    [45, 'fr', '45 min'],
    [45, 'en', '45min'],
    [60, 'fr', '1 h'],
    [60, 'en', '1h'],
    [90, 'fr', '1 h 30'],
    [90, 'en', '1h 30min'],
    [180, 'fr', '3 h'],
    [125, 'fr', '2 h 5'],
  ])('formatMinutes(%i, %s) → %s', (minutes, locale, expected) => {
    expect(formatMinutes(minutes, locale)).toBe(expected)
  })

  // Nothing to say rather than "0 min": every caller renders this behind a
  // v-if, and an estimate nobody set should show no clock at all.
  it.each([[0], [null], [undefined], [-5], [NaN]])(
    'says nothing for %s',
    (minutes) => {
      expect(formatMinutes(minutes as number, 'fr')).toBe('')
    }
  )

  // A locale nobody planned for still gets words, not a crash.
  it('falls back to the non-French wording for an unknown locale', () => {
    expect(formatMinutes(90, 'de')).toBe('1h 30min')
  })
})
