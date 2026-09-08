/**
 * Source-inspection test for the play-as-learner preview in ScenarioEditor.vue
 * (issue #322), in the same style as ScenarioEditor-scopePicker.test.ts:
 * mounting the editor needs twenty stubbed stores, so the source is pinned.
 *
 * The preview used to window.open the session view with 'noopener'. Without
 * "remember me" the JWT lives in sessionStorage, which a noopener tab does
 * not inherit, so the trainer landed on the login screen. The preview now
 * navigates in the same tab and hands the session view a way back.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const source = readFileSync(resolve(__dirname, '../../src/components/Pages/ScenarioEditor.vue'), 'utf-8')
const previewBlock = source.match(/const handleConfirmPreview[\s\S]*?\n}\n/)?.[0] ?? ''

describe('ScenarioEditor.vue — preview opens in the same tab (#322)', () => {
  it('does not open a new window', () => {
    expect(previewBlock).not.toMatch(/window\.open/)
  })

  it('navigates with the router and hands the session view a way back to the editor', () => {
    expect(previewBlock).toMatch(/router\.push\(/)
    expect(previewBlock).toMatch(/returnTo/)
    expect(previewBlock).toMatch(/name:\s*'ScenarioEditor'/)
  })
})
