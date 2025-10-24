<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="wrapper">
    <div class="license-dashboard">
      <div class="dashboard-header">
        <h2>
          <i class="fas fa-layer-group"></i>
          {{ t('licenseDashboard.title') }}
        </h2>
        <p class="text-muted">{{ t('licenseDashboard.subtitle') }}</p>
      </div>

      <div class="dashboard-actions">
        <button class="btn-primary" @click="navigateToPurchase">
          <i class="fas fa-plus"></i>
          {{ t('licenseDashboard.purchaseMore') }}
        </button>
        <button class="btn-secondary" @click="refreshBatches">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i>
          {{ t('licenseDashboard.refresh') }}
        </button>
      </div>

      <!-- Bulk Actions Bar -->
      <div v-if="selectedBatchIds.length > 0" class="bulk-actions-bar">
        <div class="selection-info">
          <i class="fas fa-check-circle"></i>
          {{ t('licenseDashboard.selectedCount', { count: selectedBatchIds.length }) }}
        </div>
        <div class="bulk-buttons">
          <button class="btn-secondary" @click="clearSelection">
            <i class="fas fa-times"></i>
            {{ t('licenseDashboard.clearSelection') }}
          </button>
          <button class="btn-danger" @click="confirmBulkDelete">
            <i class="fas fa-trash"></i>
            {{ t('licenseDashboard.deleteSelected', { count: selectedBatchIds.length }) }}
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading && batches.length === 0" class="loading-section">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ t('licenseDashboard.loadingBatches') }}</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="batches.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>{{ t('licenseDashboard.noBatches') }}</h3>
        <p>{{ t('licenseDashboard.noBatchesDescription') }}</p>
        <button class="btn-primary" @click="navigateToPurchase">
          <i class="fas fa-shopping-cart"></i>
          {{ t('licenseDashboard.purchaseFirst') }}
        </button>
      </div>

      <!-- Batches Grid -->
      <div v-else class="batches-grid">
        <div
          v-for="batch in batches"
          :key="batch.id"
          class="batch-card"
          :class="{ 'selected': selectedBatchIds.includes(batch.id) }"
        >
          <!-- Checkbox for canceled batches -->
          <div
            v-if="batch.status === 'cancelled' || batch.status === 'canceled'"
            class="batch-checkbox"
          >
            <input
              type="checkbox"
              :checked="selectedBatchIds.includes(batch.id)"
              @change="toggleBatchSelection(batch.id)"
              class="checkbox-input"
            />
          </div>

          <div class="batch-header">
            <div class="batch-title-section">
              <h3 class="batch-title">
                {{ batch.subscription_plan?.name || t('licenseDashboard.unknownPlan') }}
              </h3>
              <span :class="['batch-status-badge', `status-${batch.status}`]">
                {{ t(`licenseDashboard.status.${batch.status}`) }}
              </span>
            </div>
            <div class="batch-id">
              {{ t('licenseDashboard.batchId') }}: {{ batch.id.substring(0, 8) }}...
            </div>
          </div>

          <div class="batch-stats">
            <div class="stat-item">
              <div class="stat-icon total">
                <i class="fas fa-layer-group"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ batch.total_quantity }}</div>
                <div class="stat-label">{{ t('licenseDashboard.totalLicenses') }}</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon assigned">
                <i class="fas fa-user-check"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ batch.assigned_quantity }}</div>
                <div class="stat-label">{{ t('licenseDashboard.assigned') }}</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon available">
                <i class="fas fa-inbox"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ batch.available_quantity }}</div>
                <div class="stat-label">{{ t('licenseDashboard.available') }}</div>
              </div>
            </div>
          </div>

          <div class="batch-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${getUsagePercentage(batch)}%` }"
              ></div>
            </div>
            <div class="progress-label">
              {{ getUsagePercentage(batch) }}% {{ t('licenseDashboard.utilized') }}
            </div>
          </div>

          <div class="batch-meta">
            <div class="meta-item">
              <i class="far fa-calendar"></i>
              <span>{{ t('licenseDashboard.renews') }}: {{ formatDate(batch.current_period_end) }}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-calendar-plus"></i>
              <span>{{ t('licenseDashboard.purchased') }}: {{ formatDate(batch.created_at) }}</span>
            </div>
          </div>

          <div class="batch-actions">
            <button
              class="btn-action primary"
              @click="viewBatchDetails(batch.id)"
            >
              <i class="fas fa-eye"></i>
              {{ t('licenseDashboard.viewDetails') }}
            </button>
            <button
              v-if="batch.available_quantity > 0 && batch.status === 'active'"
              class="btn-action success"
              @click="viewBatchDetails(batch.id)"
            >
              <i class="fas fa-user-plus"></i>
              {{ t('licenseDashboard.assignLicenses') }}
            </button>
            <button
              v-if="batch.status === 'active'"
              class="btn-action secondary"
              @click="openAddLicensesModal(batch)"
            >
              <i class="fas fa-plus"></i>
              {{ t('licenseDashboard.addMore') }}
            </button>
            <button
              v-if="batch.status === 'cancelled' || batch.status === 'canceled'"
              class="btn-action danger"
              @click="confirmDeleteBatch(batch)"
            >
              <i class="fas fa-trash"></i>
              {{ t('licenseDashboard.deleteBatch') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Licenses Modal -->
    <AddLicensesModal
      :visible="showAddLicensesModal"
      :batch="selectedBatch"
      @close="closeAddLicensesModal"
      @added="handleAddLicenses"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTranslations } from '../../composables/useTranslations'
import { useSubscriptionBatchesStore } from '../../stores/subscriptionBatches'
import { useNotification } from '../../composables/useNotification'
import { formatDateTime } from '../../utils/formatters'
import AddLicensesModal from '../Modals/AddLicensesModal.vue'
import type { SubscriptionBatch } from '../../types/entities'

const { t } = useTranslations({
  en: {
    licenseDashboard: {
      title: 'License Management',
      subtitle: 'Manage your bulk license purchases and assignments',
      purchaseMore: 'Purchase More Licenses',
      refresh: 'Refresh',
      loadingBatches: 'Loading license batches...',
      noBatches: 'No License Batches',
      noBatchesDescription: 'You haven\'t purchased any bulk licenses yet',
      purchaseFirst: 'Purchase Your First Batch',
      unknownPlan: 'Unknown Plan',
      batchId: 'Batch ID',
      totalLicenses: 'Total',
      assigned: 'Assigned',
      available: 'Available',
      utilized: 'Utilized',
      renews: 'Renews',
      purchased: 'Purchased',
      viewDetails: 'View Details',
      assignLicenses: 'Assign Licenses',
      addMore: 'Add More',
      deleteBatch: 'Delete Batch',
      selectedCount: '{count} batches selected',
      clearSelection: 'Clear Selection',
      deleteSelected: 'Delete Selected ({count})',
      confirmDelete: 'Are you sure you want to permanently delete this canceled batch? This action cannot be undone.',
      confirmBulkDelete: 'Are you sure you want to permanently delete {count} canceled batches? This action cannot be undone.',
      addSuccess: 'Licenses added successfully',
      deleteSuccess: 'Batch deleted successfully',
      bulkDeleteSuccess: '{count} batches deleted successfully',
      deleteError: 'Failed to delete batch',
      batchCancelledExternally: 'This batch was already cancelled in Stripe. The status has been updated.',
      refreshSuccess: 'License batches refreshed successfully',
      purchaseComplete: 'Bulk license purchase completed successfully!',
      status: {
        active: 'Active',
        cancelled: 'Cancelled',
        canceled: 'Canceled',
        expired: 'Expired',
        past_due: 'Past Due'
      }
    }
  },
  fr: {
    licenseDashboard: {
      title: 'Gestion des Licences',
      subtitle: 'Gérez vos achats de licences en gros et vos affectations',
      purchaseMore: 'Acheter Plus de Licences',
      refresh: 'Actualiser',
      loadingBatches: 'Chargement des lots de licences...',
      noBatches: 'Aucun Lot de Licences',
      noBatchesDescription: 'Vous n\'avez pas encore acheté de licences en gros',
      purchaseFirst: 'Acheter Votre Premier Lot',
      unknownPlan: 'Plan Inconnu',
      batchId: 'ID du Lot',
      totalLicenses: 'Total',
      assigned: 'Assignées',
      available: 'Disponibles',
      utilized: 'Utilisé',
      renews: 'Renouvellement',
      purchased: 'Acheté',
      viewDetails: 'Voir les Détails',
      assignLicenses: 'Assigner des Licences',
      addMore: 'Ajouter Plus',
      deleteBatch: 'Supprimer le Lot',
      selectedCount: '{count} lots sélectionnés',
      clearSelection: 'Effacer la Sélection',
      deleteSelected: 'Supprimer la Sélection ({count})',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer définitivement ce lot annulé ? Cette action ne peut pas être annulée.',
      confirmBulkDelete: 'Êtes-vous sûr de vouloir supprimer définitivement {count} lots annulés ? Cette action ne peut pas être annulée.',
      addSuccess: 'Licences ajoutées avec succès',
      deleteSuccess: 'Lot supprimé avec succès',
      bulkDeleteSuccess: '{count} lots supprimés avec succès',
      deleteError: 'Échec de la suppression du lot',
      batchCancelledExternally: 'Ce lot a déjà été annulé dans Stripe. Le statut a été mis à jour.',
      refreshSuccess: 'Lots de licences actualisés avec succès',
      purchaseComplete: 'Achat de licences en gros terminé avec succès !',
      status: {
        active: 'Actif',
        cancelled: 'Annulé',
        canceled: 'Annulé',
        expired: 'Expiré',
        past_due: 'En Retard'
      }
    }
  }
})

const router = useRouter()
const route = useRoute()
const batchStore = useSubscriptionBatchesStore()
const { showError, showSuccess, showConfirm } = useNotification()

const isLoading = ref(false)
const showAddLicensesModal = ref(false)
const selectedBatch = ref<SubscriptionBatch | null>(null)
const selectedBatchIds = ref<string[]>([])

const batches = computed(() => {
  console.log('Batches computed:', batchStore.batches)
  return batchStore.batches
})

// Methods
const loadBatches = async () => {
  console.log('loadBatches called')
  isLoading.value = true

  try {
    await batchStore.loadBatches()
    console.log('Batches loaded successfully:', batchStore.batches.length, 'batches')
  } catch (err: any) {
    console.error('Error loading batches:', err)
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('licenseDashboard.loadingBatches')
    )
  } finally {
    isLoading.value = false
    console.log('isLoading set to false, batches.length:', batchStore.batches.length)
  }
}

