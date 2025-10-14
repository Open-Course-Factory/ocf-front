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
import axios from 'axios'
import { createAsyncWrapper } from '../utils/asyncWrapper'
import { buildFieldList, field, systemFields } from '../utils/fieldBuilder'
import { useStoreTranslations } from '../composables/useTranslations'

export const usePaymentMethodsStore = defineStore('paymentMethods', () => {

    const base = useBaseStore();
    const { t } = useStoreTranslations({
        en: {
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
                syncError: 'Error syncing payment methods',
                loadError: 'Error loading payment methods',
            }
        },
        fr: {
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
                syncError: 'Erreur lors de la synchronisation des méthodes de paiement',
                loadError: 'Erreur lors du chargement des méthodes de paiement',
            }
        }
    })

    // Create async wrapper with base store state
    const baseAsync = createAsyncWrapper({ isLoading: base.isLoading, error: base.error })

    const fieldList = buildFieldList([
        ...systemFields(['id', 'user_id', 'is_active', 'created_at'], {
            is_active: t('paymentMethods.is_active'),
            created_at: t('created_at')
        }),
        field('type', t('paymentMethods.type')).readonly(),
        field('card_brand', t('paymentMethods.card_brand')).readonly(),
        field('card_last4', t('paymentMethods.card_last4')).readonly(),
        field('card_exp_month', t('paymentMethods.card_exp_month')).readonly(),
        field('card_exp_year', t('paymentMethods.card_exp_year')).readonly(),
        field('is_default', t('paymentMethods.is_default')).readonly(),
        field('stripe_payment_method_id', t('paymentMethods.stripe_payment_method_id')).hidden().creatable().required(),
        field('set_as_default', t('paymentMethods.set_as_default')).hidden().creatable(),
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

    // Synchroniser les méthodes de paiement avec Stripe
    const syncPaymentMethods = async () => {
        return await baseAsync(
            async () => {
                const response = await axios.post('/payment-methods/sync');
                console.log('Payment methods sync result:', response.data);
                return response.data;
            },
            'paymentMethods.syncError'
        );
    }

    // Charger les méthodes de paiement de l'utilisateur
    const loadUserPaymentMethods = async () => {
        return await baseAsync(
            async () => {
                const response = await axios.get('/payment-methods/user');
                return response.data || [];
            },
            'paymentMethods.loadError',
            {
                onSuccess: (data) => {
                    base.entities.splice(0, base.entities.length, ...data);
                    base.lastLoaded.value = new Date();
                }
            }
        );
    }

    // Synchroniser puis charger les méthodes de paiement (méthode recommandée)
    const syncAndLoadPaymentMethods = async () => {
        try {
            // D'abord synchroniser avec Stripe
            await syncPaymentMethods();
            // Puis charger les méthodes de paiement
            return await loadUserPaymentMethods();
        } catch (error) {
            console.error('Erreur lors de la synchronisation et du chargement:', error);
            throw error;
        }
    }

    // Action pour définir comme méthode par défaut
    const setAsDefault = async (paymentMethodId: string) => {
        try {
            await axios.post(`/payment-methods/${paymentMethodId}/set-default`);
            // Recharger les méthodes de paiement après modification
            await syncAndLoadPaymentMethods();
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
        syncPaymentMethods,
        loadUserPaymentMethods,
        syncAndLoadPaymentMethods,
        setAsDefault,
        getSelectDatas
    }
})