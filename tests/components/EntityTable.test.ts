import { describe, it, expect, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'

// ---- Mocks (must be before the component import) ----
// EntityTable is presentational (labels are pre-translated by the caller) but may
// pull default strings via useTranslations; stub it to echo keys, matching the
// EntityModal test harness.

vi.mock('../../src/i18n', () => {
  const { createI18n } = require('vue-i18n')
  const instance = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
  return { default: instance }
})

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: { value: 'en' } }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: { value: 'en' } }),
}))

import EntityTable from '../../src/components/Generic/EntityTable.vue'
import type { TableColumn } from '../../src/utils/tableColumns'

const columns: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role' }, // non-sortable
]

const rows = [
  { id: '1', name: 'Zoe', role: 'admin' },
  { id: '2', name: 'Amy', role: 'user' },
  { id: '3', name: 'Bob', role: 'user' },
]

function mountTable(props: Record<string, any> = {}, options: Record<string, any> = {}) {
  return mount(EntityTable, { props: { columns, rows, ...props }, ...options })
}

describe('EntityTable — structure', () => {
  it('uses the ocf-entity-table root class', () => {
    const wrapper = mountTable()
    expect(wrapper.classes()).toContain('ocf-entity-table')
  })

  it('renders one row per data item, in input order', () => {
    const wrapper = mountTable()
    const trs = wrapper.findAll('tbody tr')
    expect(trs).toHaveLength(3)
    expect(trs[0].text()).toContain('Zoe')
  })

  it('renders no Add / Import / Export toolbar actions', () => {
    const wrapper = mountTable()
    expect(wrapper.text()).not.toMatch(/Add|Import|Export/i)
  })
})

describe('EntityTable — sorting', () => {
  it('marks a sortable header with data-sort and reorders rows on click', async () => {
    const wrapper = mountTable()

    const header = wrapper.find('[data-sort="name"]')
    expect(header.exists()).toBe(true)
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Zoe')

    await header.trigger('click')

    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Amy')
  })

  it('does not mark a non-sortable column header as sortable', () => {
    const wrapper = mountTable()
    expect(wrapper.find('[data-sort="role"]').exists()).toBe(false)
  })
})

describe('EntityTable — search', () => {
  it('renders no search input unless searchable', () => {
    const wrapper = mountTable()
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('renders a search input with the given placeholder when searchable', () => {
    const wrapper = mountTable({ searchable: true, searchPlaceholder: 'Find a user' })
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('Find a user')
  })

  it('filters the visible rows by the search query', async () => {
    const wrapper = mountTable({ searchable: true })

    await wrapper.find('input').setValue('Amy')

    const trs = wrapper.findAll('tbody tr')
    expect(trs).toHaveLength(1)
    expect(trs[0].text()).toContain('Amy')
  })
})

describe('EntityTable — loading and error states', () => {
  it('does not render data rows while loading', () => {
    const wrapper = mountTable({ loading: true })
    expect(wrapper.text()).not.toContain('Zoe')
  })

  it('shows the error message when the error prop is set', () => {
    const wrapper = mountTable({ error: 'Boom happened' })
    expect(wrapper.text()).toContain('Boom happened')
  })
})

describe('EntityTable — empty state', () => {
  it('renders the #empty slot when there are no rows', () => {
    const wrapper = mount(EntityTable, {
      props: { columns, rows: [] },
      slots: { empty: '<div class="my-empty">Nothing here</div>' },
    })
    expect(wrapper.find('.my-empty').exists()).toBe(true)
  })

  it('falls back to emptyText when no #empty slot is given', () => {
    const wrapper = mount(EntityTable, {
      props: { columns, rows: [], emptyText: 'No records found' },
    })
    expect(wrapper.text()).toContain('No records found')
  })
})

describe('EntityTable — cell rendering', () => {
  it('renders the column.format output in the default cell', () => {
    const fmtColumns: TableColumn[] = [
      { key: 'name', label: 'Name', format: (v) => `<<${v}>>` },
    ]
    const wrapper = mount(EntityTable, {
      props: { columns: fmtColumns, rows: [{ id: '1', name: 'Zoe' }] },
    })
    expect(wrapper.find('tbody tr').text()).toContain('<<Zoe>>')
  })

  it('renders a #cell-{key} slot receiving { row, value, column }', () => {
    const wrapper = mount(EntityTable, {
      props: { columns, rows },
      slots: {
        'cell-name': ({ row, value, column }: any) =>
          h('span', { class: 'custom-cell' }, `${value}|${column.key}|${row.id}`),
      },
    })
    const cells = wrapper.findAll('.custom-cell')
    expect(cells).toHaveLength(3)
    expect(cells[0].text()).toBe('Zoe|name|1')
  })
})

describe('EntityTable — row actions', () => {
  it('renders an Actions column only when the #row-actions slot is provided', () => {
    const withActions = mount(EntityTable, {
      props: { columns, rows },
      slots: { 'row-actions': ({ row }: any) => h('button', { class: 'act' }, row.id) },
    })
    expect(withActions.findAll('button.act')).toHaveLength(3)
    expect(withActions.findAll('thead th')).toHaveLength(columns.length + 1)
  })

  it('renders no Actions column without the #row-actions slot', () => {
    const wrapper = mountTable()
    expect(wrapper.findAll('thead th')).toHaveLength(columns.length)
  })
})

describe('EntityTable — count', () => {
  it('shows the row count only when showCount is set', () => {
    // 3 rows; no data cell contains the digit "3", so its presence proves the count.
    const withCount = mountTable({ showCount: true })
    expect(withCount.text()).toContain('3')

    const without = mountTable()
    expect(without.text()).not.toContain('3')
  })
})
