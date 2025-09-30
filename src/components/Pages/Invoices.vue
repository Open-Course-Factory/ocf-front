<!-- 
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
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Entity from './Entity.vue';
import { useInvoicesStore } from '../../stores/invoices';
import { useCurrentUserStore } from '../../stores/currentUser.ts';
import axios from 'axios';

const entityStore = useInvoicesStore();
const currentUser = useCurrentUserStore();
const isDownloading = ref(false);
const error = ref('');
const filter = ref('all');

// Seuls les admins peuvent voir toutes les factures
const isAdmin = computed(() => 
    currentUser.userRoles.includes('administrator')
);

// Filtrer les factures selon le statut
const filteredInvoices = computed(() => {
    if (filter.value === 'all') return entityStore.entities;
    return entityStore.entities.filter((invoice: any) => 
        invoice.status?.toLowerCase() === filter.value
    );
});

// Store avec filtrage pour l'affichage
const entityStoreWithFiltering = computed(() => ({
    ...entityStore,
    entities: filteredInvoices.value
}));

// Charger les factures selon le rôle de l'utilisateur
onMounted(async () => {
    try {
        if (isAdmin.value) {
            // Admin: charger toutes les factures
            await entityStore.loadEntities('/invoices');
        } else {
            // Utilisateur normal: charger seulement ses factures
            const response = await axios.get('/invoices/user');
            entityStore.entities = response.data || [];
        }
    } catch (err) {
        console.error('Erreur lors du chargement des factures:', err);
    }
});

// Action pour télécharger une facture
const downloadInvoice = async (invoiceId: string) => {
    isDownloading.value = true;
    error.value = '';
    
    try {
        await entityStore.downloadInvoice(invoiceId);
    } catch (err: any) {
        console.error('Erreur lors du téléchargement:', err);
        error.value = err.response?.data?.error_message || 'Erreur lors du téléchargement';
    } finally {
        isDownloading.value = false;
    }
};

// Ouvrir la facture dans Stripe
const openInStripe = (invoice: any) => {
    if (invoice.stripe_hosted_url) {
        window.open(invoice.stripe_hosted_url, '_blank');
    }
};

// Statistiques pour l'admin
const getInvoiceStats = computed(() => {
    const invoices = entityStore.entities;
    const totalCount = invoices.length;
    const paidCount = invoices.filter((inv: any) => inv.status === 'paid').length;
    const unpaidCount = invoices.filter((inv: any) => inv.status === 'unpaid').length;
    const totalAmount = invoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
    
    return {
        total: totalCount,
        paid: paidCount,
        unpaid: unpaidCount,
        totalAmount: entityStore.formatAmount(totalAmount, 'EUR')
    };
});
</script>

