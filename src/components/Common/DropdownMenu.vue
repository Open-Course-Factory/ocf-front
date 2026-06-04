<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  align?: 'left' | 'right'
}

withDefaults(defineProps<Props>(), {
  align: 'right'
})

const containerRef = ref<HTMLElement | null>(null)
const open = ref(false)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div ref="containerRef" class="ocf-dropdown">
    <!-- Trigger: custom #trigger slot, or the default .btn-icon ⋯ button. -->
    <div class="dropdown-trigger" @click.stop="toggle">
      <slot name="trigger">
        <button class="btn-icon" type="button">
          <i class="fas fa-ellipsis-v"></i>
        </button>
      </slot>
    </div>

    <!-- Menu: rendered only when open. A bubbled item click closes it (the
         item's own @click runs first), and `close` is exposed for explicit use. -->
    <div
      v-if="open"
      class="ocf-dropdown-menu"
      :class="'ocf-dropdown-menu--' + align"
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
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  min-width: 200px;
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-dropdown);
  overflow: hidden;
}

.ocf-dropdown-menu--right {
  right: 0;
}

.ocf-dropdown-menu--left {
  left: 0;
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
