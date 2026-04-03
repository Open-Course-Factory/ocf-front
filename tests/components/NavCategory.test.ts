import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NavCategory from '../../src/components/Menus/NavCategory.vue'

/**
 * Bug C3 (accessibility): Missing ARIA attributes on disabled categories.
 *
 * When a NavCategory is disabled (feature available in another org), the
 * category header has no `aria-disabled="true"` attribute. Screen readers
 * cannot convey the disabled state to users. Additionally, the lock icon
 * (`fas fa-lock`) that visually indicates "disabled" has no `aria-hidden`
 * or `aria-label`, so screen readers either skip it or read "lock" without
 * context.
 */
describe('NavCategory.vue — Bug C3: missing ARIA attributes on disabled categories', () => {
  const defaultProps = {
    categoryKey: 'terminals',
    label: 'Terminals',
    icon: 'fas fa-laptop-code',
    expanded: false,
    hasActiveItem: false,
    collapsed: false,
    disabled: true,
    disabledTooltip: 'Available in ACME Corp'
  }

  function mountCategory(propsOverride: Record<string, unknown> = {}) {
    return mount(NavCategory, {
      props: { ...defaultProps, ...propsOverride }
    })
  }

  it('should have aria-disabled="true" on the category header when disabled', () => {
    const wrapper = mountCategory({ disabled: true })
    const header = wrapper.find('.category-header')

    // BUG: The category header does not set aria-disabled when disabled.
    // Screen readers have no way to know this category is inactive.
    expect(header.attributes('aria-disabled')).toBe('true')
  })

  it('should NOT have aria-disabled when category is enabled', () => {
    const wrapper = mountCategory({ disabled: false })
    const header = wrapper.find('.category-header')

    // When enabled, aria-disabled should not be present (or be "false")
    const ariaDisabled = header.attributes('aria-disabled')
    expect(!ariaDisabled || ariaDisabled === 'false').toBe(true)
  })

  it('lock icon should have aria-hidden="true" to prevent screen reader noise', () => {
    const wrapper = mountCategory({ disabled: true })
    const lockIcon = wrapper.find('.category-lock-icon')

    expect(lockIcon.exists()).toBe(true)

    // BUG: The lock icon is purely decorative (the disabled state is already
    // communicated via tooltip and aria-disabled). It should have aria-hidden
    // to prevent screen readers from reading "lock" without context.
    expect(lockIcon.attributes('aria-hidden')).toBe('true')
  })

  it('lock icon should not appear when category is enabled', () => {
    const wrapper = mountCategory({ disabled: false })
    const lockIcon = wrapper.find('.category-lock-icon')

    // v-if="disabled" should hide the lock icon when not disabled
    expect(lockIcon.exists()).toBe(false)
  })

  it('disabled category header should have role="button" for keyboard accessibility', () => {
    const wrapper = mountCategory({ disabled: true })
    const header = wrapper.find('.category-header')

    // The header is a clickable div — it should have role="button"
    // so screen readers announce it as an interactive element.
    // BUG: No role attribute is set on the header div.
    expect(header.attributes('role')).toBe('button')
  })
})
