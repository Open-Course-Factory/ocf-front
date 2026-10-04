/**
 * Archive / restore in the scenario editor header.
 *
 * The editor is where a scenario with no organization is managed, and it was
 * the one place still offering Delete without the non-destructive alternative.
 * The action sits in the overflow menu beside Reset, mirrors the library's
 * wording, and swaps to Restore once the scenario carries archived_at.
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
const archivedScenario = { ...activeScenario, archived_at: '2026-01-15T10:00:00Z' }

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
      isImporting: false,
      isAdmin: false,
      nodeCount: 3,
      edgeCount: 2,
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
  return wrapper.findAll('.dropdown-item').find(b => b.find(iconClass).exists())
}

describe('ScenarioEditorHeader — archive action', () => {
  it('offers Archive for a scenario in service', async () => {
    const wrapper = mountHeader()
    await openOverflowMenu(wrapper)

    const archive = menuItem(wrapper, '.fa-box-archive')
    expect(archive, 'the overflow menu offers Archive').toBeTruthy()
    expect(menuItem(wrapper, '.fa-rotate-left'), 'and not Restore').toBeFalsy()

    await archive!.trigger('click')
    expect(wrapper.emitted('archive')).toHaveLength(1)
    expect(wrapper.emitted('unarchive')).toBeUndefined()
  })

  it('offers Restore instead once the scenario is archived', async () => {
    const wrapper = mountHeader({ currentScenario: archivedScenario })
    await openOverflowMenu(wrapper)

    const restore = menuItem(wrapper, '.fa-rotate-left')
    expect(restore, 'the overflow menu offers Restore').toBeTruthy()
    expect(menuItem(wrapper, '.fa-box-archive'), 'and not Archive').toBeFalsy()

    await restore!.trigger('click')
    expect(wrapper.emitted('unarchive')).toHaveLength(1)
    expect(wrapper.emitted('archive')).toBeUndefined()
  })

  it('badges an archived scenario in the header', () => {
    expect(mountHeader().find('.archived-badge').exists()).toBe(false)
    expect(mountHeader({ currentScenario: archivedScenario }).find('.archived-badge').exists()).toBe(true)
  })

  it('hides both actions from someone who may not edit the scenario', async () => {
    const wrapper = mountHeader({ canEditScenario: false })
    await openOverflowMenu(wrapper)

    expect(menuItem(wrapper, '.fa-box-archive')).toBeFalsy()
    expect(menuItem(wrapper, '.fa-rotate-left')).toBeFalsy()
  })
})
