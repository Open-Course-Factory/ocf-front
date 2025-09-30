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
import { ref, onMounted } from 'vue';
import Entity from './Entity.vue';
import { usePaymentMethodsStore } from '../../stores/paymentMethods';
import { useSubscriptionsStore } from '../../stores/subscriptions';

const entityStore = usePaymentMethodsStore();
const subscriptionsStore = useSubscriptionsStore();
const isSettingDefault = ref(false);
const error = ref('');

// Charger les méthodes de paiement au montage
onMounted(async () => {
    await loadPaymentMethods();
});

// Fonction pour charger les méthodes de paiement
const loadPaymentMethods = async () => {
    try {
        error.value = '';
        await entityStore.syncAndLoadPaymentMethods();
    } catch (err: any) {
        console.error('Erreur lors du chargement des méthodes de paiement:', err);
        error.value = 'Erreur lors du chargement des méthodes de paiement';
    }
};

// Action pour définir une méthode comme défaut
const setAsDefault = async (paymentMethodId: string) => {
    isSettingDefault.value = true;
    error.value = '';

    try {
        await entityStore.setAsDefault(paymentMethodId);
    } catch (err: any) {
        console.error('Erreur lors de la définition comme défaut:', err);
        error.value = err.response?.data?.error_message || 'Erreur lors de la mise à jour';
    } finally {
        isSettingDefault.value = false;
    }
};

// Ouvrir le portail Stripe pour gérer les méthodes de paiement
const addPaymentMethod = async () => {
    try {
        const returnUrl = `${window.location.origin}/payment-methods`;
        await subscriptionsStore.createPortalSession(returnUrl);

        // Note: Quand l'utilisateur reviendra du portail,
        // la page se rechargera et les méthodes seront automatiquement synchronisées
    } catch (err: any) {
        console.error('Erreur ouverture portail:', err);
        error.value = err.response?.data?.error_message || 'Impossible d\'ouvrir le portail de gestion';
    }
};
</script>

<template>
    <div class="wrapper">
        <div class="payment-methods-page">
            <!-- Message d'erreur global -->
            <div v-if="error" class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                {{ error }}
                <button class="btn btn-sm btn-outline-danger" @click="error = ''">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Informations utiles et actions -->
            <div class="info-banner">
                <div class="info-content">
                    <i class="fas fa-info-circle"></i>
                    <span>Gérez vos méthodes de paiement. Vos données bancaires sont sécurisées par Stripe.</span>
                </div>
                <button
                    class="btn btn-outline-primary btn-sm refresh-btn"
                    @click="loadPaymentMethods"
                    :disabled="entityStore.isLoading"
                    title="Actualiser les méthodes de paiement"
                >
                    <i :class="entityStore.isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
                    <span v-if="!entityStore.isLoading">Actualiser</span>
                </button>
            </div>

            <!-- Message si pas de méthodes de paiement -->
            <div v-if="entityStore.entities.length === 0" class="empty-state">
                <i class="fas fa-credit-card fa-3x"></i>
                <h4>Aucune méthode de paiement</h4>
                <p>Ajoutez une carte bancaire pour effectuer vos achats.</p>
                <button class="btn btn-primary" @click="addPaymentMethod">
                    <i class="fas fa-plus"></i>
                    Ajouter une carte
                </button>
            </div>
            
            <!-- Vue générique utilisant le composant Entity -->
            <Entity 
                :entity-name='"payment-methods"' 
                :entity-store="entityStore"
            >
                <template #actions="{ entity }">
                    <!-- Actions spécifiques pour les méthodes de paiement -->
                    <div class="payment-method-actions">
                        <!-- Affichage formaté de la méthode -->
                        <div class="payment-method-preview">
                            <div class="card-display">
                                <!-- Icône de la carte -->
                                <div class="card-icon">
                                    <i :class="entityStore.getCardIcon(entity.card_brand)"></i>
                                </div>
                                
                                <!-- Informations de la carte -->
                                <div class="card-info">
                                    <div class="card-brand">
                                        {{ entity.card_brand?.toUpperCase() || 'CARD' }}
                                    </div>
                                    <div class="card-number">
                                        •••• •••• •••• {{ entity.card_last4 }}
                                    </div>
                                    <div class="card-expiry">
                                        {{ entity.card_exp_month?.toString().padStart(2, '0') }}/{{ entity.card_exp_year }}
                                    </div>
                                    
                                    <!-- Alerte d'expiration -->
                                    <div v-if="entityStore.isExpiringSoon(entity)" class="expiry-warning">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <small>Expire bientôt</small>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Badge par défaut -->
                            <div v-if="entity.is_default" class="default-badge">
                                <span class="badge badge-primary">
                                    <i class="fas fa-star"></i>
                                    Défaut
                                </span>
                            </div>

                            <!-- Badge statut -->
                            <div v-if="!entity.is_active" class="status-badge">
                                <span class="badge badge-secondary">
                                    Inactive
                                </span>
                            </div>
                        </div>
                        
                        <!-- Boutons d'action -->
                        <div class="action-buttons">
                            <!-- Bouton pour définir comme défaut -->
                            <button 
                                v-if="!entity.is_default && entity.is_active" 
                                class="btn btn-outline-primary btn-sm"
                                @click="setAsDefault(entity.id)"
                                :disabled="isSettingDefault"
                            >
                                <i :class="isSettingDefault ? 'fas fa-spinner fa-spin' : 'fas fa-star'"></i>
                                Définir par défaut
                            </button>
                        </div>
                    </div>
                </template>
            </Entity>

            <!-- Bouton d'ajout flottant si on a déjà des méthodes -->
            <div v-if="entityStore.entities.length > 0" class="floating-add">
                <button class="btn btn-success btn-lg" @click="addPaymentMethod">
                    <i class="fas fa-plus"></i>
                    Ajouter une carte
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.payment-methods-page {
    width: 100%;
    position: relative;
}

