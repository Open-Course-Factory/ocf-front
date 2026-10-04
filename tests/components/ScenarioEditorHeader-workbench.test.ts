/**
 * The editor header in one row: a picker that keeps the scenarios a user can
 * edit apart from the ones they can only read, the health verdict, and whether
 * the open step is saved — each in a slot that is there whatever it says.
 */

import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createTestI18n } from '../helpers/entityModalHelper'

import ScenarioEditorHeader from '../../src/components/ScenarioEditor/ScenarioEditorHeader.vue'

const mine = { id: 'm', title: 'My lab', can_manage: true, organization_id: 'org-1' }
const platform = { id: 'p', title: 'GameShell', can_manage: false, organization_id: null }

function mountHeader(overrides: Record<string, unknown> = {}): VueWrapper {
  return mount(ScenarioEditorHeader, {
    props: {
      scenarios: [platform, mine],
      selectedScenarioId: 'm',
      currentScenario: mine,
      scenarioOrgName: 'Labinux',
      canCreateScenario: true,
      canEditScenario: true,
      canCopyToOrg: false,
      isAdmin: false,
      canPreview: true,
      isPreviewLoading: false,
      ...overrides,
    },
    global: { plugins: [createTestI18n()] },
  })
}

describe('ScenarioEditorHeader — workbench row', () => {
  it('groups the picker into my scenarios and the platform ones', () => {
    const groups = mountHeader().findAll('#scenario-picker optgroup')
    expect(groups.map(g => g.attributes('label'))).toEqual(['My scenarios', 'Platform scenarios'])
    expect(groups[0].text()).toContain('My lab')
    expect(groups[1].text()).toContain('GameShell')
  })

  it('asks the page to switch, and keeps showing the open scenario until it does', async () => {
    const wrapper = mountHeader()
    const picker = wrapper.get('#scenario-picker')
    await picker.setValue('p')
    expect(wrapper.emitted('select')).toEqual([['p']])
    expect((picker.element as HTMLSelectElement).value).toBe('m')
  })

  it('says ready to play, or how many problems there are', () => {
    expect(mountHeader({ healthAvailable: true }).get('[data-testid="scenario-status"]').text()).toBe('Ready to play')
    expect(mountHeader({ healthAvailable: true, warningCount: 2 }).get('[data-testid="scenario-status"]').text()).toBe('2 warning(s)')
    expect(mountHeader({ healthAvailable: true, blockingCount: 1, warningCount: 2 }).get('[data-testid="scenario-status"]').text()).toBe('1 blocking problem(s)')
    expect(mountHeader({ healthAvailable: false }).find('[data-testid="scenario-status"]').exists()).toBe(false)
  })

  it('keeps the save state slot in place, empty when no step is open', () => {
    expect(mountHeader().get('[data-testid="save-state"]').text()).toBe('')
    expect(mountHeader({ saveState: 'dirty' }).get('[data-testid="save-state"]').text()).toBe('Unsaved changes')
    expect(mountHeader({ saveState: 'saved' }).get('[data-testid="save-state"]').text()).toBe('Saved')
  })

  it('plays as a learner only once there is something to play', () => {
    expect(mountHeader({ canPreview: false }).get('[data-testid="scenario-play-btn"]').attributes('disabled')).toBeDefined()
    expect(mountHeader().get('[data-testid="scenario-play-btn"]').attributes('disabled')).toBeUndefined()
  })
})
