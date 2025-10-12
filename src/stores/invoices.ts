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
import { useI18n } from "vue-i18n"
import { useBaseStore } from "./baseStore"
import axios from 'axios'
import { formatCurrency, formatDate as formatDateUtil } from '../utils/formatters'

export const useInvoicesStore = defineStore('invoices', () => {

    const base = useBaseStore();
    const { t } = useI18n()

    useI18n().mergeLocaleMessage('en', { 
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
        }
    })

    useI18n().mergeLocaleMessage('fr', { 
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
        }
    })

    const fieldList = new Map<string, any>([
        ["id", { label: "ID", type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["invoice_number", { label: t('invoices.invoice_number'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["amount", { label: t('invoices.amount'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["currency", { label: t('invoices.currency'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["status", { label: t('invoices.status'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["invoice_date", { label: t('invoices.invoice_date'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["due_date", { label: t('invoices.due_date'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["paid_at", { label: t('invoices.paid_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["download_url", { label: t('invoices.download_url'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["stripe_hosted_url", { label: t('invoices.stripe_hosted_url'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["stripe_invoice_id", { label: t('invoices.stripe_invoice_id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["user_subscription", { label: t('invoices.user_subscription'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["user_id", { label: "User ID", type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["created_at", { label: t('created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
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
        try {
            base.isLoading.value = true;
            base.error.value = '';

            const response = await axios.post('/invoices/sync');
            console.log('Invoice sync result:', response.data);

            return response.data;
        } catch (error: any) {
            console.error('Erreur lors de la synchronisation des factures:', error);
            base.error.value = error.response?.data?.error_message || 'Erreur lors de la synchronisation';
            throw error;
        } finally {
            base.isLoading.value = false;
        }
    }

    // Charger les factures de l'utilisateur
    const loadUserInvoices = async () => {
        try {
            base.isLoading.value = true;
            base.error.value = '';

            const response = await axios.get('/invoices/user');
            base.entities.splice(0, base.entities.length, ...(response.data || []));
            base.lastLoaded.value = new Date();

            return response.data || [];
        } catch (error: any) {
            console.error('Erreur lors du chargement des factures:', error);
            base.error.value = error.response?.data?.error_message || 'Erreur lors du chargement';
            throw error;
        } finally {
            base.isLoading.value = false;
        }
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