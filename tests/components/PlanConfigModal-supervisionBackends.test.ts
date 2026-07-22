/**
 * Tests for the supervision toggle + backend-routing inputs in PlanConfigModal.
 *
 * These fields are persisted as dedicated columns on the plan
 * (session_supervision_enabled, default_backend, allowed_backends). The modal
 * historically had no UI for them; these tests pin that the toggle/inputs
 * render, reflect a loaded plan, and round-trip into the emitted save payload
 * (the field-loss lesson: assert the payload, not spy calls).
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

describe('PlanConfigModal — supervision & backend routing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the supervision toggle and backend inputs', async () => {
    const wrapper = await mountModal()
    await flushPromises()

    expect(wrapper.find('[data-test="plan-supervision-toggle"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="plan-default-backend"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="plan-allowed-backends"]').exists()).toBe(true)
  })

  it('reflects a loaded plan into the toggle and backend inputs', async () => {
    const wrapper = await mountModal({
      id: 'plan-1',
      name: 'Supervised',
      max_cpu: 0,
      max_memory_mb: 0,
      features: [],
      session_supervision_enabled: true,
      default_backend: 'incus-a',
      allowed_backends: ['incus-a', 'incus-b']
    })
    await flushPromises()

    const toggle = wrapper.find('[data-test="plan-supervision-toggle"]')
      .element as HTMLInputElement
    expect(toggle.checked).toBe(true)

    const defaultBackend = wrapper.find('[data-test="plan-default-backend"]')
      .element as HTMLInputElement
    expect(defaultBackend.value).toBe('incus-a')

    const allowed = wrapper.find('[data-test="plan-allowed-backends"]')
      .element as HTMLTextAreaElement
    expect(allowed.value).toBe('incus-a\nincus-b')
  })

  it('carries the supervision flag and backend routing into the save payload', async () => {
    const wrapper = await mountModal()
    await flushPromises()

    await wrapper.find('#plan-name').setValue('New Plan')
    await wrapper.find('[data-test="plan-supervision-toggle"]').setValue(true)
    await wrapper.find('[data-test="plan-default-backend"]').setValue('incus-main')
    await wrapper.find('[data-test="plan-allowed-backends"]').setValue('incus-main\nincus-edge\n')
    await nextTick()

    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const emitted = wrapper.emitted('save')
    expect(emitted).toBeTruthy()
    const payload = emitted![0][0] as any
    expect(payload.session_supervision_enabled).toBe(true)
    expect(payload.default_backend).toBe('incus-main')
    // Newline-separated textarea → trimmed, empty-line-filtered string[].
    expect(payload.allowed_backends).toEqual(['incus-main', 'incus-edge'])
  })

  it('defaults supervision off and backend lists empty for a new plan', async () => {
    const wrapper = await mountModal()
    await flushPromises()

    await wrapper.find('#plan-name').setValue('Plain Plan')
    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload.session_supervision_enabled).toBe(false)
    expect(payload.default_backend).toBe('')
    expect(payload.allowed_backends).toEqual([])
  })
})
