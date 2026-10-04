/**
 * A refused scenario import names every problem in `details`; the page lists
 * them so an author can fix them all at once. Only a 400's string list counts.
 */
import { describe, it, expect } from 'vitest'
import { scenarioImportProblems } from '../../src/utils/scenarioImportProblems'

describe('scenarioImportProblems', () => {
  it('returns the details of a 400 refusal', () => {
    const err = { response: { status: 400, data: { error_message: '2 problems', details: ['one', 'two'] } } }
    expect(scenarioImportProblems(err)).toEqual(['one', 'two'])
  })

  it('returns nothing for other failures or a details object', () => {
    expect(scenarioImportProblems({ response: { status: 500, data: { details: ['x'] } } })).toEqual([])
    expect(scenarioImportProblems({ response: { status: 400, data: { details: { field: 'x' } } } })).toEqual([])
    expect(scenarioImportProblems(new Error('network'))).toEqual([])
  })
})
