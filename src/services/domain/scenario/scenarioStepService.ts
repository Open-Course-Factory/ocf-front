/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * The step reads and question writes of the scenario editor. Creating, updating
 * and deleting a step itself go through the scenarioSteps store.
 */

import axios from 'axios'
import { receivedScriptFields } from '../../../utils/scenarioStepPayload'

// The backend stores a question's `options` as a JSON string (TEXT column); the
// editor works on `string[]`. Tolerates payloads that already arrive as arrays
// (demo mode) or invalid JSON.
export function deserializeQuestion(q: any) {
  const raw = q?.options
  let options: string[] = []
  if (Array.isArray(raw)) {
    options = raw
  } else if (typeof raw === 'string' && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw)
      options = Array.isArray(parsed) ? parsed : []
    } catch {
      options = []
    }
  }
  return { ...q, options }
}

export const scenarioStepService = {
  /**
   * One step with everything the editor edits. The scenario's include=steps
   * read leaves out the scripts and the banner settings, so the editor reads
   * the step itself before showing it — without that, a saved script would
   * open empty and be blanked by the next save.
   *
   * `_receivedFields` records which redactable fields the read actually
   * delivered; the save sends only those (see withoutUnseenScripts).
   */
  async loadStep(stepId: string): Promise<Record<string, any>> {
    const response = await axios.get(`/scenario-steps/${stepId}`)
    const step = response.data
    return {
      ...step,
      verify_script: step.verify_script || '',
      background_script: step.background_script || '',
      foreground_script: step.foreground_script || '',
      text_content: step.text_content || '',
      hint_content: step.hint_content || '',
      show_immediate_feedback: step.show_immediate_feedback ?? false,
      intro_effect: step.intro_effect || '',
      intro_text: step.intro_text || '',
      outro_effect: step.outro_effect || '',
      outro_text: step.outro_text || '',
      questions: Array.isArray(step.questions) ? step.questions.map(deserializeQuestion) : [],
      _receivedFields: receivedScriptFields(step)
    }
  },

  /**
   * A scenario the user may read but not edit, in full: its setup script and
   * its steps in the editor's own shape — scripts, hints, questions with their
   * answers, effects (GET /scenarios/:id/steps/read-only). Offered to anyone
   * who may author somewhere: it is what they would get by duplicating it, so
   * the read-only editor and the step library are built on it.
   */
  async loadReadOnly(scenarioId: string): Promise<{ setup_script: string; steps: any[] }> {
    const response = await axios.get(`/scenarios/${scenarioId}/steps/read-only`)
    const steps = Array.isArray(response.data?.steps) ? response.data.steps : []
    return {
      setup_script: response.data?.setup_script || '',
      steps: steps.map((step: any) => ({
        ...step,
        questions: Array.isArray(step.questions) ? step.questions.map(deserializeQuestion) : []
      }))
    }
  },

  /**
   * Brings a step's quiz questions in line with `newQuestions`, matching by id:
   * a new question is POSTed, a kept one PATCHed, a removed one DELETEd. The
   * calls are independent and run together; any failure is thrown, naming
   * every question that did not make it.
   */
  async syncQuestions(stepId: string, oldQuestions: any[], newQuestions: any[]): Promise<void> {
    const oldList = Array.isArray(oldQuestions) ? oldQuestions : []
    const newList = Array.isArray(newQuestions) ? newQuestions : []
    const newIds = new Set(newList.map(q => q?.id).filter(Boolean))

    const ops: { label: string; promise: Promise<any> }[] = []

    oldList.forEach(oldQ => {
      if (oldQ?.id && !newIds.has(oldQ.id)) {
        ops.push({ label: `delete ${oldQ.id}`, promise: axios.delete(`/scenario-step-questions/${oldQ.id}`) })
      }
    })

    newList.forEach((q, idx) => {
      const order = idx + 1 // 1-based, matches backend convention
      const body = {
        order,
        question_text: q.question_text || '',
        question_type: q.question_type || 'multiple_choice',
        options: JSON.stringify(Array.isArray(q.options) ? q.options : []),
        correct_answer: q.correct_answer ?? '',
        explanation: q.explanation || '',
        points: q.points || 1
      }
      const label = `Q${order} "${(q.question_text || '').slice(0, 30)}"`
      ops.push(q?.id
        ? { label, promise: axios.patch(`/scenario-step-questions/${q.id}`, body) }
        : { label, promise: axios.post('/scenario-step-questions', { step_id: stepId, ...body }) })
    })

    const results = await Promise.allSettled(ops.map(o => o.promise))
    const failures = results.flatMap((r, i) => {
      if (r.status !== 'rejected') return []
      const reason = r.reason?.response?.data?.error_message || r.reason?.response?.data?.message || r.reason?.message || 'unknown error'
      return [`${ops[i].label}: ${reason}`]
    })
    if (failures.length > 0) throw new Error(failures.join(' • '))
  }
}
