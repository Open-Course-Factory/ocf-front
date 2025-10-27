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

import axios from 'axios';
import type { HelpTranslations } from '../../../types/help';
import { helpFr } from '../../../locales/help/fr';
import { helpEn } from '../../../locales/help/en';

export interface HelpService {
  getTranslations(locale: string): Promise<HelpTranslations>;
  updateTranslations(locale: string, translations: HelpTranslations): Promise<void>;
  getAvailableLocales(): Promise<string[]>;
}

class HelpServiceImpl implements HelpService {
  private readonly useBackend = false; // Flag for future backend integration

  async getTranslations(locale: string): Promise<HelpTranslations> {
    if (this.useBackend) {
      // Future backend implementation
      try {
        const response = await axios.get(`/help/translations/${locale}`);
        return response.data;
      } catch (error) {
        console.warn(`Failed to fetch help translations from backend for locale ${locale}, falling back to local files`);
        return this.getLocalTranslations(locale);
      }
    } else {
      // Current local file implementation
      return this.getLocalTranslations(locale);
    }
  }

  async updateTranslations(locale: string, translations: HelpTranslations): Promise<void> {
    if (this.useBackend) {
      // Future backend implementation
      await axios.put(`/help/translations/${locale}`, translations);
    } else {
      // Local implementation - would require file system access
      throw new Error('Updating translations is not supported in local mode');
    }
  }

  async getAvailableLocales(): Promise<string[]> {
    if (this.useBackend) {
      // Future backend implementation
      const response = await axios.get('/help/locales');
      return response.data;
    } else {
      // Current local implementation
      return ['fr', 'en'];
    }
  }

  private getLocalTranslations(locale: string): HelpTranslations {
    switch (locale) {
      case 'fr':
        return helpFr as unknown as HelpTranslations;
      case 'en':
        return helpEn as unknown as HelpTranslations;
      default:
        console.warn(`Unsupported locale ${locale}, falling back to French`);
        return helpFr as unknown as HelpTranslations;
    }
  }
}

export const helpService = new HelpServiceImpl();