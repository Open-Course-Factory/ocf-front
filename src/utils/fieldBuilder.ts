/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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

/**
 * Field Builder Utility
 *
 * Reduces boilerplate when defining fieldList configurations in entity stores.
 * Provides a fluent API for building field definitions with sensible defaults.
 *
 * @example
 * // Old verbose way:
 * const fieldList = new Map<string, any>([
 *   ["id", { label: "ID", type: "input", display: false, toBeSet: false, toBeEdited: false }],
 *   ["name", { label: t('entity.name'), type: "input", display: true, toBeSet: true, toBeEdited: true, required: true }],
 * ])
 *
 * // New concise way:
 * const fieldList = buildFieldList([
 *   field('id').hidden(),
 *   field('name', t('entity.name')).editable().required(),
 *   field('description', t('entity.description')).textarea().editable(),
 *   field('status', t('entity.status')).readonly(),
 * ])
 */

/**
 * Field configuration interface
 */
export interface FieldConfig {
  label: string
  type: string
  display: boolean
  toBeSet: boolean
  toBeEdited: boolean
  required?: boolean
  options?: any[]
  placeholder?: string
  hint?: string
  validation?: any
  [key: string]: any  // Allow additional custom properties
}

/**
 * Field builder with fluent API
 */
export class FieldBuilder {
  private config: FieldConfig

  constructor(
    private fieldName: string,
    label?: string
  ) {
    // Default configuration (most common case: visible, read-only field)
    this.config = {
      label: label || fieldName,
      type: 'input',
      display: true,
      toBeSet: false,
      toBeEdited: false
    }
  }

  /**
   * Set field type
   */
  type(fieldType: string): this {
    this.config.type = fieldType
    return this
  }

  /**
   * Common field types as shortcuts
   */
  input(): this {
    return this.type('input')
  }

  textarea(): this {
    return this.type('textarea')
  }

  select(): this {
    return this.type('select')
  }

  checkbox(): this {
    return this.type('checkbox')
  }

  date(): this {
    return this.type('date')
  }

  number(): this {
    return this.type('number')
  }

  email(): this {
    return this.type('email')
  }

  /**
   * Visibility controls
   */
  visible(isVisible: boolean = true): this {
    this.config.display = isVisible
    return this
  }

  hidden(): this {
    return this.visible(false)
  }

  /**
   * Edit permissions
   */
  editable(): this {
    this.config.toBeSet = true
    this.config.toBeEdited = true
    return this
  }

  creatable(): this {
    this.config.toBeSet = true
    this.config.toBeEdited = false
    return this
  }

  updatable(): this {
    this.config.toBeSet = false
    this.config.toBeEdited = true
    return this
  }

  readonly(): this {
    this.config.toBeSet = false
    this.config.toBeEdited = false
    return this
  }

  /**
   * Validation
   */
  required(isRequired: boolean = true): this {
    this.config.required = isRequired
    return this
  }

  /**
   * Options for select/radio fields
   */
  withOptions(options: any[]): this {
    this.config.options = options
    return this
  }

  /**
   * Additional metadata
   */
  placeholder(text: string): this {
    this.config.placeholder = text
    return this
  }

  hint(text: string): this {
    this.config.hint = text
    return this
  }

  /**
   * Custom properties
   */
  custom(key: string, value: any): this {
    this.config[key] = value
    return this
  }

  /**
   * Build the final configuration
   */
  build(): [string, FieldConfig] {
    return [this.fieldName, this.config]
  }
}

/**
 * Factory function to create a field builder
 *
 * @param fieldName - The field name (database column name)
 * @param label - Optional display label (defaults to fieldName)
 * @returns FieldBuilder instance
 *
 * @example
 * field('email', t('user.email')).email().editable().required()
 */
export function field(fieldName: string, label?: string): FieldBuilder {
  return new FieldBuilder(fieldName, label)
}

/**
 * Builds a Map from an array of field builders
 *
 * @param fields - Array of FieldBuilder instances or [name, config] tuples
 * @returns Map<string, FieldConfig>
 *
 * @example
 * const fieldList = buildFieldList([
 *   field('id').hidden(),
 *   field('name', t('entity.name')).editable().required(),
 *   field('created_at', t('created_at')).readonly(),
 * ])
 */
export function buildFieldList(fields: FieldBuilder[]): Map<string, FieldConfig> {
  const entries = fields.map(f => f.build())
  return new Map(entries)
}

/**
 * Common field presets for frequently used field types
 */
export const fieldPresets = {
  /**
   * Standard ID field (hidden, read-only)
   */
  id: () => field('id', 'ID').hidden(),

  /**
   * Standard timestamps (visible, read-only)
   */
  createdAt: (label: string = 'Created At') => field('created_at', label).readonly(),
  updatedAt: (label: string = 'Updated At') => field('updated_at', label).readonly(),

  /**
   * Standard user ID reference (hidden)
   */
  userId: () => field('user_id', 'User ID').hidden(),

  /**
   * Standard boolean active flag (visible, read-only)
   */
  isActive: (label: string = 'Active') => field('is_active', label).checkbox().readonly(),

  /**
   * Standard Stripe IDs (hidden)
   */
  stripeId: (fieldName: string, label: string) => field(fieldName, label).hidden(),
}

/**
 * Helper to create multiple standard system fields at once
 *
 * @example
 * const fieldList = buildFieldList([
 *   ...systemFields(['id', 'created_at', 'updated_at']),
 *   field('name', t('entity.name')).editable().required(),
 * ])
 */
export function systemFields(
  fields: Array<'id' | 'created_at' | 'updated_at' | 'user_id' | 'is_active'>,
  labels?: { created_at?: string, updated_at?: string, is_active?: string }
): FieldBuilder[] {
  return fields.map(fieldName => {
    switch (fieldName) {
      case 'id':
        return fieldPresets.id()
      case 'created_at':
        return fieldPresets.createdAt(labels?.created_at)
      case 'updated_at':
        return fieldPresets.updatedAt(labels?.updated_at)
      case 'user_id':
        return fieldPresets.userId()
      case 'is_active':
        return fieldPresets.isActive(labels?.is_active)
      default:
        throw new Error(`Unknown system field: ${fieldName}`)
    }
  })
}
