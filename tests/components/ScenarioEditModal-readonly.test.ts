/**
 * The settings of a scenario the user may only read open in the same modal,
 * read only: every field shown and disabled, nothing to save, and no
 * vocabulary to load — it is not theirs.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestI18n } from '../helpers/entityModalHelper'

import ScenarioEditModal from '../../src/components/ScenarioEditor/ScenarioEditModal.vue'

function mountModal(readonly: boolean) {
  return mount(ScenarioEditModal, {
    props: {
      visible: true,
      readonly,
      editingScenario: { isNew: false, entityId: 'sc-1', title: 'Lab', setup_script: 'apt-get install -y nginx' },
      title: 'Scenario settings',
      orgScopes: [],
      groupScopes: [],
      platformScopeAvailable: false,
      availableCreateScopes: [],
      scopeHint: '',
      currentScenarioOrgLabel: null,
    },
    global: { plugins: [createTestI18n()] },
  })
}

describe('ScenarioEditModal — read only', () => {
  it('shows the settings, setup script included, with every field disabled and nothing to save', async () => {
    const wrapper = mountModal(true)
    expect(wrapper.get('.ocf-scn-fields').attributes('disabled')).toBeDefined()
    await wrapper.get('#tab-setup').trigger('click')
    expect((wrapper.get('#scenario-setup-script').element as HTMLTextAreaElement).value).toBe('apt-get install -y nginx')
    expect(wrapper.find('.base-modal-footer .btn-primary').exists()).toBe(false)
    expect(wrapper.find('#tab-vocabulary').exists()).toBe(false)
    expect(wrapper.find('#tab-messages').exists()).toBe(false)
  })

  it('is the ordinary settings form otherwise', () => {
    const wrapper = mountModal(false)
    expect(wrapper.get('.ocf-scn-fields').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.base-modal-footer .btn-primary').exists()).toBe(true)
    expect(wrapper.find('#tab-vocabulary').exists()).toBe(true)
  })
})
