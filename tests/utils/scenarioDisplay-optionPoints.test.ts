import { describe, it, expect } from 'vitest'
import { optionPointsTotal, rankOptionsByPoints } from '../../src/utils/scenarioDisplay'

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

describe('rankOptionsByPoints', () => {
  it('lists the options best first, with a medal per point value', () => {
    expect(rankOptionsByPoints(['a', 'b', 'c', 'd', 'e'], '[3,1,0,2,1]')).toEqual([
      { index: 0, text: 'a', points: 3, medal: '🥇' },
      { index: 3, text: 'd', points: 2, medal: '🥈' },
      { index: 1, text: 'b', points: 1, medal: '🥉' },
      { index: 4, text: 'e', points: 1, medal: '🥉' },
      { index: 2, text: 'c', points: 0, medal: '' }
    ])
  })

  it('gives no medal past the third value or at zero', () => {
    expect(rankOptionsByPoints(['a', 'b', 'c', 'd'], '[4,3,2,1]').map(o => o.medal)).toEqual(['🥇', '🥈', '🥉', ''])
  })

  it('is empty when the points do not match the options', () => {
    expect(rankOptionsByPoints(['a', 'b'], undefined)).toEqual([])
    expect(rankOptionsByPoints(['a', 'b'], 'not json')).toEqual([])
    expect(rankOptionsByPoints(['a', 'b'], '[1]')).toEqual([])
  })
})
