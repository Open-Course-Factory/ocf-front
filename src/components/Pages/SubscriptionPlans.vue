<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
import Entity from './Entity.vue'
import AdminAssignOrgPlanModal from '../Modals/AdminAssignOrgPlanModal.vue'
import PlanConfigModal from '../Modals/PlanConfigModal.vue'
import AdminAssignPlanModal from '../Modals/AdminAssignPlanModal.vue'
import BaseModal from '../Modals/BaseModal.vue'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useNotification } from '../../composables/useNotification'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import { useTranslations } from '../../composables/useTranslations'
import AdminBadge from '../Common/AdminBadge.vue'
import router from '../../router/index.ts'
import { formatBudgetAsSizes, CANONICAL_SIZE_CATALOG } from '../../utils/quotaFormatters'

const { t } = useTranslations({
    en: {
        subscriptionPlans: {
            syncToStripe: 'Sync to Stripe',
            mirrorToStripe: 'Mirror to Stripe',
            importFromStripe: 'Import from Stripe',
            mirroring: 'Mirroring...',
            importing: 'Importing...',
            stripeSyncDescription: 'Sync pushes local plans to Stripe. Mirror also archives Stripe products missing locally. Import pulls plans from Stripe into the database.',
            mirrorConfirmTitle: 'Confirm mirror to Stripe',
            mirrorConfirmIntro: 'The following Stripe products are not in your database and will be archived in Stripe:',
            mirrorConfirmEmpty: 'No Stripe products will be archived. Local plans will be pushed to Stripe; your local plans are untouched.',
            mirrorConfirmButton: 'Archive and mirror',
            importConfirmTitle: 'Confirm import from Stripe',
            importConfirmBody: 'This will create or overwrite local plans from your Stripe products. Existing local plans matching a Stripe product will be updated. Continue?',
            importConfirmButton: 'Import from Stripe',
            confirmCancel: 'Cancel',
            syncCompleteTitle: 'Sync complete',
            mirrorCompleteTitle: 'Mirror complete',
            importCompleteTitle: 'Import complete',
            syncCreated: 'Created:',
            syncUpdated: 'Updated:',
            syncArchived: 'Archived:',
            syncPriceMigrated: 'Prices migrated:',
            syncCreatedPlans: 'Created plans:',
            syncUpdatedPlans: 'Updated plans:',
            syncArchivedPlans: 'Archived in Stripe:',
            syncPriceMigratedPlans: 'Migrated prices:',
            syncPriceMigratedNote: 'Existing subscribers keep their current price.'
        }
    },
    fr: {
        subscriptionPlans: {
            syncToStripe: 'Synchroniser vers Stripe',
            mirrorToStripe: 'Répliquer vers Stripe',
            importFromStripe: 'Importer depuis Stripe',
            mirroring: 'Réplication...',
            importing: 'Importation...',
            stripeSyncDescription: 'Synchroniser pousse les plans locaux vers Stripe. Répliquer archive aussi les produits Stripe absents localement. Importer récupère les plans depuis Stripe dans la base de données.',
            mirrorConfirmTitle: 'Confirmer la réplication vers Stripe',
            mirrorConfirmIntro: 'Les produits Stripe suivants ne sont pas dans votre base de données et seront archivés dans Stripe :',
            mirrorConfirmEmpty: 'Aucun produit Stripe ne sera archivé. Les plans locaux seront poussés vers Stripe ; vos plans locaux restent inchangés.',
            mirrorConfirmButton: 'Archiver et répliquer',
            importConfirmTitle: 'Confirmer l\'importation depuis Stripe',
            importConfirmBody: 'Ceci va créer ou écraser les plans locaux à partir de vos produits Stripe. Les plans locaux correspondant à un produit Stripe seront mis à jour. Continuer ?',
            importConfirmButton: 'Importer depuis Stripe',
            confirmCancel: 'Annuler',
            syncCompleteTitle: 'Synchronisation terminée',
            mirrorCompleteTitle: 'Réplication terminée',
            importCompleteTitle: 'Importation terminée',
            syncCreated: 'Créés :',
            syncUpdated: 'Mis à jour :',
            syncArchived: 'Archivés :',
            syncPriceMigrated: 'Prix migrés :',
            syncCreatedPlans: 'Plans créés :',
            syncUpdatedPlans: 'Plans mis à jour :',
            syncArchivedPlans: 'Archivés dans Stripe :',
            syncPriceMigratedPlans: 'Prix migrés :',
            syncPriceMigratedNote: 'Les abonnés existants conservent leur prix actuel.'
        }
    }
})
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
// Which Stripe operation produced the current result panel — drives its title.
const syncResultOp = ref<'sync' | 'mirror' | 'import'>('sync')