const refreshBatches = async () => {
  await loadBatches()
  if (!batchStore.error) {
    showSuccess(t('licenseDashboard.refreshSuccess'))
  }
}

const navigateToPurchase = () => {
  router.push('/bulk-license-purchase')
}

const viewBatchDetails = (batchId: string) => {
  router.push(`/license-management/${batchId}`)
}

const openAddLicensesModal = (batch: SubscriptionBatch) => {
  selectedBatch.value = batch
  showAddLicensesModal.value = true
}

const closeAddLicensesModal = () => {
  showAddLicensesModal.value = false
  selectedBatch.value = null
}

const handleAddLicenses = async (newQuantity: number) => {
  if (!selectedBatch.value) return

  try {
    await batchStore.updateBatchQuantity(selectedBatch.value.id, newQuantity)

    // Reload batches to get updated quantities
    await loadBatches()

    showSuccess(t('licenseDashboard.addSuccess'))
    closeAddLicensesModal()
  } catch (err: any) {
    console.error('Error adding licenses:', err)
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      'Failed to add licenses'
    )
  }
}

const toggleBatchSelection = (batchId: string) => {
  const index = selectedBatchIds.value.indexOf(batchId)
  if (index === -1) {
    selectedBatchIds.value.push(batchId)
  } else {
    selectedBatchIds.value.splice(index, 1)
  }
}

