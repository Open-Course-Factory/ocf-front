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

import { useI18n } from 'vue-i18n';
import { helpService } from '../services/domain/help';
import { isDemoMode } from '../services/demo';

export function useHelpTranslations() {
  const { mergeLocaleMessage, locale } = useI18n();

  const loadHelpTranslations = async () => {
    try {
      // Load translations for current locale and fallback
      const currentLocale = locale.value || 'fr';
      const fallbackLocale = currentLocale === 'fr' ? 'en' : 'fr';

      const [currentTranslations, fallbackTranslations] = await Promise.all([
        helpService.getTranslations(currentLocale),
        helpService.getTranslations(fallbackLocale)
      ]);

      mergeLocaleMessage(currentLocale, currentTranslations);
      mergeLocaleMessage(fallbackLocale, fallbackTranslations);

      if (isDemoMode()) {
        console.log(`[DEMO] Loaded help translations for ${currentLocale} and ${fallbackLocale}`);
      }
    } catch (error) {
      console.error('Failed to load help translations:', error);
      // Fallback to local imports if service fails
      const { helpFr } = await import('../locales/help/fr');
      const { helpEn } = await import('../locales/help/en');

      mergeLocaleMessage('fr', helpFr);
      mergeLocaleMessage('en', helpEn);
    }
  };

  const getAvailableLocales = async () => {
    try {
      return await helpService.getAvailableLocales();
    } catch (error) {
      console.error('Failed to get available locales:', error);
      return ['fr', 'en'];
    }
  };

  return {
    loadHelpTranslations,
    getAvailableLocales
  };
}