/**
 * The phase checklist shown while a scenario environment is prepared.
 *
 * Rebuilding a run whose container is gone reports its own phase, `replay`:
 * the scenario setup and every step's setup script up to the learner's step
 * are run again on a new machine. The list must name it in the learner's
 * language, never print the raw i18n key.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ProvisioningPhaseList from '../../src/components/Terminal/ProvisioningPhaseList.vue'

function mountList(locale: 'en' | 'fr', props: Record<string, unknown>) {
  return mount(ProvisioningPhaseList, {
    props,
    global: {
      plugins: [createI18n({
        legacy: false,
        locale,
        fallbackLocale: 'en',
        messages: { en: {}, fr: {} },
        missingWarn: false,
        fallbackWarn: false
      })]
    }
  })
}

function activeLabel(locale: 'en' | 'fr') {
  const wrapper = mountList(locale, { phase: 'replay', phases: ['terminal_creation', 'replay'] })
  return wrapper.find('.step--active .step-label').text()
}

describe('ProvisioningPhaseList — the replay phase', () => {
  it('names the rebuild in English', () => {
    const label = activeLabel('en')
    expect(label).toMatch(/rebuil/i)
    expect(label).not.toContain('provisioningPhases')
  })

  it('names the rebuild in French', () => {
    const label = activeLabel('fr')
    expect(label).toMatch(/reconstru/i)
    expect(label).not.toContain('provisioningPhases')
  })

  it('shows the terminal creation done while the replay runs', () => {
    const wrapper = mountList('en', { phase: 'replay', phases: ['terminal_creation', 'replay'] })
    const rows = wrapper.findAll('.provisioning-step')
    expect(rows[0].classes()).toContain('step--done')
    expect(rows[1].classes()).toContain('step--active')
  })
})
