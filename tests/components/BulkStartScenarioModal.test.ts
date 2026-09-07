/**
 * BulkStartScenarioModal confirms a bulk start for a whole class.
 *
 * It no longer asks for a distribution: ocf-core resolves the image from the
 * scenario's own declaration (!415) and ignored whatever the picker sent. The
 * only choice left to the teacher is which backend to build on, and that is
 * shown only when the organization has backends.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

import BulkStartScenarioModal from '../../src/components/Groups/modals/BulkStartScenarioModal.vue'
import { useTerminalBackendsStore } from '../../src/stores/terminalBackends'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

const assignment = {
  id: 'a1',
  scenario_id: 's1',
  group_id: 'g1',
  scope: 'group',
  is_active: true,
}

function mountModal(props: Record<string, unknown> = {}) {
  return mount(BulkStartScenarioModal, {
    props: { visible: true, assignment, ...props },
    global: {
      plugins: [createTestI18n()],
      stubs: { BackendSelector: { template: '<div class="backend-selector-stub" />' } },
    },
  })
}

describe('BulkStartScenarioModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders no overlay when visible is false', () => {
    expect(mountModal({ visible: false }).find('.base-modal-overlay').exists()).toBe(false)
  })

  it('asks for no distribution', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('offers the backend choice only when the organization has backends', async () => {
    const without = mountModal()
    expect(without.find('.backend-selector-stub').exists()).toBe(false)

    useTerminalBackendsStore().backends = [{ id: 'b1', name: 'Backend A' } as any]
    const withBackends = mountModal()
    expect(withBackends.find('.backend-selector-stub').exists()).toBe(true)
  })

  it('emits confirm when the confirm button is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('emits close when the cancel button is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.base-modal-footer .btn-secondary').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeFalsy()
  })
})
