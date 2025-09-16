/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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
import { useI18n } from "vue-i18n"
import { useBaseStore } from "./baseStore"

export const useBillingAddressesStore = defineStore('billingAddresses', () => {

    const base = useBaseStore();
    const { t } = useI18n()

    useI18n().mergeLocaleMessage('en', { 
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
    })

    useI18n().mergeLocaleMessage('fr', { 
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
    })

    const fieldList = new Map<string, any>([
        ["id", { label: "ID", type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["line1", { label: t('billingAddresses.line1'), type: "input", display: true, toBeSet: true, toBeEdited: true, required: true }],
        ["line2", { label: t('billingAddresses.line2'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["city", { label: t('billingAddresses.city'), type: "input", display: true, toBeSet: true, toBeEdited: true, required: true }],
        ["state", { label: t('billingAddresses.state'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["postal_code", { label: t('billingAddresses.postal_code'), type: "input", display: true, toBeSet: true, toBeEdited: true, required: true }],
        ["country", { label: t('billingAddresses.country'), type: "input", display: true, toBeSet: true, toBeEdited: true, required: true }],
        ["is_default", { label: t('billingAddresses.is_default'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["set_default", { label: t('billingAddresses.set_default'), type: "input", display: false, toBeSet: true, toBeEdited: false }],
        ["user_id", { label: "User ID", type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["created_at", { label: t('created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["updated_at", { label: t('updated_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    // Formatage de l'adresse pour affichage
    const formatAddress = (address: any) => {
        const parts = [
            address.line1,
            address.line2,
            `${address.postal_code} ${address.city}`,
            address.state,
            address.country
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

    return {
        ...base, 
        fieldList,
        formatAddress,
        getSelectDatas
    }
})