const syncResultTitle = computed(() => {
    switch (syncResultOp.value) {
        case 'mirror': return t('subscriptionPlans.mirrorCompleteTitle')
        case 'import': return t('subscriptionPlans.importCompleteTitle')
        default: return t('subscriptionPlans.syncCompleteTitle')
    }
})

// Mirror (two-way sync) confirm dialog state
const showMirrorConfirm = ref(false)
const mirrorPreview = ref<any>(null)

// Import (Stripe → DB) confirm dialog state
const showImportConfirm = ref(false)
const showAssignOrgModal = ref(false)
const assignOrgPreselectedPlanId = ref<string | undefined>(undefined)

const openAssignOrgModal = (planId?: string) => {
    assignOrgPreselectedPlanId.value = planId
    showAssignOrgModal.value = true
}

const onOrgPlanAssigned = () => {
    showSuccess(t('subscriptionPlans.assignOrgSuccess'))
}

const showAssignModal = ref(false)
const assignPlanId = ref<string | null>(null)

const openAssignModal = (planId: string) => {
    assignPlanId.value = planId
    showAssignModal.value = true
}

const closeAssignModal = () => {
    showAssignModal.value = false
    assignPlanId.value = null
}

// Filtrer les plans selon le mode de vue
const filteredPlans = computed(() => {
    // Si pas admin OU admin en mode "vue utilisateur", filtrer pour ne montrer que les plans actifs du catalogue
    if (!isAdmin.value || shouldFilterAsStandardUser.value) {
        return entityStore.entities.filter((plan: any) => plan.is_active && plan.is_catalog);
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

// Helper to render a plan's capacity in the same size-count language the
// pricing page uses. Closes the visibility gap reported in the first user
// test: admins had to open each plan in edit mode to see the budget.
// Returns:
//   - "1 XL OR 2 L OR 4 M" for a non-empty budget
//   - "Unlimited capacity" when both max_cpu and max_memory_mb are 0
//   - null when the plan has no budget fields populated (row is hidden)
const getCapacitySummary = (plan: any): string | null => {
    const maxCpu = plan.max_cpu ?? 0
    const maxMemoryMb = plan.max_memory_mb ?? 0
    if (maxCpu === 0 && maxMemoryMb === 0) {
        return t('subscriptionPlans.capacityUnlimited')
    }
    const summary = formatBudgetAsSizes(plan, CANONICAL_SIZE_CATALOG, t('subscriptionPlans.capacityOr'))
    return summary || null
}

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
// Checkout goes straight to Stripe — the store redirects to response.url for
// paid plans, or activates a free plan in place (free_plan flag).
const selectPlan = async (plan: any) => {
    try {
        await entityStore.selectPlan(plan.id)
        const successUrl = `${window.location.origin}/checkout-success`
        const cancelUrl = `${window.location.origin}/checkout-canceled`
        const response = await subscriptionsStore.createCheckoutSession(plan.id, successUrl, cancelUrl)
        if (response?.free_plan) {
            showSuccess(t('subscriptions.planChangedSuccess'))
            router.push('/subscription-dashboard')
        }
    } catch (error) {
        console.error('Error selecting plan:', error)
        if (subscriptionsStore.error) {
            showError(subscriptionsStore.error, t('subscriptionPlans.subscriptionErrorTitle'))
        }
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

// Auto-dismiss the result panel after 10s, but only for a clean run: keep it
// on screen when there were failures or when products were archived in Stripe
// (the archived list is an audit trail the admin should be able to read).
const autoHideResult = (result: any) => {
    const failedLen = result?.details?.failed?.length ?? 0
    const archivedLen = result?.details?.archived?.length ?? 0
    if (failedLen === 0 && archivedLen === 0) {
        setTimeout(() => {
            showSyncResult.value = false
        }, 10000)
    }
}

// Fonction pour synchroniser les plans avec Stripe
const syncWithStripe = async () => {
    if (isSyncing.value) return

    syncResultOp.value = 'sync'
    isSyncing.value = true
    syncResult.value = null
    showSyncResult.value = false

    try {
        const result = await entityStore.syncAndLoadPlans()
        console.log('Plans synced successfully with Stripe:', result)

        syncResult.value = result
        showSyncResult.value = true
        autoHideResult(result)
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

// Mirror to Stripe — step 1: dry run to preview which Stripe products would be
// archived, then open the confirm dialog.
const startMirror = async () => {
    if (isSyncing.value) return

    isSyncing.value = true
    syncResult.value = null
    showSyncResult.value = false
    mirrorPreview.value = null

    try {
        const preview = await entityStore.mirrorPlansToStripe(true)
        mirrorPreview.value = preview
        showMirrorConfirm.value = true
    } catch (error: any) {
        console.error('Error previewing Stripe mirror:', error)
        syncResult.value = {
            success: false,
            error: error.response?.data?.error_message || error.message
        }
        showSyncResult.value = true
    } finally {
        isSyncing.value = false
    }
}

const cancelMirror = () => {
    showMirrorConfirm.value = false
    mirrorPreview.value = null
}

// Mirror to Stripe — step 2: run the real mirror and refresh the plan list.
const confirmMirror = async () => {
    if (isSyncing.value) return

    syncResultOp.value = 'mirror'
    showMirrorConfirm.value = false
    isSyncing.value = true
    syncResult.value = null
    showSyncResult.value = false

    try {
        const result = await entityStore.mirrorPlansToStripe(false)
        await entityStore.refreshPlans()
        syncResult.value = result
        showSyncResult.value = true
        autoHideResult(result)
    } catch (error: any) {
        console.error('Error mirroring plans to Stripe:', error)
        syncResult.value = {
            success: false,
            error: error.response?.data?.error_message || error.message
        }
        showSyncResult.value = true
    } finally {
        isSyncing.value = false
        mirrorPreview.value = null
    }
}

// Import from Stripe — open the confirmation dialog first (destructive).
const startImport = () => {
    if (isSyncing.value) return
    showImportConfirm.value = true
}

const cancelImport = () => {
    showImportConfirm.value = false
}

const confirmImport = async () => {
    if (isSyncing.value) return

    syncResultOp.value = 'import'
    showImportConfirm.value = false
    isSyncing.value = true
    syncResult.value = null
    showSyncResult.value = false

    try {
        const result = await entityStore.importPlansFromStripe()
        syncResult.value = result
        showSyncResult.value = true
        autoHideResult(result)
    } catch (error: any) {
        console.error('Error importing plans from Stripe:', error)
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
                <AdminBadge />
                <div class="stripe-sync-buttons">
                    <button
                        class="btn btn-primary"
                        @click="syncWithStripe"
                        :disabled="isSyncing"
                    >
                        <i :class="isSyncing ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-up'"></i>
                        {{ isSyncing ? t('subscriptionPlans.syncing') : t('subscriptionPlans.syncToStripe') }}
                    </button>
                    <button
                        class="btn btn-danger"
                        @click="startMirror"
                        :disabled="isSyncing"
                    >
                        <i :class="isSyncing ? 'fas fa-spinner fa-spin' : 'fas fa-broom'"></i>
                        {{ isSyncing ? t('subscriptionPlans.mirroring') : t('subscriptionPlans.mirrorToStripe') }}
                    </button>
                    <button
                        class="btn btn-secondary"
                        @click="startImport"
                        :disabled="isSyncing"
                    >
                        <i :class="isSyncing ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-down'"></i>
                        {{ isSyncing ? t('subscriptionPlans.importing') : t('subscriptionPlans.importFromStripe') }}
                    </button>
                </div>
                <button
                    class="btn btn-secondary"
                    @click="openAssignOrgModal()"
                >
                    <i class="fas fa-building"></i>
                    {{ t('subscriptionPlans.assignToOrg') }}
                </button>
                <small class="text-muted">
                    {{ t('subscriptionPlans.stripeSyncDescription') }}
                </small>

                <!-- Sync Results -->
                <div v-if="showSyncResult && syncResult" class="sync-results">
                    <div v-if="syncResult.success" class="alert alert-success">
                        <div class="result-header">
                            <i class="fas fa-check-circle"></i>
                            <strong>{{ syncResultTitle }}</strong>
                            <button
                                class="btn btn-sm btn-outline-success"
                                @click="showSyncResult = false"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <div class="result-summary">
                            <div v-if="syncResult.total_plans !== undefined" class="summary-item">
                                <span class="label">{{ t('subscriptionPlans.syncTotalPlans') }}</span>
                                <span class="value">{{ syncResult.total_plans }}</span>
                            </div>
                            <div v-if="syncResult.synced_count !== undefined" class="summary-item">
                                <span class="label">{{ t('subscriptionPlans.syncSynced') }}</span>
                                <span class="value success">{{ syncResult.synced_count }}</span>
                            </div>
                            <div v-if="syncResult.created_count !== undefined" class="summary-item">
                                <span class="label">{{ t('subscriptionPlans.syncCreated') }}</span>
                                <span class="value success">{{ syncResult.created_count }}</span>
                            </div>
                            <div v-if="syncResult.updated_count !== undefined" class="summary-item">
                                <span class="label">{{ t('subscriptionPlans.syncUpdated') }}</span>
                                <span class="value success">{{ syncResult.updated_count }}</span>
                            </div>
                            <div v-if="syncResult.archived_count > 0" class="summary-item">
                                <span class="label">{{ t('subscriptionPlans.syncArchived') }}</span>
                                <span class="value danger">{{ syncResult.archived_count }}</span>
                            </div>
                            <div v-if="syncResult.details?.price_migrated?.length > 0" class="summary-item">
                                <span class="label">{{ t('subscriptionPlans.syncPriceMigrated') }}</span>
                                <span class="value info">{{ syncResult.details.price_migrated.length }}</span>
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
                            <div v-if="syncResult.details.synced?.length > 0" class="detail-section">
                                <h6><i class="fas fa-check"></i> {{ t('subscriptionPlans.syncSyncedPlans') }}</h6>
                                <ul>
                                    <li v-for="plan in syncResult.details.synced" :key="plan">{{ plan }}</li>
                                </ul>
                            </div>

                            <div v-if="syncResult.details.created?.length > 0" class="detail-section">
                                <h6><i class="fas fa-plus"></i> {{ t('subscriptionPlans.syncCreatedPlans') }}</h6>
                                <ul>
                                    <li v-for="plan in syncResult.details.created" :key="plan">{{ plan }}</li>
                                </ul>
                            </div>

                            <div v-if="syncResult.details.updated?.length > 0" class="detail-section">
                                <h6><i class="fas fa-pen"></i> {{ t('subscriptionPlans.syncUpdatedPlans') }}</h6>
                                <ul>
                                    <li v-for="plan in syncResult.details.updated" :key="plan">{{ plan }}</li>
                                </ul>
                            </div>

                            <div v-if="syncResult.details.price_migrated?.length > 0" class="detail-section">
                                <h6><i class="fas fa-tags"></i> {{ t('subscriptionPlans.syncPriceMigratedPlans') }}</h6>
                                <p class="detail-note">{{ t('subscriptionPlans.syncPriceMigratedNote') }}</p>
                                <ul>
                                    <li v-for="plan in syncResult.details.price_migrated" :key="plan">{{ plan }}</li>
                                </ul>
                            </div>

                            <div v-if="syncResult.details.archived?.length > 0" class="detail-section">
                                <h6><i class="fas fa-box-archive"></i> {{ t('subscriptionPlans.syncArchivedPlans') }}</h6>
                                <ul>
                                    <li v-for="plan in syncResult.details.archived" :key="plan">{{ plan }}</li>
                                </ul>
                            </div>

                            <div v-if="syncResult.details.skipped?.length > 0" class="detail-section">
                                <h6><i class="fas fa-info-circle"></i> {{ t('subscriptionPlans.syncSkippedPlans') }}</h6>
                                <ul>
                                    <li v-for="plan in syncResult.details.skipped" :key="plan">{{ plan }}</li>
                                </ul>
                            </div>

                            <div v-if="syncResult.details.failed?.length > 0" class="detail-section">
                                <h6><i class="fas fa-exclamation-triangle"></i> {{ t('subscriptionPlans.syncFailedPlans') }}</h6>
                                <ul>
                                    <li v-for="(failure, i) in syncResult.details.failed" :key="i">{{ failure }}</li>
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
                <template #modal="{ showModal, entityToEdit, onSubmit, onModify, onClose }">
                    <PlanConfigModal
                        :visible="showModal"
                        :plan="entityToEdit"
                        @save="entityToEdit ? onModify($event) : onSubmit($event)"
                        @close="onClose"
                    />
                </template>
                <template #actions="{ entity }">
                    <!-- Actions spécifiques pour les plans d'abonnement -->
                    <div class="plan-actions">
                        <div class="plan-info">
                            <div
                                v-if="getCapacitySummary(entity)"
                                class="plan-capacity"
                                data-test="plan-capacity"
                            >
                                <i class="fas fa-microchip"></i>
                                <span class="plan-capacity-label">{{ t('subscriptionPlans.capacityLabel') }}:</span>
                                <span class="plan-capacity-value">{{ getCapacitySummary(entity) }}</span>
                            </div>
                            <div class="price-display">
                                <strong>{{ entityStore.formatPrice(entity.price_amount, entity.currency) }}</strong>
                                <span class="billing-period">/ {{ entity.billing_interval }}</span>
                            </div>
                            <div class="plan-limits" v-if="entity.max_courses">
                                <small class="text-muted">
                                    <span v-if="entity.max_courses">{{ entity.max_courses }} {{ t('subscriptionPlans.maxCourses') }}</span>
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
                            <span
                                :class="['badge', entity.is_catalog ? 'badge-catalog' : 'badge-unlisted']"
                                :title="entity.is_catalog ? t('subscriptionPlans.catalogPlanDescription') : t('subscriptionPlans.unlistedPlanDescription')"
                            >
                                <i :class="entity.is_catalog ? 'fas fa-store' : 'fas fa-eye-slash'"></i>
                                {{ entity.is_catalog ? t('subscriptionPlans.catalogPlan') : t('subscriptionPlans.unlistedPlan') }}
                            </span>
                            <AdminBadge v-if="!entity.is_active" icon-only />
                            <button
                                v-if="entity.is_active"
                                class="btn btn-sm btn-outline-primary"
                                @click.stop="openAssignOrgModal(entity.id)"
                            >
                                <i class="fas fa-building"></i>
                                {{ t('subscriptionPlans.assignToOrg') }}
                            </button>
                            <button
                                class="btn btn-sm btn-outline-primary assign-btn"
                                @click.stop="openAssignModal(entity.id)"
                            >
                                <i class="fas fa-user-plus"></i>
                                {{ t('subscriptionPlans.assignToUser') }}
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

            <!-- Admin Assign Plan Modal -->
            <AdminAssignPlanModal
                :visible="showAssignModal"
                :plan-id="assignPlanId"
                @close="closeAssignModal"
            />

            <!-- Mirror to Stripe confirmation (dry-run preview of archived products) -->
            <BaseModal
                :visible="showMirrorConfirm"
                :title="t('subscriptionPlans.mirrorConfirmTitle')"
                title-icon="fas fa-broom"
                @close="cancelMirror"
            >
                <div v-if="mirrorPreview?.details?.archived?.length > 0" class="mirror-preview">
                    <p>{{ t('subscriptionPlans.mirrorConfirmIntro') }}</p>
                    <ul class="mirror-archived-list">
                        <li v-for="plan in mirrorPreview.details.archived" :key="plan">{{ plan }}</li>
                    </ul>
                </div>
                <p v-else class="mirror-preview-empty">
                    {{ t('subscriptionPlans.mirrorConfirmEmpty') }}
                </p>

                <!-- Destructive action: confirm styled as danger -->
                <template #footer>
                    <button class="btn btn-danger" @click="confirmMirror">
                        <i class="fas fa-broom"></i>
                        {{ t('subscriptionPlans.mirrorConfirmButton') }}
                    </button>
                    <button class="btn btn-secondary" @click="cancelMirror">
                        {{ t('subscriptionPlans.confirmCancel') }}
                    </button>
                </template>
            </BaseModal>

            <!-- Import from Stripe confirmation (overwrites local plans) -->
            <BaseModal
                :visible="showImportConfirm"
                :title="t('subscriptionPlans.importConfirmTitle')"
                title-icon="fas fa-arrow-down"
                :show-default-footer="true"
                :confirm-text="t('subscriptionPlans.importConfirmButton')"
                confirm-icon="fas fa-arrow-down"
                :cancel-text="t('subscriptionPlans.confirmCancel')"
                :is-loading="isSyncing"
                @confirm="confirmImport"
                @close="cancelImport"
            >
                <p>{{ t('subscriptionPlans.importConfirmBody') }}</p>
            </BaseModal>
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

.plan-capacity {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    justify-content: flex-end;
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    flex-wrap: wrap;
}

.plan-capacity-label {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
}

.plan-capacity-value {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
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

.badge-catalog {
    background-color: var(--color-primary);
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.badge-unlisted {
    background-color: var(--color-warning);
    display: inline-flex;
    align-items: center;
    gap: 4px;
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

.stripe-sync-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.stripe-sync-buttons .btn {
  align-self: auto;
}

.mirror-archived-list {
  margin: var(--spacing-sm) 0 0 0;
  padding-left: var(--spacing-lg);
}

.mirror-archived-list li {
  margin-bottom: var(--spacing-xs);
}

.mirror-preview-empty {
  color: var(--color-text-secondary);
}

.detail-note {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-style: italic;
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

.btn-outline-primary {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background-color: transparent;
}

.btn-outline-primary:hover {
  background-color: var(--color-primary);
  color: white;
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.assign-btn {
  margin-top: var(--spacing-xs);
}
</style>