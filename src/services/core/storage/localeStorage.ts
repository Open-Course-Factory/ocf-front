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

const LOCALE_STORAGE_KEY = 'ocf-user-locale';
const SUPPORTED_LOCALES = ['en', 'fr'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Get the user's preferred locale from localStorage or browser settings
 */
export function getSavedLocale(): SupportedLocale {
  try {
    // First, try to get saved locale from localStorage
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale as SupportedLocale)) {
      return savedLocale as SupportedLocale;
    }

    // If no saved locale, try to detect from browser language
    const browserLocale = navigator.language.split('-')[0]; // 'en-US' -> 'en'
    if (SUPPORTED_LOCALES.includes(browserLocale as SupportedLocale)) {
      return browserLocale as SupportedLocale;
    }

    // Default to English if nothing else works
    return 'en';
  } catch (error) {
    console.warn('Error reading locale from localStorage:', error);
    return 'en'; // Safe fallback
  }
}

/**
 * Save the user's locale choice to localStorage
 */
export function saveLocale(locale: SupportedLocale): void {
  try {
    if (!SUPPORTED_LOCALES.includes(locale)) {
      console.warn(`Unsupported locale: ${locale}. Supported locales:`, SUPPORTED_LOCALES);
      return;
    }

    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    console.log(`Locale saved: ${locale}`);
  } catch (error) {
    console.warn('Error saving locale to localStorage:', error);
  }
}

/**
 * Get all supported locales
 */
export function getSupportedLocales(): readonly SupportedLocale[] {
  return SUPPORTED_LOCALES;
}

/**
 * Check if a locale is supported
 */
export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}