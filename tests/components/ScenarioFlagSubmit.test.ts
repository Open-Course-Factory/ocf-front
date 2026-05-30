/**
 * Tests for ScenarioFlagSubmit — the flag-step UI extracted from
 * ScenarioPanel.vue (commit #3 of ocf-front #243).
 *
 * Carved from the `resolvedStepType === 'flag'` block of ScenarioPanel.vue
 * (current markup lines 249–271). The component owns the flag input, the
 * submit button and the correct/incorrect result panel; the parent drives it
 * via v-model + props and listens for `submit`.
 *
 * Contract under test:
 *   Props:
 *     - modelValue: string   (v-model — the flag text)
 *     - isActive: boolean
 *     - isSubmitting: boolean
 *     - result: SubmitFlagResponse | null   (default null)
 *   Emits:
 *     - update:modelValue (string), on input
 *     - submit (no payload), on button click or Enter in the input
 *   Markup:
 *     - `<div class="flag-section">` > `.flag-input-row` >
 *         `<input class="flag-input" type="text">`
 *           :placeholder=t('scenarioPanel.flagPlaceholder')
 *           :disabled="isSubmitting || !isActive"
 *           @keyup.enter → emit('submit')
 *         `<button class="flag-submit-btn">`
 *           :disabled="!modelValue.trim() || isSubmitting || !isActive"
 *           submitting: `fas fa-spinner fa-spin` + t('scenarioPanel.submitting')
 *           else:       `fas fa-paper-plane`     + t('scenarioPanel.submitFlag')
 *     - `<p class="flag-hint">{{ t('scenarioPanel.flagHint') }}</p>`
 *     - when result: `<div class="flag-result" :class="{correct, incorrect}"
 *         role="status" aria-live="polite">` with icon (`fa-check-circle` /
 *         `fa-times-circle`) + span t('scenarioPanel.flagCorrect') /
 *         t('scenarioPanel.flagIncorrect').
 *
 * Tests assert on user-observable DOM/behavior only, with a real createI18n
 * plugin (useTranslations → useI18n needs a real instance).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import type { SubmitFlagResponse } from '../../src/services/domain/scenario'

import ScenarioFlagSubmit from '../../src/components/Terminal/ScenarioFlagSubmit.vue'

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

interface MountProps {
  modelValue?: string
  isActive?: boolean
  isSubmitting?: boolean
  result?: SubmitFlagResponse | null
}

function mountFlag(props: MountProps = {}, locale: 'en' | 'fr' = 'en') {
  return mount(ScenarioFlagSubmit, {
    props: {
      modelValue: '',
      isActive: true,
      isSubmitting: false,
      result: null,
      ...props,
    },
    global: {
      plugins: [createTestI18n(locale)],
    },
  })
}

describe('ScenarioFlagSubmit', () => {
  it('renders the input and the submit button with the submit label when idle', () => {
    const wrapper = mountFlag({ modelValue: 'FLAG{x}' })

    const input = wrapper.find('input.flag-input')
    expect(input.exists()).toBe(true)

    const btn = wrapper.find('button.flag-submit-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.find('i.fas.fa-paper-plane').exists()).toBe(true)
    expect(btn.text()).toContain('Submit Flag')

    // The hint line is present.
    expect(wrapper.find('p.flag-hint').exists()).toBe(true)
  })

  it('disables the submit button when modelValue is empty or whitespace', async () => {
    const wrapper = mountFlag({ modelValue: '' })
    const btn = wrapper.find('button.flag-submit-btn')
    expect(btn.attributes('disabled')).toBeDefined()

    await wrapper.setProps({ modelValue: '   ' })
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('enables the submit button when modelValue is non-empty, active and not submitting', () => {
    const wrapper = mountFlag({ modelValue: 'FLAG{abc}', isActive: true, isSubmitting: false })
    const btn = wrapper.find('button.flag-submit-btn')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('emits update:modelValue with the typed value', async () => {
    const wrapper = mountFlag({ modelValue: '' })
    const input = wrapper.find('input.flag-input')

    await input.setValue('FLAG{typed}')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted!.at(-1)).toEqual(['FLAG{typed}'])
  })

  it('emits submit on button click when enabled, and on Enter in the input', async () => {
    const wrapper = mountFlag({ modelValue: 'FLAG{abc}' })

    await wrapper.find('button.flag-submit-btn').trigger('click')
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')!.length).toBe(1)

    await wrapper.find('input.flag-input').trigger('keyup.enter')
    expect(wrapper.emitted('submit')!.length).toBe(2)
  })

  it('while submitting: button disabled with spinner + submitting label, input disabled', () => {
    const wrapper = mountFlag({ modelValue: 'FLAG{abc}', isSubmitting: true })

    const btn = wrapper.find('button.flag-submit-btn')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.find('i.fas.fa-spinner.fa-spin').exists()).toBe(true)
    expect(btn.text()).toContain('Submitting')

    expect(wrapper.find('input.flag-input').attributes('disabled')).toBeDefined()
  })

  it('disables input and button when the step is not active', () => {
    const wrapper = mountFlag({ modelValue: 'FLAG{abc}', isActive: false })

    expect(wrapper.find('input.flag-input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button.flag-submit-btn').attributes('disabled')).toBeDefined()
  })

  it('renders no result panel when result is null', () => {
    const wrapper = mountFlag({ result: null })
    expect(wrapper.find('.flag-result').exists()).toBe(false)
  })

  it('renders a correct result with the correct class, icon and text', () => {
    const wrapper = mountFlag({ result: { correct: true } })

    const panel = wrapper.find('.flag-result')
    expect(panel.exists()).toBe(true)
    expect(panel.classes()).toContain('correct')
    expect(panel.classes()).not.toContain('incorrect')
    expect(panel.find('i.fas.fa-check-circle').exists()).toBe(true)
    expect(panel.text()).toContain('Correct!')
  })

  it('renders an incorrect result with the incorrect class, icon and text', () => {
    const wrapper = mountFlag({ result: { correct: false } })

    const panel = wrapper.find('.flag-result')
    expect(panel.exists()).toBe(true)
    expect(panel.classes()).toContain('incorrect')
    expect(panel.classes()).not.toContain('correct')
    expect(panel.find('i.fas.fa-times-circle').exists()).toBe(true)
    expect(panel.text()).toContain('Incorrect flag. Try again.')
  })
})
