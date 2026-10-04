/**
 * A step as the learner reads it, in the reader's language when the outline
 * carries a translation for it, else in the step's own.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import StepLearnerPreview from '../../src/components/ScenarioEditor/StepLearnerPreview.vue'

function mountPreview(locale: string, translations?: any[]) {
  return mount(StepLearnerPreview, {
    props: { title: 'Climb the tower', text: '# Climb the tower\n\nGo **up**.', translations },
    global: { plugins: [createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })] }
  })
}

describe('StepLearnerPreview', () => {
  it('renders the step with the learner pipeline, without the heading that repeats its title', () => {
    const wrapper = mountPreview('en')
    expect(wrapper.find('.ocf-learner-preview-title').text()).toBe('Climb the tower')
    expect(wrapper.find('.markdown-content h1').exists()).toBe(false)
    expect(wrapper.find('.markdown-content strong').text()).toBe('up')
  })

  it("shows the translation in the reader's language, and the original otherwise", () => {
    const translations = [{ locale: 'fr', title: 'Monter dans la tour', text_content: 'Montez **en haut**.' }]
    expect(mountPreview('fr', translations).find('.ocf-learner-preview-title').text()).toBe('Monter dans la tour')
    expect(mountPreview('fr', translations).find('.markdown-content').text()).toContain('en haut')
    expect(mountPreview('en', translations).find('.ocf-learner-preview-title').text()).toBe('Climb the tower')
  })
})
