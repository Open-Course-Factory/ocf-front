/**
 * Where a scenario's runs run: a container (Incus, the default), a machine in
 * the learner's browser, or whichever the learner's plan prefers.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const get = vi.fn().mockResolvedValue({ data: { apps: ['nvim', 'python', 'postgres'] } })
vi.mock('axios', () => ({ default: { get: (...args: unknown[]) => get(...args) } }))
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

describe('ScenarioEditModal — terminal or desktop', () => {
  it('shows a terminal by default, and edits the choice', async () => {
    const { wrapper, editingScenario } = mountModal({ machine: 'local' })
    const select = wrapper.get('[data-testid="scenario-machine-display"]')
    expect((select.element as HTMLSelectElement).value).toBe('terminal')
    await select.setValue('desktop')
    expect(editingScenario.machine_display).toBe('desktop')
  })

  it('asks nothing for a lab in a container', () => {
    const { wrapper } = mountModal({ machine: 'incus' })
    expect(wrapper.find('[data-testid="scenario-machine-display"]').exists()).toBe(false)
  })
})

describe('ScenarioEditModal — apps the desktop offers', () => {
  it('lists the platform\'s apps for a desktop, and ticks the scenario\'s', async () => {
    const { wrapper } = mountModal({ machine: 'local', machine_display: 'desktop', machine_apps: '["python"]' })
    await flushPromises()
    expect(get).toHaveBeenCalledWith('/scenarios/local-machine-apps')
    const box = (app: string) => wrapper.get(`[data-testid="scenario-machine-app-${app}"]`).element as HTMLInputElement
    expect(box('python').checked).toBe(true)
    expect(box('nvim').checked).toBe(false)
  })

  it('stores the ticked apps in the platform\'s order, and none as empty', async () => {
    const { wrapper, editingScenario } = mountModal({ machine: 'by_account', machine_display: 'desktop', machine_apps: '["python"]' })
    await flushPromises()
    await wrapper.get('[data-testid="scenario-machine-app-nvim"]').setValue(true)
    expect(editingScenario.machine_apps).toBe('["nvim","python"]')
    await wrapper.get('[data-testid="scenario-machine-app-nvim"]').setValue(false)
    await wrapper.get('[data-testid="scenario-machine-app-python"]').setValue(false)
    expect(editingScenario.machine_apps).toBe('')
  })

  it('offers nothing to choose for a terminal or a lab in a container', async () => {
    for (const scenario of [{ machine: 'incus' }, { machine: 'local', machine_apps: '["python"]' }]) {
      const { wrapper } = mountModal(scenario)
      await flushPromises()
      expect(wrapper.find('[data-testid^="scenario-machine-app-"]').exists()).toBe(false)
    }
  })
})
