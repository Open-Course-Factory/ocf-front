import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useClientPagination } from '../../src/composables/useClientPagination'

/**
 * The members and groups lists search on the client. A trainer typing a name
 * the way it is spelled on a keyboard ("helene") must find "Hélène".
 */

interface Member {
  name: string
  email?: string
  user?: { email: string }
}

function paginate(items: Member[], searchFields: string[] = ['name', 'email']) {
  return useClientPagination<Member>({ items: ref(items), searchFields })
}

const names = (list: Member[]) => list.map((m) => m.name)

describe('useClientPagination — search', () => {
  const members: Member[] = [
    { name: 'Hélène Dupont', email: 'h.dupont@example.com' },
    { name: 'ecole', email: 'contact@ecole.fr' },
    { name: 'Marc', email: 'marc@example.com' },
  ]

  it('matches case-insensitively', () => {
    const p = paginate(members)
    p.searchQuery.value = 'MARC'
    expect(names(p.filteredItems.value)).toEqual(['Marc'])
  })

  it('matches across every search field', () => {
    const p = paginate(members)
    p.searchQuery.value = 'contact@'
    expect(names(p.filteredItems.value)).toEqual(['ecole'])
  })

  it('searches nested fields in dot notation', () => {
    const p = paginate([{ name: 'Zoé', user: { email: 'zoe@example.com' } }], ['user.email'])
    p.searchQuery.value = 'zoe@'
    expect(names(p.filteredItems.value)).toEqual(['Zoé'])
  })

  it('finds an accented value from an unaccented query', () => {
    const p = paginate(members)
    p.searchQuery.value = 'helene'
    expect(names(p.filteredItems.value)).toEqual(['Hélène Dupont'])
  })

  it('finds an unaccented value from an accented query', () => {
    const p = paginate(members)
    p.searchQuery.value = 'Éco'
    expect(names(p.filteredItems.value)).toEqual(['ecole'])
  })

  it('returns every item for a blank query', () => {
    const p = paginate(members)
    p.searchQuery.value = '   '
    expect(p.filteredItems.value).toHaveLength(3)
  })
})
