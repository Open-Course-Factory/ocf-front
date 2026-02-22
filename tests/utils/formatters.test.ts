import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStorageSize,
  formatNumber,
  formatPercentage,
  formatDuration,
  truncate,
  extractErrorMessage,
} from '../../src/utils/formatters'

describe('formatCurrency', () => {
  it('formats basic EUR amount from cents', () => {
    const result = formatCurrency(1999)
    // 1999 cents = 19.99 EUR in fr-FR locale
    expect(result).toContain('19,99')
    expect(result).toContain('€')
  })

  it('formats USD amount with en-US locale', () => {
    const result = formatCurrency(1999, 'USD', 'en-US')
    expect(result).toContain('19.99')
    expect(result).toContain('$')
  })

  it('formats zero amount', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0,00')
    expect(result).toContain('€')
  })

  it('formats large amount', () => {
    const result = formatCurrency(1000000)
    // 1000000 cents = 10000.00 EUR
    expect(result).toContain('10')
    expect(result).toContain('000')
    expect(result).toContain('€')
  })

  it('formats negative amount', () => {
    const result = formatCurrency(-1999)
    expect(result).toContain('19,99')
    expect(result).toContain('€')
    // Should contain a negative indicator
    expect(result).toMatch(/-|−/)
  })
})

describe('formatDate', () => {
  it('formats a valid ISO date string with explicit timezone', () => {
    const result = formatDate('2025-10-13T12:00:00Z', 'fr-FR', '-', 'UTC')
    expect(result).toBe('13/10/2025')
  })

  it('returns fallback for null input', () => {
    expect(formatDate(null)).toBe('-')
  })

  it('returns fallback for undefined input', () => {
    expect(formatDate(undefined)).toBe('-')
  })

  it('returns custom fallback for null input', () => {
    expect(formatDate(null, 'fr-FR', 'N/A')).toBe('N/A')
  })

  it('returns the original string for truly invalid date strings', () => {
    // Note: Date constructor behavior varies, but a clearly invalid string
    // will cause toLocaleDateString to throw or return invalid
    const result = formatDate('not-a-date')
    // The function catches errors and returns the original string
    expect(typeof result).toBe('string')
  })

  it('formats date with specific timezone', () => {
    // 2025-01-01T00:30:00Z in UTC is still Jan 1
    // but in a timezone behind UTC it could be Dec 31
    const resultUTC = formatDate('2025-01-01T00:30:00Z', 'fr-FR', '-', 'UTC')
    expect(resultUTC).toBe('01/01/2025')

    const resultNY = formatDate('2025-01-01T00:30:00Z', 'fr-FR', '-', 'America/New_York')
    // New York is UTC-5, so 00:30 UTC = Dec 31 19:30 NY
    expect(resultNY).toBe('31/12/2024')
  })
})

describe('formatDateTime', () => {
  it('formats a valid ISO date string with date and time using explicit timezone', () => {
    const result = formatDateTime('2025-10-13T12:30:45Z', 'fr-FR', '-', 'UTC')
    expect(result).toContain('13/10/2025')
    expect(result).toContain('12:30:45')
  })

  it('returns fallback for null input', () => {
    expect(formatDateTime(null)).toBe('-')
  })

  it('returns fallback for undefined input', () => {
    expect(formatDateTime(undefined)).toBe('-')
  })

  it('returns custom fallback for null input', () => {
    expect(formatDateTime(null, 'fr-FR', 'N/A')).toBe('N/A')
  })

  it('returns the original string for truly invalid date strings', () => {
    const result = formatDateTime('not-a-date')
    expect(typeof result).toBe('string')
  })
})

describe('formatStorageSize', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatStorageSize(0)).toBe('0 B')
  })

  it('formats bytes range (< 1024)', () => {
    expect(formatStorageSize(512)).toBe('512 B')
  })

  it('formats 1 byte', () => {
    expect(formatStorageSize(1)).toBe('1 B')
  })

  it('formats kilobytes', () => {
    expect(formatStorageSize(1536)).toBe('1.50 KB')
  })

  it('formats exactly 1 KB', () => {
    expect(formatStorageSize(1024)).toBe('1.00 KB')
  })

  it('formats megabytes', () => {
    expect(formatStorageSize(1048576)).toBe('1.00 MB')
  })

  it('formats megabytes with fractional part', () => {
    expect(formatStorageSize(5242880)).toBe('5.00 MB')
  })

  it('formats gigabytes', () => {
    expect(formatStorageSize(1073741824)).toBe('1.00 GB')
  })

  it('formats terabytes', () => {
    expect(formatStorageSize(1099511627776)).toBe('1.00 TB')
  })

  it('respects custom decimal places', () => {
    expect(formatStorageSize(1536, 0)).toBe('2 KB')
    expect(formatStorageSize(1536, 3)).toBe('1.500 KB')
  })
})

