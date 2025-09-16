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
import axios from 'axios'

export const usePaymentMethodsStore = defineStore('paymentMethods', () => {

    const base = useBaseStore();
    const { t } = useI18n()

    useI18n().mergeLocaleMessage('en', { 
        paymentMethods: { 
            pageTitle: 'Payment Methods',
            type: 'Type',
            card_brand: 'Card Brand',
            card_last4: 'Last 4 Digits',
            card_exp_month: 'Expiry Month',
            card_exp_year: 'Expiry Year',
            is_default: 'Default Method',
            is_active: 'Active',
            stripe_payment_method_id: 'Stripe Payment Method ID',
            set_as_default: 'Set as Default',
            setAsDefault: 'Set as Default',
            modify: 'Modify payment method', 
            add: 'Add a payment method',
            cardEnding: 'Card ending in',
            expires: 'Expires',
        }
    })

    useI18n().mergeLocaleMessage('fr', { 
        paymentMethods: { 
            pageTitle: 'Méthodes de Paiement',
            type: 'Type',
            card_brand: 'Marque de Carte',
            card_last4: '4 Derniers Chiffres',
            card_exp_month: 'Mois d\'Expiration',
            card_exp_year: 'Année d\'Expiration',
            is_default: 'Méthode par Défaut',
            is_active: 'Active',
            stripe_payment_method_id: 'ID Stripe Méthode de Paiement',
            set_as_default: 'Définir par Défaut',
            setAsDefault: 'Définir par Défaut',
            modify: 'Modifier la méthode de paiement', 
            add: 'Ajouter une méthode de paiement',
            cardEnding: 'Carte se terminant par',
            expires: 'Expire',
        }
    })

    const fieldList = new Map<string, any>([
        ["id", { label: "ID", type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["type", { label: t('paymentMethods.type'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["card_brand", { label: t('paymentMethods.card_brand'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["card_last4", { label: t('paymentMethods.card_last4'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["card_exp_month", { label: t('paymentMethods.card_exp_month'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["card_exp_year", { label: t('paymentMethods.card_exp_year'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["is_default", { label: t('paymentMethods.is_default'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["is_active", { label: t('paymentMethods.is_active'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["stripe_payment_method_id", { label: t('paymentMethods.stripe_payment_method_id'), type: "input", display: false, toBeSet: true, toBeEdited: false, required: true }],
        ["set_as_default", { label: t('paymentMethods.set_as_default'), type: "input", display: false, toBeSet: true, toBeEdited: false }],
        ["user_id", { label: "User ID", type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["created_at", { label: t('created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    // Icône selon la marque de carte
    const getCardIcon = (brand: string) => {
        const brandLower = brand?.toLowerCase();
        switch (brandLower) {
            case 'visa': return 'fab fa-cc-visa';
            case 'mastercard': return 'fab fa-cc-mastercard';
            case 'amex': 
            case 'american_express': return 'fab fa-cc-amex';
            case 'discover': return 'fab fa-cc-discover';
            case 'jcb': return 'fab fa-cc-jcb';
            case 'diners': 
            case 'diners_club': return 'fab fa-cc-diners-club';
            default: return 'fas fa-credit-card';
        }
    }

    // Formatage pour affichage
    const formatPaymentMethod = (method: any) => {
        if (method.type === 'card') {
            const brand = method.card_brand?.toUpperCase() || 'CARD';
            const last4 = method.card_last4;
            const expires = `${method.card_exp_month?.toString().padStart(2, '0')}/${method.card_exp_year}`;
            
            return `${brand} •••• ${last4} (${expires})`;
        }
        return method.type || 'Unknown';
    }

    // Vérifier si la carte expire bientôt
    const isExpiringSoon = (method: any, monthsAhead: number = 3) => {
        if (method.type !== 'card') return false;
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
        
        const expYear = parseInt(method.card_exp_year);
        const expMonth = parseInt(method.card_exp_month);
        
        const monthsUntilExpiry = (expYear - currentYear) * 12 + (expMonth - currentMonth);
        
        return monthsUntilExpiry <= monthsAhead && monthsUntilExpiry >= 0;
    }

    // Action pour définir comme méthode par défaut
    const setAsDefault = async (paymentMethodId: string) => {
        try {
            await axios.post(`/payment-methods/${paymentMethodId}/set-default`);
            // Recharger les méthodes de paiement après modification
            // Cette action sera appelée depuis les composants
            return true;
        } catch (error) {
            console.error('Erreur lors de la définition comme défaut:', error);
            throw error;
        }
    }

    // Fonction personnalisée pour les données de sélection
    const getSelectDatas = (inputEntities: any[]) => {
        let res: Array<{text: string, value: string}> = []
        if (inputEntities.length > 0) {
            inputEntities.forEach((method) => {
                const displayName = formatPaymentMethod(method);
                const label = method.is_default ? `${displayName} (Défaut)` : displayName;
                res.push({ 
                    text: label, 
                    value: method.id 
                })
            })
        }
        return res
    }

    return {
        ...base, 
        fieldList,
        getCardIcon,
        formatPaymentMethod,
        isExpiringSoon,
        setAsDefault,
        getSelectDatas
    }
})