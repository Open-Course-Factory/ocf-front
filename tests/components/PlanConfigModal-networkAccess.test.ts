/**
 * Tests for the network-access toggle in PlanConfigModal.
 *
 * network_access_enabled is a dedicated column on the plan. The modal had no
 * UI for it — handleSave always re-sent whatever the plan already had
 * (preservedBoolean), so an admin editing a plan had no control that could
 * actually flip it. These tests pin that the toggle renders, reflects a
 * loaded plan, and round-trips into the emitted save payload.
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

describe('PlanConfigModal — network access', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the network access toggle', async () => {
    const wrapper = await mountModal()
    await flushPromises()

    expect(wrapper.find('[data-test="plan-network-access-toggle"]').exists()).toBe(true)
  })

  it('reflects a loaded plan into the toggle', async () => {
    const wrapper = await mountModal({
      id: 'plan-1',
      name: 'Networked',
      max_cpu: 1000,
      max_memory_mb: 512,
      features: [],
      network_access_enabled: true
    })
    await flushPromises()

    const toggle = wrapper.find('[data-test="plan-network-access-toggle"]').element as HTMLInputElement
    expect(toggle.checked).toBe(true)
  })

  it('defaults the toggle to unchecked for a new plan', async () => {
    const wrapper = await mountModal()
    await flushPromises()

    const toggle = wrapper.find('[data-test="plan-network-access-toggle"]').element as HTMLInputElement
    expect(toggle.checked).toBe(false)
  })

  it('carries a checked toggle into the save payload', async () => {
    const wrapper = await mountModal()
    await flushPromises()

    await wrapper.find('#plan-name').setValue('New Plan')
    await wrapper.find('[data-test="plan-network-access-toggle"]').setValue(true)
    await nextTick()

    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload.network_access_enabled).toBe(true)
  })

  it('can turn network access back off on an existing plan and have it stick', async () => {
    const wrapper = await mountModal({
      id: 'plan-1',
      name: 'Networked',
      max_cpu: 1000,
      max_memory_mb: 512,
      features: [],
      network_access_enabled: true
    })
    await flushPromises()

    await wrapper.find('[data-test="plan-network-access-toggle"]').setValue(false)
    await nextTick()
    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload.network_access_enabled).toBe(false)
  })
})

describe('PlanConfigModal — data persistence', () => {
  const persistentPlan = {
    id: 'plan-1',
    name: 'Persistent',
    max_cpu: 1000,
    max_memory_mb: 512,
    features: [],
    network_access_enabled: true,
    data_persistence_enabled: true
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('reflects a loaded plan into the toggle', async () => {
    const wrapper = await mountModal(persistentPlan)

    const toggle = wrapper.find('[data-test="plan-data-persistence-toggle"]').element as HTMLInputElement
    expect(toggle.checked).toBe(true)
  })

  it('turns data persistence off without touching network access', async () => {
    const wrapper = await mountModal(persistentPlan)

    await wrapper.find('[data-test="plan-data-persistence-toggle"]').setValue(false)
    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload.data_persistence_enabled).toBe(false)
    expect(payload.network_access_enabled).toBe(true)
    expect(payload.name).toBe('Persistent')
  })

  it('keeps data persistence on when another toggle is edited', async () => {
    const wrapper = await mountModal(persistentPlan)

    await wrapper.find('[data-test="plan-network-access-toggle"]').setValue(false)
    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload.data_persistence_enabled).toBe(true)
  })
})
