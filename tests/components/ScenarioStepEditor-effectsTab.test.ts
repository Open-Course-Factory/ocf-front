/**
 * Tests for the Effects tab in ScenarioStepEditor (#44).
 *
 * A step can declare an intro and an outro banner, drawn in the learner's
 * terminal by ocf-banner. Two things have to hold or the trainer silently
 * gets nothing:
 *
 *   - the effect names offered must be the ones ocf-banner accepts. An
 *     unknown name draws nothing and fails silently from the trainer's side,
 *     so the list is pinned here rather than trusted to stay in step.
 *   - the text inputs must cap at the same 500 characters as the backend DTO,
 *     so a long line is refused by the field while the trainer is typing
 *     instead of coming back as a 400 on save.
 *
 * "No effect" is a valid, default choice — a step without a banner is the
 * normal case, not an unset one.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ScenarioStepEditor from '../../src/components/ScenarioEditor/ScenarioStepEditor.vue'

// The names ocf-banner accepts in the container.
const OCF_BANNER_EFFECTS = [
  'decrypt',
  'slide',
  'unstable',
  'fireworks',
  'burn',
  'rings',
  'beams',
  'matrix',
  'rain',
]

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

async function mountOnEffectsTab(stepData: Record<string, unknown> | null = null) {
  const wrapper = mount(ScenarioStepEditor, {
    props: {
      // The tab is behind the scenario_step_effects flag; the page passes it.
      showEffects: true,
      isNew: stepData === null,
      stepType: 'terminal',
      stepData,
    },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        BaseModal: { template: '<div><slot /></div>' },
      },
    },
  })

  await wrapper.vm.$nextTick()
  // TabStrip is real; drive it the way a trainer would rather than setting
  // the active tab directly.
  const effectsTab = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('effect'))
  expect(effectsTab, 'the Effects tab should be offered').toBeTruthy()
  await effectsTab!.trigger('click')
  await wrapper.vm.$nextTick()

  return wrapper
}

describe('ScenarioStepEditor — Effects tab', () => {
  it('offers exactly the effects ocf-banner accepts, plus an explicit no-effect choice', async () => {
    const wrapper = await mountOnEffectsTab()

    const intro = wrapper.find('#step-intro-effect')
    expect(intro.exists()).toBe(true)

    const values = intro.findAll('option').map(o => o.attributes('value'))
    expect(values[0]).toBe('')
    expect(values.slice(1)).toEqual(OCF_BANNER_EFFECTS)
  })

  it('defaults a new step to no effect and no text', async () => {
    const wrapper = await mountOnEffectsTab()

    expect((wrapper.find('#step-intro-effect').element as HTMLSelectElement).value).toBe('')
    expect((wrapper.find('#step-outro-effect').element as HTMLSelectElement).value).toBe('')
    expect((wrapper.find('#step-intro-text').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#step-outro-text').element as HTMLInputElement).value).toBe('')
  })

  it('caps both text fields at the backend limit of 500 characters', async () => {
    const wrapper = await mountOnEffectsTab()

    expect(wrapper.find('#step-intro-text').attributes('maxlength')).toBe('500')
    expect(wrapper.find('#step-outro-text').attributes('maxlength')).toBe('500')
  })

  it('loads an existing step onto the fields', async () => {
    const wrapper = await mountOnEffectsTab({
      title: 'Level 3',
      order: 2,
      intro_effect: 'decrypt',
      intro_text: 'the machine is lying to you',
      outro_effect: 'fireworks',
      outro_text: 'flag captured',
    })

    expect((wrapper.find('#step-intro-effect').element as HTMLSelectElement).value).toBe('decrypt')
    expect((wrapper.find('#step-intro-text').element as HTMLInputElement).value).toBe(
      'the machine is lying to you'
    )
    expect((wrapper.find('#step-outro-effect').element as HTMLSelectElement).value).toBe('fireworks')
    expect((wrapper.find('#step-outro-text').element as HTMLInputElement).value).toBe('flag captured')
  })

  it('warns that a step edited mid-session changes nothing until a fresh run', async () => {
    const wrapper = await mountOnEffectsTab()

    // The exact wording is i18n; what matters is that the caveat is present
    // and not hidden behind a hover.
    expect(wrapper.find('.ocf-effects-note').exists()).toBe(true)
  })
})

describe('ScenarioStepEditor — Effects tab behind scenario_step_effects', () => {
  const tabsOf = (showEffects: boolean, readonly = false) => mount(ScenarioStepEditor, {
    props: { stepData: { step_type: 'terminal', title: 'T' }, showEffects, readonly },
    global: { plugins: [createTestI18n()] },
  }).findAll('.tab-strip__btn').map(b => b.text())

  it('offers no Effects tab while the flag is off, editing or reading', () => {
    expect(tabsOf(false)).not.toContain('Effects')
    expect(tabsOf(false, true)).not.toContain('Effects')
  })

  it('offers it once the flag is on', () => {
    expect(tabsOf(true)).toContain('Effects')
    expect(tabsOf(true, true)).toContain('Effects')
  })

  it('falls back to the instructions when the open Effects tab goes away', async () => {
    const wrapper = mount(ScenarioStepEditor, {
      props: { stepData: { step_type: 'terminal', title: 'T' }, showEffects: true },
      global: { plugins: [createTestI18n()] },
    })
    await wrapper.get('#tab-effects').trigger('click')
    await wrapper.setProps({ showEffects: false })
    expect(wrapper.get('#tab-content').attributes('aria-selected')).toBe('true')
    expect(wrapper.find('#panel-effects').exists()).toBe(false)
  })
})

