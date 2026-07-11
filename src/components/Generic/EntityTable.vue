<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <div class="ocf-entity-table">
    <div v-if="hasToolbar" class="ocf-entity-table__toolbar">
      <div v-if="searchable" class="ocf-entity-table__search">
        <i class="fas fa-search ocf-entity-table__search-icon"></i>
        <input
          v-model="table.query.value"
          type="text"
          class="ocf-entity-table__search-input"
          :placeholder="searchPlaceholder || t('entityTable.searchPlaceholder')"
        />
      </div>
      <slot name="toolbar-extra" />
      <span v-if="showCount" class="ocf-entity-table__count">
        {{ table.visibleRows.value.length }} {{ t('entityTable.results') }}
      </span>
    </div>

    <div v-if="loading" class="ocf-entity-table__state">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p>{{ t('entityTable.loading') }}</p>
    </div>

    <div v-else-if="error" class="ocf-entity-table__state ocf-entity-table__state--error">
      <i class="fas fa-exclamation-triangle fa-2x"></i>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="table.visibleRows.value.length === 0" class="ocf-entity-table__state">
      <slot name="empty">
        <i :class="['fas', emptyIcon, 'fa-2x']"></i>
        <p>{{ emptyText || t('entityTable.empty') }}</p>
      </slot>
    </div>

    <div v-else class="ocf-entity-table__scroll">
      <table class="ocf-entity-table__grid">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="{ 'ocf-entity-table__th--sortable': column.sortable }"
              :data-sort="column.sortable ? column.key : undefined"
              @click="column.sortable && table.toggleSort(column.key)"
            >
              {{ column.label }}
              <i v-if="column.sortable" :class="table.sortIconClass(column.key)"></i>
            </th>
            <th v-if="hasRowActions">{{ t('entityTable.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in table.visibleRows.value" :key="rowId(row)">
            <td v-for="column in columns" :key="column.key">
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="cellValue(row, column)"
                :column="column"
              >
                {{ formatCell(row, column) }}
              </slot>
            </td>
            <td v-if="hasRowActions" class="ocf-entity-table__actions">
              <slot name="row-actions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts" generic="Row extends Record<string, any>">
import { computed, toRef, useSlots } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useClientTable, type SortState } from '../../composables/useClientTable'
import type { TableColumn } from '../../utils/tableColumns'

const props = withDefaults(
  defineProps<{
    columns: TableColumn<Row>[]
    rows: Row[]
    rowKey?: string
    loading?: boolean
    error?: string
    searchable?: boolean
    searchFilter?: (row: Row, query: string) => boolean
    searchPlaceholder?: string
    initialSort?: SortState
    showCount?: boolean
    emptyIcon?: string
    emptyText?: string
  }>(),
  {
    rowKey: 'id',
    loading: false,
    error: '',
    searchable: false,
    showCount: false,
    emptyIcon: 'fa-inbox'
  }
)

const { t } = useTranslations({
  en: {
    entityTable: {
      searchPlaceholder: 'Search...',
      results: 'results',
      actions: 'Actions',
      loading: 'Loading...',
      empty: 'No records found'
    }
  },
  fr: {
    entityTable: {
      searchPlaceholder: 'Rechercher...',
      results: 'résultats',
      actions: 'Actions',
      loading: 'Chargement...',
      empty: 'Aucun enregistrement'
    }
  }
})

const slots = useSlots()

const table = useClientTable(toRef(props, 'rows'), {
  columns: props.columns,
  initialSort: props.initialSort,
  searchFilter: props.searchFilter
})

const hasRowActions = computed(() => !!slots['row-actions'])
const hasToolbar = computed(
  () => props.searchable || props.showCount || !!slots['toolbar-extra']
)

function rowId(row: Row): string {
  return String(row[props.rowKey])
}

function cellValue(row: Row, column: TableColumn<Row>): any {
  return row[column.key]
}

function formatCell(row: Row, column: TableColumn<Row>): any {
  const value = cellValue(row, column)
  return column.format ? column.format(value, row) : value
}
</script>

<style scoped>
.ocf-entity-table__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.ocf-entity-table__search {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.ocf-entity-table__search-icon {
  position: absolute;
  left: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.ocf-entity-table__search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) calc(var(--spacing-md) + 1.5em);
  border: 2px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
}

.ocf-entity-table__search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.ocf-entity-table__count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  font-weight: var(--font-weight-medium);
}

.ocf-entity-table__scroll {
  overflow-x: auto;
}

.ocf-entity-table__grid {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.ocf-entity-table__grid thead {
  background: var(--color-bg-secondary);
}

.ocf-entity-table__grid th {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--color-border-light);
  white-space: nowrap;
}

.ocf-entity-table__grid td {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  vertical-align: middle;
}

.ocf-entity-table__grid tbody tr:hover {
  background: var(--color-bg-secondary);
}

.ocf-entity-table__grid tbody tr:last-child td {
  border-bottom: none;
}

.ocf-entity-table__th--sortable {
  cursor: pointer;
  user-select: none;
  transition: color var(--transition-fast);
}

.ocf-entity-table__th--sortable:hover {
  color: var(--color-primary);
}

.ocf-entity-table__th--sortable i {
  margin-left: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.ocf-entity-table__actions {
  white-space: nowrap;
}

.ocf-entity-table__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.ocf-entity-table__state--error {
  color: var(--color-danger-text);
}

@media (max-width: 768px) {
  .ocf-entity-table__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .ocf-entity-table__search {
    min-width: unset;
  }

  .ocf-entity-table__grid th,
  .ocf-entity-table__grid td {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
  }
}
</style>