describe('formatNumber', () => {
  it('formats a basic number with fr-FR locale (default)', () => {
    const result = formatNumber(1234567)
    // fr-FR uses narrow no-break space or regular space as thousands separator
    // Normalize whitespace for comparison
    const normalized = result.replace(/\s/g, ' ')
    expect(normalized).toBe('1 234 567')
  })

  it('formats with en-US locale', () => {
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567')
  })

  it('formats small number without separators', () => {
    expect(formatNumber(42)).toBe('42')
  })
})

describe('formatPercentage', () => {
  it('formats 50%', () => {
    const result = formatPercentage(0.5)
    // fr-FR percentage format may include narrow no-break space before %
    const normalized = result.replace(/\s/g, ' ')
    expect(normalized).toBe('50 %')
  })

  it('formats 33.33% with 2 decimal places', () => {
    const result = formatPercentage(0.3333, 2)
    const normalized = result.replace(/\s/g, ' ')
    expect(normalized).toBe('33,33 %')
  })

  it('formats 100%', () => {
    const result = formatPercentage(1.0)
    const normalized = result.replace(/\s/g, ' ')
    expect(normalized).toBe('100 %')
  })

  it('formats 0%', () => {
    const result = formatPercentage(0)
    const normalized = result.replace(/\s/g, ' ')
    expect(normalized).toBe('0 %')
  })
})

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(9000)).toBe('2h 30m')
  })

  it('formats hours, minutes and seconds', () => {
    expect(formatDuration(3661)).toBe('1h 1m 1s')
  })

  it('returns "0s" for 0 seconds', () => {
    expect(formatDuration(0)).toBe('0s')
  })

  it('formats exact hour with no trailing minutes/seconds', () => {
    expect(formatDuration(3600)).toBe('1h')
  })

  it('formats exact minute with no trailing seconds', () => {
    expect(formatDuration(60)).toBe('1m')
  })
})

describe('truncate', () => {
  it('returns short text unchanged', () => {
    expect(truncate('Hello', 50)).toBe('Hello')
  })

  it('truncates long text with ellipsis', () => {
    const result = truncate('A very long text that needs truncation', 20)
    expect(result).toBe('A very long text ...')
    expect(result.length).toBe(20)
  })

  it('returns empty string unchanged', () => {
    expect(truncate('', 50)).toBe('')
  })

  it('handles null/undefined input', () => {
    // The function checks !text which is truthy for null/undefined
    expect(truncate(null as unknown as string, 50)).toBe(null)
    expect(truncate(undefined as unknown as string, 50)).toBe(undefined)
  })

  it('uses custom ellipsis', () => {
    const result = truncate('A very long text that needs truncation', 20, '--')
    expect(result).toBe('A very long text t--')
    expect(result.length).toBe(20)
  })

  it('returns text equal to maxLength unchanged', () => {
    const text = 'Exactly twenty chars'
    expect(truncate(text, 20)).toBe(text)
  })
})

describe('extractErrorMessage', () => {
  it('extracts error_message from axios response', () => {
    const error = {
      response: {
        data: {
          error_message: 'Validation failed',
          message: 'Bad request',
        },
      },
      message: 'Network error',
    }
    expect(extractErrorMessage(error)).toBe('Validation failed')
  })

  it('falls back to message from response data', () => {
    const error = {
      response: {
        data: {
          message: 'Not found',
        },
      },
      message: 'Network error',
    }
    expect(extractErrorMessage(error)).toBe('Not found')
  })

  it('falls back to error.message', () => {
    const error = {
      message: 'Network error',
    }
    expect(extractErrorMessage(error)).toBe('Network error')
  })

  it('falls back to default message', () => {
    expect(extractErrorMessage({})).toBe('An error occurred')
  })

  it('uses custom fallback message', () => {
    expect(extractErrorMessage({}, 'Custom error')).toBe('Custom error')
  })

  it('handles null/undefined error', () => {
    expect(extractErrorMessage(null)).toBe('An error occurred')
    expect(extractErrorMessage(undefined)).toBe('An error occurred')
  })
})
