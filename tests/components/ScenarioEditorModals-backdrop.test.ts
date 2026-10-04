/**
 * The scenario and step editors hold long, unsaved forms — scripts, quiz
 * questions, setup. A stray click beside the modal used to close it and drop
 * everything typed. Only Cancel and the close button leave the editor.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestI18n } from '../helpers/entityModalHelper'

import ScenarioEditModal from '../../src/components/ScenarioEditor/ScenarioEditModal.vue'
import ScenarioStepEditModal from '../../src/components/ScenarioEditor/ScenarioStepEditModal.vue'

const global = { plugins: [createTestI18n()] }

describe('scenario editor modals — backdrop click', () => {
  it('keeps the step editor open', async () => {
    const wrapper = mount(ScenarioStepEditModal, {
      props: { visible: true, isNew: true, stepData: { step_type: 'terminal' } },
      global,
    })

    await wrapper.get('.base-modal-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.get('.base-modal-close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('keeps the scenario editor open', async () => {
    const wrapper = mount(ScenarioEditModal, {
      props: {
        visible: true,
        editingScenario: { isNew: true, title: 'Draft' },
        title: 'Create scenario',
        orgScopes: [],
        groupScopes: [],
        platformScopeAvailable: false,
        availableCreateScopes: [],
        scopeHint: '',
        currentScenarioOrgLabel: null,
      },
      global,
    })

    await wrapper.get('.base-modal-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.get('.base-modal-close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
