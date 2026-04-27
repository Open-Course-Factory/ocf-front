import { describe, it, expect } from 'vitest'
import {
  kebabToCamel,
  getTranslationKey,
  formatPrice,
  buildSelectData,
} from '../../src/utils/index'

describe('kebabToCamel + getTranslationKey', () => {
  it.each([
    ['subscription-plans', 'subscriptionPlans'],
    ['users', 'users'],
    ['my-multi-word-string', 'myMultiWordString'],
    ['a-b-c', 'aBC'],
    ['', ''],
    ['user-subscription-plans', 'userSubscriptionPlans'],
  ])('"%s" → %s', (input, expected) => {
    expect(kebabToCamel(input)).toBe(expected)
    expect(getTranslationKey(input)).toBe(expected)
  })
})

describe('formatPrice', () => {
  it.each([
    [1999, 'EUR', '19,99', '€'],
    [1999, 'USD', '19,99', '$'],
    [0, 'EUR', '0,00', '€'],
    [1999, 'eur', '19,99', '€'],
  ])('formatPrice(%i, %s) contains %s and %s', (amount, currency, expectedNum, expectedSymbol) => {
    const result = formatPrice(amount, currency)
    expect(result).toContain(expectedNum)
    expect(result).toContain(expectedSymbol)
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
