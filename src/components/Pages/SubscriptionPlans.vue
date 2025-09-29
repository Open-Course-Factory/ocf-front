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
import { computed, onMounted } from 'vue'
import Entity from './Entity.vue'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useCurrentUserStore } from '../../stores/currentUser.ts'
import router from '../../router/index.ts'

const entityStore = useSubscriptionPlansStore();
const currentUser = useCurrentUserStore();

// Seuls les administrateurs peuvent modifier les plans
const isAdmin = computed(() => 
    currentUser.userRoles.includes('administrator')
);

// Filtrer les plans actifs pour les utilisateurs non-admin
const filteredPlans = computed(() => {
    if (isAdmin.value) {
        return entityStore.entities;
    }
    // Les utilisateurs normaux ne voient que les plans actifs
    return entityStore.entities.filter((plan: any) => plan.is_active);
});

// Surcharger temporairement les entités filtrées
const entityStoreWithFiltering = computed(() => ({
    ...entityStore,
    entities: filteredPlans.value
}));

// Load plans on component mount
onMounted(async () => {
    try {
        await entityStore.ensurePlansLoaded()
    } catch (error) {
        console.error('Error loading subscription plans:', error)
    }
})

// Fonction pour sélectionner un plan (Composition API)
const selectPlan = async (plan: any) => {
    try {
        await entityStore.selectPlan(plan.id)
        router.push({ name: 'Checkout', params: { planId: plan.id } })
    } catch (error) {
        console.error('Error selecting plan:', error)
    }
}
</script>

<template>
    <div class="wrapper">
        <div class="subscription-plans-page">
            <!-- Message informatif pour les non-admins -->
            <div v-if="!isAdmin" class="info-banner">
                <i class="fas fa-info-circle"></i>
                <span>Plans d'abonnement disponibles. Contactez votre administrateur pour souscrire.</span>
            </div>
            
            <!-- Vue générique utilisant le composant Entity -->
            <Entity 
                :entity-name='"subscription-plans"' 
                :entity-store="isAdmin ? entityStore : entityStoreWithFiltering"
            >
                <template #actions="{ entity }">
                    <!-- Actions spécifiques pour les plans d'abonnement -->
                    <div class="plan-actions">
                        <div class="plan-info">
                            <div class="price-display">
                                <strong>{{ entityStore.formatPrice(entity.price_amount, entity.currency) }}</strong>
                                <span class="billing-period">/ {{ entity.billing_interval }}</span>
                            </div>
                            <div class="plan-limits" v-if="entity.max_courses || entity.max_concurrent_users || entity.max_lab_sessions">
                                <small class="text-muted">
                                    <span v-if="entity.max_courses">{{ entity.max_courses }} cours max</span>
                                    <span v-if="entity.max_concurrent_users"> • {{ entity.max_concurrent_users }} utilisateurs</span>
                                    <span v-if="entity.max_lab_sessions"> • {{ entity.max_lab_sessions }} sessions lab</span>
                                </small>
                            </div>
                            <div class="plan-trial" v-if="entity.trial_days > 0">
                                <small class="text-success">
                                    <i class="fas fa-gift"></i>
                                    {{ entity.trial_days }} jours d'essai gratuit
                                </small>
                            </div>
                        </div>
                        
                        <!-- Bouton pour souscrire (non-admins) -->
                        <button 
                            v-if="!isAdmin && entity.is_active" 
                            class="btn btn-success"
                            @click="selectPlan(entity)"
                        >
                            <i class="fas fa-shopping-cart"></i>
                            <br>
                            Choisir ce plan
                        </button>
                        
                        <!-- Badge de statut pour les admins -->
                        <div v-if="isAdmin" class="admin-badges">
                            <span 
                                :class="['badge', entity.is_active ? 'badge-success' : 'badge-secondary']"
                            >
                                {{ entity.is_active ? 'Actif' : 'Inactif' }}
                            </span>
                        </div>
                    </div>
                </template>
            </Entity>
        </div>
    </div>
</template>



<style scoped>
.subscription-plans-page {
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

.plan-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 200px;
    align-items: flex-end;
}

.plan-info {
    text-align: right;
    margin-bottom: 10px;
}

.price-display {
    font-size: 1.5rem;
    color: #2e7d32;
    margin-bottom: 5px;
}

.billing-period {
    font-size: 0.9rem;
    color: #666;
    font-weight: normal;
}

.plan-limits {
    margin: 5px 0;
}

.plan-trial {
    margin-top: 5px;
}

.admin-badges {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.badge {
    padding: 0.25em 0.5em;
    font-size: 0.75em;
    border-radius: 0.25rem;
    color: white;
    text-align: center;
}

.badge-success {
    background-color: #28a745;
}

.badge-secondary {
    background-color: #6c757d;
}

.text-muted {
    color: #6c757d;
}

.text-success {
    color: #28a745;
}

/* Actions boutons */
.plan-actions .btn {
    margin: 2px;
    min-width: 120px;
}
</style>