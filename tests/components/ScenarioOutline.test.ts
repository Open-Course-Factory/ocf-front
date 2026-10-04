/**
 * The scenario editor's outline: the steps as a numbered list the author
 * selects, reorders and inserts into — by mouse or by keyboard. It only asks;
 * the page owns the list and writes the order.
 */

import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createTestI18n } from '../helpers/entityModalHelper'

import ScenarioOutline from '../../src/components/ScenarioEditor/ScenarioOutline.vue'
import { toOutlineSteps } from '../../src/utils/scenarioOutline'

const scenario = { id: 'sc-1', title: 'Shell basics', difficulty: 'beginner', estimated_time_minutes: 90, instance_type: 'M', locales: '["fr","en"]' }

function mountOutline(props: Record<string, unknown> = {}): VueWrapper {
  return mount(ScenarioOutline, {
    props: {
      scenario,
      steps: toOutlineSteps([
        { id: 'a', order: 0, title: 'Look around', step_type: 'terminal', hint_content: 'try ls' },
        { id: 'b', order: 1, title: 'Find the flag', step_type: 'flag' },
        { id: 'c', order: 2, title: 'Check yourself', step_type: 'quiz', questions: [{}, {}, {}] }
      ]),
      selectedKey: 'b',
      editable: true,
      canEditSettings: true,
      ...props
    },
    global: { plugins: [createTestI18n()] },
    attachTo: document.body
  })
}

describe('ScenarioOutline', () => {
  it('lists the steps in order, numbered, with what each carries', () => {
    const wrapper = mountOutline()
    const rows = wrapper.findAll('.ocf-outline-row')
    expect(rows.map(r => r.find('.ocf-outline-title').text())).toEqual(['Look around', 'Find the flag', 'Check yourself'])
    expect(rows.map(r => r.find('.ocf-outline-number').text())).toEqual(['1', '2', '3'])
    expect(rows[0].find('.fa-lightbulb').exists()).toBe(true)
    expect(rows[1].find('.fa-key').exists()).toBe(true)
    expect(rows[2].text()).toContain('3 q.')
    expect(rows[1].attributes('aria-current')).toBe('step')
    wrapper.unmount()
  })

  it('summarises the scenario and opens its settings', async () => {
    const wrapper = mountOutline()
    const card = wrapper.get('[data-testid="outline-scenario-card"]')
    expect(card.text()).toContain('Shell basics')
    expect(card.text()).toContain('1 h 30')
    expect(card.text()).toContain('FR · EN')
    await card.trigger('click')
    expect(wrapper.emitted('edit-settings')).toHaveLength(1)
    wrapper.unmount()
  })

  it('selects a step on click', async () => {
    const wrapper = mountOutline()
    await wrapper.findAll('.ocf-outline-row')[2].trigger('click')
    expect(wrapper.emitted('select')).toEqual([['c']])
    wrapper.unmount()
  })

  it('moves a step with its buttons, and not past either end', async () => {
    const wrapper = mountOutline()
    await wrapper.get('[data-testid="outline-move-down-0"]').trigger('click')
    await wrapper.get('[data-testid="outline-move-up-2"]').trigger('click')
    expect(wrapper.emitted('move')).toEqual([[0, 1], [2, 1]])
    expect(wrapper.get('[data-testid="outline-move-up-0"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="outline-move-down-2"]').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('moves the focused step with Alt+arrows', async () => {
    const wrapper = mountOutline()
    const rows = wrapper.findAll('.ocf-outline-row')
    await rows[1].trigger('keydown', { key: 'ArrowDown', altKey: true })
    await rows[1].trigger('keydown', { key: 'ArrowUp', altKey: true })
    await rows[0].trigger('keydown', { key: 'ArrowUp', altKey: true })
    expect(wrapper.emitted('move')).toEqual([[1, 2], [1, 0]])
    wrapper.unmount()
  })

  it('moves a step dropped on another row to that place', async () => {
    const wrapper = mountOutline()
    const items = wrapper.findAll('.ocf-outline-item')
    await items[0].trigger('dragstart', { dataTransfer: { setData: () => {}, effectAllowed: '' } })
    await items[2].trigger('dragover')
    await items[2].trigger('drop')
    expect(wrapper.emitted('move')).toEqual([[0, 2]])
    wrapper.unmount()
  })

  it('inserts a step of the picked type before a step, or at the end', async () => {
    const wrapper = mountOutline()
    await wrapper.get('[data-testid="outline-insert-1"]').trigger('click')
    await wrapper.get('[data-testid="step-type-info"]').trigger('click')
    await wrapper.get('[data-testid="outline-add-step"]').trigger('click')
    await wrapper.get('[data-testid="step-type-quiz"]').trigger('click')
    expect(wrapper.emitted('insert')).toEqual([[1, 'info'], [3, 'quiz']])
    expect(wrapper.find('[data-testid="step-type-picker"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('offers no reordering or inserting on a scenario the user cannot edit', () => {
    const wrapper = mountOutline({ editable: false, canEditSettings: false })
    expect(wrapper.find('[data-testid="outline-add-step"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="outline-insert-0"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="outline-move-up-1"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="outline-scenario-card"]').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
