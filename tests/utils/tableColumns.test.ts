import { describe, it, expect } from 'vitest'
import { columnsFromFieldList } from '../../src/utils/tableColumns'
import { buildFieldList, field } from '../../src/utils/fieldBuilder'

/**
 * Contract for `columnsFromFieldList(fieldList)`:
 *   - only fields with display===true become columns
 *   - insertion order of the fieldList Map is preserved
 *   - column.key = field name, column.label = field.label
 *   - column.format is derived from field.displayValue when present, else undefined
 */
describe('columnsFromFieldList', () => {
  it('maps only display===true fields, preserving field order', () => {
    const fieldList = buildFieldList([
      field('id').hidden(),
      field('name', 'Full name'),
      field('secret').hidden(),
      field('role', 'Role'),
    ])

    const columns = columnsFromFieldList(fieldList)

    expect(columns.map((c) => c.key)).toEqual(['name', 'role'])
  })

  it('carries the field label onto the column', () => {
    const fieldList = buildFieldList([field('email', 'Email address')])

    const [column] = columnsFromFieldList(fieldList)

    expect(column.key).toBe('email')
    expect(column.label).toBe('Email address')
  })

  it('derives column.format from field.displayValue when present', () => {
    const fieldList = buildFieldList([
      field('created', 'Created').withDisplayFormatter((v) => `D:${v}`),
    ])

    const [column] = columnsFromFieldList(fieldList)

    expect(column.format).toBeTypeOf('function')
    expect(column.format!('2024-01-01', {})).toBe('D:2024-01-01')
  })

  it('leaves column.format undefined when the field has no displayValue', () => {
    const fieldList = buildFieldList([field('name', 'Name')])

    const [column] = columnsFromFieldList(fieldList)

    expect(column.format).toBeUndefined()
  })
})
