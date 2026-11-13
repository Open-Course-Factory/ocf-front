/**
 * The step-type picker shows a label and a one-line hint for every step type.
 * A type added to STEP_TYPES without its hint rendered the raw i18n key
 * ("scenarioEditor.stepTypeHint_survey") in the menu.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import StepTypePicker from '../../src/components/ScenarioEditor/StepTypePicker.vue'
import { STEP_TYPES } from '../../src/utils/scenarioOutline'

function mountPicker(locale: 'en' | 'fr') {
  return mount(StepTypePicker, {
    global: {
      plugins: [createI18n({
        legacy: false, locale, fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false
      })]
    }
  })
}

describe.each(['en', 'fr'] as const)('StepTypePicker (%s)', locale => {
  it.each([...STEP_TYPES])('shows a real hint for the %s type', type => {
    const wrapper = mountPicker(locale)
    const item = wrapper.find(`[data-testid="step-type-${type}"]`)
    expect(item.exists()).toBe(true)
    const hint = item.find('.ocf-type-picker-hint').text()
    expect(hint.trim()).not.toBe('')
    expect(hint).not.toContain('stepTypeHint_')
    const label = item.find('.ocf-type-picker-label').text()
    expect(label).not.toContain('stepType_')
    wrapper.unmount()
  })
})
