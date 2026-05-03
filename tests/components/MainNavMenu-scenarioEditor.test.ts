import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/*
 * RED-step tests for the MainNavMenu gating of the "Scenario Editor" menu
 * item (issue #213).
 *
 * Today, every authenticated user sees the "Scenario Editor" entry in the
 * left-hand nav. Once the gating composable is wired up, the menu must:
 *   (a) tag the scenario-editor item with `requiresScenarioManager: true`
 *       (or whatever flag is consumed in the items filter — these tests
 *       enforce the canonical name);
 *   (b) filter it out of the visible items when
 *       `useScenarioEditorAccess().canAccessScenarioEditor` is false.
 *
 * Strategy: the existing MainNavMenu.test.ts already follows the
 * "read-the-source" pattern (it asserts on translation strings inside the
 * SFC). We do the same here — mounting MainNavMenu in a unit test would
 * require stubbing 15+ stores plus i18n and is brittle. Asserting on the
 * source guarantees the configuration is in place; a Playwright spec is
 * the right place to validate end-to-end behaviour with real stores.
 */

const filePath = resolve(__dirname, '../../src/components/Menus/MainNavMenu.vue')
const fileContent = readFileSync(filePath, 'utf-8')

describe('MainNavMenu — Scenario Editor item is manager-gated (#213)', () => {
  /**
   * BEHAVIOR PROTECTED: The scenario-editor menu item MUST carry the
   * `requiresScenarioManager: true` flag. Without it, the items-filter
   * step in `filteredCategories` has no signal to drop the entry, and
   * every authenticated user keeps seeing it.
   *
   * GUT-CHECK: If a refactor renames the flag or drops it, this fails
   * immediately. Pairs with the items-filter assertion below.
   */
  it('the scenario-editor item declaration carries requiresScenarioManager: true', () => {
    // Find the item literal that contains `route: '/scenario-editor'`.
    // Items are object literals in an array; we capture from the opening
    // `{` of the item to its closing `}`.
    const itemMatch = fileContent.match(
      /\{[^{}]*route:\s*['"]\/scenario-editor['"][^{}]*\}/,
    )
    expect(itemMatch, 'expected to find the /scenario-editor menu item literal').not.toBeNull()
    const itemBlock = itemMatch![0]
    expect(itemBlock).toMatch(/requiresScenarioManager\s*:\s*true/)
  })

  /**
   * BEHAVIOR PROTECTED: The items filter inside `filteredCategories` MUST
   * consult `useScenarioEditorAccess` (or read its returned ref). The
   * existing items filter already handles `featureFlag` and
   * `hideForAssignedOnly`; the new branch must drop items where
   * `requiresScenarioManager` is true and the predicate is false.
   *
   * GUT-CHECK: We accept either an explicit `useScenarioEditorAccess`
   * import + items-filter call OR a check against `requiresScenarioManager`
   * inside the `.filter(item => ...)` callback. Either path implements
   * the gate; missing both = the menu still shows for everyone.
   */
  it('the items filter consults the scenario-editor access composable', () => {
    const importsComposable = /useScenarioEditorAccess/.test(fileContent)
    const itemsFilterReferencesFlag = /requiresScenarioManager/.test(fileContent)

    expect(
      importsComposable && itemsFilterReferencesFlag,
      'expected MainNavMenu.vue to import useScenarioEditorAccess AND reference requiresScenarioManager in the items filter',
    ).toBe(true)
  })

  /**
   * BEHAVIOR PROTECTED: The scenario-editor item must keep its existing
   * `featureFlag: 'scenario_conception'` so feature-flag gating still
   * works alongside the new manager gate (defence-in-depth — disabling
   * the feature flag globally still hides the item).
   *
   * GUT-CHECK: If a refactor accidentally drops the feature flag while
   * adding the manager flag, this catches it.
   */
  it('the scenario-editor item still has featureFlag: scenario_conception', () => {
    const itemMatch = fileContent.match(
      /\{[^{}]*route:\s*['"]\/scenario-editor['"][^{}]*\}/,
    )
    expect(itemMatch).not.toBeNull()
    const itemBlock = itemMatch![0]
    expect(itemBlock).toMatch(/featureFlag\s*:\s*['"]scenario_conception['"]/)
  })
})
