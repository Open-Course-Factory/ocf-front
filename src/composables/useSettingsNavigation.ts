/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import { ref } from 'vue'
import { useRouter, type RouteLocationNormalizedLoaded } from 'vue-router'

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
      // Fallback to a safe default if no previous route
      router.push('/')
    }
  }

  return {
    storePreviousRoute,
    goBackFromSettings,
    previousRoute
  }
}
