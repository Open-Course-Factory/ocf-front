/**
 * The scenario settings modal holds a long, unsaved form — scripts, setup,
 * vocabulary. A stray click beside the modal used to close it and drop
 * everything typed. Only Cancel and the close button leave the editor. (The
 * step form is no longer a modal; useUnsavedChangesGuard covers it.)
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { createTestI18n } from '../helpers/entityModalHelper'

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ createReactiveFlag: () => computed(() => true) })
}))

import ScenarioEditModal from '../../src/components/ScenarioEditor/ScenarioEditModal.vue'

const global = { plugins: [createTestI18n()] }

describe('scenario editor modals — backdrop click', () => {
  it('keeps the scenario editor open', async () => {
    const wrapper = mount(ScenarioEditModal, {
      props: {
        visible: true,
        editingScenario: { isNew: true, title: 'Draft' },
        title: 'Create scenario',
        orgScopes: [],
        groupScopes: [],
        platformScopeAvailable: false,
        availableCreateScopes: [],
        scopeHint: '',
        currentScenarioOrgLabel: null,
      },
      global,
    })

    await wrapper.get('.base-modal-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.get('.base-modal-close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
