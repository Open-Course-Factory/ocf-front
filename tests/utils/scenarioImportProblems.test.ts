/**
 * A refused scenario import names every problem in `details`; the page lists
 * them so an author can fix them all at once. Only a 400's string list counts.
 */
import { describe, it, expect } from 'vitest'
import { scenarioImportError, scenarioImportProblems } from '../../src/utils/scenarioImportProblems'

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

describe('scenarioImportError', () => {
  const text = { tooLarge: 'too large for the server', fallback: 'import failed' }

  it("says a 413 is the server's size limit, even with a proxy's HTML body", () => {
    expect(scenarioImportError({ response: { status: 413, data: '<html>413</html>' } }, text)).toBe('too large for the server')
  })

  it("says what the server said, else the caller's fallback", () => {
    expect(scenarioImportError({ response: { status: 403, data: { error_message: 'not yours' } } }, text)).toBe('not yours')
    expect(scenarioImportError({ response: { status: 500, data: { message: 'boom' } } }, text)).toBe('boom')
    expect(scenarioImportError(new Error('network'), text)).toBe('import failed')
  })
})
