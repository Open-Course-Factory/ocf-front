<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="settings-menu" :class="{ collapsed: isMenuCollapsed }">
    <header class="menu-header">
      <h1>
        <a @click="goBack" class="back-link" style="cursor: pointer;">
          <i class="fas fa-arrow-left"></i>
          <span class="menu-text">{{ t('userSettings.pageTitle') }}</span>
        </a>
      </h1>
    </header>
    <nav class="menu-nav">
      <ul>
        <li v-for="item in settingsMenuItems" :key="item.route" class="menu-item-wrapper">
          <router-link
            :to="item.route"
            class="menu-item"
            :title="isMenuCollapsed ? item.label : ''"
          >
            <i :class="item.icon"></i>
            <span class="menu-text">{{ item.label }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsNavigation } from '../../composables/useSettingsNavigation'
import { useUserTerminalKeysStore } from '../../stores/userTerminalKeys'

defineProps<{
  isMenuCollapsed?: boolean
}>()

const { t } = useI18n()
const { goBackFromSettings } = useSettingsNavigation()

// Initialize stores to load their translations
useUserTerminalKeysStore()

const goBack = () => {
  goBackFromSettings()
}

const settingsMenuItems = computed(() => [
  {
    route: '/settings/navigation',
    label: t('userSettings.menu.navigation'),
    icon: 'fas fa-compass'
  },
  {
    route: '/settings/localization',
    label: t('userSettings.menu.localization'),
    icon: 'fas fa-globe'
  },
  {
    route: '/settings/ui',
    label: t('userSettings.menu.ui'),
    icon: 'fas fa-palette'
  },
  {
    route: '/settings/notifications',
    label: t('userSettings.menu.notifications'),
    icon: 'fas fa-bell'
  },
  {
    route: '/settings/security',
    label: t('userSettings.menu.security'),
    icon: 'fas fa-shield-alt'
  },
  {
    route: '/user-terminal-keys',
    label: t('userTerminalKeys.pageTitle'),
    icon: 'fas fa-terminal'
  }
])
</script>

<style scoped>
.settings-menu {
  background-color: var(--color-gray-800);
  color: var(--color-border-light);
  height: 100vh;
  padding: 20px;
  animation: fadeIn 0.5s ease-in-out;
  transition: width 0.3s ease;
  overflow: hidden;
}

.settings-menu.collapsed {
  width: 80px;
}

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
  transition: color 0.3s;
}

.menu-header h1 a:hover {
  color: var(--color-white);
}

.menu-header h1 a i {
  font-size: 1.2rem;
}

.settings-menu.collapsed .menu-header {
  margin-bottom: 0px;
}

.settings-menu.collapsed .menu-header h1 a {
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.settings-menu.collapsed .menu-text {
  opacity: 0;
  width: 0;
  height: 0;
}

.menu-nav ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.menu-item-wrapper {
  margin-bottom: 5px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px;
  color: #c8d1d8;
  text-decoration: none;
  transition: background-color 0.3s, transform 0.3s, color 0.3s;
  border-radius: 4px;
  position: relative;
  font-size: 0.95rem;
  gap: 12px;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-white);
  transform: translateX(5px);
}

.menu-item i {
  width: 20px;
  text-align: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.menu-item .menu-text {
  flex-grow: 1;
  transition: opacity 0.3s ease;
}

/* Mode collapsed */
.settings-menu.collapsed .menu-item {
  justify-content: center;
  padding: 15px 10px;
}

.settings-menu.collapsed .menu-item:hover {
  transform: none;
}

.settings-menu.collapsed .menu-item:hover::after {
  content: attr(title);
  position: absolute;
  left: 85px;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--color-gray-800);
  color: var(--color-border-light);
  padding: 8px 12px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 1;
  z-index: 5000;
  border: 1px solid var(--color-gray-700);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 0.85rem;
  pointer-events: none;
}

/* Active link style */
.menu-item.router-link-active,
.menu-item.router-link-exact-active {
  background-color: var(--color-primary) !important;
  color: var(--color-white) !important;
  font-weight: 600;
  border-left: 4px solid var(--color-primary-hover);
  transform: translateX(0) !important;
}

.menu-item.router-link-active:hover,
.menu-item.router-link-exact-active:hover {
  background-color: var(--color-primary-hover) !important;
  transform: translateX(0) !important;
}

.settings-menu.collapsed .menu-item.router-link-active,
.settings-menu.collapsed .menu-item.router-link-exact-active {
  border-left: none;
  border-radius: 4px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
