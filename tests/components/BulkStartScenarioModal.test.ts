/**
 * Tests for BulkStartScenarioModal — the bulk-start distribution-picker
 * BaseModal extracted from GroupScenariosTab.vue (commit c3 of #244).
 *
 * Presentational: the parent keeps confirmBulkStart + the bulkStartScenario
 * service call + result population. The modal renders the distribution picker
 * and re-emits update:selectedDistribution / confirm / close. Behavior FROZEN.
 *
 * Source markup (parent lines 1851–1889):
 *   - BaseModal :visible, title t('groupScenarios.selectDistribution'),
 *     size="medium", default footer, confirm-text t('groupScenarios.bulkStart'),
 *     cancel-text t('groupScenarios.cancel').
 *   - `.instance-type-description` blurb.
 *   - BackendSelector (only when backends exist) — STUBBED here.
 *   - `.loading-state` with a spinner when loadingDistributions; ELSE a
 *     `.form-group` with `<select>` (option per distribution, text
 *     "name — description"). NOTE: the select is not disabled during loading —
 *     the whole form-group is swapped out via v-if/v-else.
 *
 * i18n note: empty test messages → assert on BaseModal structure, the
 * distribution data (real), and emits — not on translated chrome.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach } from 'vitest'

import BulkStartScenarioModal from '../../src/components/Groups/modals/BulkStartScenarioModal.vue'

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

const distributions = [
  { prefix: 'ubuntu', name: 'Ubuntu', description: '22.04 LTS', is_global: true },
  { prefix: 'debian', name: 'Debian', description: '12 Bookworm', is_global: true },
]

const assignment = {
  id: 'a1',
  scenario_id: 's1',
  group_id: 'g1',
  scope: 'group',
  is_active: true,
}

function mountModal(props: Record<string, unknown> = {}) {
  return mount(BulkStartScenarioModal, {
    props: {
      visible: true,
      assignment,
      distributions,
      selectedDistribution: '',
      loadingDistributions: false,
      ...props,
    },
    global: {
      plugins: [createTestI18n()],
      // Stub BackendSelector so the modal mounts standalone.
      stubs: { BackendSelector: true },
    },
  })
}

describe('BulkStartScenarioModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders no overlay when visible is false', () => {
    const wrapper = mountModal({ visible: false })
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)
  })

  it('renders one option per distribution when not loading', () => {
    const wrapper = mountModal({ loadingDistributions: false })
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)

    // The disabled placeholder option plus one option per distribution.
    const realOptions = wrapper.findAll('select option').filter(o => o.attributes('value') !== '')
    expect(realOptions.length).toBe(2)
    const texts = realOptions.map(o => o.text())
    expect(texts.some(t => t.includes('Ubuntu') && t.includes('22.04 LTS'))).toBe(true)
    expect(texts.some(t => t.includes('Debian') && t.includes('12 Bookworm'))).toBe(true)
  })

  it('emits update:selectedDistribution when the select changes', async () => {
    const wrapper = mountModal({ selectedDistribution: '' })
    await wrapper.find('select').setValue('debian')

    const emitted = wrapper.emitted('update:selectedDistribution')
    expect(emitted).toBeTruthy()
    expect(emitted!.at(-1)).toEqual(['debian'])
  })

  it('shows the loading indicator (and no select) while loadingDistributions is true', () => {
    const wrapper = mountModal({ loadingDistributions: true })
    expect(wrapper.find('.loading-state').exists()).toBe(true)
    expect(wrapper.find('.loading-state .fa-spinner').exists()).toBe(true)
    // The distribution select is swapped out during loading (v-if/v-else).
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('emits confirm when the confirm button is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')!.length).toBe(1)
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('emits close when the cancel button is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.base-modal-footer .btn-secondary').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')!.length).toBe(1)
    expect(wrapper.emitted('confirm')).toBeFalsy()
  })
})
