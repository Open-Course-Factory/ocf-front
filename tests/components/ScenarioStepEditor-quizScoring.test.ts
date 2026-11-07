/**
 * Quiz scoring mode: an empty mode from the backend reads as all_or_nothing,
 * the penalty field only shows for partial scoring, and both are saved with
 * the step like show_immediate_feedback.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ScenarioStepEditor from '../../src/components/ScenarioEditor/ScenarioStepEditor.vue'

async function mountQuiz(stepFields: Record<string, unknown>) {
  const wrapper = mount(ScenarioStepEditor, {
    props: {
      isNew: false,
      stepType: 'quiz',
      stepData: {
        title: 'Quiz',
        order: 0,
        step_type: 'quiz',
        questions: [
          { question_text: 'Which?', question_type: 'multiple_choice', options: ['A', 'B'], correct_answer: '0' },
        ],
        ...stepFields,
      },
    },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: { BaseModal: { template: '<div><slot /><slot name="footer" /></div>' } },
    },
  })
  await wrapper.vm.$nextTick()
  ;(wrapper.vm as any).activeTab = 'questions'
  await wrapper.vm.$nextTick()
  return wrapper
}

const saved = (wrapper: any) => wrapper.emitted('save')?.[0]?.[0] as any

describe('ScenarioStepEditor — quiz scoring mode', () => {
  it('reads an empty mode as all or nothing and hides the penalty', async () => {
    const wrapper = await mountQuiz({ quiz_scoring_mode: '' })
    const select = wrapper.find('[data-testid="quiz-scoring-mode"]')
    expect((select.element as HTMLSelectElement).value).toBe('all_or_nothing')
    expect(wrapper.find('[data-testid="quiz-wrong-penalty"]').exists()).toBe(false)
  })

  it('saves partial scoring with the penalty the author typed', async () => {
    const wrapper = await mountQuiz({})
    await wrapper.find('[data-testid="quiz-scoring-mode"]').setValue('partial')
    const penalty = wrapper.find('[data-testid="quiz-wrong-penalty"]')
    expect((penalty.element as HTMLInputElement).value).toBe('1')
    await penalty.setValue('0.5')

    await wrapper.find('[data-testid="step-edit-save"]').trigger('click')
    expect(saved(wrapper).quiz_scoring_mode).toBe('partial')
    expect(saved(wrapper).quiz_wrong_penalty).toBe(0.5)
  })

  it('falls back to a penalty of 1 when the field is cleared', async () => {
    const wrapper = await mountQuiz({ quiz_scoring_mode: 'partial', quiz_wrong_penalty: 2 })
    await wrapper.find('[data-testid="quiz-wrong-penalty"]').setValue('')
    await wrapper.find('[data-testid="step-edit-save"]').trigger('click')
    expect(saved(wrapper).quiz_wrong_penalty).toBe(1)
  })
})
