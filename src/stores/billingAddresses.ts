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

import { defineStore } from "pinia"
import { useBaseStore } from "./baseStore"
import { getCountryOptions, getCountryName } from '../services/countries'
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const useBillingAddressesStore = defineStore('billingAddresses', () => {

    const base = useBaseStore();

    // Get country options based on current locale (will be called when needed)
    const getCountrySelectOptions = () => {
        // Default to French since that's the main locale for this app
        return getCountryOptions('fr')
    }

    const { t } = useStoreTranslations({
        en: {
            billingAddresses: {
                pageTitle: 'Billing Addresses',
                line1: 'Address Line 1',
                line2: 'Address Line 2',
                city: 'City',
                state: 'State/Province',
                postal_code: 'Postal Code',
                country: 'Country',
                is_default: 'Default Address',
                set_default: 'Set as Default',
                modify: 'Modify address',
                add: 'Add an address',
            }
        },
        fr: {
            billingAddresses: {
                pageTitle: 'Adresses de Facturation',
                line1: 'Adresse Ligne 1',
                line2: 'Adresse Ligne 2',
                city: 'Ville',
                state: 'État/Province',
                postal_code: 'Code Postal',
                country: 'Pays',
                is_default: 'Adresse par Défaut',
                set_default: 'Définir par Défaut',
                modify: 'Modifier l\'adresse',
                add: 'Ajouter une adresse',
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', 'ID').input().hidden().readonly(),
        field('line1', t('billingAddresses.line1')).input().visible().editable().required(),
        field('line2', t('billingAddresses.line2')).input().visible().editable(),
        field('city', t('billingAddresses.city')).input().visible().editable().required(),
        field('state', t('billingAddresses.state')).input().visible().editable(),
        field('postal_code', t('billingAddresses.postal_code')).input().visible().editable().required(),
        field('country', t('billingAddresses.country'))
            .select()
            .visible()
            .editable()
            .required()
            .withOptions(getCountrySelectOptions())
            .custom('displayValue', (value: string) => getCountryName(value, 'fr')),
        field('is_default', t('billingAddresses.is_default')).input().visible().readonly(),
        field('set_default', t('billingAddresses.set_default')).input().hidden().creatable(),
        field('user_id', 'User ID').input().hidden().readonly(),
        field('created_at', t('created_at')).input().visible().readonly(),
        field('updated_at', t('updated_at')).input().visible().readonly(),
    ])

    // Formatage de l'adresse pour affichage
    const formatAddress = (address: any) => {
        const parts = [
            address.line1,
            address.line2,
            `${address.postal_code} ${address.city}`,
            address.state,
            address.country ? getCountryName(address.country, 'fr') : address.country // Convert ISO code to country name for display
        ].filter(Boolean); // Enlève les parties vides

        return parts.join(', ');
    }

    // Fonction personnalisée pour les données de sélection
    const getSelectDatas = (inputEntities: any[]) => {
        let res: Array<{text: string, value: string}> = []
        if (inputEntities.length > 0) {
            inputEntities.forEach((address) => {
                const displayName = formatAddress(address);
                const label = address.is_default ? `${displayName} (Défaut)` : displayName;
                res.push({ 
                    text: label, 
                    value: address.id 
                })
            })
        }
        return res
    }

    // No hooks needed - the select field handles ISO codes directly
    // The select options have ISO codes as values and country names as display text

    return {
        ...base, 
        fieldList,
        formatAddress,
        getSelectDatas
    }
})