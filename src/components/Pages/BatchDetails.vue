<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="wrapper">
    <div class="batch-details-page">
      <!-- Back Button -->
      <button class="btn-back" @click="goBack">
        <i class="fas fa-arrow-left"></i>
        {{ t('batchDetails.back') }}
      </button>

      <!-- Loading state -->
      <div v-if="isLoading && !batch" class="loading-section">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ t('batchDetails.loadingBatch') }}</p>
      </div>

      <div v-else-if="batch" class="batch-content">
        <!-- Batch Header -->
        <div class="batch-header-section">
          <div class="header-main">
            <h2>
              <i class="fas fa-layer-group"></i>
              {{ batch.subscription_plan?.name || t('batchDetails.unknownPlan') }}
            </h2>
            <span :class="['status-badge', `status-${batch.status}`]">
              {{ t(`batchDetails.status.${batch.status}`) }}
            </span>
          </div>
          <div class="batch-stats-grid">
            <div class="stat-card total">
              <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
              <div class="stat-content">
                <div class="stat-value">{{ batch.total_quantity }}</div>
                <div class="stat-label">{{ t('batchDetails.totalLicenses') }}</div>
              </div>
            </div>
            <div class="stat-card assigned">
              <div class="stat-icon"><i class="fas fa-user-check"></i></div>
              <div class="stat-content">
                <div class="stat-value">{{ batch.assigned_quantity }}</div>
                <div class="stat-label">{{ t('batchDetails.assigned') }}</div>
              </div>
            </div>
            <div class="stat-card available">
              <div class="stat-icon"><i class="fas fa-inbox"></i></div>
              <div class="stat-content">
                <div class="stat-value">{{ batch.available_quantity }}</div>
                <div class="stat-label">{{ t('batchDetails.available') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Licenses Table -->
        <div class="licenses-section">
          <div class="section-header">
            <h3>{{ t('batchDetails.licenses') }}</h3>
            <div class="section-actions">
              <button
                v-if="selectedAssignedLicenses.length > 0"
                class="btn-warning"
                @click="confirmBulkRevoke"
              >
                <i class="fas fa-user-times"></i>
                {{ t('batchDetails.revokeSelected', { count: selectedAssignedLicenses.length }) }}
              </button>
              <button
                v-if="selectedUnassignedLicenses.length > 0"
                class="btn-danger"
                @click="confirmBulkDelete"
              >
                <i class="fas fa-trash"></i>
                {{ t('batchDetails.deleteSelected', { count: selectedUnassignedLicenses.length }) }}
              </button>
              <button
                v-if="batch.available_quantity > 0"
                class="btn-primary"
                @click="showAssignModal = true"
              >
                <i class="fas fa-user-plus"></i>
                {{ t('batchDetails.assignLicense') }}
              </button>
              <button class="btn-secondary" @click="refreshLicenses">
                <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoadingLicenses }"></i>
                {{ t('batchDetails.refresh') }}
              </button>
            </div>
          </div>

          <!-- Filters -->
          <div class="filters-bar">
            <div class="filter-group">
              <label>{{ t('batchDetails.filterByStatus') }}</label>
              <select v-model="selectedFilter" class="form-control">
                <option value="all">{{ t('batchDetails.allLicenses') }}</option>
                <option value="assigned">{{ t('batchDetails.assignedOnly') }}</option>
                <option value="unassigned">{{ t('batchDetails.unassignedOnly') }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>{{ t('batchDetails.search') }}</label>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control"
                :placeholder="t('batchDetails.searchPlaceholder')"
              />
            </div>
          </div>

          <!-- Licenses Table -->
          <div v-if="isLoadingLicenses && licenses.length === 0" class="loading-section">
            <i class="fas fa-spinner fa-spin"></i>
            <p>{{ t('batchDetails.loadingLicenses') }}</p>
          </div>

          <div v-else-if="filteredLicenses.length === 0" class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>{{ t('batchDetails.noLicenses') }}</p>
          </div>

          <div v-else class="table-responsive">
            <table class="licenses-table">
              <thead>
                <tr>
                  <th class="checkbox-column">
                    <input
                      type="checkbox"
                      :checked="isAllAssignedSelected"
                      :indeterminate.prop="isSomeSelected"
                      @change="toggleSelectAll"
                      class="checkbox-input"
                    />
                  </th>
                  <th>{{ t('batchDetails.licenseId') }}</th>
                  <th>{{ t('batchDetails.assignedTo') }}</th>
                  <th>{{ t('batchDetails.licenseStatus') }}</th>
                  <th>{{ t('batchDetails.assignedDate') }}</th>
                  <th>{{ t('batchDetails.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="license in filteredLicenses" :key="license.id">
                  <td class="checkbox-column">
                    <input
                      type="checkbox"
                      :checked="selectedLicenses.includes(license.id)"
                      @change="toggleLicenseSelection(license.id)"
                      class="checkbox-input"
                    />
                  </td>
                  <td>
                    <span class="license-id">{{ license.id.substring(0, 8) }}...</span>
                  </td>
                  <td>
                    <div v-if="license.user_id" class="user-cell">
                      <div class="user-avatar">
                        <i class="fas fa-user"></i>
                      </div>
                      <div class="user-info">
                        <div class="user-name">{{ getUserName(license.user_id) }}</div>
                        <div class="user-id">ID: {{ license.user_id.substring(0, 8) }}...</div>
                      </div>
                    </div>
                    <span v-else class="text-muted">
                      <i class="fas fa-minus"></i>
                      {{ t('batchDetails.unassigned') }}
                    </span>
                  </td>
                  <td>
                    <span :class="['license-status-badge', `status-${license.status}`]">
                      {{ t(`batchDetails.licenseStatus.${license.status}`) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="license.created_at" class="date-cell">
                      <i class="far fa-calendar"></i>
                      {{ formatDate(license.created_at) }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        v-if="license.status === 'unassigned'"
                        class="btn-action assign"
                        :title="t('batchDetails.assignLicense')"
                        @click="showAssignModal = true"
                      >
                        <i class="fas fa-user-plus"></i>
                      </button>
                      <button
                        v-if="license.status === 'active' && license.user_id"
                        class="btn-action revoke"
                        :title="t('batchDetails.revokeLicense')"
                        @click="confirmRevoke(license)"
                      >
                        <i class="fas fa-user-times"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- License Assignment Modal -->
      <LicenseAssignmentModal
        :visible="showAssignModal"
        :batch-id="batchId"
        @close="showAssignModal = false"
        @assigned="handleLicenseAssigned"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTranslations } from '../../composables/useTranslations'
import { useSubscriptionBatchesStore } from '../../stores/subscriptionBatches'
import { userService } from '../../services/domain/user'
import { formatDateTime } from '../../utils/formatters'
import { useNotification } from '../../composables/useNotification'
import LicenseAssignmentModal from '../Modals/LicenseAssignmentModal.vue'
import type { UserSubscription } from '../../types/entities'

const { t } = useTranslations({
  en: {
    batchDetails: {
      back: 'Back to Dashboard',
      loadingBatch: 'Loading batch details...',
      loadingLicenses: 'Loading licenses...',
      unknownPlan: 'Unknown Plan',
      totalLicenses: 'Total Licenses',
      assigned: 'Assigned',
      available: 'Available',
      licenses: 'Licenses',
      assignLicense: 'Assign License',
      refresh: 'Refresh',
      filterByStatus: 'Filter by Status',
      allLicenses: 'All Licenses',
      assignedOnly: 'Assigned Only',
      unassignedOnly: 'Available Only',
      search: 'Search',
      searchPlaceholder: 'Search by user ID...',
      noLicenses: 'No licenses found',
      licenseId: 'License ID',
      assignedTo: 'Assigned To',
      licenseStatus: 'Status',
      assignedDate: 'Assigned Date',
      actions: 'Actions',
      unassigned: 'Unassigned',
      revokeLicense: 'Revoke',
      revokeSelected: 'Revoke Selected ({count})',
      deleteSelected: 'Delete Selected ({count})',
      confirmRevokeTitle: 'Confirm Revoke',
      confirmRevokeMessage: 'Are you sure you want to revoke this license? The user will lose access immediately.',
      confirmBulkRevokeMessage: 'Are you sure you want to revoke {count} licenses? The users will lose access immediately.',
      confirmDeleteMessage: 'Are you sure you want to permanently delete this license? This will reduce your total licenses and you may receive a prorated credit.',
      confirmBulkDeleteMessage: 'Are you sure you want to permanently delete {count} licenses? This will reduce your total licenses and you may receive a prorated credit.',
      assignSuccess: 'License assigned successfully',
      revokeSuccess: 'License revoked successfully',
      bulkRevokeSuccess: '{count} licenses revoked successfully',
      bulkDeleteSuccess: '{count} licenses deleted successfully',
      refreshSuccess: 'Licenses refreshed successfully',
      assignError: 'Failed to assign license',
      revokeError: 'Failed to revoke license',
      deleteError: 'Failed to delete licenses',
      cannotDeleteAssigned: 'Cannot delete licenses: some are assigned to users. Revoke them first.',
      batchCancelledExternally: 'This batch was already cancelled in Stripe. Redirecting to license management...',
      status: {
        active: 'Active',
        cancelled: 'Cancelled',
        canceled: 'Canceled',
        expired: 'Expired',
        past_due: 'Past Due'
      },
      licenseStatus: {
        unassigned: 'Available',
        active: 'Active',
        cancelled: 'Cancelled',
        canceled: 'Canceled',
        past_due: 'Past Due'
      }
    }
  },
  fr: {
    batchDetails: {
      back: 'Retour au Tableau de Bord',
      loadingBatch: 'Chargement des détails du lot...',
      loadingLicenses: 'Chargement des licences...',
      unknownPlan: 'Plan Inconnu',
      totalLicenses: 'Licences Totales',
      assigned: 'Assignées',
      available: 'Disponibles',
      licenses: 'Licences',
      assignLicense: 'Assigner une Licence',
      refresh: 'Actualiser',
      filterByStatus: 'Filtrer par Statut',
      allLicenses: 'Toutes les Licences',
      assignedOnly: 'Assignées Uniquement',
      unassignedOnly: 'Disponibles Uniquement',
      search: 'Rechercher',
      searchPlaceholder: 'Rechercher par ID utilisateur...',
      noLicenses: 'Aucune licence trouvée',
      licenseId: 'ID de Licence',
      assignedTo: 'Assignée à',
      licenseStatus: 'Statut',
      assignedDate: 'Date d\'Assignation',
      actions: 'Actions',
      unassigned: 'Non assignée',
      revokeLicense: 'Révoquer',
      revokeSelected: 'Révoquer la Sélection ({count})',
      deleteSelected: 'Supprimer la Sélection ({count})',
      confirmRevokeTitle: 'Confirmer la Révocation',
      confirmRevokeMessage: 'Êtes-vous sûr de vouloir révoquer cette licence ? L\'utilisateur perdra l\'accès immédiatement.',
      confirmBulkRevokeMessage: 'Êtes-vous sûr de vouloir révoquer {count} licences ? Les utilisateurs perdront l\'accès immédiatement.',
      confirmDeleteMessage: 'Êtes-vous sûr de vouloir supprimer définitivement cette licence ? Cela réduira votre total de licences et vous pourriez recevoir un crédit au prorata.',
      confirmBulkDeleteMessage: 'Êtes-vous sûr de vouloir supprimer définitivement {count} licences ? Cela réduira votre total de licences et vous pourriez recevoir un crédit au prorata.',
      assignSuccess: 'Licence assignée avec succès',
      revokeSuccess: 'Licence révoquée avec succès',
      bulkRevokeSuccess: '{count} licences révoquées avec succès',
      bulkDeleteSuccess: '{count} licences supprimées avec succès',
      refreshSuccess: 'Licences actualisées avec succès',
      assignError: 'Échec de l\'assignation de la licence',
      revokeError: 'Échec de la révocation de la licence',
      deleteError: 'Échec de la suppression des licences',
      cannotDeleteAssigned: 'Impossible de supprimer les licences : certaines sont assignées à des utilisateurs. Révoquez-les d\'abord.',
      batchCancelledExternally: 'Ce lot a déjà été annulé dans Stripe. Redirection vers la gestion des licences...',
      status: {
        active: 'Actif',
        cancelled: 'Annulé',
        canceled: 'Annulé',
        expired: 'Expiré',
        past_due: 'En Retard'
      },
      licenseStatus: {
        unassigned: 'Disponible',
        active: 'Active',
        cancelled: 'Annulée',
        canceled: 'Annulée',
        past_due: 'En Retard'
      }
    }
  }
})

const route = useRoute()
const router = useRouter()
const batchStore = useSubscriptionBatchesStore()
const { showSuccess, showError, showConfirm } = useNotification()

const batchId = route.params.id as string

const isLoading = ref(false)
const isLoadingLicenses = ref(false)
const showAssignModal = ref(false)
const selectedFilter = ref('all')
const searchQuery = ref('')
const selectedLicenses = ref<string[]>([])

// Get batch from the batches list instead of currentBatch (which may be "not implemented")
const batch = computed(() => {
  // First try to find it in the batches list
  const batchFromList = batchStore.batches.find(b => b.id === batchId)
  if (batchFromList) {
    return batchFromList
  }
  // Fallback to currentBatch if not found in list
  return batchStore.currentBatch
})
const licenses = computed(() => batchStore.currentBatchLicenses)

const userCache = ref<Map<string, any>>(new Map())

const filteredLicenses = computed(() => {
  let result = licenses.value

  // Filter by status
  if (selectedFilter.value === 'assigned') {
    result = result.filter(l => l.status === 'active')
  } else if (selectedFilter.value === 'unassigned') {
    result = result.filter(l => l.status === 'unassigned')
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(l =>
      l.id.toLowerCase().includes(query) ||
      (l.user_id && l.user_id.toLowerCase().includes(query))
    )
  }

  return result
})

const assignedLicenses = computed(() => {
  return filteredLicenses.value.filter(l => l.status === 'active' && l.user_id)
})

const unassignedLicenses = computed(() => {
  return filteredLicenses.value.filter(l => l.status === 'unassigned')
})

const selectedAssignedLicenses = computed(() => {
  return selectedLicenses.value.filter(id => {
    const license = licenses.value.find(l => l.id === id)
    return license && license.status === 'active' && license.user_id
  })
})

const selectedUnassignedLicenses = computed(() => {
  return selectedLicenses.value.filter(id => {
    const license = licenses.value.find(l => l.id === id)
    return license && license.status === 'unassigned'
  })
})

const isAllAssignedSelected = computed(() => {
  return filteredLicenses.value.length > 0 &&
         filteredLicenses.value.every(l => selectedLicenses.value.includes(l.id))
})

const isSomeSelected = computed(() => {
  const selectedCount = filteredLicenses.value.filter(l =>
    selectedLicenses.value.includes(l.id)
  ).length
  return selectedCount > 0 && selectedCount < filteredLicenses.value.length
})

// Methods
const goBack = () => {
  router.push('/license-management')
}

const loadBatch = async () => {
  isLoading.value = true

  try {
    await batchStore.loadBatch(batchId)
  } catch (err: any) {
    console.error('Error loading batch:', err)
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('batchDetails.loadingBatch')
    )
  } finally {
    isLoading.value = false
  }
}

const loadBatchWithFeedback = async () => {
  await batchStore.loadBatches()
  if (!batchStore.error) {
    showSuccess(t('batchDetails.refreshSuccess'))
  }
}

const loadLicenses = async () => {
  isLoadingLicenses.value = true

  try {
    await batchStore.loadBatchLicenses(batchId)
    // Preload user data for assigned licenses
    await loadUsersData()
  } catch (err: any) {
    console.error('Error loading licenses:', err)
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('batchDetails.loadingLicenses')
    )
  } finally {
    isLoadingLicenses.value = false
  }
}

const refreshLicenses = async () => {
  await batchStore.loadBatches()
  await loadLicenses()
  showSuccess(t('batchDetails.refreshSuccess'))
}

const loadUsersData = async () => {
  const userIds = licenses.value
    .filter(l => l.user_id && l.status === 'active')
    .map(l => l.user_id!)
    .filter(id => !userCache.value.has(id))

  if (userIds.length === 0) return

  try {
    const users = await userService.getUsersByIds(userIds)
    users.forEach(user => {
      userCache.value.set(user.id, user)
    })
  } catch (err) {
    console.error('Error loading users:', err)
  }
}

const getUserName = (userId: string): string => {
  const user = userCache.value.get(userId)
  if (user) {
    return user.display_name || user.username || user.name || user.email || userId.substring(0, 8)
  }
  return userId.substring(0, 8) + '...'
}

const handleLicenseAssigned = async (userId: string) => {
  try {
    await batchStore.assignLicense(batchId, userId)
    showSuccess(t('batchDetails.assignSuccess'))
    showAssignModal.value = false
    // Reload licenses to update the table
    await loadLicenses()
  } catch (err: any) {
    console.error('Error assigning license:', err)
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('batchDetails.assignError')
    )
  }
}

const toggleLicenseSelection = (licenseId: string) => {
  const index = selectedLicenses.value.indexOf(licenseId)
  if (index === -1) {
    selectedLicenses.value.push(licenseId)
  } else {
    selectedLicenses.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (isAllAssignedSelected.value) {
    selectedLicenses.value = []
  } else {
    selectedLicenses.value = filteredLicenses.value.map(l => l.id)
  }
}

const confirmBulkRevoke = async () => {
  if (selectedAssignedLicenses.value.length === 0) return

  const count = selectedAssignedLicenses.value.length
  const message = count === 1
    ? t('batchDetails.confirmRevokeMessage')
    : t('batchDetails.confirmBulkRevokeMessage', { count })

  const confirmed = await showConfirm(message)
  if (!confirmed) {
    return
  }

  try {
    // Revoke all selected ASSIGNED licenses
    const revokePromises = selectedAssignedLicenses.value.map(licenseId =>
      batchStore.revokeLicense(batchId, licenseId)
    )

    await Promise.all(revokePromises)

    showSuccess(t('batchDetails.bulkRevokeSuccess', { count }))
    selectedLicenses.value = []

    // Reload licenses to update the table
    await loadLicenses()
  } catch (err: any) {
    console.error('Error revoking licenses:', err)
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('batchDetails.revokeError')
    )
  }
}

const confirmBulkDelete = async () => {
  if (selectedUnassignedLicenses.value.length === 0) return

  const count = selectedUnassignedLicenses.value.length
  const message = count === 1
    ? t('batchDetails.confirmDeleteMessage')
    : t('batchDetails.confirmBulkDeleteMessage', { count })

  const confirmed = await showConfirm(message)
  if (!confirmed) {
    return
  }

  try {
    // Calculate new quantity (current total - number of licenses to delete)
    const newQuantity = batch.value!.total_quantity - count

    if (newQuantity < batch.value!.assigned_quantity) {
      showError(t('batchDetails.cannotDeleteAssigned'))
      return
    }

    // Update batch quantity (this will delete the unassigned licenses)
    await batchStore.updateBatchQuantity(batchId, newQuantity)

    showSuccess(t('batchDetails.bulkDeleteSuccess', { count }))
    selectedLicenses.value = []

    // Reload all batches (since loadBatch is not implemented on backend)
    await batchStore.loadBatches()
    await loadLicenses()
  } catch (err: any) {
    console.error('Error deleting licenses:', err)
    const errorMessage = err.response?.data?.error_message || err.response?.data?.message || ''

    // Check if this is a "cancelled externally" error
    if (errorMessage.includes('cancelled externally') || errorMessage.includes('cancelled locally')) {
      // Batch was already cancelled in Stripe, show message and redirect
      showError(t('batchDetails.batchCancelledExternally'))
      // Wait 2 seconds for user to read the message, then redirect
      setTimeout(() => {
        router.push('/license-management')
      }, 2000)
      return
    }

    showError(errorMessage || t('batchDetails.deleteError'))
  }
}

const confirmRevoke = async (license: UserSubscription) => {
  const confirmed = await showConfirm(t('batchDetails.confirmRevokeMessage'))
  if (!confirmed) {
    return
  }

  try {
    await batchStore.revokeLicense(batchId, license.id)
    showSuccess(t('batchDetails.revokeSuccess'))
    // Reload licenses to update the table
    await loadLicenses()
  } catch (err: any) {
    console.error('Error revoking license:', err)
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('batchDetails.revokeError')
    )
  }
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-'
  return formatDateTime(dateString).split(' ')[0]
}

// Lifecycle
onMounted(async () => {
  // Load all batches first to populate the list
  if (batchStore.batches.length === 0) {
    await batchStore.loadBatches()
  }
  await loadBatch()
  await loadLicenses()
})
</script>

<style scoped>
.batch-details-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-back:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-dark);
}

.loading-section {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-muted);
}

