/**
 * Import and Export in the scenario editor header.
 *
 * Teachers looked for them and did not find them: Export sat inside the ⋯
 * menu and Import nowhere. Both are now buttons in the header row, always in
 * place. Export is offered only for a scenario the user manages — the backend
 * export answers CanManageScenario, the verdict the scenario carries as
 * `can_manage` — and says why when it is not, instead of letting a click 403.
 */

import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ScenarioEditorHeader from '../../src/components/ScenarioEditor/ScenarioEditorHeader.vue'

const scenario = { id: 'sc-1', name: 'lab', title: 'Lab', archived_at: null }

function mountHeader(overrides: Record<string, unknown> = {}): VueWrapper {
  return mount(ScenarioEditorHeader, {
    props: {
      scenarios: [scenario],
      selectedScenarioId: 'sc-1',
      currentScenario: scenario,
      scenarioOrgName: null,
      canCreateScenario: true,
      canEditScenario: true,
      canCopyToOrg: true,
      isAdmin: false,
      nodeCount: 3,
      edgeCount: 2,
      canPreview: true,
      isPreviewLoading: false,
      ...overrides,
    },
    slots: { import: '<button data-testid="scenario-import-btn">Import</button>' },
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false,
      })],
    },
  })
}

const exportButton = (wrapper: VueWrapper) => wrapper.find('[data-testid="scenario-export-btn"]')

describe('ScenarioEditorHeader — import and export', () => {
  it('shows the import control and an enabled Export for a scenario the user manages', async () => {
    const wrapper = mountHeader()
    expect(wrapper.find('[data-testid="scenario-import-btn"]').isVisible()).toBe(true)
    expect(exportButton(wrapper).attributes('disabled')).toBeUndefined()

    await exportButton(wrapper).trigger('click')
    await wrapper.find('[data-testid="scenario-export-killercoda"]').trigger('click')
    await exportButton(wrapper).trigger('click')
    await wrapper.find('[data-testid="scenario-export-json"]').trigger('click')

    expect(wrapper.emitted('export-killercoda')).toHaveLength(1)
    expect(wrapper.emitted('export-json')).toHaveLength(1)
  })

  it('keeps Export in place but disabled, with the reason, when no scenario is selected', () => {
    const wrapper = mountHeader({ selectedScenarioId: null, currentScenario: null })
    expect(exportButton(wrapper).attributes('disabled')).toBeDefined()
    expect(exportButton(wrapper).attributes('title')).toBe('Select a scenario to export it')
  })

  it('disables Export, with the reason, on a scenario the user cannot manage', async () => {
    const wrapper = mountHeader({ canEditScenario: false })
    expect(exportButton(wrapper).attributes('disabled')).toBeDefined()
    expect(exportButton(wrapper).attributes('title')).toBe('Only someone who manages this scenario can export it')

    await exportButton(wrapper).trigger('click')
    expect(wrapper.find('[data-testid="scenario-export-json"]').exists()).toBe(false)
  })

  it('no longer lists the export formats in the ⋯ menu', async () => {
    const wrapper = mountHeader()
    await wrapper.find('.dropdown-container .btn-icon').trigger('click')
    const items = wrapper.findAll('.dropdown-item')
    expect(items.length).toBeGreaterThan(0)
    expect(items.some(i => i.find('.fa-file-archive').exists() || i.find('.fa-file-code').exists())).toBe(false)
  })
})
