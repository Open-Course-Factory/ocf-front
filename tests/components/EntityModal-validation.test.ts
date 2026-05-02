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

import { basicFieldList, createMockStore, mountEntityModal } from '../helpers/entityModalHelper'

describe('EntityModal — validation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('required fields', () => {
    it('shows required mark (*) on required field labels', () => {
      const wrapper = mountEntityModal()
      const requiredMarks = wrapper.findAll('.required-mark')
      // 'name' is the only required field
      expect(requiredMarks.length).toBeGreaterThanOrEqual(1)
    })

    it('shows required legend when there are required fields', () => {
      const wrapper = mountEntityModal()
      const legend = wrapper.find('.required-legend')
      expect(legend.exists()).toBe(true)
      expect(legend.text()).toContain('Required field')
    })

    it('does not show required legend when no required fields', () => {
      const fieldList = new Map([
        ['name', { label: 'Name', type: 'input', toBeSet: true, toBeEdited: true, required: false }]
      ])
      const store = createMockStore({ fieldList })
      const wrapper = mountEntityModal({ entityStore: store })
      expect(wrapper.find('.required-legend').exists()).toBe(false)
    })
  })

  describe('validation', () => {
    it('shows validation error when required field is empty on submit', async () => {
      const wrapper = mountEntityModal()

      // Name is required and starts empty -- trigger confirm via BaseModal
      const confirmBtn = wrapper.find('.btn-primary')
      await confirmBtn.trigger('click')
      await nextTick()

      const invalidFeedback = wrapper.findAll('.invalid-feedback')
      expect(invalidFeedback.length).toBeGreaterThanOrEqual(1)
      // Should contain error for the 'name' field
      expect(invalidFeedback[0].text()).toContain('is required')
    })

    it('does not emit submit when validation fails', async () => {
      const wrapper = mountEntityModal()

      const confirmBtn = wrapper.find('.btn-primary')
      await confirmBtn.trigger('click')
      await nextTick()

      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('shows name uniqueness error when name already exists', async () => {
      const store = createMockStore({
        fieldList: basicFieldList,
        entities: [{ id: '2', name: 'ExistingName' }]
      })
      const wrapper = mountEntityModal({ entityStore: store })

      // Set name to existing name
      const nameInput = wrapper.find('input#name')
      await nameInput.setValue('ExistingName')

      const confirmBtn = wrapper.find('.btn-primary')
      await confirmBtn.trigger('click')
      await nextTick()

      const feedback = wrapper.findAll('.invalid-feedback')
      const nameError = feedback.find(f => f.text().includes('already used'))
      expect(nameError).toBeDefined()
    })
  })
})