.loading-section i {
  margin-bottom: var(--spacing-md);
}

/* Batch Header */
.batch-header-section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border-light);
}

.header-main h2 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.status-badge.status-active {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-badge.status-cancelled,
.status-badge.status-canceled {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.batch-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 2px solid transparent;
}

.stat-card.total {
  border-color: var(--color-primary-light);
}

.stat-card.assigned {
  border-color: var(--color-success-light);
}

.stat-card.available {
  border-color: var(--color-info-light);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xl);
}

.stat-card.total .stat-icon {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.stat-card.assigned .stat-icon {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.stat-card.available .stat-icon {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.btn-outline-danger,
.btn-outline-success {
  border-width: 1px;
  background: transparent;
}

.btn-outline-danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.btn-outline-success {
  color: var(--color-success);
  border-color: var(--color-success);
}

/* Licenses Section */
.licenses-section {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border-light);
}

.section-header h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.section-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-primary,
.btn-secondary,
.btn-warning,
.btn-danger {
  display: inline-flex;
  align-items: center;
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

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
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

.btn-warning {
  background: var(--color-warning);
  color: var(--color-white);
}

.btn-warning:hover {
  background: var(--color-warning-dark);
}

.btn-danger {
  background: var(--color-danger);
  color: var(--color-white);
}

.btn-danger:hover {
  background: var(--color-danger-dark);
}

/* Checkboxes */
.checkbox-column {
  width: 40px;
  text-align: center;
  padding: var(--spacing-sm) !important;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
  margin: 0;
  vertical-align: middle;
}

.checkbox-placeholder {
  color: var(--color-text-disabled);
  font-size: var(--font-size-xs);
}

/* Filters */
.filters-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.filter-group label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.form-control {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

/* Table */
.table-responsive {
  overflow-x: auto;
}

.licenses-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.licenses-table thead th {
  padding: var(--spacing-md);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border-bottom: 2px solid var(--color-border-medium);
}

.licenses-table tbody tr {
  border-bottom: 1px solid var(--color-border-light);
  transition: background var(--transition-fast);
}

.licenses-table tbody tr:hover {
  background: var(--color-bg-secondary);
}

.licenses-table tbody td {
  padding: var(--spacing-md);
}

.license-id {
  font-family: monospace;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  border-radius: 50%;
  font-size: var(--font-size-sm);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-id {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: monospace;
}

.license-status-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.license-status-badge.status-unassigned {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.license-status-badge.status-active {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.date-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-muted);
}

.text-muted {
  color: var(--color-text-muted);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-action.assign {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.btn-action.assign:hover {
  background: var(--color-success);
  color: var(--color-white);
}

.btn-action.revoke {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.btn-action.revoke:hover {
  background: var(--color-danger);
  color: var(--color-white);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-md);
}

/* Responsive */
@media (max-width: 768px) {
  .batch-details-page {
    padding: var(--spacing-lg);
  }

  .header-main {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .batch-stats-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .section-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .filters-bar {
    grid-template-columns: 1fr;
  }

  .table-responsive {
    overflow-x: scroll;
  }
}
</style>
