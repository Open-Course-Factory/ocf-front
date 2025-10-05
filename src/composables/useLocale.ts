/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { saveLocale, getSupportedLocales, isValidLocale } from '../services/localeStorage'

/**
 * Composable for managing locale/language settings
 */
export function useLocale() {
  const { locale, availableLocales } = useI18n()

  // Current locale as a computed property
  const currentLocale = computed(() => locale.value)

  // Available locales from the service
  const supportedLocales = getSupportedLocales()

  // Locale display names and flags
  const localeInfo = {
    en: { name: 'English', flag: '🇺🇸' },
    fr: { name: 'Français', flag: '🇫🇷' }
  } as const

  /**
   * Change the current locale and save it to localStorage
   */
  function setLocale(newLocale: string) {
    if (!isValidLocale(newLocale)) {
      console.warn(`Invalid locale: ${newLocale}`)
      return false
    }

    try {
      // Update i18n locale
      locale.value = newLocale

      // Save to localStorage for persistence
      saveLocale(newLocale)

      console.log(`Locale changed to: ${newLocale}`)
      return true
    } catch (error) {
      console.error('Error changing locale:', error)
      return false
    }
  }

  /**
   * Get the display name for a locale
   */
  function getLocaleName(localeCode: string): string {
    return localeInfo[localeCode as keyof typeof localeInfo]?.name || localeCode
  }

  /**
   * Get the flag emoji for a locale
   */
  function getLocaleFlag(localeCode: string): string {
    return localeInfo[localeCode as keyof typeof localeInfo]?.flag || '🌐'
  }

  /**
   * Get complete locale information (name + flag)
   */
  function getLocaleInfo(localeCode: string) {
    return localeInfo[localeCode as keyof typeof localeInfo] || { name: localeCode, flag: '🌐' }
  }

  /**
   * Toggle between supported locales (useful for simple language switcher)
   */
  function toggleLocale() {
    const current = currentLocale.value
    const newLocale = current === 'en' ? 'fr' : 'en'
    setLocale(newLocale)
  }

  return {
    // State
    currentLocale,
    supportedLocales,
    localeInfo,

    // Actions
    setLocale,
    toggleLocale,
    getLocaleName,
    getLocaleFlag,
    getLocaleInfo
  }
}