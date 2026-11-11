/**
 * With several servers, the first choice is "Automatic": its value is the
 * empty string, which every caller already sends as "no backend".
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import BackendSelector from '../../src/components/Terminal/BackendSelector.vue'

const i18n = () => createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })

const backends = [
  { id: 'main', name: 'Main', connected: true, is_default: true },
  { id: 'spare', name: 'Spare', connected: true, is_default: false },
] as any

function mountSelector(modelValue: string) {
  return mount(BackendSelector, { props: { modelValue, backends }, global: { plugins: [i18n()] } })
}

describe('BackendSelector — automatic choice', () => {
  it('offers Automatic first, selected when nothing is chosen', () => {
    const cards = mountSelector('').findAll('.backend-card')
    expect(cards).toHaveLength(3)
    expect(cards[0].text()).toContain('Automatic')
    expect(cards[0].classes()).toContain('selected')
  })

  it('emits an empty value when Automatic is picked', async () => {
    const wrapper = mountSelector('spare')
    await wrapper.findAll('.backend-card')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('shows no Automatic choice when there is a single server', () => {
    const wrapper = mount(BackendSelector, { props: { modelValue: '', backends: [backends[0]] }, global: { plugins: [i18n()] } })
    expect(wrapper.text()).not.toContain('Automatic')
  })
})
