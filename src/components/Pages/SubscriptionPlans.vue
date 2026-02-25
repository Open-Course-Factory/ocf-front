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
import AdminAssignOrgPlanModal from '../Modals/AdminAssignOrgPlanModal.vue'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useNotification } from '../../composables/useNotification'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import router from '../../router/index.ts'

const { t } = useI18n()
const { showError, showSuccess } = useNotification()

const entityStore = useSubscriptionPlansStore()
const subscriptionsStore = useSubscriptionsStore()
const { isAdmin, shouldFilterAsStandardUser, shouldShowAllData } = useAdminViewMode()

// État pour les actions
const isUpgrading = ref(false)
const upgradingPlanId = ref<string | null>(null)
const isSyncing = ref(false)
const syncResult = ref<any>(null)
const showSyncResult = ref(false)
const showAssignOrgModal = ref(false)
const assignOrgPreselectedPlanId = ref<string | undefined>(undefined)

const openAssignOrgModal = (planId?: string) => {
    assignOrgPreselectedPlanId.value = planId
    showAssignOrgModal.value = true
}

const onOrgPlanAssigned = () => {
    showSuccess(t('subscriptionPlans.assignOrgSuccess'))
}

// Filtrer les plans selon le mode de vue
const filteredPlans = computed(() => {
    // Si pas admin OU admin en mode "vue utilisateur", filtrer pour ne montrer que les plans actifs
    if (!isAdmin.value || shouldFilterAsStandardUser.value) {
        return entityStore.entities.filter((plan: any) => plan.is_active);
    }
    // Admin en mode "vue admin" : montrer tous les plans
    return entityStore.entities;
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
            <!-- Message informatif pour les non-admins ou admins en vue utilisateur -->
            <div v-if="!isAdmin || shouldFilterAsStandardUser" class="info-banner">
                <i class="fas fa-info-circle"></i>
                <span>{{ t('ui.availablePlans') }}</span>
            </div>

            <!-- Admin controls (visible uniquement en mode admin complet) -->
            <div v-if="shouldShowAllData" class="admin-controls">
                <button
                    class="btn btn-primary"
                    @click="syncWithStripe"
                    :disabled="isSyncing"
                >
                    <i :class="isSyncing ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"></i>
                    {{ isSyncing ? t('subscriptionPlans.syncing') : t('subscriptionPlans.syncWithStripe') }}
                </button>
                <button
                    class="btn btn-secondary"
                    @click="openAssignOrgModal()"
                >
                    <i class="fas fa-building"></i>
                    {{ t('subscriptionPlans.assignToOrg') }}
                </button>
                <small class="text-muted">
                    {{ t('subscriptionPlans.syncDescription') }}
                </small>

                <!-- Sync Results -->
                <div v-if="showSyncResult && syncResult" class="sync-results">
                    <div v-if="syncResult.success" class="alert alert-success">
                        <div class="result-header">
                            <i class="fas fa-check-circle"></i>
                            <strong>{{ t('subscriptionPlans.syncSuccess') }}</strong>
                            <button
                                class="btn btn-sm btn-outline-success"
                                @click="showSyncResult = false"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <div class="result-summary">
                            <div class="summary-item">
                                <span class="label">{{ t('subscriptionPlans.syncTotalPlans') }}</span>
                                <span class="value">{{ syncResult.total_plans }}</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">{{ t('subscriptionPlans.syncSynced') }}</span>
                                <span class="value success">{{ syncResult.synced_count }}</span>
                            </div>
                            <div v-if="syncResult.skipped_count > 0" class="summary-item">
                                <span class="label">{{ t('subscriptionPlans.syncSkipped') }}</span>
                                <span class="value info">{{ syncResult.skipped_count }}</span>
                            </div>
                            <div v-if="syncResult.failed_count > 0" class="summary-item">
                                <span class="label">{{ t('subscriptionPlans.syncFailed') }}</span>
                                <span class="value danger">{{ syncResult.failed_count }}</span>
                            </div>
                        </div>

                        <!-- Detailed Results -->
                        <div v-if="syncResult.details" class="result-details">
                            <div v-if="syncResult.details.synced.length > 0" class="detail-section">
                                <h6><i class="fas fa-check"></i> {{ t('subscriptionPlans.syncSyncedPlans') }}</h6>
                                <ul>
                                    <li v-for="plan in syncResult.details.synced" :key="plan">{{ plan }}</li>
                                </ul>
                            </div>

                            <div v-if="syncResult.details.skipped.length > 0" class="detail-section">
                                <h6><i class="fas fa-info-circle"></i> {{ t('subscriptionPlans.syncSkippedPlans') }}</h6>
                                <ul>
                                    <li v-for="plan in syncResult.details.skipped" :key="plan">{{ plan }}</li>
                                </ul>
                            </div>

                            <div v-if="syncResult.details.failed.length > 0" class="detail-section">
                                <h6><i class="fas fa-exclamation-triangle"></i> {{ t('subscriptionPlans.syncFailedPlans') }}</h6>
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
                            <strong>{{ t('subscriptionPlans.syncErrorTitle') }}</strong>
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
                :entity-store="entityStoreWithFiltering"
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
                                    <span v-if="entity.max_courses">{{ entity.max_courses }} {{ t('subscriptionPlans.maxCourses') }}</span>
                                    <span v-if="entity.max_concurrent_users"> • {{ entity.max_concurrent_users }} {{ t('subscriptionPlans.users') }}</span>
                                </small>
                            </div>
                            <div class="plan-trial" v-if="entity.trial_days > 0">
                                <small class="text-success">
                                    <i class="fas fa-gift"></i>
                                    {{ entity.trial_days }} {{ t('subscriptionPlans.freeTrialDays') }}
                                </small>
                            </div>
                        </div>
                        
                        <!-- Buttons for plan actions (non-admins or admins viewing as user) -->
                        <div v-if="(!isAdmin || shouldFilterAsStandardUser) && entity.is_active" class="plan-buttons">
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
                                class="btn btn-secondary"
                                @click="upgradePlan(entity)"
                                :disabled="isUpgrading && upgradingPlanId === entity.id"
                            >
                                <i :class="isUpgrading && upgradingPlanId === entity.id ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-down'"></i>
                                <br>
                                {{ t('subscriptionPlans.downgrade') }}
                            </button>
                        </div>

                        <!-- Badge de statut pour les admins (en mode admin complet seulement) -->
                        <div v-if="shouldShowAllData" class="admin-badges">
                            <span
                                :class="['badge', entity.is_active ? 'badge-success' : 'badge-secondary']"
                            >
                                {{ entity.is_active ? t('subscriptionPlans.statusActive') : t('subscriptionPlans.statusInactive') }}
                            </span>
                            <button
                                v-if="entity.is_active"
                                class="btn btn-sm btn-outline-primary"
                                @click.stop="openAssignOrgModal(entity.id)"
                            >
                                <i class="fas fa-building"></i>
                                {{ t('subscriptionPlans.assignToOrg') }}
                            </button>
                        </div>
                    </div>
                </template>
            </Entity>

            <!-- Admin: Assign Plan to Organization Modal -->
            <AdminAssignOrgPlanModal
                :visible="showAssignOrgModal"
                :preselected-plan-id="assignOrgPreselectedPlanId"
                @close="showAssignOrgModal = false"
                @assigned="onOrgPlanAssigned"
            />
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
    border-radius: var(--border-radius-sm);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-primary);
}

.plan-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    min-width: 200px;
    align-items: flex-end;
}

.plan-info {
    text-align: right;
    margin-bottom: var(--spacing-sm);
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
    margin: var(--spacing-xs) 0;
}

.plan-trial {
    margin-top: var(--spacing-xs);
}

.plan-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-end;
}

.current-plan-badge {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-success-bg);
    border: 1px solid var(--color-success-border);
    border-radius: var(--border-radius-md);
    color: var(--color-success-text);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
}

.admin-badges {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
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
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--border-radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.admin-controls .btn {
  align-self: flex-start;
}

/* Sync Results */
.sync-results {
  margin-top: var(--spacing-md);
}

.alert {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-lg);
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
  margin-bottom: var(--spacing-md);
}

.result-header i {
  margin-right: var(--spacing-sm);
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-light);
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
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--spacing-md);
}

.detail-section {
  margin-bottom: var(--spacing-md);
}

.detail-section h6 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-sm) 0;
  font-weight: var(--font-weight-semibold);
}

.detail-section ul {
  margin: 0;
  padding-left: var(--spacing-lg);
}

.detail-section li {
  margin-bottom: var(--spacing-xs);
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