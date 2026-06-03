/**
 * Tests for DropdownMenu — a generic design-system overflow menu (SSOT for the
 * ~4 hand-rolled row dropdowns, e.g. TerminalMySessions.vue). Owns the
 * open/close + outside-click logic ONE time so consumers don't re-implement it.
 *
 * Contract:
 *   Props: align?:'left'|'right' (default 'right').
 *   Slots: #trigger (optional; default = a `.btn-icon` button with a
 *          `fas fa-ellipsis-v`); default slot = the menu items, exposed a slot
 *          prop { close } so items can close programmatically.
 *   Behavior:
 *     - clicking the trigger toggles open (@click.stop);
 *     - `.dropdown-menu` renders only when open;
 *     - clicking OUTSIDE closes it (document listener + container ref .contains);
 *     - clicking any item INSIDE also closes it (the item's own @click still fires);
 *     - align → `.dropdown-menu--left` / `.dropdown-menu--right`.
 *
 * No i18n: this DS primitive uses no t(); it mounts without an i18n plugin.
 */

import { describe, it, expect, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'

import DropdownMenu from '../../src/components/Common/DropdownMenu.vue'

describe('DropdownMenu', () => {
  it('hides the menu until the default trigger is clicked', async () => {
    const wrapper = mount(DropdownMenu, {
      slots: { default: '<button class="dropdown-item">Item A</button>' },
    })

    // Default trigger is a .btn-icon with the ellipsis icon.
    const trigger = wrapper.find('.btn-icon')
    expect(trigger.exists()).toBe(true)
    expect(trigger.find('i.fa-ellipsis-v').exists()).toBe(true)

    // Closed initially.
    expect(wrapper.find('.dropdown-menu').exists()).toBe(false)

    await trigger.trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
    expect(wrapper.find('.dropdown-menu').text()).toContain('Item A')
  })

  it('toggles closed when the trigger is clicked again', async () => {
    const wrapper = mount(DropdownMenu, {
      slots: { default: '<button class="dropdown-item">X</button>' },
    })
    const trigger = wrapper.find('.btn-icon')
    await trigger.trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
    await trigger.trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
  })

  it('renders a custom #trigger slot instead of the default button', async () => {
    const wrapper = mount(DropdownMenu, {
      slots: {
        trigger: '<button class="my-trigger">Open</button>',
        default: '<button class="dropdown-item">Y</button>',
      },
    })
    // Custom trigger present; default .btn-icon NOT rendered.
    expect(wrapper.find('.my-trigger').exists()).toBe(true)
    expect(wrapper.find('.btn-icon').exists()).toBe(false)

    await wrapper.find('.my-trigger').trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
  })

  it('fires the item handler AND closes the menu when an item is clicked', async () => {
    // Use a render-function slot that closes over a LOCAL vi.fn() — no reliance
    // on app globalProperties leaking into the slot scope.
    const onItem = vi.fn()
    const wrapper = mount(DropdownMenu, {
      attachTo: document.body,
      slots: {
        default: () => h('button', { class: 'dropdown-item action', onClick: onItem }, 'Do it'),
      },
    })

    await wrapper.find('.btn-icon').trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)

    await wrapper.find('.dropdown-item.action').trigger('click')

    // The item's own handler fired...
    expect(onItem).toHaveBeenCalledTimes(1)
    // ...and the menu auto-closed.
    expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
  })

  it('exposes a `close` slot prop so items can close programmatically', async () => {
    // Scoped render-function slot receives { close } and wires it to the item's
    // click handler directly — no global wiring needed.
    const wrapper = mount(DropdownMenu, {
      slots: {
        default: ({ close }: { close: () => void }) =>
          h('button', { class: 'dropdown-item prog', onClick: close }, 'Close me'),
      },
    })
    await wrapper.find('.btn-icon').trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
    await wrapper.find('.dropdown-item.prog').trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
  })

  it('closes when clicking outside the component', async () => {
    const wrapper = mount(DropdownMenu, {
      attachTo: document.body,
      slots: { default: '<button class="dropdown-item">Z</button>' },
    })
    await wrapper.find('.btn-icon').trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)

    // Dispatch a real click on the document body (outside the component).
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('applies the right alignment class by default and the left class when align="left"', async () => {
    const right = mount(DropdownMenu, { slots: { default: '<span class="dropdown-item">a</span>' } })
    await right.find('.btn-icon').trigger('click')
    expect(right.find('.dropdown-menu').classes()).toContain('dropdown-menu--right')

    const left = mount(DropdownMenu, {
      props: { align: 'left' },
      slots: { default: '<span class="dropdown-item">a</span>' },
    })
    await left.find('.btn-icon').trigger('click')
    expect(left.find('.dropdown-menu').classes()).toContain('dropdown-menu--left')
  })
})
