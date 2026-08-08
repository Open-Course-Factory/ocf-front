/**
 * Step 0 regression fence (#43 follow-up).
 *
 * Scenario steps are 0-based: the importer writes Order = i and a session
 * seeds CurrentStep from the first step's Order. That makes the first step's
 * order `0` — a legitimate value that is also falsy, which broke four separate
 * places at once. The renumbering was covered by tests; nothing covered the
 * round-trip through the edit modal, which is where the damage happened:
 * `order: props.stepData.order || 1` silently promoted step 0 to order 1 on
 * every save, colliding with the real step 1.
 *
 * These pin the first step specifically. Any future `||` on an order value
 * fails here rather than in a trainer's scenario.
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

function mountModal(stepData: Record<string, unknown> | null) {
  return mount(ScenarioStepEditModal, {
    props: {
      visible: true,
      isNew: stepData === null,
      stepType: 'terminal',
      stepData,
    },
    global: {
      plugins: [createTestI18n()],
      stubs: { BaseModal: { template: '<div><slot /><slot name="footer" /></div>' } },
    },
  })
}

/** The payload the modal would hand the editor on save. */
function savedPayload(wrapper: ReturnType<typeof mountModal>): Record<string, any> {
  return (wrapper.vm as any).formData
}

describe('ScenarioStepEditModal — step 0 survives a round trip', () => {
  it('keeps order 0 instead of promoting it to 1', async () => {
    const wrapper = mountModal({ title: 'First step', order: 0 })
    await wrapper.vm.$nextTick()

    // The bug: `order || 1` turned the legitimate first step into order 1,
    // leaving two steps at 1 and none at 0.
    expect(savedPayload(wrapper).order).toBe(0)
  })

  it('keeps a non-zero order untouched', async () => {
    const wrapper = mountModal({ title: 'Third step', order: 2 })
    await wrapper.vm.$nextTick()

    expect(savedPayload(wrapper).order).toBe(2)
  })

  it('defaults a brand-new step to order 0, matching the 0-based scheme', async () => {
    const wrapper = mountModal(null)
    await wrapper.vm.$nextTick()

    expect(savedPayload(wrapper).order).toBe(0)
  })

  it('treats a missing order as 0 rather than 1', async () => {
    const wrapper = mountModal({ title: 'Step with no order' })
    await wrapper.vm.$nextTick()

    expect(savedPayload(wrapper).order).toBe(0)
  })
})
