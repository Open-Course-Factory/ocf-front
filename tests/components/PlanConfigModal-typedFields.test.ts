/**
 * RED tests for PlanConfigModal under the features[]-strings removal campaign.
 *
 * Three changes are pinned here:
 *   (e1) the features[]-catalog toggle section (Section 2, "Plan Configuration"
 *        from the plan_features catalog) is REMOVED — the modal no longer
 *        consumes planFeaturesStore, so no per-catalog-feature checkbox renders.
 *   (e2) a NEW dedicated group_management toggle (mirroring the supervision
 *        toggle precedent) drives plan.group_management_enabled in the save
 *        payload, reflects a loaded plan, and defaults off.
 *   (e3) max_courses is GONE from the emitted payload (ocf-core dropped the
 *        column — !319 front-safety list).
 *
 * Assertions read rendered DOM and the emitted save payload (the field-loss
 * lesson: assert the payload, not spy calls).
 *
 * Pinned DOM seam (contract for the dev):
 *   - group management toggle: [data-test="plan-group-management-toggle"]
 *
 * EXPECTED STATE against current code:
 *   (e1) a supplied catalog feature still renders #feature-<key>   → RED (assert absent)
 *   (e2) no group-management toggle exists                          → RED
 *   (e3) handleSave still emits max_courses                         → RED (assert absent)
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
      response: { use: vi.fn() },
    },
  },
}))

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((_err: any, fallbackKey: string) => fallbackKey),
}))

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
      locale: { value: 'en' },
    }
  },
  useStoreTranslations: () => ({
    t: (key: string) => key,
    te: () => true,
    locale: { value: 'en' },
  }),
}))

// The plan_features catalog store has been removed entirely; the modal no
// longer imports it, so there is nothing left to mock. No per-catalog-feature
// checkbox (any `#feature-*` input) can therefore render — pinned below.

import PlanConfigModal from '../../src/components/Modals/PlanConfigModal.vue'

async function mountModal(plan: any = null) {
  const wrapper = mount(PlanConfigModal, {
    props: { visible: false, plan },
    global: {
      stubs: {
        BaseModal: {
          props: ['visible', 'title', 'titleIcon', 'size'],
          template:
            '<div class="base-modal-stub"><slot /><div class="footer-slot"><slot name="footer" /></div></div>',
        },
      },
    },
  })
  await wrapper.setProps({ visible: true })
  await flushPromises()
  return wrapper
}

describe('PlanConfigModal — features[] catalog removal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('no longer renders the plan_features catalog toggle section', async () => {
    const wrapper = await mountModal()
    await flushPromises()
    // No catalog feature checkbox (built from planFeaturesStore) may remain —
    // assert on the whole `#feature-*` family rather than any single key.
    expect(wrapper.findAll('[id^="feature-"]').length).toBe(0)
  })
})

describe('PlanConfigModal — dedicated group_management toggle', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the group-management toggle', async () => {
    const wrapper = await mountModal()
    await flushPromises()
    expect(wrapper.find('[data-test="plan-group-management-toggle"]').exists()).toBe(true)
  })

  it('reflects a loaded plan into the group-management toggle', async () => {
    const wrapper = await mountModal({
      id: 'plan-1',
      name: 'Team',
      max_cpu: 0,
      max_memory_mb: 0,
      features: [],
      group_management_enabled: true,
    })
    await flushPromises()

    const toggle = wrapper.find('[data-test="plan-group-management-toggle"]')
      .element as HTMLInputElement
    expect(toggle.checked).toBe(true)
  })

  it('carries group_management_enabled into the save payload', async () => {
    const wrapper = await mountModal()
    await flushPromises()

    await wrapper.find('#plan-name').setValue('Team Plan')
    await wrapper.find('[data-test="plan-group-management-toggle"]').setValue(true)
    await nextTick()

    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload.group_management_enabled).toBe(true)
  })

  it('defaults group_management_enabled off for a new plan', async () => {
    const wrapper = await mountModal()
    await flushPromises()

    await wrapper.find('#plan-name').setValue('Plain Plan')
    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload.group_management_enabled).toBe(false)
  })
})

describe('PlanConfigModal — max_courses removed', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('does not emit max_courses in the save payload', async () => {
    const wrapper = await mountModal()
    await flushPromises()

    await wrapper.find('#plan-name').setValue('No Courses Plan')
    await wrapper.find('[data-test="plan-save-button"]').trigger('click')

    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload).not.toHaveProperty('max_courses')
  })
})
