/**
 * "Test from this step" in ScenarioStepEditModal (#346).
 *
 * An author who is working on step 5 should not have to play steps 1 to 4 to
 * see it. The step modal offers to preview the scenario from this step: the
 * editor then builds a machine as a learner resuming here would get it.
 *
 * The modal only asks; the editor confirms and launches. What the modal owns:
 *   - the action exists, bilingual, and names the step by its Order (0 is a
 *     real order, the first step of a 0-based scenario);
 *   - it is not offered for a step the backend does not know yet — a step
 *     dropped on the canvas and never saved has no order to start from;
 *   - it is not offered when the editor says the scenario cannot be previewed
 *     (read-only, no steps).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ScenarioStepEditModal from '../../src/components/ScenarioEditor/ScenarioStepEditModal.vue'

const ACTION = '[data-testid="step-edit-test-from-step"]'

function createTestI18n(locale = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountModal(
  props: Record<string, unknown>,
  locale = 'en'
) {
  return mount(ScenarioStepEditModal, {
    props: {
      visible: true,
      isNew: false,
      canTestFromStep: true,
      ...props,
    },
    global: {
      plugins: [createTestI18n(locale)],
      stubs: { BaseModal: { template: '<div><slot /><slot name="footer" /></div>' } },
    },
  })
}

const savedStep = (order: number) => ({
  entityId: `step-${order}`,
  title: `Step ${order}`,
  order,
  stepType: 'terminal',
})

describe('ScenarioStepEditModal — test from this step', () => {
  it('offers the action on a saved step, in English', () => {
    const wrapper = mountModal({ stepData: savedStep(2) })

    const action = wrapper.find(ACTION)
    expect(action.exists()).toBe(true)
    expect(action.text()).toContain('Test from this step')
  })

  it('offers the action in French', () => {
    const wrapper = mountModal({ stepData: savedStep(2) }, 'fr')

    expect(wrapper.find(ACTION).text()).toContain('Tester depuis cette étape')
  })

  it("asks the editor to preview from this step's order", async () => {
    const wrapper = mountModal({ stepData: savedStep(2) })

    await wrapper.find(ACTION).trigger('click')

    expect(wrapper.emitted('test-from-step')).toEqual([[2]])
  })

  // Step 0 is the first step of a 0-based scenario — falsy, and legitimate.
  it('asks for order 0 rather than dropping it', async () => {
    const wrapper = mountModal({ stepData: savedStep(0) })

    await wrapper.find(ACTION).trigger('click')

    expect(wrapper.emitted('test-from-step')).toEqual([[0]])
  })

  it('does not save the step on the way', async () => {
    const wrapper = mountModal({ stepData: savedStep(2) })

    await wrapper.find(ACTION).trigger('click')

    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('is not offered while creating a step', () => {
    const wrapper = mountModal({ isNew: true, stepData: null })

    expect(wrapper.find(ACTION).exists()).toBe(false)
  })

  // A node dropped on the canvas opens this modal before it is ever saved: it
  // has no id on the backend, so there is no step to start from yet.
  it('is not offered for a step the backend does not know yet', () => {
    const wrapper = mountModal({
      stepData: { entityId: null, isNew: true, title: 'Dropped', order: 3, stepType: 'terminal' },
    })

    expect(wrapper.find(ACTION).exists()).toBe(false)
  })

  it('is not offered when the scenario cannot be previewed', () => {
    const wrapper = mountModal({ stepData: savedStep(2), canTestFromStep: false })

    expect(wrapper.find(ACTION).exists()).toBe(false)
  })

  // Existing callers that never pass the prop must not suddenly grow a
  // button that launches terminals.
  it('is off unless the editor turns it on', () => {
    const wrapper = mount(ScenarioStepEditModal, {
      props: { visible: true, isNew: false, stepData: savedStep(2) },
      global: {
        plugins: [createTestI18n()],
        stubs: { BaseModal: { template: '<div><slot /><slot name="footer" /></div>' } },
      },
    })

    expect(wrapper.find(ACTION).exists()).toBe(false)
  })
})
