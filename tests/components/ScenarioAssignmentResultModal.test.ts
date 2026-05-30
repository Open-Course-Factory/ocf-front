/**
 * Tests for ScenarioAssignmentResultModal — the bulk-start result BaseModal
 * extracted from GroupScenariosTab.vue (commit c2 of #244).
 *
 * Presentational, read-only: shows a success message plus two optional
 * sections (learners with no provisioned key; terminal-creation errors). Wraps
 * BaseModal (size medium). Emits `close`.
 *
 * Source markup (parent lines 2018–2046):
 *   - `.result-message` with the `message` text.
 *   - `.no-key-warning` (heading t('groupScenarios.noKeyWarning')) + `.no-key-list`
 *     when noKeyUsers.length > 0; each row = user.user_name || user.user_email || user.user_id.
 *   - `.no-key-warning` (heading t('groupScenarios.terminalErrors')) + `.no-key-list`
 *     when errors.length > 0; each row = `${err.user_id}: ${err.error}`.
 *
 * i18n note: empty test messages → assert on the `message` prop text (real
 * data), list presence/contents, and emits — not on translated headings.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ScenarioAssignmentResultModal from '../../src/components/Groups/modals/ScenarioAssignmentResultModal.vue'

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

interface MountProps {
  visible?: boolean
  message?: string
  noKeyUsers?: Array<{ user_id: string; user_name?: string; user_email?: string }>
  errors?: Array<{ user_id: string; error?: string }>
}

function mountModal(props: MountProps = {}) {
  return mount(ScenarioAssignmentResultModal, {
    props: {
      visible: true,
      message: 'Started 5 sessions.',
      noKeyUsers: [],
      errors: [],
      ...props,
    },
    global: { plugins: [createTestI18n()] },
  })
}

describe('ScenarioAssignmentResultModal', () => {
  it('renders no overlay when visible is false', () => {
    const wrapper = mountModal({ visible: false })
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)
  })

  it('renders the result message when visible', () => {
    const wrapper = mountModal({ message: 'Started 5 sessions.' })
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.result-message').text()).toContain('Started 5 sessions.')
  })

  it('omits both warning sections when the arrays are empty', () => {
    const wrapper = mountModal({ noKeyUsers: [], errors: [] })
    expect(wrapper.find('.no-key-warning').exists()).toBe(false)
    expect(wrapper.findAll('.no-key-list').length).toBe(0)
  })

  it('renders the no-key users list only when non-empty', () => {
    const wrapper = mountModal({
      noKeyUsers: [
        { user_id: 'u1', user_name: 'Alice', user_email: 'alice@x.io' },
        { user_id: 'u2' },
      ],
      errors: [],
    })
    const warnings = wrapper.findAll('.no-key-warning')
    expect(warnings.length).toBe(1)
    const items = wrapper.findAll('.no-key-list li')
    expect(items.length).toBe(2)
    expect(items[0].text()).toContain('Alice')
    // Falls back to user_id when no name/email.
    expect(items[1].text()).toContain('u2')
  })

  it('renders the errors list only when non-empty, with "user_id: error"', () => {
    const wrapper = mountModal({
      noKeyUsers: [],
      errors: [{ user_id: 'u3', error: 'no capacity' }],
    })
    const warnings = wrapper.findAll('.no-key-warning')
    expect(warnings.length).toBe(1)
    const items = wrapper.findAll('.no-key-list li')
    expect(items.length).toBe(1)
    expect(items[0].text()).toContain('u3')
    expect(items[0].text()).toContain('no capacity')
  })

  it('renders both sections when both arrays are non-empty', () => {
    const wrapper = mountModal({
      noKeyUsers: [{ user_id: 'u1', user_name: 'Alice' }],
      errors: [{ user_id: 'u3', error: 'boom' }],
    })
    expect(wrapper.findAll('.no-key-warning').length).toBe(2)
  })

  it('emits close when the confirm/close button is clicked', async () => {
    const wrapper = mountModal()
    // The result modal uses the default footer with a single close action.
    await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')!.length).toBe(1)
  })

  it('emits close when the BaseModal close (X) button is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.base-modal-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