const clearSelection = () => {
  selectedBatchIds.value = []
}

const confirmDeleteBatch = async (batch: SubscriptionBatch) => {
  const confirmed = await showConfirm(t('licenseDashboard.confirmDelete'))
  if (!confirmed) {
    return
  }

  try {
    await batchStore.deleteBatch(batch.id)
    showSuccess(t('licenseDashboard.deleteSuccess'))
  } catch (err: any) {
    console.error('Error deleting batch:', err)
    const errorMessage = err.response?.data?.error_message || err.response?.data?.message || ''

    // Check if this is a "cancelled externally" error
    if (errorMessage.includes('cancelled externally') || errorMessage.includes('cancelled locally')) {
      // Batch was already cancelled in Stripe, refresh data and stay on page
      showError(t('licenseDashboard.batchCancelledExternally'))
      await loadBatches() // Refresh to show updated status
      return
    }

    showError(errorMessage || t('licenseDashboard.deleteError'))
  }
}

const confirmBulkDelete = async () => {
  const count = selectedBatchIds.value.length
  const confirmed = await showConfirm(
    t('licenseDashboard.confirmBulkDelete', { count })
  )
  if (!confirmed) {
    return
  }

  try {
    // Delete all selected batches
    const deletePromises = selectedBatchIds.value.map(batchId =>
      batchStore.deleteBatch(batchId)
    )
    await Promise.all(deletePromises)

    showSuccess(t('licenseDashboard.bulkDeleteSuccess', { count }))
    selectedBatchIds.value = []
  } catch (err: any) {
    console.error('Error deleting batches:', err)
    const errorMessage = err.response?.data?.error_message || err.response?.data?.message || ''

    // Check if this is a "cancelled externally" error
    if (errorMessage.includes('cancelled externally') || errorMessage.includes('cancelled locally')) {
      // Some batches were already cancelled in Stripe, refresh data
      showError(t('licenseDashboard.batchCancelledExternally'))
      await loadBatches() // Refresh to show updated status
      selectedBatchIds.value = []
      return
    }

    showError(errorMessage || t('licenseDashboard.deleteError'))
  }
}

