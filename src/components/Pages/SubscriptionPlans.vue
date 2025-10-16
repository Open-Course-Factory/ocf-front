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
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Entity from './Entity.vue'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useCurrentUserStore } from '../../stores/currentUser.ts'
import router from '../../router/index.ts'
import { useNotification } from '../../composables/useNotification'

const { t } = useI18n()
const { showError } = useNotification()

const entityStore = useSubscriptionPlansStore()
const subscriptionsStore = useSubscriptionsStore()
const currentUser = useCurrentUserStore()

// État pour les actions
const isUpgrading = ref(false)
const upgradingPlanId = ref<string | null>(null)
const isSyncing = ref(false)
const syncResult = ref<any>(null)
const showSyncResult = ref(false)

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

// Current subscription info
const currentSubscription = computed(() => subscriptionsStore.currentSubscription)
const hasActiveSubscription = computed(() => subscriptionsStore.hasActiveSubscription())

// Helper to determine plan relationship
const getPlanRelationship = (plan: any) => {
    if (!currentSubscription.value) return 'available'
    if (currentSubscription.value.plan_id === plan.id) return 'current'

    // Compare plan "levels" based on price - this is a simple heuristic
    if (plan.price_amount > currentSubscription.value.plan_price) return 'upgrade'
    if (plan.price_amount < currentSubscription.value.plan_price) return 'downgrade'
    return 'available'
}

// Load plans and current subscription on component mount
onMounted(async () => {
    try {
        await Promise.all([
            entityStore.ensurePlansLoaded(),
            subscriptionsStore.getCurrentSubscription()
        ])
    } catch (error) {
        console.error('Error loading subscription data:', error)
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

// Fonction pour mettre à niveau/rétrograder un plan
const upgradePlan = async (plan: any) => {
    if (isUpgrading.value) return

    isUpgrading.value = true
    upgradingPlanId.value = plan.id

    try {
        await subscriptionsStore.upgradePlan(plan.id)
        // Show success message or redirect
        console.log('Plan upgraded successfully')
    } catch (error: any) {
        console.error('Error upgrading plan:', error)
        // Handle specific error cases
        if (error.response?.status === 403) {
            showError(error.response?.data?.error_message || 'Permission denied', 'Unable to upgrade')
        } else {
            showError(error.response?.data?.error_message || error.message, 'Upgrade failed')
        }
    } finally {
        isUpgrading.value = false
        upgradingPlanId.value = null
    }
}

// Fonction pour synchroniser les plans avec Stripe
const syncWithStripe = async () => {
    if (isSyncing.value) return

    isSyncing.value = true
    syncResult.value = null
    showSyncResult.value = false

    try {
        const result = await entityStore.syncAndLoadPlans()
        console.log('Plans synced successfully with Stripe:', result)

        syncResult.value = result
        showSyncResult.value = true

        // Auto-hide success message after 10 seconds
        if ((result as any)?.details?.failed?.length === 0) {
            setTimeout(() => {
                showSyncResult.value = false
            }, 10000)
        }
    } catch (error: any) {
        console.error('Error syncing plans with Stripe:', error)
        syncResult.value = {
            success: false,
            error: error.response?.data?.error_message || error.message
        }
        showSyncResult.value = true
    } finally {
        isSyncing.value = false
    }
}
</script>

<template>
    <div class="wrapper">
        <div class="subscription-plans-page">
            <!-- Message informatif pour les non-admins -->
            <div v-if="!isAdmin" class="info-banner">
                <i class="fas fa-info-circle"></i>
                <span>{{ t('ui.availablePlans') }}</span>
            </div>

            <!-- Admin controls -->
            <div v-if="isAdmin" class="admin-controls">
                <button
                    class="btn btn-info"
                    @click="syncWithStripe"
                    :disabled="isSyncing"
                >
                    <i :class="isSyncing ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"></i>
                    {{ isSyncing ? t('subscriptionPlans.syncing') : t('subscriptionPlans.syncWithStripe') }}
                </button>
                <small class="text-muted">
                    {{ t('subscriptionPlans.syncDescription') }}
                </small>

                <!-- Sync Results -->
                <div v-if="showSyncResult && syncResult" class="sync-results">
                    <div v-if="syncResult.success" class="alert alert-success">
                        <div class="result-header">
                            <i class="fas fa-check-circle"></i>
                            <strong>Synchronisation réussie !</strong>
                            <button
                                class="btn btn-sm btn-outline-success"
                                @click="showSyncResult = false"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <div class="result-summary">
                            <div class="summary-item">
                                <span class="label">Total des plans:</span>
                                <span class="value">{{ syncResult.total_plans }}</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Synchronisés:</span>
                                <span class="value success">{{ syncResult.synced_count }}</span>
                            </div>
                            <div v-if="syncResult.skipped_count > 0" class="summary-item">
                                <span class="label">Ignorés:</span>
                                <span class="value info">{{ syncResult.skipped_count }}</span>
                            </div>
                            <div v-if="syncResult.failed_count > 0" class="summary-item">
                                <span class="label">Échecs:</span>
                                <span class="value danger">{{ syncResult.failed_count }}</span>
                            </div>
                        </div>

                        <!-- Detailed Results -->
                        <div v-if="syncResult.details" class="result-details">
                            <div v-if="syncResult.details.synced.length > 0" class="detail-section">
                                <h6><i class="fas fa-check"></i> Plans synchronisés:</h6>
                                <ul>
                                    <li v-for="plan in syncResult.details.synced" :key="plan">{{ plan }}</li>
                                </ul>
                            </div>

                            <div v-if="syncResult.details.skipped.length > 0" class="detail-section">
                                <h6><i class="fas fa-info-circle"></i> Plans ignorés:</h6>
                                <ul>
                                    <li v-for="plan in syncResult.details.skipped" :key="plan">{{ plan }}</li>
                                </ul>
                            </div>

                            <div v-if="syncResult.details.failed.length > 0" class="detail-section">
                                <h6><i class="fas fa-exclamation-triangle"></i> Plans en échec:</h6>
                                <ul>
                                    <li v-for="failure in syncResult.details.failed" :key="failure.id">
                                        <strong>{{ failure.name }}</strong>: {{ failure.error }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Error Results -->
                    <div v-else class="alert alert-danger">
                        <div class="result-header">
                            <i class="fas fa-exclamation-circle"></i>
                            <strong>Erreur de synchronisation</strong>
                            <button
                                class="btn btn-sm btn-outline-danger"
                                @click="showSyncResult = false"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <p>{{ syncResult.error }}</p>
                    </div>
                </div>
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
                            <div class="plan-limits" v-if="entity.max_courses || entity.max_concurrent_users">
                                <small class="text-muted">
                                    <span v-if="entity.max_courses">{{ entity.max_courses }} cours max</span>
                                    <span v-if="entity.max_concurrent_users"> • {{ entity.max_concurrent_users }} utilisateurs</span>
                                </small>
                            </div>
                            <div class="plan-trial" v-if="entity.trial_days > 0">
                                <small class="text-success">
                                    <i class="fas fa-gift"></i>
                                    {{ entity.trial_days }} jours d'essai gratuit
                                </small>
                            </div>
                        </div>
                        
                        <!-- Buttons for plan actions (non-admins) -->
                        <div v-if="!isAdmin && entity.is_active" class="plan-buttons">
                            <!-- Current plan indicator -->
                            <div v-if="getPlanRelationship(entity) === 'current'" class="current-plan-badge">
                                <i class="fas fa-check-circle"></i>
                                {{ t('subscriptionPlans.currentPlan') }}
                            </div>

                            <!-- Subscribe button (no active subscription) -->
                            <button
                                v-else-if="!hasActiveSubscription"
                                class="btn btn-success"
                                @click="selectPlan(entity)"
                            >
                                <i class="fas fa-shopping-cart"></i>
                                <br>
                                {{ t('subscriptionPlans.choosePlan') }}
                            </button>

                            <!-- Upgrade button -->
                            <button
                                v-else-if="getPlanRelationship(entity) === 'upgrade'"
                                class="btn btn-primary"
                                @click="upgradePlan(entity)"
                                :disabled="isUpgrading && upgradingPlanId === entity.id"
                            >
                                <i :class="isUpgrading && upgradingPlanId === entity.id ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-up'"></i>
                                <br>
                                {{ t('subscriptionPlans.upgrade') }}
                            </button>

                            <!-- Downgrade button -->
                            <button
                                v-else-if="getPlanRelationship(entity) === 'downgrade'"
                                class="btn btn-warning"
                                @click="upgradePlan(entity)"
                                :disabled="isUpgrading && upgradingPlanId === entity.id"
                            >
                                <i :class="isUpgrading && upgradingPlanId === entity.id ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-down'"></i>
                                <br>
                                {{ t('subscriptionPlans.downgrade') }}
                            </button>
                        </div>
                        
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
    background-color: var(--color-info-bg);
    border: 1px solid var(--color-info-bg);
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--color-primary);
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
    color: var(--color-success-text);
    margin-bottom: 5px;
}

.billing-period {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    font-weight: normal;
}

.plan-limits {
    margin: 5px 0;
}

.plan-trial {
    margin-top: 5px;
}

.plan-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
}

.current-plan-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--color-success-bg);
    border: 1px solid var(--color-success-border);
    border-radius: 6px;
    color: var(--color-success-text);
    font-weight: 500;
    font-size: 14px;
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
    background-color: var(--color-success);
}

