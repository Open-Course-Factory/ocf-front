/**
 * "Test from this step" in ScenarioEditor.vue (#346).
 *
 * Source-inspection tests, in the same style as
 * ScenarioEditor-previewNavigation.test.ts: mounting the editor needs twenty
 * stubbed stores, so the wiring is pinned in the source. The copy is checked
 * for real, through the editor's i18n composable.
 *
 * The step modal asks to preview from a step; the editor reuses the one
 * preview confirm modal with copy that says what is built — setup, then every
 * step's setup script up to this one, and nothing the learner would have
 * typed — and on confirm posts from_step_order and navigates exactly like the
 * whole-scenario preview.
 *
 * The backend refuses a preview for reasons an author can act on: a step it
 * does not know (400), no right to preview or no plan (403), a real run of
 * theirs already in progress (409 session_exists). Each gets its own message
 * in the author's language; a budget refusal (403, source budget) keeps the
 * backend's sentence, which says what to free.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import { useScenarioEditorI18n } from '../../src/composables/useScenarioEditorI18n'
import { previewOptions, previewRefusalKey } from '../../src/utils/scenarioPreview'

const source = readFileSync(resolve(__dirname, '../../src/components/Pages/ScenarioEditor.vue'), 'utf-8')
const template = source.slice(0, source.indexOf('<script'))
const previewHandler = source.match(/const handleConfirmPreview[\s\S]*?\n}\n/)?.[0] ?? ''
const stepModalTag = template.match(/<ScenarioStepEditModal[\s\S]*?\/>/)?.[0] ?? ''
const previewConfirmModal =
  template.match(/<BaseModal(?:(?!<\/BaseModal>)[\s\S])*?@confirm="handleConfirmPreview"[\s\S]*?<\/BaseModal>/)?.[0] ?? ''

const FROM_STEP_BODY_EN =
  "Builds a fresh machine as a learner resuming at this step would get it: setup, then every step's setup script up to this one. Nothing the learner would have typed is replayed."

/** The editor's messages as registered by its i18n composable. */
function editorMessages(): { en: Record<string, string>; fr: Record<string, string> } {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
  mount(defineComponent({ setup() { useScenarioEditorI18n(); return () => h('div') } }), {
    global: { plugins: [i18n] },
  })
  const en = (i18n.global.getLocaleMessage('en') as any).scenarioEditor ?? {}
  const fr = (i18n.global.getLocaleMessage('fr') as any).scenarioEditor ?? {}
  return { en, fr }
}

describe('ScenarioEditor.vue — the step modal can start a preview from its step', () => {
  it('listens for the step modal asking to test from a step', () => {
    expect(stepModalTag).toMatch(/@test-from-step="/)
  })

  it('offers it only when the scenario can be previewed', () => {
    expect(stepModalTag).toMatch(/:can-test-from-step="canPreviewScenario"/)
  })
})

describe('ScenarioEditor.vue — one preview confirm modal, with step-specific copy', () => {
  it('reuses the existing preview confirm modal rather than adding a second one', () => {
    expect(previewConfirmModal).not.toBe('')
    expect(template.match(/@confirm="handleConfirmPreview"/g)).toHaveLength(1)
  })

  it('shows the from-step copy in that modal, beside the whole-scenario copy', () => {
    expect(previewConfirmModal).toMatch(/scenarioEditor\.previewConfirmBody/)
    expect(previewConfirmModal).toMatch(/scenarioEditor\.previewFromStepConfirmBody/)
  })

  it('says what is built and what is not, in English', () => {
    expect(editorMessages().en.previewFromStepConfirmBody).toBe(FROM_STEP_BODY_EN)
  })

  it('says it in French too', () => {
    const { en, fr } = editorMessages()
    expect(fr.previewFromStepConfirmBody).toBeTruthy()
    expect(fr.previewFromStepConfirmBody).not.toBe(en.previewFromStepConfirmBody)
  })
})

describe('ScenarioEditor.vue — confirming previews from the chosen step', () => {
  it('posts the chosen step with the preview', () => {
    expect(previewHandler).toMatch(/previewOptions\(orgId, previewFromStepOrder\.value\)/)
  })

  it('sends the step order, 0 included', () => {
    expect(previewOptions('org-1', 2)).toEqual({ organization_id: 'org-1', from_step_order: 2 })
    expect(previewOptions('org-1', 0)).toHaveProperty('from_step_order', 0)
  })

  it('sends no step for a whole-scenario preview', () => {
    expect(JSON.parse(JSON.stringify(previewOptions('org-1', null)))).toEqual({ organization_id: 'org-1' })
  })
})

describe('ScenarioEditor.vue — a refused preview says why', () => {
  const REFUSALS = ['previewErrorUnknownStep', 'previewErrorForbidden', 'previewErrorSessionExists'] as const

  it('maps each refusal the author can act on to its message', () => {
    expect(previewHandler).toMatch(/previewRefusalKey\(/)
    expect(previewRefusalKey(400, {}, 2)).toBe('scenarioEditor.previewErrorUnknownStep')
    expect(previewRefusalKey(403, { error_message: 'Not authorized' }, null)).toBe('scenarioEditor.previewErrorForbidden')
    expect(previewRefusalKey(409, { reason: 'session_exists' }, 0)).toBe('scenarioEditor.previewErrorSessionExists')
  })

  // The terminal budget is shared: the backend's sentence says what to free,
  // and "you are not allowed" would be wrong.
  it("keeps the backend's explanation for a budget refusal", () => {
    expect(previewRefusalKey(403, { source: 'budget', reason: 'cpu' }, 2)).toBeNull()
  })

  it('does not call a malformed whole-scenario request an unknown step', () => {
    expect(previewRefusalKey(400, {}, null)).toBeNull()
  })

  it('keeps any other conflict to the backend', () => {
    expect(previewRefusalKey(409, { reason: 'archived' }, 2)).toBeNull()
  })

  it.each(REFUSALS)('has %s in English and French', (key) => {
    const { en, fr } = editorMessages()
    expect(en[key]).toBeTruthy()
    expect(fr[key]).toBeTruthy()
    expect(fr[key]).not.toBe(en[key])
  })

  it('gives each refusal a different message', () => {
    const { en } = editorMessages()
    expect(new Set(REFUSALS.map((k) => en[k])).size).toBe(REFUSALS.length)
  })
})
