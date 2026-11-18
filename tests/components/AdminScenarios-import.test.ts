/**
 * The admin scenario list offers two imports, a Labinux JSON file and a
 * KillerCoda archive; each button opens the import dialog for its format.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createTestI18n } from '../helpers/entityModalHelper'

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('../../src/stores/scenarios', () => ({ useScenariosStore: () => ({ loadEntities: vi.fn() }) }))
vi.mock('../../src/stores/organizations', () => ({ useOrganizationsStore: () => ({ currentOrganizationId: null }) }))
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}))

import AdminScenarios from '../../src/components/Pages/Admin/Scenarios.vue'

// The generic entity page is not under test: only its toolbar slot is rendered.
const EntityStub = defineComponent({ setup: (_, { slots }) => () => h('div', slots['toolbar-extra']?.()) })

describe('Admin scenarios — import buttons', () => {
  it.each([
    { button: 'Import JSON', accept: '.json' },
    { button: 'Import KillerCoda', accept: '.zip,.tar.gz,.tgz' },
  ])('"$button" opens the import dialog for that format', async ({ button, accept }) => {
    const wrapper = mount(AdminScenarios, {
      global: { plugins: [createTestI18n()], stubs: { Entity: EntityStub } },
    })
    await wrapper.findAll('button').find(b => b.text().includes(button))!.trigger('click')
    expect(wrapper.findAll('input[type="file"]').map(i => i.attributes('accept'))).toEqual([accept])
  })
})
