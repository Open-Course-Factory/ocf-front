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

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBaseStore } from './baseStore'
import { createAsyncWrapper } from '../utils/asyncWrapper'
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'
import { bulkLicenseService } from '../services/domain/subscription'
import type {
  SubscriptionBatch,
  UserSubscription,
  PricingBreakdown,
  BulkPurchaseInput
} from '../types/entities'

export const useSubscriptionBatchesStore = defineStore('subscriptionBatches', () => {
  const base = useBaseStore()

  const { t } = useStoreTranslations({
    en: {
      subscriptionBatches: {
        pageTitle: 'License Management',
        batchDetails: 'Batch Details',
        totalLicenses: 'Total Licenses',
        assignedLicenses: 'Assigned',
        availableLicenses: 'Available',
        status: 'Status',
        renewsOn: 'Renews On',
        purchasedOn: 'Purchased On',
        planName: 'Plan',
        addLicenses: 'Add Licenses',
        manageLicenses: 'Manage Licenses',
        viewDetails: 'View Details',
        purchaseBulk: 'Purchase Bulk Licenses',
        assignLicense: 'Assign License',
        revokeLicense: 'Revoke License',
        quantity: 'Quantity',
        updateQuantity: 'Update Quantity',
        cancelBatch: 'Cancel Batch',
        noBatches: 'No license batches found',
        noLicenses: 'No licenses in this batch',
        assignedTo: 'Assigned To',
        unassigned: 'Unassigned',
        licenseStatus: 'License Status',
        actions: 'Actions',
        loadError: 'Failed to load license batches',
        purchaseError: 'Failed to purchase licenses',
        assignError: 'Failed to assign license',
        revokeError: 'Failed to revoke license',
        updateError: 'Failed to update quantity',
        cancelError: 'Failed to cancel batch',
        purchaseSuccess: 'Licenses purchased successfully',
        assignSuccess: 'License assigned successfully',
        revokeSuccess: 'License revoked successfully',
        updateSuccess: 'Quantity updated successfully',
        cancelSuccess: 'Batch cancelled successfully',
        confirmRevoke: 'Are you sure you want to revoke this license?',
        confirmCancel: 'Are you sure you want to cancel this batch?',
        active: 'Active',
        cancelled: 'Cancelled',
        expired: 'Expired',
        past_due: 'Past Due'
      }
    },
    fr: {
      subscriptionBatches: {
        pageTitle: 'Gestion des Licences',
        batchDetails: 'Détails du Lot',
        totalLicenses: 'Licences Totales',
        assignedLicenses: 'Assignées',
        availableLicenses: 'Disponibles',
        status: 'Statut',
        renewsOn: 'Renouvellement le',
        purchasedOn: 'Acheté le',
        planName: 'Plan',
        addLicenses: 'Ajouter des Licences',
        manageLicenses: 'Gérer les Licences',
        viewDetails: 'Voir les Détails',
        purchaseBulk: 'Acheter des Licences en Gros',
        assignLicense: 'Assigner une Licence',
        revokeLicense: 'Révoquer la Licence',
        quantity: 'Quantité',
        updateQuantity: 'Mettre à Jour la Quantité',
        cancelBatch: 'Annuler le Lot',
        noBatches: 'Aucun lot de licences trouvé',
        noLicenses: 'Aucune licence dans ce lot',
        assignedTo: 'Assigné à',
        unassigned: 'Non assignée',
        licenseStatus: 'Statut de la Licence',
        actions: 'Actions',
        loadError: 'Échec du chargement des lots de licences',
        purchaseError: 'Échec de l\'achat des licences',
        assignError: 'Échec de l\'assignation de la licence',
        revokeError: 'Échec de la révocation de la licence',
        updateError: 'Échec de la mise à jour de la quantité',
        cancelError: 'Échec de l\'annulation du lot',
        purchaseSuccess: 'Licences achetées avec succès',
        assignSuccess: 'Licence assignée avec succès',
        revokeSuccess: 'Licence révoquée avec succès',
        updateSuccess: 'Quantité mise à jour avec succès',
        cancelSuccess: 'Lot annulé avec succès',
        confirmRevoke: 'Êtes-vous sûr de vouloir révoquer cette licence ?',
        confirmCancel: 'Êtes-vous sûr de vouloir annuler ce lot ?',
        active: 'Actif',
        cancelled: 'Annulé',
        expired: 'Expiré',
        past_due: 'En Retard'
      }
    }
  })

  // Create async wrapper with base store state
  const baseAsync = createAsyncWrapper({ isLoading: base.isLoading, error: base.error })

  // Field list for batch entity
  const fieldList = buildFieldList([
    field('id').hidden().readonly(),
    field('subscription_plan_id', t('subscriptionBatches.planName'))
      .input()
      .visible()
      .required(),
    field('total_quantity', t('subscriptionBatches.totalLicenses'))
      .input()
      .visible()
      .readonly(),
    field('assigned_quantity', t('subscriptionBatches.assignedLicenses'))
      .input()
      .visible()
      .readonly(),
    field('available_quantity', t('subscriptionBatches.availableLicenses'))
      .input()
      .visible()
      .readonly(),
    field('status', t('subscriptionBatches.status')).input().visible().readonly(),
    field('current_period_end', t('subscriptionBatches.renewsOn')).input().visible().readonly(),
    field('created_at', t('subscriptionBatches.purchasedOn')).input().visible().readonly()
  ])

  // State for current batch licenses
  const currentBatchLicenses = ref<UserSubscription[]>([])
  const currentBatch = ref<SubscriptionBatch | null>(null)
  const pricingPreview = ref<PricingBreakdown | null>(null)

  // Computed properties
  const batches = computed(() => base.entities as SubscriptionBatch[])
  const activeBatches = computed(() =>
    batches.value.filter((batch) => batch.status === 'active')
  )

  /**
   * Load all batches for current user
   */
  const loadBatches = async () => {
    return await baseAsync(async () => {
      const data = await bulkLicenseService.getMyBatches()
      base.entities = data
      return data
    }, 'subscriptionBatches.loadError')
  }

  /**
   * Load a specific batch by ID
   */
  const loadBatch = async (batchId: string) => {
    return await baseAsync(async () => {
      const data = await bulkLicenseService.getBatchById(batchId)
      currentBatch.value = data
      return data
    }, 'subscriptionBatches.loadError')
  }

  /**
   * Load licenses for a batch
   */
  const loadBatchLicenses = async (batchId: string) => {
    return await baseAsync(async () => {
      const data = await bulkLicenseService.getBatchLicenses(batchId)
      currentBatchLicenses.value = data
      return data
    }, 'subscriptionBatches.loadError')
  }

  /**
   * Get pricing preview for bulk purchase
   */
  const getPricingPreview = async (subscriptionPlanId: string, quantity: number) => {
    return await baseAsync(async () => {
      const data = await bulkLicenseService.getPricingPreview({
        subscriptionPlanId,
        quantity
      })
      pricingPreview.value = data
      return data
    }, 'subscriptionBatches.loadError')
  }

  /**
   * Purchase bulk licenses
   */
  const purchaseBulkLicenses = async (input: BulkPurchaseInput) => {
    return await baseAsync(async () => {
      const data = await bulkLicenseService.purchaseBulkLicenses(input)
      // Add to batches list
      base.entities.unshift(data)
      return data
    }, 'subscriptionBatches.purchaseError')
  }

  /**
   * Assign a license to a user
   */
  const assignLicense = async (batchId: string, userId: string) => {
    return await baseAsync(async () => {
      const data = await bulkLicenseService.assignLicense(batchId, { user_id: userId })
      // Update the license in the current batch licenses
      const index = currentBatchLicenses.value.findIndex((l) => l.id === data.id)
      if (index !== -1) {
        currentBatchLicenses.value[index] = data
      }
      // Update batch assigned count
      if (currentBatch.value && currentBatch.value.id === batchId) {
        currentBatch.value.assigned_quantity++
        currentBatch.value.available_quantity--
      }
      // Update in batches list
      const batchIndex = batches.value.findIndex((b) => b.id === batchId)
      if (batchIndex !== -1) {
        batches.value[batchIndex].assigned_quantity++
        batches.value[batchIndex].available_quantity--
      }
      return data
    }, 'subscriptionBatches.assignError')
  }

  /**
   * Revoke a license assignment
   */
  const revokeLicense = async (batchId: string, licenseId: string) => {
    return await baseAsync(async () => {
      const result = await bulkLicenseService.revokeLicense(batchId, licenseId)
      // Update the license in the current batch licenses
      const license = currentBatchLicenses.value.find((l) => l.id === licenseId)
      if (license) {
        license.status = 'unassigned'
        license.user_id = undefined
      }
      // Update batch assigned count
      if (currentBatch.value && currentBatch.value.id === batchId) {
        currentBatch.value.assigned_quantity--
        currentBatch.value.available_quantity++
      }
      // Update in batches list
      const batchIndex = batches.value.findIndex((b) => b.id === batchId)
      if (batchIndex !== -1) {
        batches.value[batchIndex].assigned_quantity--
        batches.value[batchIndex].available_quantity++
      }
      return result
    }, 'subscriptionBatches.revokeError')
  }

  /**
   * Update batch quantity
   */
  const updateBatchQuantity = async (batchId: string, newQuantity: number) => {
    return await baseAsync(async () => {
      const result = await bulkLicenseService.updateBatchQuantity(batchId, {
        new_quantity: newQuantity
      })
      // Reload the batch and its licenses
      await loadBatch(batchId)
      await loadBatchLicenses(batchId)
      return result
    }, 'subscriptionBatches.updateError')
  }

  /**
   * Cancel a batch
   */
  const cancelBatch = async (batchId: string) => {
    return await baseAsync(async () => {
      const result = await bulkLicenseService.cancelBatch(batchId)
      // Update batch status
      const batchIndex = batches.value.findIndex((b) => b.id === batchId)
      if (batchIndex !== -1) {
        batches.value[batchIndex].status = 'cancelled'
      }
      if (currentBatch.value && currentBatch.value.id === batchId) {
        currentBatch.value.status = 'cancelled'
      }
      return result
    }, 'subscriptionBatches.cancelError')
  }

  /**
   * Get unassigned licenses count for a batch
   */
  const getUnassignedCount = (batchId: string): number => {
    const batch = batches.value.find((b) => b.id === batchId)
    return batch ? batch.available_quantity : 0
  }

  /**
   * Get assigned licenses for a batch
   */
  const getAssignedLicenses = computed(() =>
    currentBatchLicenses.value.filter((license) => license.status === 'active')
  )

  /**
   * Get unassigned licenses for a batch
   */
  const getUnassignedLicenses = computed(() =>
    currentBatchLicenses.value.filter((license) => license.status === 'unassigned')
  )

  return {
    ...base,
    fieldList,

    // State
    currentBatchLicenses,
    currentBatch,
    pricingPreview,

    // Computed
    batches,
    activeBatches,
    getAssignedLicenses,
    getUnassignedLicenses,

    // Actions
    loadBatches,
    loadBatch,
    loadBatchLicenses,
    getPricingPreview,
    purchaseBulkLicenses,
    assignLicense,
    revokeLicense,
    updateBatchQuantity,
    cancelBatch,
    getUnassignedCount
  }
})