.badge-secondary {
    background-color: var(--color-gray-600);
}

.text-muted {
    color: var(--color-gray-600);
}

.text-success {
    color: var(--color-success);
}

/* Actions boutons */
.plan-actions .btn {
    margin: 2px;
    min-width: 120px;
}

/* Admin controls */
.admin-controls {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-controls .btn {
  align-self: flex-start;
}

/* Sync Results */
.sync-results {
  margin-top: 15px;
}

.alert {
  padding: 15px;
  border-radius: 8px;
  border: 1px solid;
  position: relative;
}

.alert-success {
  background-color: var(--color-success-bg);
  border-color: var(--color-success-border);
  color: var(--color-success-text);
}

.alert-danger {
  background-color: var(--color-danger-bg);
  border-color: var(--color-danger-border);
  color: var(--color-danger-text);
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.result-header i {
  margin-right: 8px;
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 15px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.summary-item .label {
  font-weight: 500;
}

.summary-item .value {
  font-weight: 600;
}

.value.success {
  color: var(--color-success);
}

.value.info {
  color: var(--color-info);
}

.value.danger {
  color: var(--color-danger);
}

.result-details {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 15px;
}

.detail-section {
  margin-bottom: 15px;
}

.detail-section h6 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.detail-section ul {
  margin: 0;
  padding-left: 20px;
}

.detail-section li {
  margin-bottom: 4px;
}

.btn-outline-success {
  color: var(--color-success);
  border-color: var(--color-success);
  background-color: transparent;
}

.btn-outline-success:hover {
  background-color: var(--color-success);
  color: white;
}

.btn-outline-danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background-color: transparent;
}

.btn-outline-danger:hover {
  background-color: var(--color-danger);
  color: white;
}
</style>