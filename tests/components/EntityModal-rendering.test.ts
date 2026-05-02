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

  describe('visibility', () => {
    it('renders when visible is true', () => {
      const wrapper = mountEntityModal({ visible: true })
      expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)
    })

    it('does not render when visible is false', () => {
      const wrapper = mountEntityModal({ visible: false })
      expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)
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
    it('renders input for type="input"', () => {
      const wrapper = mountEntityModal()
      const nameInput = wrapper.find('input#name')
      expect(nameInput.exists()).toBe(true)
    })

    it('renders textarea for type="textarea"', () => {
      const wrapper = mountEntityModal()
      const textarea = wrapper.find('textarea#description')
      expect(textarea.exists()).toBe(true)
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

    it('renders checkbox for type="checkbox"', () => {
      const wrapper = mountEntityModal()
      const checkbox = wrapper.find('input#is_active')
      expect(checkbox.exists()).toBe(true)
      expect(checkbox.attributes('type')).toBe('checkbox')
    })

    it('renders number input for type="number"', () => {
      const fieldList = new Map([
        ['count', {
          label: 'Count',
          type: 'number',
          toBeSet: true,
          toBeEdited: true,
          min: 0,
          max: 100,
          step: 1
        }]
      ])
      const store = createMockStore({ fieldList })
      const wrapper = mountEntityModal({ entityStore: store })

      const numInput = wrapper.find('input#count')
      expect(numInput.exists()).toBe(true)
      expect(numInput.attributes('type')).toBe('number')
      expect(numInput.attributes('min')).toBe('0')
      expect(numInput.attributes('max')).toBe('100')
    })

    it('renders date input for type="date"', () => {
      const fieldList = new Map([
        ['start_date', {
          label: 'Start Date',
          type: 'date',
          toBeSet: true,
          toBeEdited: true
        }]
      ])
      const store = createMockStore({ fieldList })
      const wrapper = mountEntityModal({ entityStore: store })

      const dateInput = wrapper.find('input#start_date')
      expect(dateInput.exists()).toBe(true)
      expect(dateInput.attributes('type')).toBe('date')
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

  describe('footer buttons', () => {
    it('shows "Add" button text in create mode', () => {
      const wrapper = mountEntityModal()
      const confirmBtn = wrapper.find('.btn-primary')
      expect(confirmBtn.text()).toContain('Add')
    })

    it('shows "Modify" button text in edit mode', () => {
      const wrapper = mountEntityModal({
        entity: { id: '1', name: 'Test', description: '', status: '', is_active: false }
      })
      const confirmBtn = wrapper.find('.btn-primary')
      expect(confirmBtn.text()).toContain('Modify')
    })

    it('shows "Cancel" button text', () => {
      const wrapper = mountEntityModal()
      const cancelBtn = wrapper.find('.btn-secondary')
      expect(cancelBtn.text()).toContain('Cancel')
    })
  })
})
