/**
 * A brand-new multiple-choice question has correct_answer = ''. The editor
 * used to test `Number(correct_answer) === index`, and Number('') is 0, so
 * option 1's radio rendered as already selected: clicking it fired no change
 * event and the question saved with no correct answer at all.
 *
 * Two contracts: an unanswered question shows no option as correct, and the
 * modal refuses to save until the author has marked one.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ScenarioStepEditModal from '../../src/components/ScenarioEditor/ScenarioStepEditModal.vue'

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

async function mountQuizWith(correct_answer: string) {
  const wrapper = mount(ScenarioStepEditModal, {
    props: {
      visible: true,
      isNew: false,
      stepType: 'quiz',
      stepData: {
        title: 'Quiz',
        order: 0,
        step_type: 'quiz',
        questions: [
          { question_text: 'Which?', question_type: 'multiple_choice', options: ['A', 'B'], correct_answer },
        ],
      },
    },
    global: {
      plugins: [createTestI18n()],
      stubs: { BaseModal: { template: '<div><slot /><slot name="footer" /></div>' } },
    },
  })
  await wrapper.vm.$nextTick()
  ;(wrapper.vm as any).activeTab = 'questions'
  await wrapper.vm.$nextTick()
  return wrapper
}

const radios = (wrapper: any) => wrapper.findAll('.option-row input[type="radio"]')
const saveButton = (wrapper: any) => wrapper.find('[data-testid="step-edit-save"]')

describe('ScenarioStepEditModal — multiple-choice correct answer', () => {
  it('renders no option as correct while the author has not chosen one', async () => {
    const wrapper = await mountQuizWith('')
    expect(radios(wrapper)).toHaveLength(2)
    expect(radios(wrapper).map((r: any) => (r.element as HTMLInputElement).checked)).toEqual([false, false])
    expect(wrapper.findAll('.option-row--correct')).toHaveLength(0)
  })

  it('still renders option 1 as correct when it really is the answer', async () => {
    const wrapper = await mountQuizWith('0')
    expect(radios(wrapper).map((r: any) => (r.element as HTMLInputElement).checked)).toEqual([true, false])
  })

  it('refuses to save until one option is marked correct', async () => {
    const wrapper = await mountQuizWith('')
    expect(saveButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.find('.field-error').exists()).toBe(true)

    await radios(wrapper)[0].trigger('change')

    expect(saveButton(wrapper).attributes('disabled')).toBeUndefined()
    await saveButton(wrapper).trigger('click')
    const saved = wrapper.emitted('save')?.[0]?.[0] as any
    expect(saved.questions[0].correct_answer).toBe('0')
  })
})
