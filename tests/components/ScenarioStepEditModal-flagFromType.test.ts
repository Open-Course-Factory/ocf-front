/**
 * A flag belongs to the flag step type, not to a checkbox.
 *
 * The terminal step used to offer "Has Flag": the learner then got a Verify
 * button for a flag the backend never issued. ocf-core derives has_flag from
 * step_type, so the form offers no such choice and sends no has_flag at all —
 * an imported flag step keeps the value it already has.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ScenarioStepEditModal from '../../src/components/ScenarioEditor/ScenarioStepEditModal.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountModal(stepData: Record<string, unknown>) {
  return mount(ScenarioStepEditModal, {
    props: { visible: true, isNew: false, stepData },
    global: {
      plugins: [createTestI18n()],
      stubs: { BaseModal: { template: '<div><slot /><slot name="footer" /></div>' } },
    },
  })
}

async function save(wrapper: ReturnType<typeof mountModal>): Promise<Record<string, any>> {
  await wrapper.get('[data-testid="step-edit-save"]').trigger('click')
  const saved = wrapper.emitted('save')
  expect(saved).toHaveLength(1)
  return saved![0][0] as Record<string, any>
}

describe('ScenarioStepEditModal — flags come from the step type', () => {
  it('offers no flag fields on a terminal step', async () => {
    const wrapper = mountModal({ title: 'Install nginx', step_type: 'terminal' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    expect(wrapper.find('#step-flag-path').exists()).toBe(false)
  })

  it('sends no has_flag from a terminal step, even one imported with it set', async () => {
    const wrapper = mountModal({ title: 'Legacy', step_type: 'terminal', has_flag: true })
    await wrapper.vm.$nextTick()

    expect(await save(wrapper)).not.toHaveProperty('has_flag')
  })

  it('keeps an imported flag step\'s path and level through a save', async () => {
    const wrapper = mountModal({
      title: 'Find the flag',
      step_type: 'flag',
      has_flag: true,
      flag_path: '/root/flag.txt',
      flag_level: 2,
    })
    await wrapper.vm.$nextTick()

    expect((wrapper.get('#step-flag-path').element as HTMLInputElement).value).toBe('/root/flag.txt')
    const payload = await save(wrapper)
    expect(payload).toMatchObject({ flag_path: '/root/flag.txt', flag_level: 2 })
    expect(payload).not.toHaveProperty('has_flag')
  })
})
