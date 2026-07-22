/**
 * Contract tests for the backend PICKER in PlanConfigModal (feat/plan-backend-picker).
 *
 * The backend-routing fields used to be free text: a plain <input> for the
 * default backend and a newline-separated <textarea> for the allowed list.
 * This meant an admin could type a backend id that does not exist. The feature
 * feeds both fields from terminalService.getBackends() instead:
 *
 *   - default backend  -> <select data-test="plan-default-backend"> with one
 *                         option per backend plus an empty "platform default".
 *   - allowed backends -> a checkbox list (one
 *                         <input type="checkbox" data-test="plan-allowed-backend-option">
 *                         per backend); checked boxes become the allowed_backends
 *                         array on save; none checked = [] (= all allowed).
 *
 * If getBackends() rejects, the modal falls back to the old free-text input +
 * textarea so admins are never blocked by a backend outage.
 *
 * These assert on rendered DOM and on the emitted save payload (the field-loss
 * lesson: round-trip the field through the write, never spy call counts).
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

// terminalService.getBackends() is the new data source for both fields.
const backendMocks = vi.hoisted(() => ({
  getBackends: vi.fn()
}))

vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    getBackends: backendMocks.getBackends
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

// id === name so the test does not over-specify which Backend field the picker
// keys its option/checkbox value on — both round-trip the same string into the
// persisted default_backend / allowed_backends columns.
const BACKENDS = [
  { id: 'incus-prod', name: 'incus-prod', description: '', connected: true, is_default: false, is_active: true },
  { id: 'incus-lab', name: 'incus-lab', description: '', connected: true, is_default: false, is_active: true }
]

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

// The allowed-backend checkbox whose bound value is `value`, or undefined.
function allowedCheckbox(wrapper: any, value: string) {
  return wrapper
    .findAll('[data-test="plan-allowed-backend-option"]')
    .find((w: any) => (w.element as HTMLInputElement).value === value)
}

describe('PlanConfigModal — backend picker', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    backendMocks.getBackends.mockResolvedValue(BACKENDS)
  })

  it('renders the default-backend select with one option per backend plus an empty platform-default option', async () => {
    const wrapper = await mountModal()
    await flushPromises()

    const select = wrapper.find('select[data-test="plan-default-backend"]')
    expect(select.exists()).toBe(true)

    const values = select.findAll('option').map(o => (o.element as HTMLOptionElement).value)
    // One empty (platform default) + one per backend.
    expect(values).toContain('')
    expect(values).toContain('incus-prod')
    expect(values).toContain('incus-lab')
    expect(values).toHaveLength(3)
  })

  it('renders one allowed-backend checkbox per backend and pre-checks exactly the plan allowed_backends', async () => {
    const wrapper = await mountModal({
      id: 'plan-1',
      name: 'Routed',
      max_cpu: 0,
      max_memory_mb: 0,
      default_backend: '',
      allowed_backends: ['incus-lab']
    })
    await flushPromises()

    const boxes = wrapper.findAll('input[type="checkbox"][data-test="plan-allowed-backend-option"]')
    expect(boxes).toHaveLength(2)

    const checked = boxes
      .filter(b => (b.element as HTMLInputElement).checked)
      .map(b => (b.element as HTMLInputElement).value)
    expect(checked).toEqual(['incus-lab'])
  })

  it('checking a second backend saves an allowed_backends array with both values', async () => {
    const wrapper = await mountModal({
      id: 'plan-1',
      name: 'Routed',
      max_cpu: 0,
      max_memory_mb: 0,
      default_backend: '',
      allowed_backends: ['incus-lab']
    })
    await flushPromises()

    await allowedCheckbox(wrapper, 'incus-prod')!.setValue(true)
    await nextTick()

    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    // Order-insensitive: the box order in the DOM should not leak into the contract.
    expect([...payload.allowed_backends].sort()).toEqual(['incus-lab', 'incus-prod'])
  })

  it('unchecking every backend saves an empty allowed_backends array (empty = all allowed)', async () => {
    const wrapper = await mountModal({
      id: 'plan-1',
      name: 'Routed',
      max_cpu: 0,
      max_memory_mb: 0,
      default_backend: '',
      allowed_backends: ['incus-lab']
    })
    await flushPromises()

    await allowedCheckbox(wrapper, 'incus-lab')!.setValue(false)
    await nextTick()

    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload.allowed_backends).toEqual([])
  })

  it('falls back to free-text input + textarea when getBackends rejects, and still round-trips typed values', async () => {
    backendMocks.getBackends.mockRejectedValue(new Error('backend service down'))

    const wrapper = await mountModal()
    await flushPromises()

    // No picker widgets when the backend list could not be loaded.
    expect(wrapper.find('select[data-test="plan-default-backend"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="plan-allowed-backend-option"]').exists()).toBe(false)

    // The old free-text controls are the fallback.
    const defaultInput = wrapper.find('input[data-test="plan-default-backend"]')
    const allowedTextarea = wrapper.find('textarea[data-test="plan-allowed-backends"]')
    expect(defaultInput.exists()).toBe(true)
    expect(allowedTextarea.exists()).toBe(true)

    await wrapper.find('#plan-name').setValue('Manual Plan')
    await defaultInput.setValue('incus-main')
    await allowedTextarea.setValue('incus-main\nincus-edge\n')
    await nextTick()

    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload.default_backend).toBe('incus-main')
    expect(payload.allowed_backends).toEqual(['incus-main', 'incus-edge'])
  })
})
