/**
 * The admin organizations panel died on
 * "RangeError: invalid currency code in NumberFormat()".
 *
 * `formatCurrency(amount, currency = 'EUR')` only applies its default when the
 * argument is `undefined`. An empty string is a value, so it sailed past the
 * default straight into Intl, which throws — and because the throw happened
 * inside a render function, the whole page went blank rather than one cell.
 *
 * The empty string came from the backend (an org subscription whose plan had
 * been soft-deleted serialised as a zero-value plan). That is fixed separately;
 * a formatter should not be able to take down a page over one bad row either
 * way.
 */
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../../src/utils/formatters'

describe('formatCurrency', () => {
  it('falls back to EUR when the currency is an empty string', () => {
    // The exact input that crashed the admin organizations panel.
    expect(() => formatCurrency(1990, '')).not.toThrow()
    expect(formatCurrency(1990, '')).toBe(formatCurrency(1990, 'EUR'))
  })

  it('falls back to EUR when the currency is whitespace', () => {
    expect(formatCurrency(1990, '   ')).toBe(formatCurrency(1990, 'EUR'))
  })

  it('falls back to EUR when the currency is undefined', () => {
    expect(formatCurrency(1990, undefined)).toBe(formatCurrency(1990, 'EUR'))
  })

  it('still honours an explicit currency', () => {
    expect(formatCurrency(1990, 'usd', 'en-US')).toBe('$19.90')
  })

  it('formats zero rather than treating it as missing', () => {
    expect(formatCurrency(0, 'eur')).toBe(formatCurrency(0, 'EUR'))
  })
})
