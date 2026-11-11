/**
 * Assigning a scenario can name the server the class's runs are built on.
 * The choice is offered only when the organization has several servers, and
 * defaults to automatic placement (an empty backend).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import AssignScenarioModal from '../../src/components/Groups/modals/AssignScenarioModal.vue'

const i18n = () => createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })

const scenarios = [{ id: 's1', name: 'lab', title: 'Lab', difficulty: 'beginner', source: 'org' }] as any
const servers = [
  { id: 'main', name: 'Main', connected: true, is_default: true },
  { id: 'spare', name: 'Spare', connected: true, is_default: false },
] as any

function mountModal(backends?: unknown[]) {
  return mount(AssignScenarioModal, {
    props: { visible: false, scenarios, backends },
    global: { plugins: [i18n()] },
  })
}

async function open(wrapper: ReturnType<typeof mountModal>) {
  await wrapper.setProps({ visible: true })
  await wrapper.find('select.select-scenario').setValue('s1')
}

describe('AssignScenarioModal — server choice', () => {
  it('offers no server choice with a single server', async () => {
    const wrapper = mountModal([servers[0]])
    await open(wrapper)
    expect(wrapper.text()).not.toContain('Automatic')
  })

  it('defaults to automatic placement', async () => {
    const wrapper = mountModal(servers)
    await open(wrapper)
    await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
    expect(wrapper.emitted('assign')?.[0][0]).toMatchObject({ scenarioId: 's1', backend: '' })
  })

  it('sends the server the teacher picked', async () => {
    const wrapper = mountModal(servers)
    await open(wrapper)
    const spare = wrapper.findAll('.backend-card').find(c => c.text().includes('Spare'))!
    await spare.trigger('click')
    await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
    expect(wrapper.emitted('assign')?.[0][0]).toMatchObject({ backend: 'spare' })
  })
})
