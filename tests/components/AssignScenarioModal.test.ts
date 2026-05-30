/**
 * Tests for AssignScenarioModal — the "assign scenario to group" BaseModal
 * extracted from GroupScenariosTab.vue (commit c2 of #244).
 *
 * Unlike the other three c2 modals, this one OWNS its form state internally
 * (selectedScenarioId, startDate, deadline, search) and the optgroup-split
 * computeds. The parent keeps the assignScenarioToGroup service call: the modal
 * emits `assign({ scenarioId, startDate, deadline })`.
 *
 * Source (parent):
 *   - search filters availableScenarios by title/name (case-insensitive
 *     substring) → filteredAvailableScenarios.
 *   - orgScenarios   = filtered.filter(s => s.source === 'org')
 *   - groupOnlyScenarios = filtered.filter(s => s.source === 'group')
 *   - <optgroup orgLibrary> rendered when orgScenarios.length > 0
 *   - <optgroup groupScenarios> rendered when groupOnlyScenarios.length > 0
 *   - behavior-frozen: confirm has NO disabled guard (the parent's modal never
 *     had one). A select-gated disable is deferred to Branch 2.
 *   - on open (visible false→true) the form resets.
 *
 * i18n note: empty test messages → option labels render the title text (real
 * data) with the difficulty label as the bare key; we assert on the title and
 * on the optgroup count, not on translated chrome.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import AssignScenarioModal from '../../src/components/Groups/modals/AssignScenarioModal.vue'

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

const scenarios = [
  { id: 'org-1', name: 'docker-basics', title: 'Docker Basics', difficulty: 'beginner', source: 'org' },
  { id: 'org-2', name: 'k8s-intro', title: 'Kubernetes Intro', difficulty: 'advanced', source: 'org' },
  { id: 'grp-1', name: 'local-lab', title: 'Local Lab', difficulty: 'intermediate', source: 'group' },
]

function mountModal(props: Record<string, unknown> = {}) {
  return mount(AssignScenarioModal, {
    props: { visible: true, scenarios, ...props },
    global: { plugins: [createTestI18n()] },
  })
}

describe('AssignScenarioModal', () => {
  it('renders no overlay when visible is false', () => {
    const wrapper = mountModal({ visible: false })
    expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)
  })

  it('splits scenarios into org and group-only optgroups', () => {
    const wrapper = mountModal()
    const optgroups = wrapper.findAll('select optgroup')
    expect(optgroups.length).toBe(2)

    // The org optgroup has the two org scenarios; the group optgroup has one.
    const allOptionTexts = wrapper.findAll('select option').map(o => o.text())
    expect(allOptionTexts.some(t => t.includes('Docker Basics'))).toBe(true)
    expect(allOptionTexts.some(t => t.includes('Kubernetes Intro'))).toBe(true)
    expect(allOptionTexts.some(t => t.includes('Local Lab'))).toBe(true)
  })

  it('filters options by the search box (case-insensitive substring)', async () => {
    const wrapper = mountModal()
    await wrapper.find('input[type="text"]').setValue('docker')

    const optionTexts = wrapper.findAll('select option').map(o => o.text())
    expect(optionTexts.some(t => t.includes('Docker Basics'))).toBe(true)
    expect(optionTexts.some(t => t.includes('Kubernetes Intro'))).toBe(false)
    expect(optionTexts.some(t => t.includes('Local Lab'))).toBe(false)

    // Only the org optgroup survives (group has no match).
    expect(wrapper.findAll('select optgroup').length).toBe(1)
  })

  it('emits assign once with the selected payload when confirm is clicked', async () => {
    const wrapper = mountModal()
    const confirm = () => wrapper.find('.base-modal-footer .btn-primary')

    // Behavior-frozen: the parent's Assign modal had no confirm-disabled guard,
    // so the confirm button is always enabled. (A select-gated disable is
    // deferred to Branch 2.) Here we just select, fill dates, and confirm.
    await wrapper.find('select').setValue('org-2')
    const dateInputs = wrapper.findAll('input[type="date"]')
    await dateInputs[0].setValue('2026-06-01') // start date
    await dateInputs[1].setValue('2026-06-30') // deadline

    await confirm().trigger('click')

    const emitted = wrapper.emitted('assign')
    expect(emitted).toBeTruthy()
    expect(emitted!.length).toBe(1)
    expect(emitted![0][0]).toEqual({
      scenarioId: 'org-2',
      startDate: '2026-06-01',
      deadline: '2026-06-30',
    })
  })

  it('emits close when the cancel button is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.base-modal-footer .btn-secondary').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')!.length).toBe(1)
  })

  it('resets its form when reopened (visible false → true)', async () => {
    const wrapper = mountModal({ visible: true })

    // Fill the form.
    await wrapper.find('select').setValue('org-1')
    await wrapper.find('input[type="text"]').setValue('docker')
    const dateInputs = wrapper.findAll('input[type="date"]')
    await dateInputs[0].setValue('2026-06-01')

    // Close, then reopen.
    await wrapper.setProps({ visible: false })
    await wrapper.setProps({ visible: true })

    // Search cleared → all three options visible again.
    const optionTexts = wrapper.findAll('select option').map(o => o.text())
    expect(optionTexts.some(t => t.includes('Kubernetes Intro'))).toBe(true)
    expect(optionTexts.some(t => t.includes('Local Lab'))).toBe(true)

    // Dates cleared.
    const resetDates = wrapper.findAll('input[type="date"]')
    expect((resetDates[0].element as HTMLInputElement).value).toBe('')
  })
})
