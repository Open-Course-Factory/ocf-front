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
import { ref } from 'vue';
import Entity from './Entity.vue';
import { useBillingAddressesStore } from '../../stores/billingAddresses';
import axios from 'axios';

const entityStore = useBillingAddressesStore();
const isSettingDefault = ref(false);
const error = ref('');

// Action pour définir une adresse comme défaut
const setAsDefault = async (addressId: string) => {
    isSettingDefault.value = true;
    error.value = '';
    
    try {
        // L'API attend set_default: true dans le PATCH
        await axios.patch(`/billing-addresses/${addressId}`, {
            set_default: true
        });
        
        // Recharger les adresses pour voir les changements
        const response = await axios.get('/billing-addresses');
        entityStore.entities = response.data || [];
        
    } catch (err: any) {
        console.error('Erreur lors de la définition comme défaut:', err);
        error.value = err.response?.data?.error_message || 'Erreur lors de la mise à jour';
    } finally {
        isSettingDefault.value = false;
    }
};

// Obtenir les pays les plus courants pour l'autocomplétion
// const getCountrySuggestions = () => {
//     return [
//         'France', 'Belgium', 'Switzerland', 'Canada', 
//         'United States', 'Germany', 'Italy', 'Spain', 
//         'United Kingdom', 'Netherlands'
//     ];
// };
</script>

<template>
    <div class="wrapper">
        <div class="billing-addresses-page">
            <!-- Message d'erreur global -->
            <div v-if="error" class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                {{ error }}
                <button class="btn btn-sm btn-outline-danger" @click="error = ''">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Informations utiles -->
            <div class="info-banner">
                <i class="fas fa-info-circle"></i>
                <span>{{ t('ui.manageBillingAddresses') }}</span>
            </div>
            
            <!-- Vue générique utilisant le composant Entity -->
            <Entity 
                :entity-name='"billing-addresses"' 
                :entity-store="entityStore"
            >
                <template #actions="{ entity }">
                    <!-- Actions spécifiques pour les adresses -->
                    <div class="address-actions">
                        <!-- Affichage formaté de l'adresse -->
                        <div class="address-preview">
                            <div class="formatted-address">
                                <div><strong>{{ entity.line1 }}</strong></div>
                                <div v-if="entity.line2" class="text-muted">{{ entity.line2 }}</div>
                                <div>{{ entity.postal_code }} {{ entity.city }}</div>
                                <div v-if="entity.state" class="text-muted">{{ entity.state }}</div>
                                <div><strong>{{ entity.country }}</strong></div>
                            </div>
                            
                            <!-- Badge par défaut -->
                            <div v-if="entity.is_default" class="default-badge">
                                <span class="badge badge-primary">
                                    <i class="fas fa-star"></i>
                                    Défaut
                                </span>
                            </div>
                        </div>
                        
                        <!-- Bouton pour définir comme défaut -->
                        <button 
                            v-if="!entity.is_default" 
                            class="btn btn-outline-primary"
                            @click="setAsDefault(entity.id)"
                            :disabled="isSettingDefault"
                        >
                            <i :class="isSettingDefault ? 'fas fa-spinner fa-spin' : 'fas fa-star'"></i>
                            <br>
                            {{ isSettingDefault ? 'Mise à jour...' : 'Définir par défaut' }}
                        </button>
                    </div>
                </template>
            </Entity>
        </div>
    </div>
</template>

<style scoped>
.billing-addresses-page {
    width: 100%;
}

.info-banner {
    background-color: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #1976d2;
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

.address-actions {
    display: flex;
    flex-direction: column;
    gap: 15px;
    min-width: 250px;
    align-items: flex-end;
}

.address-preview {
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.formatted-address {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 10px;
    background-color: #fafafa;
    font-size: 0.9rem;
    line-height: 1.4;
}

.formatted-address div {
    margin-bottom: 2px;
}

.formatted-address div:last-child {
    margin-bottom: 0;
}

.default-badge {
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

.text-muted {
    color: #6c757d;
}

/* Actions boutons */
.address-actions .btn {
    min-width: 140px;
}

.btn-outline-primary {
    color: #007bff;
    border-color: #007bff;
    background-color: transparent;
}

.btn-outline-primary:hover:not(:disabled) {
    color: #fff;
    background-color: #007bff;
    border-color: #007bff;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>