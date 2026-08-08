/**
 * Tests for the scenario-step update payload guard (#42).
 *
 * The bug: `scenarioStepRedactor` strips scripts from a step read unless the
 * caller can manage the scenario, but the editor reads through that same
 * endpoint. It shows an empty Background Script box for a script that exists —
 * and because ocf-core guards its update on `!= nil`, the editor's `""` is
 * non-nil and a second save overwrites the script with nothing. Open, save,
 * content gone, no error.
 *
 * The guard: never send a field the read didn't deliver. Note the editor
 * genuinely cannot tell "hidden" from "empty" — both are `omitempty` on
 * ScenarioStepOutput and arrive absent — which is fine, because omitting is
 * correct either way: it preserves a hidden script and leaves an empty one
 * empty.
 *
 * What must keep working is a deliberate clear: a user who could see a script,
 * selected it and deleted it, means it.
 */

import { describe, it, expect } from 'vitest'
import {
  receivedScriptFields,
  withoutUnseenScripts
} from '../../src/utils/scenarioStepPayload'

describe('receivedScriptFields', () => {
  it('reports only the redactable fields the read actually delivered', () => {
    const read = {
      id: 'st1',
      title: 'Step',
      background_script: '#!/bin/sh\necho hi',
      // verify_script / foreground_script / hint_content / flag_path absent —
      // either redacted or genuinely empty, indistinguishable here.
      text_content: 'not a script field'
    }

    expect(receivedScriptFields(read)).toEqual(['background_script'])
  })

  it('counts a field that came back empty as received — presence, not truthiness', () => {
    // The caller could manage the scenario, so nothing was redacted; this
    // script really is empty. That must stay distinguishable from hidden.
    expect(receivedScriptFields({ verify_script: '' })).toEqual(['verify_script'])
  })

  it('treats a missing response as having delivered nothing', () => {
    expect(receivedScriptFields(null)).toEqual([])
    expect(receivedScriptFields(undefined)).toEqual([])
  })
})

describe('withoutUnseenScripts', () => {
  it('drops a script the editor never received rather than blanking it', () => {
    const payload = withoutUnseenScripts(
      { title: 'Step', background_script: '', verify_script: '' },
      []
    )

    // Absent from the payload entirely — not "" — so ocf-core's `!= nil`
    // guard leaves the stored script alone.
    expect('background_script' in payload).toBe(false)
    expect('verify_script' in payload).toBe(false)
    expect(payload.title).toBe('Step')
  })

  it('still sends a deliberate clear of a script the user could see', () => {
    const payload = withoutUnseenScripts(
      { title: 'Step', background_script: '' },
      ['background_script']
    )

    expect('background_script' in payload).toBe(true)
    expect(payload.background_script).toBe('')
  })

  it('sends a script the user typed into a field that was previously empty', () => {
    const payload = withoutUnseenScripts(
      { title: 'Step', verify_script: 'test -f /tmp/x' },
      []
    )

    expect(payload.verify_script).toBe('test -f /tmp/x')
  })

  it('leaves non-script fields alone even when empty', () => {
    const payload = withoutUnseenScripts({ title: '', text_content: '' }, [])

    expect('title' in payload).toBe(true)
    expect('text_content' in payload).toBe(true)
  })

  it('does not mutate the object it was given', () => {
    const original = { title: 'Step', background_script: '' }
    withoutUnseenScripts(original, [])

    expect('background_script' in original).toBe(true)
  })
})
