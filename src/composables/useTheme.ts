/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import { ref } from 'vue'

type Theme = 'light' | 'dark' | 'auto'

const currentTheme = ref<Theme>('light')

/**
 * Composable for managing theme settings
 */
export function useTheme() {
  /**
   * Apply theme to the document
   */
  function applyTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else { // auto
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    }
  }

  /**
   * Set the current theme and apply it
   */
  function setTheme(theme: Theme) {
    currentTheme.value = theme
    applyTheme(theme)

    // Save to localStorage for persistence
    localStorage.setItem('theme', theme)
  }

  /**
   * Get the current theme from localStorage or use default
   */
  function loadTheme(): Theme {
    const saved = localStorage.getItem('theme') as Theme
    return saved || 'light'
  }

  /**
   * Initialize theme from localStorage
   */
  function initTheme() {
    const theme = loadTheme()
    setTheme(theme)
  }

  // Watch for system theme changes when in auto mode
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (currentTheme.value === 'auto') {
        applyTheme('auto')
      }
    })
  }

  return {
    currentTheme,
    setTheme,
    applyTheme,
    loadTheme,
    initTheme
  }
}
