import { describe, it, expect } from 'vitest'
import {
  kebabToCamel,
  getTranslationKey,
  formatPrice,
  buildSelectData,
} from '../../src/utils/index'

describe('kebabToCamel', () => {
  it('converts basic kebab-case to camelCase', () => {
    expect(kebabToCamel('subscription-plans')).toBe('subscriptionPlans')
  })

  it('returns string unchanged if no hyphens', () => {
    expect(kebabToCamel('users')).toBe('users')
  })

  it('handles multiple hyphens', () => {
    expect(kebabToCamel('my-multi-word-string')).toBe('myMultiWordString')
  })

  it('handles single character segments', () => {
    expect(kebabToCamel('a-b-c')).toBe('aBC')
  })

  it('handles empty string', () => {
    expect(kebabToCamel('')).toBe('')
  })
})

describe('getTranslationKey', () => {
  it('delegates to kebabToCamel for kebab-case input', () => {
    expect(getTranslationKey('subscription-plans')).toBe('subscriptionPlans')
  })

  it('returns unchanged string for non-kebab input', () => {
    expect(getTranslationKey('users')).toBe('users')
  })

  it('handles complex entity names', () => {
    expect(getTranslationKey('user-subscription-plans')).toBe('userSubscriptionPlans')
  })
})

describe('formatPrice', () => {
  it('formats basic EUR price from cents', () => {
    const result = formatPrice(1999)
    // 1999 cents = 19.99 EUR in fr-FR
    expect(result).toContain('19,99')
    expect(result).toContain('€')
  })

  it('formats USD price', () => {
    const result = formatPrice(1999, 'USD')
    // Still fr-FR locale but USD currency
    expect(result).toContain('19,99')
    expect(result).toContain('$')
  })

  it('formats zero price', () => {
    const result = formatPrice(0)
    expect(result).toContain('0,00')
    expect(result).toContain('€')
  })

  it('handles lowercase currency code', () => {
    const result = formatPrice(1999, 'eur')
    expect(result).toContain('19,99')
    expect(result).toContain('€')
  })
})

describe('buildSelectData', () => {
  it('maps entities to select options', () => {
    const entities = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ]
    const result = buildSelectData(entities, (e) => e.name)
    expect(result).toEqual([
      { text: 'Alice', value: '1' },
      { text: 'Bob', value: '2' },
      { text: 'Charlie', value: '3' },
    ])
  })

  it('returns empty array for empty input', () => {
    const result = buildSelectData([], (e) => e.id)
    expect(result).toEqual([])
  })

  it('uses custom formatter function', () => {
    const entities = [
      { id: '1', firstName: 'Alice', lastName: 'Smith' },
      { id: '2', firstName: 'Bob', lastName: 'Jones' },
    ]
    const result = buildSelectData(entities, (e) => `${e.lastName}, ${e.firstName}`)
    expect(result).toEqual([
      { text: 'Smith, Alice', value: '1' },
      { text: 'Jones, Bob', value: '2' },
    ])
  })

  it('preserves entity id as value', () => {
    const entities = [{ id: 'uuid-abc-123', name: 'Test' }]
    const result = buildSelectData(entities, (e) => e.name)
    expect(result[0].value).toBe('uuid-abc-123')
  })
})
