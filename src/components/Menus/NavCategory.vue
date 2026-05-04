<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <li class="nav-category" :class="{ 'nav-category--disabled': disabled }" :data-category="categoryKey">
    <div class="category-header" @click="!disabled && $emit('toggle', categoryKey, $event)"
      :class="{ active: expanded && !disabled, 'has-active-item': hasActiveItem && !disabled, disabled: disabled }"
      :title="disabled ? (disabledTooltip || '') : (collapsed ? label : '')"
      :aria-disabled="disabled ? 'true' : undefined"
      role="button">
      <i :class="icon"></i>
      <span class="menu-text category-title">{{ label }}</span>
      <i v-if="disabled" class="fas fa-lock category-lock-icon" aria-hidden="true"></i>
      <i v-else-if="!collapsed" class="fas fa-chevron-down chevron-icon"
         :class="{ rotated: expanded }"></i>
    </div>
    <ul v-if="!disabled" class="category-items" :class="{ expanded }" :style="popupStyle">
      <slot></slot>
    </ul>
  </li>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

withDefaults(defineProps<{
  categoryKey: string
  label: string
  icon: string
  expanded?: boolean
  hasActiveItem?: boolean
  collapsed: boolean
  disabled?: boolean
  disabledTooltip?: string
  popupStyle?: CSSProperties
}>(), {
  expanded: false,
  hasActiveItem: false,
})

defineEmits<{
  toggle: [key: string, event: Event]
}>()
</script>

<style scoped>
/* Category container */
.nav-category {
  margin-bottom: var(--spacing-sm);
  position: relative;
}

/* Disabled category (feature available in another org) */
.nav-category--disabled {
  opacity: 0.5;
}

.category-header.disabled {
  cursor: not-allowed;
  pointer-events: auto;
}

.category-header.disabled:hover {
  transform: none;
  background-color: var(--color-gray-700);
}

.category-lock-icon {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--color-gray-400);
  flex-shrink: 0;
}

/* Category header */
.category-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  color: var(--color-white);
  background-color: var(--color-gray-700);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-slow), transform var(--transition-slow);
  position: relative;
  user-select: none;
  min-height: 50px;
  box-sizing: border-box;
}

.category-header:hover {
  background-color: var(--color-gray-600);
  transform: translateX(3px);
}

.category-header.active {
  background-color: var(--color-gray-600);
}

.category-header i:first-child {
  width: 20px;
  text-align: center;
  margin-right: var(--spacing-md);
  flex-shrink: 0;
}

.category-title {
  flex-grow: 1;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

/* Chevron icon */
.chevron-icon {
  margin-left: auto;
  transition: transform var(--transition-slow) ease;
  font-size: var(--font-size-xs);
  flex-shrink: 0;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

/* Category items list (expand/collapse) */
.category-items {
  list-style-type: none;
  padding: 0;
  margin: 0;
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 0 0 4px 4px;
}

.category-items.expanded {
  max-height: 1000px;
}

/* Active item indicator on category header */
.category-header.has-active-item {
  background-color: var(--color-gray-700);
  border-left: 3px solid var(--color-primary);
}

/* Collapsed mode — applied via parent .collapsed class */
.collapsed .category-header {
  justify-content: center;
  align-items: center;
  min-height: 50px;
  margin-bottom: var(--spacing-xs);
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  display: flex;
  cursor: pointer;
}

.collapsed .category-header:hover {
  transform: none;
  background-color: var(--color-gray-600);
}

.collapsed .category-header i:first-child {
  margin: 0;
  width: auto;
}

.collapsed .category-title {
  opacity: 0;
  width: 0;
  margin: 0;
  height: 0;
}

.collapsed .chevron-icon {
  display: none;
}

/* Collapsed tooltip on hover — hidden when submenu is open */
.collapsed .category-header:hover:not(.active)::after {
  content: attr(title);
  position: absolute;
  left: 85px;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--color-gray-800);
  color: var(--color-white);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  white-space: nowrap;
  opacity: 1;
  z-index: 5000;
  border: var(--border-width-thin) solid var(--color-gray-600);
  box-shadow: var(--shadow-md);
  font-size: var(--font-size-sm);
  pointer-events: none;
}

/* Collapsed context menu positioning */
.collapsed .category-items {
  position: fixed !important;
  min-width: 220px;
  background-color: var(--color-gray-900);
  border: var(--border-width-thin) solid var(--color-gray-600);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-lg);
  z-index: 9999 !important;
  overflow: visible;
  max-height: none !important;
  transition: none;
  color: var(--color-white);
  --collapsed-popup-text: var(--color-white);
  --collapsed-popup-hover-bg: var(--color-gray-700);
}

.collapsed .category-items.expanded {
  display: block !important;
}

.collapsed .category-items:not(.expanded) {
  display: none !important;
}

/* Hide individual item tooltips inside open submenus */
.collapsed .category-items.expanded :deep(a:hover::after) {
  display: none !important;
}
</style>
