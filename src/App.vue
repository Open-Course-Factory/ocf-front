<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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
-->

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from './composables/useTheme'
import { useUserSettingsStore } from './stores/userSettings'
import { useCurrentUserStore } from './stores/currentUser'

const route = useRoute()
const { initTheme, setTheme } = useTheme()
const settingsStore = useUserSettingsStore()
const currentUserStore = useCurrentUserStore()

// Apply compact mode to document
function applyCompactMode(enabled: boolean) {
  if (enabled) {
    document.documentElement.setAttribute('data-compact', 'true')
  } else {
    document.documentElement.removeAttribute('data-compact')
  }
}

onMounted(async () => {
  // Don't load settings on public pages (login, register, password reset, etc.)
  const publicPages = ['Login', 'Register', 'PasswordReset', 'ForgotPassword', 'ResetPassword', 'VerifyEmail', 'LandingPage', 'Legal', 'HelpPublic']
  const isPublicPage = publicPages.includes(route.name as string) || route.name?.toString().startsWith('HelpPublic')

  // Only load settings if user is authenticated
  if (!isPublicPage && currentUserStore.isAuthenticated) {
    try {
      await settingsStore.loadSettings()

      // Apply user's theme preference if available
      if (settingsStore.settings.theme) {
        setTheme(settingsStore.settings.theme as 'light' | 'dark' | 'auto')
      } else {
        // Fallback to localStorage or default
        initTheme()
      }

      // Apply compact mode if enabled
      applyCompactMode(settingsStore.settings.compact_mode || false)
    } catch (error) {
      // If settings fail to load, use localStorage or default
      console.warn('Failed to load user settings, using default theme')
      initTheme()
    }
  } else {
    // On public pages, just use localStorage or default theme
    initTheme()
  }
})
</script>

<template>

  <router-view></router-view>
</template>

<style scoped>

</style>
