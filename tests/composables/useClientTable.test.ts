import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useClientTable } from '../../src/composables/useClientTable'
import type { TableColumn } from '../../src/utils/tableColumns'

/**
 * `useClientTable` owns client-side search + sort for a list of rows.
 * It must never mutate the input array: `visibleRows` is a derived view
 * (search-filtered, then sorted).
 */

interface Row {
  name?: string
  role?: string
  word?: string
}

// Default-sort columns: the second column has no sortValue, so the default
// String(row[key]).toLowerCase() accessor is exercised for both search and sort.
const nameCols: TableColumn<Row>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role' },
]

// Numeric sort: sortValue returns the word length, so ordering is by length,
// not lexicographically.
const wordCols: TableColumn<Row>[] = [
  { key: 'word', label: 'Word', sortable: true, sortValue: (r) => (r.word ?? '').length },
]

describe('useClientTable — sort state (toggleSort)', () => {
  it('sets ascending sort on the first toggle of a column', () => {
    const rows = ref<Row[]>([{ name: 'Zoe' }, { name: 'Amy' }])
    const table = useClientTable(rows, { columns: nameCols })

    expect(table.sortState.value).toBeNull()

    table.toggleSort('name')

    expect(table.sortState.value).toEqual({ key: 'name', dir: 'asc' })
  })

  it('toggles to descending on the second toggle of the same column', () => {
    const rows = ref<Row[]>([{ name: 'Zoe' }, { name: 'Amy' }])
    const table = useClientTable(rows, { columns: nameCols })

    table.toggleSort('name')
    table.toggleSort('name')

    expect(table.sortState.value).toEqual({ key: 'name', dir: 'desc' })
  })

  it('resets to ascending when switching to a different column', () => {
    const rows = ref<Row[]>([{ name: 'Zoe', role: 'a' }, { name: 'Amy', role: 'b' }])
    const table = useClientTable(rows, { columns: nameCols })

    table.toggleSort('name') // asc
    table.toggleSort('name') // desc
    table.toggleSort('role') // new column -> back to asc

    expect(table.sortState.value).toEqual({ key: 'role', dir: 'asc' })
  })

  it('returns three distinct icon classes for unsorted / ascending / descending', () => {
    const rows = ref<Row[]>([{ name: 'Zoe' }, { name: 'Amy' }])
    const table = useClientTable(rows, { columns: nameCols })

    const unsorted = table.sortIconClass('name')
    table.toggleSort('name')
    const asc = table.sortIconClass('name')
    table.toggleSort('name')
    const desc = table.sortIconClass('name')

    expect(new Set([unsorted, asc, desc]).size).toBe(3)
  })
})

describe('useClientTable — visibleRows sorting', () => {
  it('sorts ascending using a numeric sortValue', () => {
    const rows = ref<Row[]>([{ word: 'ccc' }, { word: 'a' }, { word: 'bb' }])
    const table = useClientTable(rows, { columns: wordCols })

    table.toggleSort('word')

    expect(table.visibleRows.value.map((r) => r.word)).toEqual(['a', 'bb', 'ccc'])
  })

  it('reverses order when descending', () => {
    const rows = ref<Row[]>([{ word: 'ccc' }, { word: 'a' }, { word: 'bb' }])
    const table = useClientTable(rows, { columns: wordCols })

    table.toggleSort('word')
    table.toggleSort('word')

    expect(table.visibleRows.value.map((r) => r.word)).toEqual(['ccc', 'bb', 'a'])
  })

  it('uses the default sortValue case-insensitively', () => {
    const rows = ref<Row[]>([{ name: 'Banana' }, { name: 'apple' }, { name: 'Cherry' }])
    const table = useClientTable(rows, { columns: nameCols })

    table.toggleSort('name')

    expect(table.visibleRows.value.map((r) => r.name)).toEqual(['apple', 'Banana', 'Cherry'])
  })

  it('preserves the input order when unsorted', () => {
    const rows = ref<Row[]>([{ name: 'Zoe' }, { name: 'Amy' }, { name: 'Bob' }])
    const table = useClientTable(rows, { columns: nameCols })

    expect(table.visibleRows.value.map((r) => r.name)).toEqual(['Zoe', 'Amy', 'Bob'])
  })

  it('never mutates the source rows array', () => {
    const rows = ref<Row[]>([{ word: 'ccc' }, { word: 'a' }, { word: 'bb' }])
    const table = useClientTable(rows, { columns: wordCols })

    table.toggleSort('word')
    void table.visibleRows.value

    expect(rows.value.map((r) => r.word)).toEqual(['ccc', 'a', 'bb'])
  })

  it('applies initialSort on creation', () => {
    const rows = ref<Row[]>([{ word: 'ccc' }, { word: 'a' }, { word: 'bb' }])
    const table = useClientTable(rows, {
      columns: wordCols,
      initialSort: { key: 'word', dir: 'desc' },
    })

    expect(table.sortState.value).toEqual({ key: 'word', dir: 'desc' })
    expect(table.visibleRows.value.map((r) => r.word)).toEqual(['ccc', 'bb', 'a'])
  })
})

describe('useClientTable — search', () => {
  it('filters case-insensitively across every column value by default', () => {
    const rows = ref<Row[]>([
      { name: 'Alpha', role: 'admin' },
      { name: 'Beta', role: 'user' },
    ])
    const table = useClientTable(rows, { columns: nameCols })

    // 'ADM' only matches the role of the first row -> proves all columns + case-insensitivity.
    table.query.value = 'ADM'

    expect(table.visibleRows.value.map((r) => r.name)).toEqual(['Alpha'])
  })

  it('lets a custom searchFilter fully replace the default', () => {
    const rows = ref<Row[]>([{ name: 'Beta' }, { name: 'Betamax' }])
    const table = useClientTable(rows, {
      columns: nameCols,
      searchFilter: (row, query) => row.name === query, // exact match only
    })

    table.query.value = 'Beta'

    // The default substring search would also match 'Betamax'; the custom filter must not.
    expect(table.visibleRows.value.map((r) => r.name)).toEqual(['Beta'])
  })

  it('search-filters first, then sorts the remaining rows', () => {
    const rows = ref<Row[]>([{ name: 'Bo' }, { name: 'Al' }, { name: 'Bea' }, { name: 'Zo' }])
    const table = useClientTable(rows, { columns: nameCols })

    table.query.value = 'b' // keeps Bo and Bea
    table.toggleSort('name') // then orders them ascending

    expect(table.visibleRows.value.map((r) => r.name)).toEqual(['Bea', 'Bo'])
  })

  it('shows all rows again when the query is cleared', () => {
    const rows = ref<Row[]>([{ name: 'Alpha', role: 'a' }, { name: 'Beta', role: 'b' }])
    const table = useClientTable(rows, { columns: nameCols })

    table.query.value = 'Alpha'
    expect(table.visibleRows.value).toHaveLength(1)

    table.query.value = ''
    expect(table.visibleRows.value).toHaveLength(2)
  })

  it('returns an empty list for empty input rows', () => {
    const rows = ref<Row[]>([])
    const table = useClientTable(rows, { columns: nameCols })

    expect(table.visibleRows.value).toEqual([])
  })
})
