/**
 * Where a scenario's runs run: a container (Incus, the default), a machine in
 * the learner's browser, or whichever the learner's plan prefers.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestI18n } from '../helpers/entityModalHelper'

import ScenarioEditModal from '../../src/components/ScenarioEditor/ScenarioEditModal.vue'

function mountModal(scenario: Record<string, unknown>) {
  const editingScenario = { isNew: false, entityId: 'sc-1', title: 'Lab', ...scenario }
  const wrapper = mount(ScenarioEditModal, {
    props: {
      visible: true, readonly: false, editingScenario, title: 'Scenario settings',
      orgScopes: [], groupScopes: [], platformScopeAvailable: false, availableCreateScopes: [],
      scopeHint: '', currentScenarioOrgLabel: null,
    },
    global: { plugins: [createTestI18n()] },
  })
  return { wrapper, editingScenario }
}

describe('ScenarioEditModal — machine', () => {
  it('offers the three machines and shows the scenario\'s', () => {
    const { wrapper } = mountModal({ machine: 'local' })
    const select = wrapper.get('#scenario-machine')
    expect(select.findAll('option').map(o => o.attributes('value'))).toEqual(['incus', 'local', 'by_account'])
    expect((select.element as HTMLSelectElement).value).toBe('local')
  })

  it('edits the scenario\'s machine', async () => {
    const { wrapper, editingScenario } = mountModal({ machine: 'incus' })
    await wrapper.get('#scenario-machine').setValue('by_account')
    expect(editingScenario.machine).toBe('by_account')
  })
})
