/**
 * Archive in the scenario editor header.
 *
 * The editor is where a scenario with no organization is managed, and it was
 * the one place still offering Delete without the non-destructive alternative.
 * The action sits in the overflow menu and mirrors the library's wording.
 * Restore is not here: the editor never shows an archived scenario — that is
 * the org Scenarios tab's and the admin list's job.
 *
 * Archiving retires the scenario for every learner and class at once, so the
 * header only asks — the parent owns the confirmation and the service call.
 */

import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ScenarioEditorHeader from '../../src/components/ScenarioEditor/ScenarioEditorHeader.vue'

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

const activeScenario = { id: 'sc-1', name: 'old-lab', title: 'Old Lab', archived_at: null }

function mountHeader(overrides: Record<string, unknown> = {}): VueWrapper {
  return mount(ScenarioEditorHeader, {
    props: {
      scenarios: [activeScenario],
      selectedScenarioId: 'sc-1',
      currentScenario: activeScenario,
      scenarioOrgName: null,
      canCreateScenario: true,
      canEditScenario: true,
      canCopyToOrg: false,
      canRetire: true,
      isAdmin: false,
      canPreview: true,
      isPreviewLoading: false,
      ...overrides,
    },
    global: { plugins: [createTestI18n()] },
  })
}

async function openOverflowMenu(wrapper: VueWrapper) {
  await wrapper.find('.dropdown-container .btn-icon').trigger('click')
}

function menuItem(wrapper: VueWrapper, iconClass: string) {
  return wrapper.findAll('.ocf-header-menu-item').find(b => b.find(iconClass).exists())
}

describe('ScenarioEditorHeader — archive action', () => {
  it('offers Archive for a scenario in service', async () => {
    const wrapper = mountHeader()
    await openOverflowMenu(wrapper)

    const archive = menuItem(wrapper, '.fa-box-archive')
    expect(archive, 'the overflow menu offers Archive').toBeTruthy()
    expect(menuItem(wrapper, '.fa-rotate-left'), 'and never Restore').toBeFalsy()

    await archive!.trigger('click')
    expect(wrapper.emitted('archive')).toHaveLength(1)
  })

  it('hides Archive from someone who may not retire the scenario', async () => {
    const wrapper = mountHeader({ canEditScenario: false, canRetire: false, canCopyToOrg: true })
    await openOverflowMenu(wrapper)

    expect(menuItem(wrapper, '.fa-box-archive')).toBeFalsy()
  })

  it('offers no overflow menu at all when it would be empty', () => {
    const wrapper = mountHeader({ canEditScenario: false, canRetire: false, canCopyToOrg: false })
    expect(wrapper.find('.dropdown-container').exists()).toBe(false)
  })
})