.info-banner {
    background-color: #e8f5e9;
    border: 1px solid #c8e6c9;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    color: #2e7d32;
}

.info-content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.refresh-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    font-size: 0.85rem;
    white-space: nowrap;
    color: #2e7d32;
    border-color: #2e7d32;
}

.refresh-btn:hover:not(:disabled) {
    background-color: #2e7d32;
    color: white;
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

.payment-method-actions {
    display: flex;
    flex-direction: column;
    gap: 15px;
    min-width: 280px;
    align-items: flex-end;
}

.payment-method-preview {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
}

.card-display {
    display: flex;
    align-items: center;
    gap: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-width: 260px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card-icon {
    font-size: 2rem;
    opacity: 0.9;
}

.card-info {
    flex: 1;
}

.card-brand {
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0.8;
    margin-bottom: 4px;
}

.card-number {
    font-size: 1.1rem;
    font-weight: 500;
    letter-spacing: 2px;
    margin-bottom: 4px;
    font-family: 'Courier New', monospace;
}

.card-expiry {
    font-size: 0.9rem;
    opacity: 0.8;
}

.expiry-warning {
    margin-top: 5px;
    color: #ffeb3b;
    display: flex;
    align-items: center;
    gap: 5px;
}

.default-badge, .status-badge {
    align-self: flex-end;
}

.badge {
    padding: 0.25em 0.5em;
    font-size: 0.75em;
    border-radius: 0.25rem;
    color: white;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.badge-primary {
    background-color: #007bff;
}

.badge-secondary {
    background-color: #6c757d;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

.floating-add {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 100;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s ease;
}

.btn-sm {
    padding: 5px 10px;
    font-size: 0.875rem;
}

.btn-lg {
    padding: 12px 20px;
    font-size: 1.1rem;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-success {
    background-color: #28a745;
    color: white;
}

.btn-outline-primary {
    color: #007bff;
    border: 1px solid #007bff;
    background-color: transparent;
}

.btn-outline-primary:hover:not(:disabled) {
    color: #fff;
    background-color: #007bff;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>