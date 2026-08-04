/**
 * Tests for which fields `useEntitySearch` actually looks at.
 *
 * The component tests cover the visible behaviour (narrowing, debounce, clearing).
 * What they cannot reach is the field-selection rule, which is the part with
 * judgement in it: search must find what the card SHOWS, and must not turn a
 * pasted UUID fragment into a pile of unrelated matches.
 */

import { describe, it, expect } from 'vitest'
import { searchableValues, normalizeSearchText } from '../../src/composables/useEntitySearch'

function field(overrides: Record<string, any> = {}) {
  return { display: true, type: 'input', ...overrides }
}

describe('searchableValues — which fields a search looks at', () => {
  it('reads the fields the card draws its title and subtitle from', () => {
    const entity = {
      id: 'g-1',
      display_name: 'Promo A',
      title: 'Linux fundamentals',
      name: 'promo-a',
      description: 'First-year sysadmin cohort'
    }

    expect(searchableValues(entity)).toEqual([
      'Promo A',
      'Linux fundamentals',
      'promo-a',
      'First-year sysadmin cohort'
    ])
  })

  it('skips fields that are absent, empty or not text', () => {
    const entity = { name: 'promo-a', description: '', title: null, member_count: 12 }

    expect(searchableValues(entity)).toEqual(['promo-a'])
  })

  it('adds other displayed string fields, so an entity with no name is still findable', () => {
    const entity = { id: 'u-1', email: 'marc@example.com', member_count: 12 }
    const fieldList = new Map([
      ['email', field()],
      ['member_count', field()]
    ])

    expect(searchableValues(entity, fieldList)).toEqual(['marc@example.com'])
  })

  it('ignores fields the store does not display', () => {
    const entity = { id: 'u-1', internal_note: 'do not surface this' }
    const fieldList = new Map([['internal_note', field({ display: false })]])

    expect(searchableValues(entity, fieldList)).toEqual([])
  })

  it('ignores foreign keys, so a pasted UUID fragment does not match everything', () => {
    const entity = {
      name: 'promo-a',
      organization_id: '7f3c1e20-0000-4000-8000-000000000001',
      courseId: '7f3c1e20-0000-4000-8000-000000000002',
      ownerID: '7f3c1e20-0000-4000-8000-000000000003',
      themes: '7f3c1e20-0000-4000-8000-000000000004'
    }
    const fieldList = new Map([
      ['organization_id', field()],
      ['courseId', field()],
      ['ownerID', field()],
      // An FK declared by its relation name rather than an id-suffixed key.
      ['themes', field({ type: 'multi-select' })]
    ])

    expect(searchableValues(entity, fieldList)).toEqual(['promo-a'])
  })

  it('does not report a card field twice when the store also declares it', () => {
    const entity = { name: 'promo-a' }
    const fieldList = new Map([['name', field()]])

    expect(searchableValues(entity, fieldList)).toEqual(['promo-a'])
  })
})

describe('normalizeSearchText', () => {
  it('folds case, accents and surrounding whitespace so "eleve" finds "Élève"', () => {
    expect(normalizeSearchText('  Élève  ')).toBe('eleve')
    expect(normalizeSearchText('Promo A')).toBe('promo a')
  })

  it('reduces a whitespace-only query to the empty string, which means "no search"', () => {
    expect(normalizeSearchText('   ')).toBe('')
  })
})
