import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Bug C4: `pointer-events: none` on `.nav-menu-item--disabled` blocks tooltip display.
 *
 * When pointer-events is set to none, the browser completely ignores mouse events
 * on the element. This means:
 * - The native `title` attribute tooltip NEVER shows (title needs :hover)
 * - Screen readers that use mouse position lose track of the element
 * - Any future click handler for "switch org" would also be blocked
 *
 * The correct approach is to keep pointer-events enabled but use CSS/JS to
 * prevent navigation while still showing the tooltip on hover.
 */
describe('NavMenuItem.vue — Bug C4: pointer-events: none blocks tooltip', () => {
  const filePath = resolve(__dirname, '../../src/components/Menus/NavMenuItem.vue')
  const fileContent = readFileSync(filePath, 'utf-8')

  it('should NOT use pointer-events: none on disabled menu items', () => {
    // Extract the <style> block content
    const styleMatch = fileContent.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    expect(styleMatch).not.toBeNull()
    const styleContent = styleMatch![1]

    // Find the .nav-menu-item--disabled rule block
    const disabledRuleMatch = styleContent.match(
      /\.nav-menu-item--disabled\s*\{([^}]*)\}/
    )
    expect(disabledRuleMatch).not.toBeNull()
    const disabledRuleBody = disabledRuleMatch![1]

    // BUG: The disabled class currently has `pointer-events: none` which prevents
    // the native title tooltip from appearing on hover. The tooltip is the ONLY
    // way users learn why an item is disabled (e.g., "Available in org X").
    expect(disabledRuleBody).not.toContain('pointer-events: none')
  })

  it('disabled items should still allow hover events for tooltip display', () => {
    // The component uses native `title` attribute for tooltips.
    // With pointer-events: none, the :hover pseudo-class never triggers,
    // so the browser never shows the title tooltip.
    const styleMatch = fileContent.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    const styleContent = styleMatch![1]

    // Check that no CSS rule that applies to disabled state blocks pointer events
    // This catches both direct rules and rules that might affect parent elements
    const allRules = styleContent.split('}')
    const disabledRelatedRules = allRules.filter(rule =>
      rule.includes('disabled') && rule.includes('pointer-events')
    )

    for (const rule of disabledRelatedRules) {
      // pointer-events: auto is fine (it explicitly enables events)
      // pointer-events: none is the bug
      const pointerEventsValues = rule.match(/pointer-events:\s*([^;]+)/g) || []
      for (const pev of pointerEventsValues) {
        expect(pev).not.toContain('none')
      }
    }
  })
})
