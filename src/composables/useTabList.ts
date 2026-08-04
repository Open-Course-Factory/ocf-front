/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

/**
 * WAI-ARIA tabs pattern for a tab bar rendered as plain buttons.
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * Manual activation — Left/Right/Home/End move focus, Enter or Space selects —
 * rather than the automatic variant, because every panel behind these bars fetches
 * its own data on mount: arrowing across the bar with automatic activation would
 * fire one request per keypress. Buttons already select on Enter/Space natively,
 * so activation needs no code here.
 *
 * Panels are rendered lazily (`v-if` on the active tab), so `aria-controls` is
 * emitted only for the selected tab; pointing the others at ids that are not in
 * the document would be a dangling reference.
 */

import { ref, watch, type Ref } from 'vue'

export function useTabList<T extends string>(activeId: Ref<T>, idPrefix: string) {
  /** The element carrying `role="tablist"`; arrow navigation reads its tabs from the DOM. */
  const tablist = ref<HTMLElement | null>(null)

  // Roving tabindex: exactly one tab is in the page's tab sequence. It follows
  // focus while arrowing, and returns to the selected tab whenever the selection
  // changes, so tabbing back into the bar lands on the tab that is showing.
  const focusedId = ref<string>(activeId.value)
  watch(activeId, id => { focusedId.value = id })

  const tabId = (id: string) => `${idPrefix}-tab-${id}`
  const panelId = (id: string) => `${idPrefix}-panel-${id}`

  function tabProps(id: T, disabled = false) {
    const selected = activeId.value === id
    return {
      id: tabId(id),
      role: 'tab',
      'aria-selected': selected,
      'aria-controls': selected ? panelId(id) : undefined,
      'aria-disabled': disabled || undefined,
      tabindex: focusedId.value === id ? 0 : -1,
      onFocus: () => { focusedId.value = id }
    }
  }

  function panelProps(id: T) {
    return {
      id: panelId(id),
      role: 'tabpanel',
      'aria-labelledby': tabId(id)
    }
  }

  /**
   * The tabs a keyboard user may reach, in DOM order. Read from the DOM rather
   * than from a registry so a bar mixing static buttons with a `v-for` needs no
   * bookkeeping. Placeholder tabs reserved while a role resolves are skipped.
   */
  function navigableTabs(): HTMLElement[] {
    if (!tablist.value) return []
    return Array.from(tablist.value.querySelectorAll<HTMLElement>('[role="tab"]'))
      .filter(el => el.getAttribute('aria-disabled') !== 'true' && !(el as HTMLButtonElement).disabled)
  }

  function onKeydown(event: KeyboardEvent) {
    const tabs = navigableTabs()
    const current = tabs.indexOf(event.target as HTMLElement)
    if (current === -1) return

    let next: number
    switch (event.key) {
      case 'ArrowRight': next = current + 1; break
      case 'ArrowLeft': next = current - 1; break
      case 'Home': next = 0; break
      case 'End': next = tabs.length - 1; break
      default: return
    }

    event.preventDefault()
    // Wrap around, which is what the pattern prescribes for a horizontal tab bar.
    tabs[(next + tabs.length) % tabs.length].focus()
  }

  return { tablist, tabProps, panelProps, onKeydown }
}
