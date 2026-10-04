/**
 * "Import ▾" gathers every way a scenario comes in: a KillerCoda archive, an
 * OCF JSON file, or the teacher's own AI. Each item opens the existing flow,
 * the file ones with their format already chosen.
 */

import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createTestI18n } from '../helpers/entityModalHelper'

const openChooser = vi.fn()
vi.mock('../../src/components/ScenarioEditor/ScenarioImportButton.vue', () => ({
  default: defineComponent({ setup(_, { expose }) { expose({ openChooser }); return () => h('div') } })
}))
vi.mock('../../src/components/ScenarioEditor/ScenarioAiModal.vue', () => ({
  default: defineComponent({
    props: { visible: Boolean, mode: String },
    emits: ['imported', 'close'],
    setup(props, { emit }) {
      return () => props.visible ? h('button', { 'data-testid': 'ai-modal', 'data-mode': props.mode, onClick: () => emit('imported', { id: 'sc-ai' }) }) : null
    }
  })
}))

import ScenarioImportMenu from '../../src/components/ScenarioEditor/ScenarioImportMenu.vue'

function mountMenu() {
  return mount(ScenarioImportMenu, { global: { plugins: [createTestI18n()] }, attachTo: document.body })
}

describe('ScenarioImportMenu', () => {
  it('opens the file import with the format picked in the menu', async () => {
    const wrapper = mountMenu()
    await wrapper.get('[data-testid="scenario-import-menu"]').trigger('click')
    await wrapper.get('[data-testid="scenario-import-menu-json"]').trigger('click')
    await wrapper.get('[data-testid="scenario-import-menu"]').trigger('click')
    await wrapper.get('[data-testid="scenario-import-menu-killercoda"]').trigger('click')
    expect(openChooser.mock.calls).toEqual([['json'], ['killercoda']])
    expect(wrapper.find('[data-testid="scenario-import-menu-json"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opens the AI flow in create mode and hands back what it created', async () => {
    const wrapper = mountMenu()
    await wrapper.get('[data-testid="scenario-import-menu"]').trigger('click')
    await wrapper.get('[data-testid="scenario-import-menu-ai"]').trigger('click')
    const modal = wrapper.get('[data-testid="ai-modal"]')
    expect(modal.attributes('data-mode')).toBe('create')
    await modal.trigger('click')
    expect(wrapper.emitted('imported')).toEqual([[{ id: 'sc-ai' }, 'ai']])
    wrapper.unmount()
  })
})
