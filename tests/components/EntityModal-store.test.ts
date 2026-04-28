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

import { mountEntityModal } from '../helpers/entityModalHelper'

describe('EntityModal — store integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('edit mode (entity prop provided)', () => {
    it('populates input values from entity data', async () => {
      // Mount hidden first, then toggle visible to trigger the watch
      const wrapper = mountEntityModal({
        visible: false,
        entity: { id: '1', name: 'Existing Name', description: 'Existing Desc', status: 'inactive', is_active: true }
      })
      await wrapper.setProps({ visible: true })
      await nextTick()

      const nameInput = wrapper.find('input#name')
      expect((nameInput.element as HTMLInputElement).value).toBe('Existing Name')

      const descTextarea = wrapper.find('textarea#description')
      expect((descTextarea.element as HTMLTextAreaElement).value).toBe('Existing Desc')
    })

    it('populates select value from entity data', async () => {
      const wrapper = mountEntityModal({
        visible: false,
        entity: { id: '1', name: 'Test', description: '', status: 'inactive', is_active: false }
      })
      await wrapper.setProps({ visible: true })
      await nextTick()

      const selectEl = wrapper.find('select#status')
      expect((selectEl.element as HTMLSelectElement).value).toBe('inactive')
    })

    it('populates checkbox from entity data', async () => {
      const wrapper = mountEntityModal({
        visible: false,
        entity: { id: '1', name: 'Test', description: '', status: 'active', is_active: true }
      })
      await wrapper.setProps({ visible: true })
      await nextTick()

      const checkbox = wrapper.find('input#is_active')
      expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('form submission', () => {
    it('emits submit with form data in create mode', async () => {
      const wrapper = mountEntityModal()

      // Fill in required field
      await wrapper.find('input#name').setValue('New Entity')
      await wrapper.find('textarea#description').setValue('A description')

      // Select a status
      const select = wrapper.find('select#status')
      await select.setValue('active')

      // Click confirm
      const confirmBtn = wrapper.find('.btn-primary')
      await confirmBtn.trigger('click')
      await nextTick()

      const emitted = wrapper.emitted('submit')
      expect(emitted).toBeDefined()
      expect(emitted!.length).toBe(1)

      const formData = emitted![0][0] as Record<string, any>
      expect(formData.name).toBe('New Entity')
      expect(formData.description).toBe('A description')
      expect(formData.status).toBe('active')
    })

    it('emits modify with form data in edit mode (includes entity id)', async () => {
      const wrapper = mountEntityModal({
        entity: { id: 'entity-42', name: 'Old Name', description: 'Old Desc', status: 'active', is_active: false }
      })
      await nextTick()

      // Modify the name
      await wrapper.find('input#name').setValue('Updated Name')

      const confirmBtn = wrapper.find('.btn-primary')
      await confirmBtn.trigger('click')
      await nextTick()

      const emitted = wrapper.emitted('modify')
      expect(emitted).toBeDefined()
      expect(emitted!.length).toBe(1)

      const formData = emitted![0][0] as Record<string, any>
      expect(formData.id).toBe('entity-42')
      expect(formData.name).toBe('Updated Name')
    })

    it('does not include id in create mode submit data', async () => {
      const wrapper = mountEntityModal()

      await wrapper.find('input#name').setValue('New Item')

      const confirmBtn = wrapper.find('.btn-primary')
      await confirmBtn.trigger('click')
      await nextTick()

      const emitted = wrapper.emitted('submit')
      expect(emitted).toBeDefined()
      const formData = emitted![0][0] as Record<string, any>
      expect(formData.id).toBeUndefined()
    })
  })
})
