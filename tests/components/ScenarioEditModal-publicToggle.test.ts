import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/*
 * Source-inspection test for the org-isolation rule of 2026-09-19: "public" is
 * a platform notion, so the toggle is offered only on a platform scenario — the
 * API refuses it on an organisation's. Copying into an org or a class is
 * covered, mounted, by ScenarioDuplicateModal.test.ts.
 */

const modal = readFileSync(resolve(__dirname, '../../src/components/ScenarioEditor/ScenarioEditModal.vue'), 'utf-8')

describe('ScenarioEditModal.vue — public is a platform notion', () => {
  it('shows the public toggle only on a platform scenario', () => {
    expect(modal).toMatch(/<div v-if="isPlatformScenario" class="form-group checkbox-group">\s*<label[^>]*for="scenario-is-public"/)
    expect(modal).toMatch(/const isPlatformScenario = computed\(\(\) =>\s*model\.value\.isNew \? model\.value\._scopeKey === 'platform:\*' : !model\.value\.organization_id/)
  })
})
