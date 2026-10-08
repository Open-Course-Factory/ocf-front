import { describe, it, expect } from 'vitest'
import { countRoles, sumRoleCounts, rolesByRank } from '../../src/utils/roles'

describe('role counts', () => {
  it('counts each role, and nothing for no members', () => {
    expect(countRoles([{ role: 'member' }, { role: 'manager' }, { role: 'member' }])).toEqual({ member: 2, manager: 1 })
    expect(countRoles(undefined)).toEqual({})
    expect(countRoles([])).toEqual({})
  })

  it('sums counts across groups', () => {
    expect(sumRoleCounts([{ owner: 1, member: 3 }, { member: 2, manager: 1 }, {}])).toEqual({ owner: 1, member: 5, manager: 1 })
    expect(sumRoleCounts([])).toEqual({})
  })

  it('orders present roles highest rank first and drops zeros', () => {
    expect(rolesByRank({ member: 4, owner: 1, manager: 0, teacher: 2 })).toEqual(['owner', 'teacher', 'member'])
  })
})
