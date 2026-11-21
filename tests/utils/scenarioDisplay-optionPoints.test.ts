import { describe, it, expect } from 'vitest'
import { optionPointsTotal, optionPointsAt } from '../../src/utils/scenarioDisplay'

describe('optionPointsTotal', () => {
  it('is null when no question is scored by option points', () => {
    expect(optionPointsTotal([])).toBeNull()
    expect(optionPointsTotal([{ earned_points: 1, max_points: 1 }])).toBeNull()
  })

  it('sums every question once one is scored by option points', () => {
    expect(optionPointsTotal([
      { option_points: '[3,1,0,2]', earned_points: 2, max_points: 3 },
      { earned_points: 1, max_points: 1 },
      { option_points: '[1,0]' }
    ])).toEqual({ earned: 3, max: 4 })
  })
})

describe('optionPointsAt', () => {
  it('reads one option\'s points', () => {
    expect(optionPointsAt('[3,1,0,2]', 2)).toBe(0)
    expect(optionPointsAt('[3,1,0,2]', 3)).toBe(2)
  })

  it('is null without usable points', () => {
    expect(optionPointsAt(undefined, 0)).toBeNull()
    expect(optionPointsAt('', 0)).toBeNull()
    expect(optionPointsAt('not json', 0)).toBeNull()
    expect(optionPointsAt('{"a":1}', 0)).toBeNull()
    expect(optionPointsAt('[3,1]', 5)).toBeNull()
  })
})
