import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// ---- Mocks (must be before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((err: any, fallbackKey: string) => fallbackKey)
}))

vi.mock('../../src/i18n', () => {
  const { createI18n } = require('vue-i18n')
  const instance = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
  return { default: instance }
})

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: (messages: any) => {
    const flatMap: Record<string, string> = {}
    function flatten(obj: any, prefix: string) {
      for (const key of Object.keys(obj)) {
        const val = obj[key]
        const path = prefix ? `${prefix}.${key}` : key
        if (typeof val === 'string') {
          flatMap[path] = val
        } else if (typeof val === 'object' && val !== null) {
          flatten(val, path)
        }
      }
    }
    if (messages?.en) flatten(messages.en, '')
    return {
      t: (key: string, params?: any) => {
        let result = flatMap[key] || key
        if (params) {
          Object.keys(params).forEach(k => {
            result = result.replace(`{${k}}`, params[k])
          })
        }
        return result
      },
      te: () => true,
      locale: { value: 'en' }
    }
  },
  useStoreTranslations: () => ({
    t: (key: string) => key,
    te: () => true,
    locale: { value: 'en' }
  })
}))

import { createMockStore, mountEntityModal } from '../helpers/entityModalHelper'

describe('EntityModal — rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // EntityModal forwards these to BaseModal; nothing else pins the wiring.
  describe('what it hands to BaseModal', () => {
    it('stays closed while visible is false', () => {
      expect(mountEntityModal({ visible: false }).find('[role="dialog"]').exists()).toBe(false)
    })

    it('labels the footer buttons Add or Modify, and Cancel', () => {
      const create = mountEntityModal()
      expect(create.find('.base-modal-footer .btn-primary').text()).toContain('Add')
      expect(create.find('.base-modal-footer .btn-secondary').text()).toContain('Cancel')

      const edit = mountEntityModal({
        entity: { id: '1', name: 'Test', description: '', status: '', is_active: false }
      })
      expect(edit.find('.base-modal-footer .btn-primary').text()).toContain('Modify')
    })
  })

  describe('create mode (no entity prop)', () => {
    it('shows title "Add" in create mode', () => {
      const wrapper = mountEntityModal()
      expect(wrapper.find('.base-modal-title').text()).toContain('Add')
    })

    it('renders fields with toBeSet=true', () => {
      const wrapper = mountEntityModal()
      const formGroups = wrapper.findAll('.form-group')
      // All 4 fields have toBeSet=true
      expect(formGroups.length).toBe(4)
    })

    it('does not show fields with toBeSet=false', () => {
      const fieldList = new Map([
        ['name', { label: 'Name', type: 'input', toBeSet: true, toBeEdited: true, required: true }],
        ['hidden_field', { label: 'Hidden', type: 'input', toBeSet: false, toBeEdited: true }]
      ])
      const store = createMockStore({ fieldList })
      const wrapper = mountEntityModal({ entityStore: store })

      const formGroups = wrapper.findAll('.form-group')
      // Only 'name' should be visible in create mode
      expect(formGroups.length).toBe(1)
    })
  })

  describe('edit mode (entity prop provided)', () => {
    it('shows title "Modify" in edit mode', async () => {
      const wrapper = mountEntityModal({
        entity: { id: '1', name: 'Test', description: 'Desc', status: 'active', is_active: true }
      })
      await nextTick()
      expect(wrapper.find('.base-modal-title').text()).toContain('Modify')
    })

    it('renders fields with toBeEdited=true', async () => {
      const fieldList = new Map([
        ['name', { label: 'Name', type: 'input', toBeSet: true, toBeEdited: true, required: true }],
        ['readonly_field', { label: 'Read Only', type: 'input', toBeSet: true, toBeEdited: false }]
      ])
      const store = createMockStore({ fieldList })
      const wrapper = mountEntityModal({
        entityStore: store,
        entity: { id: '1', name: 'Test', readonly_field: 'Value' }
      })
      await nextTick()

      const formGroups = wrapper.findAll('.form-group')
      // Only 'name' should be visible in edit mode (readonly_field has toBeEdited=false)
      expect(formGroups.length).toBe(1)
    })
  })

  describe('field types', () => {
    it.each([
      ['input', 'input#field'],
      ['textarea', 'textarea#field'],
      ['checkbox', 'input#field[type="checkbox"]'],
      ['number', 'input#field[type="number"][min="0"][max="100"]'],
      ['date', 'input#field[type="date"]']
    ])('renders type "%s" as %s', (type, selector) => {
      const fieldList = new Map([
        ['field', { label: 'Field', type, toBeSet: true, toBeEdited: true, min: 0, max: 100, step: 1 }]
      ])
      const wrapper = mountEntityModal({ entityStore: createMockStore({ fieldList }) })

      expect(wrapper.find(selector).exists()).toBe(true)
    })

    it('renders select with options for type="select"', () => {
      const wrapper = mountEntityModal()
      const select = wrapper.find('select#status')
      expect(select.exists()).toBe(true)

      const options = select.findAll('option')
      // 1 placeholder + 2 real options = 3
      expect(options.length).toBe(3)
      expect(options[1].text()).toBe('Active')
      expect(options[2].text()).toBe('Inactive')
    })
  })

  describe('close', () => {
    it('emits close when cancel button is clicked', async () => {
      const wrapper = mountEntityModal()

      const cancelBtn = wrapper.find('.btn-secondary')
      await cancelBtn.trigger('click')
      await nextTick()

      expect(wrapper.emitted('close')).toBeDefined()
      expect(wrapper.emitted('close')!.length).toBe(1)
    })

    it('emits close when close button (X) is clicked', async () => {
      const wrapper = mountEntityModal()

      const closeBtn = wrapper.find('.base-modal-close')
      await closeBtn.trigger('click')
      await nextTick()

      expect(wrapper.emitted('close')).toBeDefined()
    })
  })

  describe('checkbox label handling', () => {
    it('renders label inside checkbox wrapper (not before)', () => {
      const wrapper = mountEntityModal()
      const checkboxWrapper = wrapper.find('.checkbox-wrapper')
      expect(checkboxWrapper.exists()).toBe(true)

      const label = checkboxWrapper.find('.checkbox-label')
      expect(label.exists()).toBe(true)
      expect(label.text()).toContain('Active')
    })
  })

  describe('subentity fields', () => {
    it('does not render subentity type fields in the main form', () => {
      const fieldList = new Map([
        ['name', { label: 'Name', type: 'input', toBeSet: true, toBeEdited: true, required: true }],
        ['items', { label: 'Items', type: 'subentity', toBeSet: true, toBeEdited: true }]
      ])
      const store = createMockStore({ fieldList })
      const wrapper = mountEntityModal({ entityStore: store })

      // Only name should render (subentity is excluded from the main template loop)
      const formGroups = wrapper.findAll('.form-group')
      expect(formGroups.length).toBe(1)
    })
  })
})

describe('EntityModal — sub-entity picker', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('offers the sub-entity store\'s choices in a filterable select bound to the field', async () => {
    const fieldList = new Map([
      ['theme_id', { label: 'Theme', type: 'input', toBeSet: true, toBeEdited: true }]
    ])
    const themes = { selectDatas: [{ text: 'Dark', value: 't1' }, { text: 'Light', value: 't2' }] }
    const store = createMockStore({ fieldList, subEntitiesStores: new Map([['theme_id', themes]]) })
    const wrapper = mountEntityModal({ entityStore: store })
    await nextTick()

    const select = wrapper.findComponent({ name: 'ElSelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('filterable')).toBe(true)
    const options = wrapper.findAllComponents({ name: 'ElOption' })
    expect(options.map(o => [o.props('label'), o.props('value')])).toEqual([['Dark', 't1'], ['Light', 't2']])
  })
})