const getUsagePercentage = (batch: SubscriptionBatch): number => {
  if (batch.total_quantity === 0) return 0
  return Math.round((batch.assigned_quantity / batch.total_quantity) * 100)
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-'
  return formatDateTime(dateString).split(' ')[0] // Only show date, not time
}

// Lifecycle
onMounted(async () => {
  await loadBatches()

  // Check for success parameter in URL (from payment redirect)
  if (route.query.success === 'true') {
    showSuccess(t('licenseDashboard.purchaseComplete'))
    // Clean up URL
    router.replace({ query: {} })
  }
})
</script>

<style scoped>
.license-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.dashboard-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.dashboard-header h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
}

.text-muted {
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.dashboard-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-bottom: var(--spacing-xl);
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
}

.btn-secondary:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-dark);
}

.btn-danger {
  background: var(--color-danger);
  color: var(--color-white);
  border: none;
}

.btn-danger:hover {
  background: var(--color-danger-dark);
}

/* Bulk Actions Bar */
.bulk-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  background: var(--color-primary-light);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
}

.selection-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.selection-info i {
  font-size: var(--font-size-lg);
}

.bulk-buttons {
  display: flex;
  gap: var(--spacing-md);
}

/* Loading */
.loading-section {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-muted);
}

.loading-section i {
  margin-bottom: var(--spacing-md);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-disabled);
}

.empty-state h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.empty-state p {
  margin: 0 0 var(--spacing-xl) 0;
  font-size: var(--font-size-base);
}

/* Batches Grid */
.batches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: var(--spacing-xl);
}

.batch-card {
  position: relative;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.batch-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.batch-card.selected {
  border: 2px solid var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.batch-checkbox {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);
  z-index: 10;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.batch-header {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border-light);
}

.batch-title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.batch-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.batch-status-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.batch-status-badge.status-active {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.batch-status-badge.status-cancelled,
.batch-status-badge.status-canceled {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.batch-status-badge.status-expired {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.batch-status-badge.status-past_due {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.batch-id {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-family: monospace;
}

/* Batch Stats */
.batch-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-lg);
}

.stat-icon.total {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.stat-icon.assigned {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.stat-icon.available {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

/* Batch Progress */
.batch-progress {
  margin-bottom: var(--spacing-lg);
}

.progress-bar {
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  margin-bottom: var(--spacing-xs);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  transition: width var(--transition-base);
}

.progress-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
}

/* Batch Meta */
.batch-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.meta-item i {
  color: var(--color-text-muted);
}

/* Batch Actions */
.batch-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--spacing-sm);
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
}

.btn-action.primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-action.primary:hover {
  background: var(--color-primary-dark);
}

.btn-action.success {
  background: var(--color-success);
  color: var(--color-white);
}

.btn-action.success:hover {
  background: var(--color-success-dark);
}

.btn-action.secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
}

.btn-action.secondary:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-dark);
}

.btn-action.danger {
  background: var(--color-danger);
  color: var(--color-white);
}

.btn-action.danger:hover {
  background: var(--color-danger-dark);
}

/* Responsive */
@media (max-width: 1024px) {
  .batches-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .license-dashboard {
    padding: var(--spacing-lg);
  }

  .batches-grid {
    grid-template-columns: 1fr;
  }

  .batch-stats {
    grid-template-columns: 1fr;
  }

  .batch-actions {
    grid-template-columns: 1fr;
  }

  .dashboard-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .bulk-actions-bar {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .bulk-buttons {
    width: 100%;
    flex-direction: column;
  }

  .bulk-buttons button {
    width: 100%;
  }
}
</style>
