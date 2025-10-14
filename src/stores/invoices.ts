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
import { formatCurrency, formatDate as formatDateUtil } from '../utils/formatters'
import { createAsyncWrapper } from '../utils/asyncWrapper'
import { buildFieldList, field, systemFields } from '../utils/fieldBuilder'
import { useStoreTranslations } from '../composables/useTranslations'

export const useInvoicesStore = defineStore('invoices', () => {

    const base = useBaseStore();
    const { t } = useStoreTranslations({
        en: {
            invoices: {
                pageTitle: 'Invoices',
                invoice_number: 'Invoice Number',
                amount: 'Amount',
                currency: 'Currency',
                status: 'Status',
                invoice_date: 'Invoice Date',
                due_date: 'Due Date',
                paid_at: 'Paid Date',
                download_url: 'Download URL',
                stripe_hosted_url: 'Stripe URL',
                stripe_invoice_id: 'Stripe Invoice ID',
                user_subscription: 'Subscription',
                download: 'Download PDF',
                view: 'View Invoice',
                view_all: 'View all invoices',
                no_invoice_yet: 'No invoice yet',
                paid: 'Paid',
                recent: 'Recent Invoices',
                unpaid: 'Unpaid',
                draft: 'Draft',
                void: 'Void',
                viewInStripe: 'View in Stripe',
                modify: 'View invoice details',
                add: 'Create invoice',
                syncError: 'Error syncing invoices',
                loadError: 'Error loading invoices',
            }
        },
        fr: {
            invoices: {
                pageTitle: 'Factures',
                invoice_number: 'Numéro de Facture',
                amount: 'Montant',
                currency: 'Devise',
                status: 'Statut',
                invoice_date: 'Date de Facture',
                due_date: 'Date d\'Échéance',
                paid_at: 'Date de Paiement',
                download_url: 'URL de Téléchargement',
                stripe_hosted_url: 'URL Stripe',
                stripe_invoice_id: 'ID Facture Stripe',
                user_subscription: 'Abonnement',
                download: 'Télécharger PDF',
                view: 'Voir la Facture',
                view_all: 'Toutes les factures',
                no_invoice_yet: 'Pas encore de facture',
                paid: 'Payée',
                recent: 'Factures récentes',
                unpaid: 'Non Payée',
                draft: 'Brouillon',
                void: 'Annulée',
                viewInStripe: 'Voir dans Stripe',
                modify: 'Voir les détails de la facture',
                add: 'Créer une facture',
                syncError: 'Erreur lors de la synchronisation des factures',
                loadError: 'Erreur lors du chargement des factures',
            }
        }
    })

    // Create async wrapper with base store state
    const baseAsync = createAsyncWrapper({ isLoading: base.isLoading, error: base.error })

    const fieldList = buildFieldList([
        ...systemFields(['id', 'user_id', 'created_at'], { created_at: t('created_at') }),
        field('invoice_number', t('invoices.invoice_number')).readonly(),
        field('amount', t('invoices.amount')).readonly(),
        field('currency', t('invoices.currency')).readonly(),
        field('status', t('invoices.status')).readonly(),
        field('invoice_date', t('invoices.invoice_date')).readonly(),
        field('due_date', t('invoices.due_date')).readonly(),
        field('paid_at', t('invoices.paid_at')).readonly(),
        field('download_url', t('invoices.download_url')).hidden(),
        field('stripe_hosted_url', t('invoices.stripe_hosted_url')).hidden(),
        field('stripe_invoice_id', t('invoices.stripe_invoice_id')).hidden(),
        field('user_subscription', t('invoices.user_subscription')).hidden(),
    ])

    // Formatage du montant avec devise
    const formatAmount = (amount: number, currency: string = 'EUR') => {
        return formatCurrency(amount, currency)
    }

    // Obtenir la classe CSS pour le statut
    const getStatusClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'text-success';
            case 'unpaid': return 'text-warning';
            case 'draft': return 'text-muted';
            case 'void': return 'text-danger';
            default: return 'text-secondary';
        }
    }

    // Obtenir l'icône pour le statut
    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'fas fa-check-circle';
            case 'unpaid': return 'fas fa-clock';
            case 'draft': return 'fas fa-edit';
            case 'void': return 'fas fa-times-circle';
            default: return 'fas fa-file-invoice';
        }
    }

    // Vérifier si la facture est en retard
    const isOverdue = (invoice: any) => {
        if (invoice.status === 'paid' || !invoice.due_date) return false;
        
        const dueDate = new Date(invoice.due_date);
        const now = new Date();
        return now > dueDate;
    }

    // Formater la date
    const formatDate = (dateString: string) => {
        return formatDateUtil(dateString, 'fr-FR', '-')
    }

    // Synchroniser les factures avec Stripe
    const syncInvoices = async () => {
        return await baseAsync(
            async () => {
                const response = await axios.post('/invoices/sync');
                console.log('Invoice sync result:', response.data);
                return response.data;
            },
            'invoices.syncError'
        );
    }

    // Charger les factures de l'utilisateur
    const loadUserInvoices = async () => {
        return await baseAsync(
            async () => {
                const response = await axios.get('/invoices/user');
                return response.data || [];
            },
            'invoices.loadError',
            {
                onSuccess: (data) => {
                    base.entities.splice(0, base.entities.length, ...data);
                    base.lastLoaded.value = new Date();
                }
            }
        );
    }

    // Synchroniser puis charger les factures (méthode recommandée)
    const syncAndLoadInvoices = async () => {
        try {
            // D'abord synchroniser avec Stripe
            await syncInvoices();
            // Puis charger les factures
            return await loadUserInvoices();
        } catch (error) {
            console.error('Erreur lors de la synchronisation et du chargement:', error);
            throw error;
        }
    }

    // Action pour télécharger une facture (utilise la nouvelle API)
    const downloadInvoice = async (invoiceId: string) => {
        try {
            // Solution simple: utiliser window.location pour laisser le navigateur gérer la redirection
            // Cela évite les problèmes CORS avec Stripe
            const downloadUrl = `/invoices/${invoiceId}/download`;

            // Ouvrir dans un nouvel onglet pour éviter de quitter la page
            window.open(downloadUrl, '_blank');

            return true;
        } catch (error: any) {
            console.error('Erreur lors du téléchargement:', error);
            throw error;
        }
    }

    // Fonction personnalisée pour les données de sélection
    const getSelectDatas = (inputEntities: any[]) => {
        let res: Array<{text: string, value: string}> = []
        if (inputEntities.length > 0) {
            inputEntities.forEach((invoice) => {
                const amount = formatAmount(invoice.amount, invoice.currency);
                const date = formatDate(invoice.invoice_date);
                const displayName = `${invoice.invoice_number} - ${amount} (${date})`;
                res.push({ 
                    text: displayName, 
                    value: invoice.id 
                })
            })
        }
        return res
    }

    return {
        ...base,
        fieldList,
        formatAmount,
        getStatusClass,
        getStatusIcon,
        isOverdue,
        formatDate,
        syncInvoices,
        loadUserInvoices,
        syncAndLoadInvoices,
        downloadInvoice,
        getSelectDatas
    }
})