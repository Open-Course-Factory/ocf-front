/**
 * The step library lists every scenario the user can see with its steps, to
 * reuse some in the scenario being edited: grouped, searchable, previewable,
 * ticked and inserted (or dragged) — only ids leave it, the copy is the
 * server's.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const loadOutline = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioStepService: { loadOutline: (id: string) => loadOutline(id) }
}))
import { createTestI18n } from '../helpers/entityModalHelper'

import StepLibrary from '../../src/components/ScenarioEditor/StepLibrary.vue'
import { LIBRARY_DRAG_TYPE } from '../../src/utils/scenarioOutline'

const scenarios = [
  { id: 'mine', title: 'My lab', can_manage: true, organization_id: 'org-1', steps: [
    { id: 'm2', order: 1, title: 'Second', step_type: 'quiz' },
    { id: 'm1', order: 0, title: 'First', step_type: 'info', text_content: 'Hello learner' }
  ] },
  { id: 'colleague', title: 'Colleague lab', can_manage: false, organization_id: 'org-1', steps: [
    { id: 'c1', order: 0, title: 'Find the flag', step_type: 'flag' }
  ] },
  { id: 'platform', title: 'GameShell', can_manage: false, organization_id: null, steps: [
    { id: 'p1', order: 0, title: 'Climb the tower', step_type: 'terminal' }
  ] },
  // What the list sends for a scenario the user does not manage: no steps.
  { id: 'public', title: 'Public lab', can_manage: false, organization_id: null, steps: [] },
  { id: 'old', title: 'Archived', can_manage: true, archived_at: '2026-01-01', steps: [{ id: 'o1', order: 0, title: 'Gone' }] },
  { id: 'current', title: 'Being edited', can_manage: true, steps: [{ id: 'x1', order: 0, title: 'Own step' }] }
]

beforeEach(() => loadOutline.mockReset())

function mountLibrary(props: Record<string, unknown> = {}) {
  return mount(StepLibrary, {
    props: { scenarios, currentScenarioId: 'current', insertAfter: 2, busy: false, ...props },
    global: { plugins: [createTestI18n()] }
  })
}

describe('StepLibrary', () => {
  it('groups the scenarios, leaving out archived ones and the one being edited', () => {
    const wrapper = mountLibrary()
    expect(wrapper.findAll('.ocf-library-group-title').map(h => h.text())).toEqual(['My scenarios', 'Organization', 'Platform scenarios'])
    expect(wrapper.text()).not.toContain('Archived')
    expect(wrapper.text()).not.toContain('Being edited')
  })

  it('fetches the outline of a scenario the list sent without steps, on opening it, once', async () => {
    loadOutline.mockResolvedValue([{ id: 'pub1', order: 0, title: 'Public step', step_type: 'info', text_content: 'Safe text' }])
    const wrapper = mountLibrary()
    expect(loadOutline).not.toHaveBeenCalled()
    await wrapper.get('[data-testid="step-library-scenario-public"]').trigger('click')
    await flushPromises()
    expect(loadOutline).toHaveBeenCalledWith('public')
    expect(wrapper.text()).toContain('Public step')
    await wrapper.get('[data-testid="step-library-scenario-public"]').trigger('click')
    await wrapper.get('[data-testid="step-library-scenario-public"]').trigger('click')
    expect(loadOutline).toHaveBeenCalledTimes(1)
  })

  it('lists a scenario’s steps in order once expanded, and previews one as the learner reads it', async () => {
    const wrapper = mountLibrary()
    await wrapper.get('[data-testid="step-library-scenario-mine"]').trigger('click')
    expect(wrapper.findAll('.ocf-library-step-title').map(b => b.text())).toEqual(['First', 'Second'])
    await wrapper.get('[data-testid="step-library-preview-m1"]').trigger('click')
    expect(wrapper.get('[data-testid="step-preview"]').text()).toContain('Hello learner')
  })

  it('searches step titles across scenarios and opens what it found', async () => {
    const wrapper = mountLibrary()
    await wrapper.get('[data-testid="step-library-search"]').setValue('flag')
    await wrapper.get('[data-testid="step-library-scenario-colleague"]').trigger('click')
    expect(wrapper.findAll('.ocf-library-step-title').map(b => b.text())).toEqual(['Find the flag'])
  })

  it('inserts the ticked steps after the selected one', async () => {
    const wrapper = mountLibrary()
    await wrapper.get('[data-testid="step-library-scenario-mine"]').trigger('click')
    await wrapper.get('[data-testid="step-library-scenario-platform"]').trigger('click')
    const insert = wrapper.get('[data-testid="step-library-insert"]')
    expect(insert.attributes('disabled')).toBeDefined()
    expect(insert.text()).toBe('Insert after step 2')
    await wrapper.get('[data-testid="step-library-pick-p1"]').setValue(true)
    await wrapper.get('[data-testid="step-library-pick-m1"]').setValue(true)
    await insert.trigger('click')
    expect(wrapper.emitted('insert')).toEqual([[['p1', 'm1']]])
  })

  it('says "at the start" when nothing comes before', () => {
    expect(mountLibrary({ insertAfter: 0 }).get('[data-testid="step-library-insert"]').text()).toBe('Insert at the start')
  })

  it('drags the ticked steps, or just the one dragged', async () => {
    const wrapper = mountLibrary()
    await wrapper.get('[data-testid="step-library-scenario-mine"]').trigger('click')
    await wrapper.get('[data-testid="step-library-scenario-platform"]').trigger('click')
    await wrapper.get('[data-testid="step-library-pick-m1"]').setValue(true)
    const data: Record<string, string> = {}
    const dataTransfer = { setData: (type: string, value: string) => { data[type] = value }, effectAllowed: '' }
    const rows = wrapper.findAll('.ocf-library-step')
    await rows.find(r => r.text().includes('First'))!.trigger('dragstart', { dataTransfer })
    expect(JSON.parse(data[LIBRARY_DRAG_TYPE])).toEqual(['m1'])
    await rows.find(r => r.text().includes('Climb'))!.trigger('dragstart', { dataTransfer })
    expect(JSON.parse(data[LIBRARY_DRAG_TYPE])).toEqual(['p1'])
  })
})
