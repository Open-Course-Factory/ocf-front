/**
 * The settings of a scenario the user may only read open in the same modal,
 * read only: every field shown and disabled, nothing to save, and no
 * vocabulary to load — it is not theirs.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { createTestI18n } from '../helpers/entityModalHelper'

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ createReactiveFlag: () => computed(() => true) })
}))

import ScenarioEditModal from '../../src/components/ScenarioEditor/ScenarioEditModal.vue'

function mountModal(readonly: boolean, scenario: Record<string, unknown> = {}) {
  return mount(ScenarioEditModal, {
    props: {
      visible: true,
      readonly,
      editingScenario: { isNew: false, entityId: 'sc-1', title: 'Lab', setup_script: 'apt-get install -y nginx', ...scenario },
      title: 'Scenario settings',
      orgScopes: [],
      groupScopes: [],
      platformScopeAvailable: false,
      availableCreateScopes: [],
      scopeHint: '',
      currentScenarioOrgLabel: null,
    },
    global: { plugins: [createTestI18n()] },
  })
}

describe('ScenarioEditModal — read only', () => {
  it('shows the settings, setup script included, with every field disabled and nothing to save', async () => {
    const wrapper = mountModal(true)
    expect(wrapper.get('.ocf-scn-fields').attributes('disabled')).toBeDefined()
    await wrapper.get('#tab-setup').trigger('click')
    expect((wrapper.get('#scenario-setup-script').element as HTMLTextAreaElement).value).toBe('apt-get install -y nginx')
    expect(wrapper.find('.base-modal-footer .btn-primary').exists()).toBe(false)
    expect(wrapper.find('#tab-vocabulary').exists()).toBe(false)
    expect(wrapper.find('#tab-messages').exists()).toBe(false)
  })

  it('is the ordinary settings form otherwise', () => {
    const wrapper = mountModal(false)
    expect(wrapper.get('.ocf-scn-fields').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.base-modal-footer .btn-primary').exists()).toBe(true)
    expect(wrapper.find('#tab-vocabulary').exists()).toBe(true)
  })
})

// "Public" is a platform notion: the API refuses it on an organization's
// scenario, so the toggle is offered on a platform scenario only.
describe('ScenarioEditModal — public toggle', () => {
  it('offers the toggle on a platform scenario', () => {
    expect(mountModal(false).find('#scenario-is-public').exists()).toBe(true)
  })

  it("hides it on an organization's scenario", () => {
    expect(mountModal(false, { organization_id: 'org-1' }).find('#scenario-is-public').exists()).toBe(false)
  })

  it('follows the chosen destination on a new scenario', () => {
    expect(mountModal(false, { isNew: true, _scopeKey: 'platform:*' }).find('#scenario-is-public').exists()).toBe(true)
    expect(mountModal(false, { isNew: true, _scopeKey: 'org:org-1' }).find('#scenario-is-public').exists()).toBe(false)
  })
})
