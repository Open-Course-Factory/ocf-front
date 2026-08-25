/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import axios from 'axios'

/** What state one step is in, for one language. Decided by the backend. */
export interface StepTranslationState {
  step_id: string
  order: number
  state: 'translated' | 'stale' | 'missing'
}

/**
 * How completely one language covers a scenario.
 *
 * Every number here is computed server-side, including staleness. Recomputing
 * it in the editor would mean a second implementation of the rule that says
 * whether a translation still matches what it was written from — and the two
 * would agree until someone changed which fields that rule covers.
 */
export interface LocaleCoverage {
  locale: string
  total_steps: number
  translated: number
  stale: number
  missing: number
  complete: boolean
  steps: StepTranslationState[]
}

export interface StepTranslation {
  id?: string
  step_id: string
  locale: string
  title?: string
  text_content?: string
  hint_content?: string
  intro_text?: string
  outro_text?: string
  /** Which version of the step this was written against. Set by the server. */
  source_hash?: string
}

/** The fields a translator actually writes. */
export type StepTranslationFields = Pick<
  StepTranslation,
  'title' | 'text_content' | 'hint_content' | 'intro_text' | 'outro_text'
>

export const scenarioTranslationService = {
  async getCoverage(scenarioId: string): Promise<LocaleCoverage[]> {
    const response = await axios.get(`/scenarios/${scenarioId}/translation-coverage`)
    return response.data || []
  },

  /** The existing translation of a step in one language, or null if untouched. */
  async getStepTranslation(stepId: string, locale: string): Promise<StepTranslation | null> {
    const response = await axios.get('/scenario-step-translations', {
      params: { step_id: stepId, locale }
    })
    const rows = Array.isArray(response.data) ? response.data : response.data?.data
    return rows?.[0] ?? null
  },

  /**
   * Write a step's translation, creating it the first time.
   *
   * source_hash is never sent. The server stamps which version of the step this
   * was written against, and a caller able to set it would be a caller able to
   * declare stale work current — after which the staleness report would agree,
   * which is worse than not having one.
   */
  async saveStepTranslation(
    stepId: string,
    locale: string,
    fields: StepTranslationFields,
    existingId?: string
  ): Promise<StepTranslation> {
    if (existingId) {
      const response = await axios.patch(`/scenario-step-translations/${existingId}`, fields)
      return response.data
    }
    const response = await axios.post('/scenario-step-translations', {
      step_id: stepId,
      locale,
      ...fields
    })
    return response.data
  }
}
