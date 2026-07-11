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

import type { FieldConfig } from './fieldBuilder'

/**
 * A single column definition for EntityTable.
 *
 * - `sortValue` extracts the comparable value for sorting (defaults to the
 *   case-insensitive string of `row[key]`).
 * - `format` renders the display value in the default cell.
 */
export interface TableColumn<Row = Record<string, any>> {
  key: string
  label: string
  sortable?: boolean
  sortValue?: (row: Row) => string | number
  format?: (value: any, row: Row) => string
}

/**
 * Derives table columns from an entity store's `fieldList`, keeping only the
 * displayed fields in their declared order. A field's `displayValue` formatter
 * becomes the column's `format`.
 */
export function columnsFromFieldList<Row = Record<string, any>>(
  fieldList: Map<string, FieldConfig>
): TableColumn<Row>[] {
  const columns: TableColumn<Row>[] = []

  for (const [key, config] of fieldList) {
    if (config.display !== true) continue

    columns.push({
      key,
      label: config.label,
      format: config.displayValue as TableColumn<Row>['format']
    })
  }

  return columns
}
