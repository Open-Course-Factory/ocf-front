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
import { useI18n } from 'vue-i18n';
import Entity from './Entity.vue';
import ErrorAlert from '../UI/ErrorAlert.vue';
import { useBillingAddressesStore } from '../../stores/billingAddresses';
import { useLoadingState } from '../../composables/useLoadingState';
import { extractErrorMessage } from '../../utils/formatters';
import axios from 'axios';

const { t } = useI18n();

const entityStore = useBillingAddressesStore();
const { isLoading: isSettingDefault, withLoading } = useLoadingState();
const error = ref('');

// Action pour définir une adresse comme défaut
const setAsDefault = async (addressId: string) => {
    await withLoading(async () => {
        try {
            error.value = '';
            // L'API attend set_default: true dans le PATCH
            await axios.patch(`/billing-addresses/${addressId}`, {
                set_default: true
            });

            // Recharger les adresses pour voir les changements
            const response = await axios.get('/billing-addresses');
            entityStore.entities = response.data || [];

        } catch (err: any) {
            console.error('Erreur lors de la définition comme défaut:', err);
            error.value = extractErrorMessage(err, 'Erreur lors de la mise à jour');
        }
    });
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
            <!-- Message d'erreur global (utilise le nouveau composant ErrorAlert) -->
            <ErrorAlert
                :message="error"
                @dismiss="error = ''"
            />

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
    background-color: var(--color-info-bg);
    border: var(--border-width-thin) solid var(--color-info);
    border-radius: var(--border-radius-sm);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-info-text);
}

.alert {
    padding: var(--spacing-md);
    border-radius: var(--border-radius-sm);
    margin: var(--spacing-md) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    justify-content: space-between;
}

.alert-danger {
    background-color: var(--color-danger-bg);
    border: var(--border-width-thin) solid var(--color-danger);
    color: var(--color-danger-text);
}

.address-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    min-width: 250px;
    align-items: flex-end;
}

.address-preview {
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.formatted-address {
    border: var(--border-width-thin) solid var(--color-border-light);
    border-radius: var(--border-radius-sm);
    padding: var(--spacing-sm);
    background-color: var(--color-bg-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    color: var(--color-text-primary);
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
    font-size: var(--font-size-xs);
    border-radius: var(--border-radius-full);
    color: var(--color-white);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
}

.badge-primary {
    background-color: var(--color-primary);
}

.text-muted {
    color: var(--color-text-muted);
}

/* Actions boutons */
.address-actions .btn {
    min-width: 140px;
}

.btn-outline-primary {
    color: var(--color-primary);
    border: var(--border-width-thin) solid var(--color-primary);
    background-color: transparent;
}

.btn-outline-primary:hover:not(:disabled) {
    color: var(--color-white);
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>