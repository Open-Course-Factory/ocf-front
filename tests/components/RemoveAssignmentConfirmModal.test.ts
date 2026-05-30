/**
 * Tests for RemoveAssignmentConfirmModal — the "confirm remove assignment"
 * BaseModal extracted from GroupScenariosTab.vue (commit c2 of #244).
 *
 * Presentational: the parent keeps the removeAssignment service call. The modal
 * wraps BaseModal (size="small", default footer) and re-emits confirm/close.
 *
 * Source markup (parent): title t('groupScenarios.confirmRemoveTitle'), body is
 * a STATIC <p>{{ t('groupScenarios.confirmRemove') }}</p> — it does NOT
 * interpolate the assignment title. The `assignment` prop is still passed so
 * the parent can show context (and future markup can reference it), but the
 * current body is a fixed message.
 *
 * i18n note: empty test messages → t() returns the bare key. We assert on
 * BaseModal structure (overlay presence, footer buttons) and emits, not on
 * translated text.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import RemoveAssignmentConfirmModal from '../../src/components/Groups/modals/RemoveAssignmentConfirmModal.vue'

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
  scenario_title: 'Intro to Linux',
  scenario: { id: 's1', name: 'intro', title: 'Intro to Linux', difficulty: 'beginner' },
}

function mountModal(props: Record<string, unknown> = {}) {
  return mount(RemoveAssignmentConfirmModal, {
    props: { visible: true, assignment, ...props },
    global: { plugins: [createTestI18n()] },
  })
}

describe('RemoveAssignmentConfirmModal', () => {
  it('renders no overlay when visible is false', () => {
    const wrapper = mountModal({ visible: false })
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)
  })

  it('renders the modal overlay and a confirm button when visible', () => {
    const wrapper = mountModal({ visible: true })
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)
    // Default footer confirm button.
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

  it('emits close when the BaseModal close (X) button is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.base-modal-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
