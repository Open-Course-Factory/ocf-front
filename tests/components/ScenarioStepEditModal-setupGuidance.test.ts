/**
 * Setup script guidance in the step editor (#343).
 *
 * A step's setup script (the Background tab) runs before the step starts, and
 * runs again — steps 1..N in order, after the scenario setup — whenever the
 * learner's machine has to be rebuilt. A script written for a fresh machine
 * only ("create this file") either fails on the rebuild or overwrites the
 * learner's own, valid answer. Authors only learn the rule if the editor tells
 * them, so the field carries:
 *
 *   - an explanation of when the script runs and what it must guarantee,
 *   - a placeholder that shows the "create only if missing" pattern,
 *   - on every step but the first, a reminder that results of earlier steps
 *     are this step's preconditions too.
 *
 * Text assertions stay on key phrases so copy can be reworded freely.
 *
 * The modal cannot tell the first step from the others by itself: `order`
 * is absent on a step just dropped on the canvas and stale after a canvas
 * reorder until the editor saves. The editor knows from the chain, so it
 * passes `isFirstStep`.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ScenarioStepEditModal from '../../src/components/ScenarioEditor/ScenarioStepEditModal.vue'

type Locale = 'en' | 'fr'

function createTestI18n(locale: Locale) {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

async function mountOnBackgroundTab(
  { locale = 'en', props = {} }: { locale?: Locale; props?: Record<string, unknown> } = {}
) {
  const wrapper = mount(ScenarioStepEditModal, {
    props: {
      visible: true,
      isNew: false,
      stepData: { title: 'A step', order: 0, step_type: 'terminal' },
      ...props,
    },
    global: {
      plugins: [createTestI18n(locale)],
      stubs: { BaseModal: { template: '<div><slot /><slot name="footer" /></div>' } },
    },
  })

  await wrapper.vm.$nextTick()
  // Drive the real TabStrip the way a trainer would.
  const tab = wrapper.find('#tab-background')
  expect(tab.exists(), 'the Background tab should be offered').toBe(true)
  await tab.trigger('click')
  await wrapper.vm.$nextTick()

  return wrapper
}

function placeholderOf(wrapper: Awaited<ReturnType<typeof mountOnBackgroundTab>>): string {
  const textarea = wrapper.find('#step-background-script')
  expect(textarea.exists(), 'the setup script field should be shown').toBe(true)
  return textarea.attributes('placeholder') ?? ''
}

describe('ScenarioStepEditModal — setup script guidance', () => {
  describe('explanation under the setup script field', () => {
    it('says, in English, that the script runs again when the machine is rebuilt', async () => {
      const wrapper = await mountOnBackgroundTab({ locale: 'en' })

      const guidance = wrapper.find('[data-testid="step-setup-guidance"]')
      expect(guidance.exists()).toBe(true)
      const text = guidance.text().toLowerCase()
      expect(text).toMatch(/rebuil/)
      expect(text).toMatch(/again|re-?run/)
      // Must not destroy what the learner did.
      expect(text).toMatch(/overwrite/)
    })

    it('says the same in French', async () => {
      const wrapper = await mountOnBackgroundTab({ locale: 'fr' })

      const guidance = wrapper.find('[data-testid="step-setup-guidance"]')
      expect(guidance.exists()).toBe(true)
      const text = guidance.text().toLowerCase()
      expect(text).toMatch(/reconstrui/)
      expect(text).toMatch(/nouveau|relanc|réexécut|rejou/)
      expect(text).toMatch(/écras/)
      // Genuinely translated, not the English copy falling through.
      expect(text).not.toMatch(/rebuil/)
    })
  })

  describe('placeholder shows the create-if-missing pattern', () => {
    it.each<Locale>(['en', 'fr'])('in %s', async locale => {
      const wrapper = await mountOnBackgroundTab({ locale })

      const placeholder = placeholderOf(wrapper)
      expect(placeholder).toContain('#!/bin/bash')
      // `[ -f <path> ] || <create it>` — test first, create only when missing.
      expect(placeholder).toMatch(/\[ -f [^\]]+ \] \|\|/)
    })
  })

  describe('reminder about earlier steps', () => {
    it('is shown on a step that comes after the first', async () => {
      const wrapper = await mountOnBackgroundTab({
        props: { isFirstStep: false, stepData: { title: 'Second step', order: 1, step_type: 'terminal' } },
      })

      const reminder = wrapper.find('[data-testid="step-setup-earlier-step-reminder"]')
      expect(reminder.exists()).toBe(true)
      expect(reminder.text().toLowerCase()).toMatch(/earlier step/)
    })

    it('is shown in French too', async () => {
      const wrapper = await mountOnBackgroundTab({
        locale: 'fr',
        props: { isFirstStep: false, stepData: { title: 'Deuxième étape', order: 1, step_type: 'terminal' } },
      })

      const reminder = wrapper.find('[data-testid="step-setup-earlier-step-reminder"]')
      expect(reminder.exists()).toBe(true)
      expect(reminder.text().toLowerCase()).toMatch(/étape précédente|étapes précédentes/)
    })

    it('is shown on a brand-new step inserted after others, which has no order yet', async () => {
      const wrapper = await mountOnBackgroundTab({
        props: { isNew: true, isFirstStep: false, stepData: { step_type: 'terminal', isNew: true } },
      })

      expect(wrapper.find('[data-testid="step-setup-earlier-step-reminder"]').exists()).toBe(true)
    })

    it('is hidden on the first step — there is no earlier step to rely on', async () => {
      const wrapper = await mountOnBackgroundTab({
        props: { isFirstStep: true, stepData: { title: 'First step', order: 0, step_type: 'terminal' } },
      })

      // The general explanation still applies to the first step.
      expect(wrapper.find('[data-testid="step-setup-guidance"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="step-setup-earlier-step-reminder"]').exists()).toBe(false)
    })
  })
})
