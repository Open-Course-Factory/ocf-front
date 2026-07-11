/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { TableColumn } from '../utils/tableColumns'

export interface SortState {
  key: string
  dir: 'asc' | 'desc'
}

export interface UseClientTableOptions<Row> {
  columns: TableColumn<Row>[]
  initialSort?: SortState
  /** Replaces the default substring search across all columns. */
  searchFilter?: (row: Row, query: string) => boolean
}

export interface UseClientTable<Row> {
  query: Ref<string>
  sortState: Ref<SortState | null>
  toggleSort: (key: string) => void
  sortIconClass: (key: string) => string
  visibleRows: ComputedRef<Row[]>
}

/**
 * Client-side search + sort over a reactive list of rows. `visibleRows` is a
 * derived view (search-filtered, then sorted) and never mutates the source.
 */
export function useClientTable<Row>(
  rows: Ref<Row[]>,
  options: UseClientTableOptions<Row>
): UseClientTable<Row> {
  const { columns, initialSort, searchFilter } = options

  const query = ref('')
  const sortState = ref<SortState | null>(initialSort ?? null)

  function columnFor(key: string): TableColumn<Row> | undefined {
    return columns.find((c) => c.key === key)
  }

  function sortValueFor(row: Row, key: string): string | number {
    const column = columnFor(key)
    if (column?.sortValue) return column.sortValue(row)
    return String((row as Record<string, any>)[key] ?? '').toLowerCase()
  }

  function toggleSort(key: string): void {
    const current = sortState.value
    if (current && current.key === key) {
      sortState.value = { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
    } else {
      sortState.value = { key, dir: 'asc' }
    }
  }

  function sortIconClass(key: string): string {
    const current = sortState.value
    if (!current || current.key !== key) return 'fas fa-sort'
    return current.dir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
  }

  function matchesQuery(row: Row, needle: string): boolean {
    if (searchFilter) return searchFilter(row, needle)
    const lowered = needle.toLowerCase()
    return columns.some((column) =>
      String((row as Record<string, any>)[column.key] ?? '')
        .toLowerCase()
        .includes(lowered)
    )
  }

  function compareRows(a: Row, b: Row, key: string): number {
    const va = sortValueFor(a, key)
    const vb = sortValueFor(b, key)
    if (typeof va === 'number' && typeof vb === 'number') return va - vb
    return String(va).localeCompare(String(vb))
  }

  const visibleRows = computed<Row[]>(() => {
    let result = [...rows.value]

    const needle = query.value.trim()
    if (needle) {
      result = result.filter((row) => matchesQuery(row, needle))
    }

    const sort = sortState.value
    if (sort) {
      const factor = sort.dir === 'asc' ? 1 : -1
      result.sort((a, b) => factor * compareRows(a, b, sort.key))
    }

    return result
  })

  return { query, sortState, toggleSort, sortIconClass, visibleRows }
}
