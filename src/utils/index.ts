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

/**
 * Convertit une chaîne kebab-case en camelCase
 * Exemple : "subscription-plans" → "subscriptionPlans"
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Génère la clé de traduction i18n à partir du nom d'entité
 * Gère automatiquement la conversion kebab-case → camelCase
 */
export function getTranslationKey(entityName: string): string {
  return kebabToCamel(entityName);
}

/**
 * Formate un prix en centimes vers une devise
 */
export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Formate une date pour l'affichage
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('fr-FR');
  } catch (e) {
    return dateString;
  }
}

/**
 * Build select data (options) from an array of entities
 * Provides consistent select option generation across stores
 *
 * @template T - Entity type with id property
 * @param entities - Array of entities to convert to select options
 * @param formatter - Function to format entity to display text
 * @returns Array of select options with text and value properties
 *
 * @example
 * // In a store:
 * const getSelectDatas = (inputEntities: Invoice[]) => {
 *   return buildSelectData(inputEntities, (invoice) => {
 *     const amount = formatCurrency(invoice.amount, invoice.currency)
 *     const date = formatDate(invoice.invoice_date)
 *     return `${invoice.invoice_number} - ${amount} (${date})`
 *   })
 * }
 *
 * @example
 * // For payment methods:
 * const getSelectDatas = (inputEntities: PaymentMethod[]) => {
 *   return buildSelectData(inputEntities, (method) => {
 *     const displayName = formatPaymentMethod(method)
 *     return method.is_default ? `${displayName} (Défaut)` : displayName
 *   })
 * }
 */
export function buildSelectData<T extends { id: string }>(
  entities: T[],
  formatter: (item: T) => string
): Array<{ text: string; value: string }> {
  return entities.map((entity) => ({
    text: formatter(entity),
    value: entity.id,
  }))
}