<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <li class="nav-menu-item-wrapper">
    <router-link :to="to" class="nav-menu-item" :title="tooltip" @click="$emit('click')">
      <i :class="icon"></i>
      <span class="menu-text">{{ label }}</span>
    </router-link>
  </li>
</template>

<script setup lang="ts">
defineProps<{
  to: string
  label: string
  icon: string
  tooltip?: string
}>()

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.nav-menu-item-wrapper {
  margin-bottom: var(--spacing-xs);
}

.nav-menu-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--collapsed-popup-text, var(--color-gray-400));
  text-decoration: none;
  transition: background-color var(--transition-slow), transform var(--transition-slow), color var(--transition-slow);
  border-radius: var(--border-radius-sm);
  position: relative;
  font-size: var(--font-size-sm);
  min-height: 44px;
  box-sizing: border-box;
}

.nav-menu-item:hover {
  background-color: var(--collapsed-popup-hover-bg, rgba(255, 255, 255, 0.1));
  color: var(--color-white);
  transform: translateX(5px);
}

.nav-menu-item i {
  width: 18px;
  text-align: center;
  margin-right: var(--spacing-md);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.nav-menu-item .menu-text {
  flex-grow: 1;
  transition: opacity var(--transition-slow) ease;
}

/* Active link style */
.nav-menu-item.router-link-active,
.nav-menu-item.router-link-exact-active {
  background-color: var(--color-primary) !important;
  color: var(--color-white) !important;
  font-weight: var(--font-weight-semibold);
  border-left: 4px solid var(--color-primary-hover);
  transform: translateX(0) !important;
}

.nav-menu-item.router-link-active:hover,
.nav-menu-item.router-link-exact-active:hover {
  background-color: var(--color-primary-hover) !important;
  transform: translateX(0) !important;
}

/* Collapsed mode — scoped under parent .collapsed class */
:deep(.collapsed) .nav-menu-item-wrapper .nav-menu-item,
.collapsed .nav-menu-item {
  justify-content: center;
  padding: var(--spacing-md);
  transform: none;
}

.collapsed .nav-menu-item:hover {
  transform: none;
  background-color: var(--color-gray-700);
}

.collapsed .nav-menu-item .menu-text {
  opacity: 1;
  width: auto;
}

.collapsed .nav-menu-item:hover::after {
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


.collapsed .nav-menu-item.router-link-active,
.collapsed .nav-menu-item.router-link-exact-active {
  border-left: none;
  border-radius: var(--border-radius-sm);
}
</style>
