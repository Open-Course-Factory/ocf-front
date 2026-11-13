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

import ScenarioStepEditor from '../../src/components/ScenarioEditor/ScenarioStepEditor.vue'

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
  const wrapper = mount(ScenarioStepEditor, {
    props: {

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

describe('ScenarioStepEditor — multiple-choice correct answer', () => {
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

async function mountSurveyWith(questions: any[]) {
  const wrapper = mount(ScenarioStepEditor, {
    props: {
      isNew: false,
      stepType: 'survey',
      stepData: { title: 'Feedback', order: 0, step_type: 'survey', questions },
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

describe('ScenarioStepEditor — survey step (no correct answers)', () => {
  const choice = (correct_answer = '') =>
    ({ question_text: 'How was it?', question_type: 'multiple_choice', options: ['Good', 'Bad'], correct_answer })

  it('shows the questions tab with the options but no correct marks', async () => {
    const wrapper = await mountSurveyWith([choice()])
    expect(wrapper.findAll('.option-row')).toHaveLength(2)
    expect(wrapper.findAll('.option-row__input')).toHaveLength(2)
    expect(wrapper.find('.option-row__correct').exists()).toBe(false)
    expect(radios(wrapper)).toHaveLength(0)
    expect(wrapper.findAll('.option-row--correct')).toHaveLength(0)
  })

  it('hides the feedback and scoring settings, and the points and explanation fields', async () => {
    const wrapper = await mountSurveyWith([choice()])
    expect(wrapper.find('.quiz-settings').exists()).toBe(false)
    expect(wrapper.find('[data-testid="quiz-scoring-mode"]').exists()).toBe(false)
    expect(wrapper.find('#q-0-points').exists()).toBe(false)
    expect(wrapper.find('#q-0-explanation').exists()).toBe(false)
  })

  it('offers no true/false question type', async () => {
    const wrapper = await mountSurveyWith([choice()])
    const values = wrapper.findAll('#q-0-type option').map((o: any) => (o.element as HTMLOptionElement).value)
    expect(values).toEqual(['multiple_choice', 'multi_answer', 'free_text'])
  })

  it('shows no expected-answer field on a free_text question', async () => {
    const wrapper = await mountSurveyWith([
      { question_text: 'Any comment?', question_type: 'free_text', options: [], correct_answer: '' },
    ])
    expect(wrapper.find('#q-0-correct').exists()).toBe(false)
  })

  it('saves without any correct option marked, and never sends a correct answer', async () => {
    const wrapper = await mountSurveyWith([
      choice(''),
      { question_text: 'Pick some', question_type: 'multi_answer', options: ['A', 'B', 'C'], correct_answer: '[0]' },
      { question_text: 'Any comment?', question_type: 'free_text', options: [], correct_answer: 'leftover' },
    ])
    // An unchanged existing step keeps Save disabled; make one edit first.
    await wrapper.find('#q-0-text').setValue('How was it, really?')
    expect(wrapper.text()).not.toContain('Mark at least one correct option.')
    expect(wrapper.find('.field-error').exists()).toBe(false)
    expect(saveButton(wrapper).attributes('disabled')).toBeUndefined()

    await saveButton(wrapper).trigger('click')
    const saved = wrapper.emitted('save')?.[0]?.[0] as any
    expect(saved.questions.map((q: any) => q.correct_answer)).toEqual(['', '', ''])
  })

  it('still refuses a choice question with a single option', async () => {
    const wrapper = await mountSurveyWith([
      { question_text: 'How was it?', question_type: 'multiple_choice', options: ['Only'], correct_answer: '' },
    ])
    expect(wrapper.find('.field-error').text()).toContain('A question needs at least 2 options.')
    expect(wrapper.text()).not.toContain('Mark at least one correct option.')
  })
})
