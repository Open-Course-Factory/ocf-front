/**
 * The plan's setting for machines in the learner's browser: off (the default),
 * allowed for scenarios set to Local, or also the default for scenarios set to
 * By account. (Harness from PlanConfigModal-networkAccess.test.ts.)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// ---- Mocks (must be before component import) ----

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
  handleStoreError: vi.fn((_err: any, fallbackKey: string) => fallbackKey)
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

import PlanConfigModal from '../../src/components/Modals/PlanConfigModal.vue'

async function mountModal(plan: any = null) {
  const wrapper = mount(PlanConfigModal, {
    props: { visible: false, plan },
    global: {
      stubs: {
        BaseModal: {
          props: ['visible', 'title', 'titleIcon', 'size'],
          template: '<div class="base-modal-stub"><slot /><div class="footer-slot"><slot name="footer" /></div></div>'
        }
      }
    }
  })
  await wrapper.setProps({ visible: true })
  await flushPromises()
  return wrapper
}

describe('PlanConfigModal — local machines', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('offers the three settings, off for a new plan', async () => {
    const wrapper = await mountModal()
    const select = wrapper.find('[data-test="plan-local-machines"]')
    expect(select.exists()).toBe(true)
    expect(select.findAll('option').map(o => o.attributes('value'))).toEqual(['off', 'allowed', 'by_account_default'])
    expect((select.element as HTMLSelectElement).value).toBe('off')
  })

  it('reflects a loaded plan', async () => {
    const wrapper = await mountModal({ id: 'plan-1', name: 'Local', max_cpu: 1000, max_memory_mb: 512, features: [], local_machines: 'allowed' })
    expect((wrapper.find('[data-test="plan-local-machines"]').element as HTMLSelectElement).value).toBe('allowed')
  })

  it('carries the setting into the save payload', async () => {
    const wrapper = await mountModal()
    await wrapper.find('#plan-name').setValue('New Plan')
    await wrapper.find('[data-test="plan-local-machines"]').setValue('by_account_default')
    await nextTick()
    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload.local_machines).toBe('by_account_default')
  })
})
