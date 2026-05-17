/**
 * Tests for the admin size-quota composer in PlanConfigModal.
 *
 * The composer lets an admin describe a plan in size-count language
 * ("students can spawn 1 L OR 2 M"); the frontend computes the raw
 * `max_cpu` + `max_memory_mb` budget (D7 max() semantics) before saving.
 *
 * Assertions target rendered DOM and emitted payloads — no spy-call checks.
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

// Mock planFeatures store — no features needed for these tests; the budget
// composer is independent of plan-features catalog rows.
vi.mock('../../src/stores/planFeatures', () => ({
  usePlanFeaturesStore: () => ({
    entities: [],
    featuresByCategory: {},
    ensureFeaturesLoaded: vi.fn().mockResolvedValue(undefined)
  })
}))

import PlanConfigModal from '../../src/components/Modals/PlanConfigModal.vue'

function mountModal(plan: any = null) {
  return mount(PlanConfigModal, {
    props: { visible: true, plan },
    global: {
      stubs: {
        BaseModal: {
          props: ['visible', 'title', 'titleIcon', 'size'],
          template: '<div class="base-modal-stub"><slot /><div class="footer-slot"><slot name="footer" /></div></div>'
        }
      }
    }
  })
}

describe('PlanConfigModal — size-quota composer (budget mode)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the size-quota composer when quota model is budget', async () => {
    const wrapper = mountModal()
    await flushPromises()

    // Default new plan starts in budget mode → composer visible.
    const composer = wrapper.find('[data-test="size-quota-composer"]')
    expect(composer.exists()).toBe(true)

    // At least one default row is rendered so the admin can start editing.
    const rows = wrapper.findAll('[data-test="size-quota-row"]')
    expect(rows.length).toBeGreaterThanOrEqual(1)
  })

  it('appends a new row when the admin clicks "Add row"', async () => {
    const wrapper = mountModal()
    await flushPromises()

    const before = wrapper.findAll('[data-test="size-quota-row"]').length
    await wrapper.find('[data-test="size-quota-add-row"]').trigger('click')
    await nextTick()
    const after = wrapper.findAll('[data-test="size-quota-row"]').length

    expect(after).toBe(before + 1)
  })

  it('removes a row when the admin clicks "Remove" on that row', async () => {
    const wrapper = mountModal()
    await flushPromises()

    // Add a second row so we have at least 2 before deleting one.
    await wrapper.find('[data-test="size-quota-add-row"]').trigger('click')
    await nextTick()

    const before = wrapper.findAll('[data-test="size-quota-row"]').length
    await wrapper.findAll('[data-test="size-quota-remove-row"]')[0].trigger('click')
    await nextTick()
    const after = wrapper.findAll('[data-test="size-quota-row"]').length

    expect(after).toBe(before - 1)
  })

  it('updates the computed CPU+RAM preview when the admin edits rows', async () => {
    const wrapper = mountModal()
    await flushPromises()

    // Default starts as [L × 1] → CPU 4, RAM 2 GiB
    let preview = wrapper.find('[data-test="size-quota-preview"]')
    expect(preview.text()).toContain('4')
    expect(preview.text()).toContain('2')

    // Change first row to M × 2 → MaxCPU = max(2×2) = 4 cpu, MaxRAM = max(2×1024) = 2048 MB
    const firstRow = wrapper.findAll('[data-test="size-quota-row"]')[0]
    await firstRow.find('[data-test="size-quota-size"]').setValue('xl')
    await firstRow.find('[data-test="size-quota-count"]').setValue('2')
    await nextTick()

    preview = wrapper.find('[data-test="size-quota-preview"]')
    // XL × 2 → CPU 8, RAM 8 GiB (XL = 4cpu/4096MB; 2×4=8, 2×4096=8192=8 GiB)
    expect(preview.text()).toContain('8')
  })

  it('hides the rows composer and shows raw inputs when advanced toggle is on', async () => {
    const wrapper = mountModal()
    await flushPromises()

    expect(wrapper.find('[data-test="size-quota-advanced-fields"]').exists()).toBe(false)

    await wrapper.find('[data-test="size-quota-advanced-toggle"]').trigger('click')
    await nextTick()

    // Composer rows hidden; raw inputs visible
    expect(wrapper.find('[data-test="size-quota-rows-list"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="size-quota-advanced-fields"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="advanced-max-cpu"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="advanced-max-memory-mb"]').exists()).toBe(true)
  })

  it('emits save payload with computed max_cpu and max_memory_mb from rows', async () => {
    const wrapper = mountModal()
    await flushPromises()

    // Set the default first row to [L × 1] (it already is by default).
    // Add a second row [M × 2].
    await wrapper.find('[data-test="size-quota-add-row"]').trigger('click')
    await nextTick()

    const rows = wrapper.findAll('[data-test="size-quota-row"]')
    expect(rows.length).toBe(2)

    // Row 0 stays as L × 1; explicitly set to be safe.
    await rows[0].find('[data-test="size-quota-size"]').setValue('l')
    await rows[0].find('[data-test="size-quota-count"]').setValue('1')
    // Row 1: M × 2
    await rows[1].find('[data-test="size-quota-size"]').setValue('m')
    await rows[1].find('[data-test="size-quota-count"]').setValue('2')
    await nextTick()

    // Fill the required name field
    await wrapper.find('#plan-name').setValue('Test Plan')

    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    // Expected:
    //   L×1: cpu=4 ram=2048
    //   M×2: cpu=4 ram=2048
    //   max() across rows: cpu=4 ram=2048
    const emitted = wrapper.emitted('save')
    expect(emitted).toBeTruthy()
    const payload = emitted![0][0] as any
    expect(payload.quota_model).toBe('budget')
    expect(payload.max_cpu).toBe(4)
    expect(payload.max_memory_mb).toBe(2048)
  })

  it('renders the legacy allowlist (count mode) when quota_model is set to count', async () => {
    const wrapper = mountModal()
    await flushPromises()

    // Switch to count mode
    await wrapper.find('[data-test="quota-model-count"]').setValue(true)
    await nextTick()

    // Budget composer is hidden
    expect(wrapper.find('[data-test="size-quota-composer"]').exists()).toBe(false)

    // Legacy count-mode UI is visible
    expect(wrapper.find('[data-test="count-mode-section"]').exists()).toBe(true)
  })

  it('disables the save button and shows validation when budget mode has zero rows', async () => {
    const wrapper = mountModal()
    await flushPromises()

    // Remove the default row so there are zero rows in the composer.
    await wrapper.findAll('[data-test="size-quota-remove-row"]')[0].trigger('click')
    await nextTick()

    const rows = wrapper.findAll('[data-test="size-quota-row"]')
    expect(rows.length).toBe(0)

    // Save button is disabled
    const saveBtn = wrapper.find('[data-test="plan-save-button"]')
    expect(saveBtn.attributes('disabled')).toBeDefined()

    // Validation message is shown
    expect(wrapper.find('[data-test="size-quota-validation"]').exists()).toBe(true)
  })
})
