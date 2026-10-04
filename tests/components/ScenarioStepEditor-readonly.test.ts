/**
 * A scenario the user may read but not edit opens in the same step editor,
 * read only: every tab and field shown, nothing editable, nothing to save —
 * and a tab's text can be copied, since disabled fields cannot be selected.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestI18n } from '../helpers/entityModalHelper'

import ScenarioStepEditor from '../../src/components/ScenarioEditor/ScenarioStepEditor.vue'

const step = {
  id: 'st-1', key: 'st-1', order: 0, title: 'Check the port', step_type: 'terminal',
  text_content: 'Open port **8080**.', hint_content: 'Use ss -tln', verify_script: 'ss -tln | grep -q 8080',
  background_script: 'mkdir -p /srv/app', foreground_script: ''
}

function mountEditor(readonly: boolean) {
  return mount(ScenarioStepEditor, {
    props: { stepData: step, readonly, locales: ['en', 'fr'], defaultLocale: 'en' },
    global: { plugins: [createTestI18n()] },
    attachTo: document.body
  })
}

describe('ScenarioStepEditor — read only', () => {
  it('shows every tab of the step, with its content, and nothing to save', async () => {
    const wrapper = mountEditor(true)
    expect(wrapper.findAll('.tab-strip__btn').map(b => b.text())).toEqual(['Instructions', 'Hints', 'Verification', 'Setup', 'Demonstration', 'Effects'])
    expect((wrapper.get('#step-text-content').element as HTMLTextAreaElement).value).toBe('Open port **8080**.')
    expect(wrapper.get('[data-testid="step-preview"]').text()).toContain('8080')
    await wrapper.get('#tab-verify').trigger('click')
    expect((wrapper.get('#step-verify-script').element as HTMLTextAreaElement).value).toBe('ss -tln | grep -q 8080')
    expect(wrapper.find('[data-testid="step-edit-save"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="step-edit-more"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="step-edit-locale-switch"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('lets nothing be edited', () => {
    const wrapper = mountEditor(true)
    expect(wrapper.get('.ocf-step-fields').attributes('disabled')).toBeDefined()
    expect(wrapper.get('#step-title').attributes('readonly')).toBeDefined()
    wrapper.unmount()
  })

  it("copies the open tab's text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const wrapper = mountEditor(true)
    await wrapper.get('#tab-background').trigger('click')
    await wrapper.get('[data-testid="step-edit-copy"]').trigger('click')
    expect(writeText).toHaveBeenCalledWith('mkdir -p /srv/app')
    wrapper.unmount()
  })

  it('is the ordinary editor otherwise', () => {
    const wrapper = mountEditor(false)
    expect(wrapper.get('.ocf-step-fields').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-testid="step-edit-save"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="step-edit-copy"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
