import { describe, it, expect } from 'vitest'
import { sanitizeCSVField } from '../../src/utils/csv'

describe('sanitizeCSVField', () => {
  it('wraps plain text in double quotes', () => {
    expect(sanitizeCSVField('Hello World')).toBe('"Hello World"')
  })

  it('returns empty quoted string for null and undefined', () => {
    expect(sanitizeCSVField(null)).toBe('""')
    expect(sanitizeCSVField(undefined)).toBe('""')
  })

  it('coerces numbers and booleans to string', () => {
    expect(sanitizeCSVField(42)).toBe('"42"')
    expect(sanitizeCSVField(true)).toBe('"true"')
  })

  it('doubles embedded double quotes (RFC 4180)', () => {
    expect(sanitizeCSVField('say "hi"')).toBe('"say ""hi"""')
  })

  it('keeps commas, newlines and tabs intact within the quoted field', () => {
    expect(sanitizeCSVField('a, b')).toBe('"a, b"')
    expect(sanitizeCSVField('line1\nline2')).toBe('"line1\nline2"')
  })

  // --- Formula injection prevention (CWE-1236) ---

  it('escapes leading = (formula injection)', () => {
    expect(sanitizeCSVField('=cmd|"/c calc"!A1')).toBe('"\'=cmd|""/c calc""!A1"')
  })

  it('escapes leading + (formula injection)', () => {
    expect(sanitizeCSVField('+1+1')).toBe('"\'+1+1"')
  })

  it('escapes leading - (formula injection)', () => {
    expect(sanitizeCSVField('-cmd')).toBe('"\'-cmd"')
  })

  it('escapes leading @ (Lotus / Excel formula injection)', () => {
    expect(sanitizeCSVField('@SUM(A1:A10)')).toBe('"\'@SUM(A1:A10)"')
  })

  it('does not escape regular text starting with letters or digits', () => {
    expect(sanitizeCSVField('Alice')).toBe('"Alice"')
    expect(sanitizeCSVField('42 widgets')).toBe('"42 widgets"')
  })

  it('does not escape text where = + - @ appear later in the field', () => {
    expect(sanitizeCSVField('user@example.com')).toBe('"user@example.com"')
    expect(sanitizeCSVField('total=42')).toBe('"total=42"')
    expect(sanitizeCSVField('a-b')).toBe('"a-b"')
  })

  it('still doubles quotes when also escaping a leading formula char', () => {
    // Important regression: both protections must compose.
    expect(sanitizeCSVField('=A1&"x"')).toBe('"\'=A1&""x"""')
  })
})