<template>
    <div class="wrapper">
        <div class="invoices-page">
            <!-- Message d'erreur global -->
            <div v-if="error" class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                {{ error }}
                <button class="btn btn-sm btn-outline-danger" @click="error = ''">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Statistiques pour les admins -->
            <div v-if="isAdmin" class="stats-panel">
                <h4><i class="fas fa-chart-bar"></i> Statistiques des Factures</h4>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">{{ getInvoiceStats.total }}</div>
                        <div class="stat-label">Total</div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-value">{{ getInvoiceStats.paid }}</div>
                        <div class="stat-label">Payées</div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-value">{{ getInvoiceStats.unpaid }}</div>
                        <div class="stat-label">Non payées</div>
                    </div>
                    <div class="stat-card info">
                        <div class="stat-value">{{ getInvoiceStats.totalAmount }}</div>
                        <div class="stat-label">CA Total</div>
                    </div>
                </div>
            </div>

            <!-- Filtres -->
            <div class="filter-section">
                <label for="statusFilter">Filtrer par statut :</label>
                <select id="statusFilter" v-model="filter" class="filter-select">
                    <option value="all">Toutes les factures</option>
                    <option value="paid">Payées</option>
                    <option value="unpaid">Non payées</option>
                    <option value="draft">Brouillons</option>
                    <option value="void">Annulées</option>
                </select>
            </div>

            <!-- Message si pas de factures -->
            <div v-if="entityStore.entities.length === 0" class="empty-state">
                <i class="fas fa-file-invoice fa-3x"></i>
                <h4>Aucune facture</h4>
                <p v-if="!isAdmin">Vos factures apparaîtront ici une fois que vous aurez effectué des achats.</p>
                <p v-else>Aucune facture n'a encore été générée dans le système.</p>
            </div>
            
            <!-- Vue générique utilisant le composant Entity -->
            <Entity 
                :entity-name='"invoices"' 
                :entity-store="entityStoreWithFiltering"
            >
                <template #actions="{ entity }">
                    <!-- Actions spécifiques pour les factures -->
                    <div class="invoice-actions">
                        <!-- Affichage formaté de la facture -->
                        <div class="invoice-preview">
                            <div class="invoice-header">
                                <div class="invoice-number">
                                    <strong># {{ entity.invoice_number }}</strong>
                                </div>
                                <div class="invoice-amount">
                                    <span class="amount-value">
                                        {{ entityStore.formatAmount(entity.amount, entity.currency) }}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="invoice-details">
                                <div class="detail-row">
                                    <span class="label">Date :</span>
                                    <span class="value">{{ entityStore.formatDate(entity.invoice_date) }}</span>
                                </div>
                                <div v-if="entity.due_date" class="detail-row">
                                    <span class="label">Échéance :</span>
                                    <span 
                                        :class="['value', { 'overdue': entityStore.isOverdue(entity) }]"
                                    >
                                        {{ entityStore.formatDate(entity.due_date) }}
                                    </span>
                                </div>
                                <div v-if="entity.paid_at" class="detail-row">
                                    <span class="label">Payée le :</span>
                                    <span class="value">{{ entityStore.formatDate(entity.paid_at) }}</span>
                                </div>
                            </div>
                            
                            <!-- Badge statut -->
                            <div class="status-badge">
                                <span 
                                    :class="['badge', entityStore.getStatusClass(entity.status)]"
                                >
                                    <i :class="entityStore.getStatusIcon(entity.status)"></i>
                                    {{ entity.status?.toUpperCase() || 'UNKNOWN' }}
                                </span>
                            </div>

                            <!-- Alerte si en retard -->
                            <div v-if="entityStore.isOverdue(entity)" class="overdue-warning">
                                <i class="fas fa-exclamation-triangle"></i>
                                <small>Facture en retard</small>
                            </div>
                        </div>
                        
                        <!-- Boutons d'action -->
                        <div class="action-buttons">
                            <!-- Télécharger PDF -->
                            <button 
                                v-if="entity.download_url" 
                                class="btn btn-primary btn-sm"
                                @click="downloadInvoice(entity.id)"
                                :disabled="isDownloading"
                            >
                                <i :class="isDownloading ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
                                Télécharger
                            </button>
                            
                            <!-- Voir dans Stripe -->
                            <button 
                                v-if="entity.stripe_hosted_url"
                                class="btn btn-outline-secondary btn-sm"
                                @click="openInStripe(entity)"
                            >
                                <i class="fas fa-external-link-alt"></i>
                                Voir dans Stripe
                            </button>
                        </div>
                    </div>
                </template>
            </Entity>
        </div>
    </div>
</template>

<style scoped>
.invoices-page {
    width: 100%;
}

.alert {
    padding: 12px 15px;
    border-radius: 4px;
    margin: 15px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: space-between;
}

.alert-danger {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.stats-panel {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.stats-panel h4 {
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
}

.stat-card {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    padding: 15px;
    text-align: center;
    backdrop-filter: blur(10px);
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 5px;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.filter-section {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #6c757d;
}

.empty-state i {
    color: #dee2e6;
    margin-bottom: 20px;
}

.empty-state h4 {
    margin: 20px 0 10px 0;
    color: #495057;
}

.invoice-actions {
    display: flex;
    flex-direction: column;
    gap: 15px;
    min-width: 300px;
    align-items: flex-end;
}

.invoice-preview {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-end;
}

.invoice-header {
    text-align: right;
}

.invoice-number {
    font-size: 1.1rem;
    color: #495057;
    margin-bottom: 8px;
}

.amount-value {
    font-size: 1.4rem;
    font-weight: bold;
    color: #2e7d32;
}

.invoice-details {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 12px;
    background-color: #fafafa;
    min-width: 250px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 0.9rem;
}

.detail-row:last-child {
    margin-bottom: 0;
}

.label {
    color: #6c757d;
    font-weight: 500;
}

.value {
    color: #495057;
}

.value.overdue {
    color: #dc3545;
    font-weight: 600;
}

.status-badge {
    align-self: flex-end;
}

.badge {
    padding: 0.35em 0.6em;
    font-size: 0.75em;
    border-radius: 0.25rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.text-success { color: #28a745 !important; background-color: #d4edda; }
.text-warning { color: #856404 !important; background-color: #fff3cd; }
.text-danger { color: #721c24 !important; background-color: #f8d7da; }
.text-muted { color: #6c757d !important; background-color: #f8f9fa; }
.text-secondary { color: #6c757d !important; background-color: #e2e3e5; }

.overdue-warning {
    color: #dc3545;
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: 500;
}

.action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s ease;
    font-size: 0.875rem;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-outline-secondary {
    color: #6c757d;
    border: 1px solid #6c757d;
    background-color: transparent;
}

.btn-outline-secondary:hover:not(:disabled) {
    color: white;
    background-color: #6c757d;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>