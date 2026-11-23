<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

interface Props {
  align?: 'left' | 'right'
  /** Accessible name of the default ⋯ trigger, e.g. "Actions for Alice". */
  triggerLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  align: 'right'
})

const containerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const open = ref(false)
const menuStyle = ref<Record<string, string>>({})

// The menu is position: fixed, placed from the trigger's box, so a table's or
// card's overflow cannot clip it. It opens upward when the space below is short.
async function place() {
  const rect = triggerRef.value?.getBoundingClientRect()
  if (!rect) return
  const gap = 4
  const horizontal = props.align === 'right'
    ? { right: `${window.innerWidth - rect.right}px` }
    : { left: `${rect.left}px` }
  menuStyle.value = { ...horizontal, top: `${rect.bottom + gap}px` }
  await nextTick()
  const height = menuRef.value?.offsetHeight ?? 0
  if (rect.bottom + gap + height > window.innerHeight && rect.top - gap - height >= 0) {
    menuStyle.value = { ...horizontal, top: `${rect.top - gap - height}px` }
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) place()
}

function close() {
  open.value = false
}

// Escape closes the open menu and gives the focus back to its trigger.
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !open.value) return
  e.stopPropagation()
  open.value = false
  triggerRef.value?.querySelector<HTMLElement>('button, [tabindex], a[href]')?.focus()
}

function onDocClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

// A fixed menu would drift away from its trigger on scroll, so close it instead.
function onScrollOrResize() {
  if (open.value) open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>

<template>
  <div ref="containerRef" class="ocf-dropdown" @keydown="onKeydown">
    <!-- Trigger: custom #trigger slot, or the default .btn-icon ⋯ button. -->
    <div ref="triggerRef" class="dropdown-trigger" @click.stop="toggle">
      <slot name="trigger">
        <button
          class="btn-icon"
          type="button"
          aria-haspopup="menu"
          :aria-expanded="open"
          :aria-label="triggerLabel"
          :title="triggerLabel"
        >
          <i class="fas fa-ellipsis-v"></i>
        </button>
      </slot>
    </div>

    <!-- Menu: rendered only when open. A bubbled item click closes it (the
         item's own @click runs first), and `close` is exposed for explicit use. -->
    <div
      v-if="open"
      ref="menuRef"
      class="ocf-dropdown-menu"
      :style="menuStyle"
      @click="close"
    >
      <slot :close="close" />
    </div>
  </div>
</template>

<style scoped>
.ocf-dropdown {
  position: relative;
  display: inline-flex;
}

.dropdown-trigger {
  display: inline-flex;
}

.ocf-dropdown-menu {
  position: fixed;
  min-width: 200px;
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-dropdown);
  overflow: hidden;
}

/* Generic menu item look — consumers may pass plain .ocf-dropdown-item buttons. */
.ocf-dropdown-menu :deep(.ocf-dropdown-item) {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ocf-dropdown-menu :deep(.ocf-dropdown-item:hover:not(:disabled)) {
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
}

.ocf-dropdown-menu :deep(.ocf-dropdown-item:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

.ocf-dropdown-menu :deep(.ocf-dropdown-item i) {
  width: 18px;
  text-align: center;
  opacity: 0.7;
}

.ocf-dropdown-menu :deep(.ocf-dropdown-item--danger) {
  color: var(--color-danger);
}

.ocf-dropdown-menu :deep(.ocf-dropdown-item--danger:hover:not(:disabled)) {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
}
</style>
