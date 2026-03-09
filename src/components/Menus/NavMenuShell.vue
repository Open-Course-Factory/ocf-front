<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="nav-menu-shell" :class="{ collapsed: isMenuCollapsed }">
    <header v-if="showHeader" class="menu-header">
      <h1>
        <a @click="$emit('back')" class="back-link" style="cursor: pointer;">
          <i class="fas fa-arrow-left"></i>
          <span class="menu-text">{{ headerTitle }}</span>
        </a>
      </h1>
    </header>
    <nav class="menu-nav">
      <slot></slot>
    </nav>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  isMenuCollapsed?: boolean
  headerTitle?: string
  showHeader?: boolean
}>(), {
  isMenuCollapsed: false,
  headerTitle: '',
  showHeader: true
})

defineEmits<{
  back: []
}>()
</script>

<style scoped>
.nav-menu-shell {
  background-color: var(--color-gray-800);
  color: var(--color-border-light);
  height: 100%;
  padding: var(--spacing-lg);
  animation: fadeIn 0.5s ease-in-out;
  transition: width var(--transition-slow) ease;
  overflow: hidden;
}

.nav-menu-shell.collapsed {
  width: 80px;
}

/* Header */
.menu-header {
  margin-bottom: 30px;
}

.menu-header h1 {
  margin: 0;
}

.menu-header h1 a {
  font-size: 1.5rem;
  color: var(--color-border-light);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: color var(--transition-slow);
}

.menu-header h1 a:hover {
  color: var(--color-white);
}

.menu-header h1 a i {
  font-size: 1.2rem;
}

/* Header in collapsed mode */
.nav-menu-shell.collapsed .menu-header {
  margin-bottom: 0;
}

.nav-menu-shell.collapsed .menu-header h1 a {
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

/* Nav area */
.menu-nav {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.menu-nav :deep(ul) {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

/* Hide menu-text in collapsed mode — only in headers, not in popup submenus */
.nav-menu-shell.collapsed .menu-text,
.nav-menu-shell.collapsed :deep(.category-header .menu-text) {
  opacity: 0;
  width: 0;
  height: 0;
}

/* Fade-in animation */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
