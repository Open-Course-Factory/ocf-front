import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/*
 * Source-inspection tests (same strategy as ScenarioEditor-scopePicker.test.ts:
 * mounting the editor needs 20+ stubbed stores) for the org-isolation rule
 * of 2026-09-19:
 *   - a teacher copies a public catalogue scenario into their CLASS through
 *     POST /groups/:id/scenarios/:id/duplicate, an org manager into an org;
 *   - "public" is a platform notion, so the toggle is offered only on a
 *     platform scenario — the API refuses it on an organisation's.
 */

const editor = readFileSync(resolve(__dirname, '../../src/components/Pages/ScenarioEditor.vue'), 'utf-8')
const modal = readFileSync(resolve(__dirname, '../../src/components/ScenarioEditor/ScenarioEditModal.vue'), 'utf-8')

describe('ScenarioEditor.vue — copy into an organisation or a class', () => {
  const handler = editor.match(/const handleCopyToOrg = async \(\) => \{[\s\S]*?\n\}/)?.[0] ?? ''

  it('routes a class target through the group duplicate endpoint', () => {
    expect(handler).toMatch(/\/groups\/\$\{target\.id\}/)
    expect(handler).toMatch(/\/organizations\/\$\{target\.id\}/)
    expect(handler).toMatch(/scenarios\/\$\{currentScenario\.value\.id\}\/duplicate/)
  })

  it('offers classes as copy targets', () => {
    expect(editor).toMatch(/v-for="s in groupScopes"[^>]*:value="`group:\$\{s\.id\}`"/)
  })
})

describe('ScenarioEditModal.vue — public is a platform notion', () => {
  it('shows the public toggle only on a platform scenario', () => {
    expect(modal).toMatch(/<div v-if="isPlatformScenario" class="form-group checkbox-group">\s*<label[^>]*for="scenario-is-public"/)
    expect(modal).toMatch(/const isPlatformScenario = computed\(\(\) =>\s*model\.value\.isNew \? model\.value\._scopeKey === 'platform:\*' : !model\.value\.organization_id/)
  })
})
