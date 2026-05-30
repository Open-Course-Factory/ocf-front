/**
 * Tests for ResetAssignmentModal — the "reset scenario sessions" BaseModal
 * extracted from GroupScenariosTab.vue (commit c2 of #244).
 *
 * Presentational: the parent keeps the resetSessions service call. Wraps
 * BaseModal (size="small", default footer). Title t('groupScenarios.resetConfirmTitle'),
 * body static <p>{{ t('groupScenarios.resetConfirm') }}</p>. Re-emits confirm/close.
 *
 * i18n note: empty test messages → assertions pin BaseModal structure + emits,
 * not translated text.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ResetAssignmentModal from '../../src/components/Groups/modals/ResetAssignmentModal.vue'

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
  scenario_title: 'Networking 101',
  scenario: { id: 's1', name: 'net', title: 'Networking 101', difficulty: 'intermediate' },
}

function mountModal(props: Record<string, unknown> = {}) {
  return mount(ResetAssignmentModal, {
    props: { visible: true, assignment, ...props },
    global: { plugins: [createTestI18n()] },
  })
}

describe('ResetAssignmentModal', () => {
  it('renders no overlay when visible is false', () => {
    const wrapper = mountModal({ visible: false })
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)
  })

  it('renders the modal overlay and a confirm button when visible', () => {
    const wrapper = mountModal({ visible: true })
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.base-modal-footer .btn-primary').exists()).toBe(true)
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
