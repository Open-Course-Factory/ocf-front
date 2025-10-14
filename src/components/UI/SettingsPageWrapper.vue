<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="settings-page-wrapper">
    <component :is="settingsComponent" />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, type Component } from 'vue'

interface Props {
  componentName: string
}

const props = defineProps<Props>()

// Map of settings component names to their imports
const componentMap: Record<string, Component> = {
  'NavigationSettings': defineAsyncComponent(() => import('../Settings/NavigationSettings.vue')),
  'LocalizationSettings': defineAsyncComponent(() => import('../Settings/LocalizationSettings.vue')),
  'UISettings': defineAsyncComponent(() => import('../Settings/UISettings.vue')),
  'NotificationSettings': defineAsyncComponent(() => import('../Settings/NotificationSettings.vue')),
  'SecuritySettings': defineAsyncComponent(() => import('../Settings/SecuritySettings.vue')),
  'SSHKeysSettings': defineAsyncComponent(() => import('../Settings/SSHKeysSettings.vue'))
}

// Get the component based on the componentName prop
const settingsComponent = componentMap[props.componentName]

if (!settingsComponent) {
  console.error(`Settings component "${props.componentName}" not found`)
}
</script>

<style scoped>
.settings-page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
