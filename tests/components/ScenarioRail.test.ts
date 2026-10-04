/**
 * The editor's right rail says what the health check found, in the same
 * sentences as the operators' report, and the scenario's settings in plain
 * words. A check the user may not read (403) is not shown at all — never an
 * "all clear" nobody verified.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestI18n } from '../helpers/entityModalHelper'

import ScenarioRail from '../../src/components/ScenarioEditor/ScenarioRail.vue'

const scenario = { id: 'sc-1', os_type: 'deb', instance_type: 'M', required_features: '["network"]', is_public: false }

function mountRail(props: Record<string, unknown> = {}) {
  return mount(ScenarioRail, {
    props: {
      scenario,
      steps: [{ id: 'a', key: 'a', order: 0, title: 'x', step_type: 'flag' }],
      findings: [],
      healthAvailable: true,
      canManage: true,
      orgName: 'Labinux',
      ...props
    },
    global: { plugins: [createTestI18n()], stubs: { ScenarioClassesPanel: true } }
  })
}

// Wide enough for the rail to start open.
window.innerWidth = 1920

describe('ScenarioRail', () => {
  it('says so when the check found nothing', () => {
    const wrapper = mountRail()
    expect(wrapper.get('[data-testid="rail-checks"]').text()).toContain('No problem found')
    expect(wrapper.findAll('[data-testid="rail-finding"]')).toHaveLength(0)
  })

  it('lists each finding in the shared sentence, blocking and warning apart', () => {
    const wrapper = mountRail({
      findings: [
        { code: 'step_without_verification', severity: 'blocking', detail: '3' },
        { code: 'step_without_verification', severity: 'warning', detail: '1, 2' }
      ]
    })
    const findings = wrapper.findAll('[data-testid="rail-finding"]')
    expect(findings).toHaveLength(2)
    expect(findings[0].classes()).toContain('is-blocking')
    expect(findings[0].text()).toContain('cannot get past')
    expect(findings[1].classes()).toContain('is-warning')
    expect(findings[1].text()).toContain('no verify script: Verify always passes them')
  })

  it('shows no checks at all when the user may not read them', () => {
    const wrapper = mountRail({ healthAvailable: false })
    expect(wrapper.find('[data-testid="rail-checks"]').exists()).toBe(false)
  })

  it('summarises the settings in plain words', () => {
    const text = mountRail().get('[data-testid="rail-settings"]').text()
    expect(text).toContain('Debian (apt)')
    expect(text).toContain('network')
    expect(text).toContain('1 flag step(s)')
    expect(text).toContain('Labinux')
  })

  it('offers the settings to edit to a manager and to read to anyone, the classes to everyone', () => {
    const manager = mountRail()
    expect(manager.find('[data-testid="rail-edit-settings"]').exists()).toBe(true)

    // A teacher assigns a colleague's lab, or a platform one, to their class.
    // A reader opens the same settings, to read them.
    const reader = mountRail({ canManage: false })
    expect(reader.get('[data-testid="rail-edit-settings"]').attributes('aria-label')).toBe('See the scenario settings')
    expect(reader.findComponent({ name: 'ScenarioClassesPanel' }).exists()).toBe(true)
  })

  it('says what an unset system or size does instead of a dash', () => {
    const text = mountRail({ scenario: { id: 'sc-2', is_public: true } }).get('[data-testid="rail-settings"]').text()
    expect(text).toContain('First compatible distribution')
    expect(text).toContain("The distribution's default size")
    expect(text).not.toMatch(/—/)
  })

  it('offers the step library as a second tab only when given one', async () => {
    expect(mountRail().find('#tab-library').exists()).toBe(false)

    const wrapper = mount(ScenarioRail, {
      props: { scenario, steps: [], findings: [], healthAvailable: true, canManage: true, orgName: null },
      slots: { library: '<div data-testid="library-body">library</div>' },
      global: { plugins: [createTestI18n()], stubs: { ScenarioClassesPanel: true } }
    })
    expect(wrapper.find('[data-testid="library-body"]').exists()).toBe(false)
    await wrapper.get('#tab-library').trigger('click')
    expect(wrapper.find('[data-testid="library-body"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="rail-settings"]').exists()).toBe(false)
  })
})
