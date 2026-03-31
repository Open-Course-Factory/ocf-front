<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <NavMenuShell
    :isMenuCollapsed="isMenuCollapsed"
    :headerTitle="t('userSettings.pageTitle')"
    :showHeader="true"
    @back="goBack"
  >
    <ul>
      <NavMenuItem
        v-for="item in settingsMenuItems"
        :key="item.route"
        :to="item.route"
        :label="item.label"
        :icon="item.icon"
        :tooltip="isMenuCollapsed ? item.label : ''"
      />
    </ul>
  </NavMenuShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import NavMenuShell from './NavMenuShell.vue'
import NavMenuItem from './NavMenuItem.vue'
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
