/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import { ref } from 'vue'
import { useRouter, type RouteLocationNormalizedLoaded } from 'vue-router'
import { useUserSettingsStore } from '../stores/userSettings'

const previousRoute = ref<string | null>(null)

export function useSettingsNavigation() {
  const router = useRouter()

  const storePreviousRoute = (from: RouteLocationNormalizedLoaded) => {
    // Only store if not coming from another settings page
    if (!from.meta.isSettings) {
      previousRoute.value = from.fullPath
    }
  }

  const goBackFromSettings = () => {
    if (previousRoute.value) {
      router.push(previousRoute.value)
    } else {
      // Use the user's default landing page from settings, or terminal sessions as fallback
      const settingsStore = useUserSettingsStore()
      const defaultPage = settingsStore.settings.default_landing_page || '/terminal-sessions'
      router.push(defaultPage)
    }
  }

  return {
    storePreviousRoute,
    goBackFromSettings,
    previousRoute
  }
}
