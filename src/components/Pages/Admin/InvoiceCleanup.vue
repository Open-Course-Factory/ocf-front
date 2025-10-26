<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="wrapper">
    <div class="invoice-cleanup-page">
      <div class="page-header">
        <h2>
          <i class="fas fa-broom"></i>
          {{ t('invoiceCleanup.title') }}
        </h2>
        <p class="text-muted">{{ t('invoiceCleanup.subtitle') }}</p>
      </div>

      <!-- Cleanup Configuration Form -->
      <div class="config-section">
        <h3>{{ t('invoiceCleanup.configTitle') }}</h3>

        <div class="form-grid">
          <!-- Action Type -->
          <div class="form-group">
            <label for="action-type">
              {{ t('invoiceCleanup.actionType') }}
              <span class="required-mark">*</span>
            </label>
            <select
              id="action-type"
              v-model="config.action"
              class="form-control"
            >
              <option value="void">{{ t('invoiceCleanup.actionVoid') }}</option>
              <option value="uncollectible">{{ t('invoiceCleanup.actionUncollectible') }}</option>
            </select>
            <div class="form-hint">
              {{ config.action === 'void' ? t('invoiceCleanup.actionVoidHint') : t('invoiceCleanup.actionUncollectibleHint') }}
            </div>
          </div>

          <!-- Minimum Age (days) -->
          <div class="form-group">
            <label for="min-age">
              {{ t('invoiceCleanup.minimumAge') }}
              <span class="required-mark">*</span>
            </label>
            <input
              id="min-age"
              v-model.number="config.olderThanDays"
              type="number"
              min="0"
              class="form-control"
              :placeholder="t('invoiceCleanup.minimumAgePlaceholder')"
            />
            <div class="form-hint">
              {{ t('invoiceCleanup.minimumAgeHint') }}
            </div>
          </div>

          <!-- Status Filter -->
          <div class="form-group">
            <label for="status-filter">
              {{ t('invoiceCleanup.statusFilter') }}
            </label>
            <select
              id="status-filter"
              v-model="config.statusFilter"
              class="form-control"
            >
              <option value="all">{{ t('invoiceCleanup.allStatuses') }}</option>
              <option value="draft">{{ t('invoiceCleanup.statusDraft') }}</option>
              <option value="open">{{ t('invoiceCleanup.statusOpen') }}</option>
              <option value="uncollectible">{{ t('invoiceCleanup.statusUncollectible') }}</option>
            </select>
            <div class="form-hint">
              {{ t('invoiceCleanup.statusFilterHint') }}
            </div>
          </div>
        </div>

        <!-- Dry Run Toggle -->
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              v-model="config.dryRun"
              type="checkbox"
              class="checkbox-input"
            />
            <span>{{ t('invoiceCleanup.dryRun') }}</span>
          </label>
          <div class="form-hint">
            {{ t('invoiceCleanup.dryRunHint') }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button
            v-if="!results"
            class="btn-primary"
            :disabled="!isConfigValid || isProcessing"
            @click="runPreview"
          >
            <i class="fas" :class="isProcessing ? 'fa-spinner fa-spin' : 'fa-search'"></i>
            {{ t('invoiceCleanup.previewButton') }}
          </button>
          <button
            v-if="results && selectedInvoiceIds.length > 0"
            class="btn-danger"
            :disabled="isProcessing"
            @click="confirmExecuteSelected"
          >
            <i class="fas" :class="isProcessing ? 'fa-spinner fa-spin' : 'fa-trash-alt'"></i>
            {{ t('invoiceCleanup.executeSelected', { count: selectedInvoiceIds.length }) }}
          </button>
          <button
            class="btn-secondary"
            :disabled="isProcessing"
            @click="resetConfig"
          >
            <i class="fas fa-redo"></i>
            {{ t('invoiceCleanup.reset') }}
          </button>
        </div>
      </div>

      <!-- Results Section -->
      <div v-if="results" class="results-section">
        <div class="results-header">
          <h3>
            {{ config.dryRun ? t('invoiceCleanup.previewResults') : t('invoiceCleanup.cleanupResults') }}
          </h3>
          <div class="results-actions">
            <button
              class="btn-secondary"
              @click="exportResults"
            >
              <i class="fas fa-download"></i>
              {{ t('invoiceCleanup.exportResults') }}
            </button>
          </div>
        </div>

        <!-- Results Summary -->
        <div class="results-summary">
          <div class="summary-card">
            <div class="summary-icon total">
              <i class="fas fa-file-invoice"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ results.processed_invoices }}</div>
              <div class="summary-label">{{ t('invoiceCleanup.totalProcessed') }}</div>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon processed">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ results.cleaned_invoices }}</div>
              <div class="summary-label">{{ t('invoiceCleanup.cleaned') }}</div>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon skipped">
              <i class="fas fa-forward"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ results.skipped_invoices }}</div>
              <div class="summary-label">{{ t('invoiceCleanup.skipped') }}</div>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon failed">
              <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ results.failed_invoices }}</div>
              <div class="summary-label">{{ t('invoiceCleanup.failed') }}</div>
            </div>
          </div>

          <div v-if="results.total_amount_cleaned > 0" class="summary-card amount">
            <div class="summary-icon amount">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ formatCurrency(results.total_amount_cleaned / 100, results.currency) }}</div>
              <div class="summary-label">{{ t('invoiceCleanup.totalAmount') }}</div>
            </div>
          </div>
        </div>

        <!-- Selection Summary (for preview mode) -->
        <div v-if="results.dry_run && results.cleaned_details && results.cleaned_details.length > 0" class="selection-summary">
          <div class="selection-header">
            <h4>
              <i class="fas fa-check-square"></i>
              {{ t('invoiceCleanup.selectionSummary') }}
            </h4>
            <div class="selection-actions">
              <button class="btn-link" @click="selectAllInvoices">
                <i class="fas fa-check-double"></i>
                {{ t('invoiceCleanup.selectAll') }}
              </button>
              <button class="btn-link" @click="deselectAllInvoices">
                <i class="fas fa-times"></i>
                {{ t('invoiceCleanup.deselectAll') }}
              </button>
            </div>
          </div>

          <div class="selection-stats">
            <div class="stat-item">
              <span class="stat-label">{{ t('invoiceCleanup.selectedCount') }}:</span>
              <span class="stat-value">{{ selectedInvoiceIds.length }} / {{ results.cleaned_details.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ t('invoiceCleanup.selectedAmount') }}:</span>
              <span class="stat-value">{{ formatCurrency(selectedTotalAmount / 100, results.currency) }}</span>
            </div>
          </div>

          <div v-if="selectedInvoiceIds.length > 50" class="warning-banner">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ t('invoiceCleanup.largeSelectionWarning', { count: selectedInvoiceIds.length }) }}</span>
          </div>
        </div>

        <!-- Cleaned Invoices Table -->
        <div v-if="results.cleaned_details && results.cleaned_details.length > 0" class="results-table-section">
          <h4>{{ t('invoiceCleanup.cleanedInvoices') }}</h4>

          <div class="table-filters">
            <div class="filter-group">
              <label>{{ t('invoiceCleanup.searchInvoices') }}</label>
              <input
                v-model="resultsSearch"
                type="text"
                class="form-control"
                :placeholder="t('invoiceCleanup.searchPlaceholder')"
              />
            </div>
          </div>

          <div class="table-responsive">
            <table class="results-table">
              <thead>
                <tr>
                  <th v-if="results.dry_run" class="checkbox-column">
                    <input
                      type="checkbox"
                      :checked="isAllSelected"
                      :indeterminate.prop="isSomeSelected"
                      @change="toggleSelectAll"
                      class="checkbox-input"
                    />
                  </th>
                  <th @click="sortBy('invoice_id')">
                    {{ t('invoiceCleanup.invoiceId') }}
                    <i v-if="sortField === 'invoice_id'" class="fas" :class="sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
                  </th>
                  <th>{{ t('invoiceCleanup.invoiceNumber') }}</th>
                  <th @click="sortBy('amount')">
                    {{ t('invoiceCleanup.amount') }}
                    <i v-if="sortField === 'amount'" class="fas" :class="sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
                  </th>
                  <th @click="sortBy('original_status')">
                    {{ t('invoiceCleanup.originalStatus') }}
                    <i v-if="sortField === 'original_status'" class="fas" :class="sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
                  </th>
                  <th @click="sortBy('created_at')">
                    {{ t('invoiceCleanup.createdAt') }}
                    <i v-if="sortField === 'created_at'" class="fas" :class="sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
                  </th>
                  <th>{{ t('invoiceCleanup.actionTaken') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredCleanedResults"
                  :key="item.invoice_id"
                  :class="{ 'row-selected': results.dry_run && selectedInvoiceIds.includes(item.invoice_id) }"
                >
                  <td v-if="results.dry_run" class="checkbox-column">
                    <input
                      type="checkbox"
                      :checked="selectedInvoiceIds.includes(item.invoice_id)"
                      @change="toggleInvoiceSelection(item.invoice_id)"
                      class="checkbox-input"
                    />
                  </td>
                  <td>
                    <span class="invoice-id">{{ item.invoice_id }}</span>
                  </td>
                  <td>{{ item.invoice_number || '-' }}</td>
                  <td>{{ formatCurrency(item.amount / 100, item.currency) }}</td>
                  <td>
                    <span :class="['status-badge', `status-${item.original_status}`]">
                      {{ getStatusLabel(item.original_status) }}
                    </span>
                  </td>
                  <td>{{ formatDate(item.created_at) }}</td>
                  <td>
                    <span class="action-badge">
                      <i class="fas fa-check-circle"></i>
                      {{ item.action_taken }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Skipped Invoices Section -->
        <div v-if="results.skipped_details && results.skipped_details.length > 0" class="skipped-section">
          <h4>{{ t('invoiceCleanup.skippedInvoices') }} ({{ results.skipped_details.length }})</h4>
          <div class="skipped-list">
            <div v-for="(reason, index) in results.skipped_details" :key="index" class="skipped-item">
              <i class="fas fa-info-circle"></i>
              <span>{{ reason }}</span>
            </div>
          </div>
        </div>

        <!-- Failed Invoices Section -->
        <div v-if="results.failed_details && results.failed_details.length > 0" class="failed-section">
          <h4>{{ t('invoiceCleanup.failedInvoices') }} ({{ results.failed_details.length }})</h4>
          <div class="failed-list">
            <div v-for="(error, index) in results.failed_details" :key="index" class="failed-item">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{ error }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslations } from '../../../composables/useTranslations'
import { useNotification } from '../../../composables/useNotification'
import { formatCurrency, formatDateTime } from '../../../utils/formatters'
import axios from 'axios'

const { t } = useTranslations({
  en: {
    invoiceCleanup: {
      title: 'Invoice Cleanup',
      subtitle: 'Manage and cleanup old or invalid invoices from the system',
      configTitle: 'Cleanup Configuration',
      actionType: 'Cleanup Action',
      actionVoid: 'Void Invoice',
      actionUncollectible: 'Mark as Uncollectible',
      actionVoidHint: 'Permanently cancels the invoice (cannot be reopened)',
      actionUncollectibleHint: 'Marks invoice as uncollectible (stops collection, keeps record)',
      minimumAge: 'Minimum Age (days)',
      minimumAgePlaceholder: 'e.g., 90',
      minimumAgeHint: 'Only invoices older than this will be affected',
      statusFilter: 'Invoice Status',
      statusFilterHint: 'If omitted, will process both draft and open invoices',
      allStatuses: 'All Statuses (Draft + Open)',
      statusDraft: 'Draft Only',
      statusOpen: 'Open Only',
      statusUncollectible: 'Uncollectible Only',
      dryRun: 'Dry Run (Preview only, no changes)',
      dryRunHint: 'Preview which invoices would be affected without making actual changes',
      previewButton: 'Preview Cleanup',
      executeSelected: 'Execute Selected ({count})',
      reset: 'Reset',
      selectionSummary: 'Invoice Selection',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      selectedCount: 'Selected',
      selectedAmount: 'Total Amount',
      largeSelectionWarning: 'You have selected {count} invoices. Please review carefully before executing.',
      noInvoicesSelected: 'Please select at least one invoice to execute cleanup',
      confirmExecution: 'Are you sure you want to {action} {count} invoices totaling {amount}? This action cannot be undone.',
      previewResults: 'Preview Results',
      cleanupResults: 'Cleanup Results',
      exportResults: 'Export Results',
      totalProcessed: 'Total Processed',
      cleaned: 'Cleaned',
      skipped: 'Skipped',
      failed: 'Failed',
      totalAmount: 'Total Amount',
      cleanedInvoices: 'Invoices to be Cleaned',
      skippedInvoices: 'Skipped Invoices',
      failedInvoices: 'Failed Invoices',
      searchInvoices: 'Search Invoices',
      searchPlaceholder: 'Search by invoice ID or email...',
      filterByResult: 'Filter by Result',
      allResults: 'All Results',
      successOnly: 'Success Only',
      failedOnly: 'Failed Only',
      noResults: 'No results to display',
      invoiceId: 'Invoice ID',
      invoiceNumber: 'Invoice Number',
      customerEmail: 'Customer Email',
      amount: 'Amount',
      status: 'Status',
      originalStatus: 'Original Status',
      createdAt: 'Created',
      result: 'Result',
      actionTaken: 'Action Taken',
      success: 'Success',
      failedResult: 'Failed',
      cleanupSuccess: 'Cleanup completed successfully',
      cleanupError: 'Failed to run cleanup',
      invalidConfig: 'Please specify a minimum age (must be greater than 0)',
      exportSuccess: 'Results exported successfully',
      exportError: 'Failed to export results'
    }
  },
  fr: {
    invoiceCleanup: {
      title: 'Nettoyage des Factures',
      subtitle: 'Gérer et nettoyer les anciennes ou invalides factures du système',
      configTitle: 'Configuration du Nettoyage',
      actionType: 'Action de Nettoyage',
      actionVoid: 'Annuler la Facture',
      actionUncollectible: 'Marquer comme Irrecouvrable',
      actionVoidHint: 'Annule définitivement la facture (ne peut pas être rouverte)',
      actionUncollectibleHint: 'Marque la facture comme irrecouvrable (arrête la collecte, conserve l\'enregistrement)',
      minimumAge: 'Âge Minimum (jours)',
      minimumAgePlaceholder: 'ex: 90',
      minimumAgeHint: 'Seules les factures plus anciennes seront affectées',
      statusFilter: 'Statut de Facture',
      statusFilterHint: 'Si omis, traitera les factures brouillon et ouvertes',
      allStatuses: 'Tous les Statuts (Brouillon + Ouvert)',
      statusDraft: 'Brouillon Uniquement',
      statusOpen: 'Ouvert Uniquement',
      statusUncollectible: 'Irrecouvrable Uniquement',
      dryRun: 'Simulation (Aperçu uniquement, aucune modification)',
      dryRunHint: 'Prévisualiser quelles factures seraient affectées sans effectuer de changements réels',
      previewButton: 'Prévisualiser le Nettoyage',
      executeSelected: 'Exécuter la Sélection ({count})',
      reset: 'Réinitialiser',
      selectionSummary: 'Sélection de Factures',
      selectAll: 'Tout Sélectionner',
      deselectAll: 'Tout Désélectionner',
      selectedCount: 'Sélectionnées',
      selectedAmount: 'Montant Total',
      largeSelectionWarning: 'Vous avez sélectionné {count} factures. Veuillez vérifier attentivement avant d\'exécuter.',
      noInvoicesSelected: 'Veuillez sélectionner au moins une facture pour exécuter le nettoyage',
      confirmExecution: 'Êtes-vous sûr de vouloir {action} {count} factures pour un total de {amount} ? Cette action ne peut pas être annulée.',
      previewResults: 'Résultats de la Prévisualisation',
      cleanupResults: 'Résultats du Nettoyage',
      exportResults: 'Exporter les Résultats',
      totalProcessed: 'Total Traité',
      cleaned: 'Nettoyé',
      skipped: 'Ignoré',
      failed: 'Échoué',
      totalAmount: 'Montant Total',
      cleanedInvoices: 'Factures à Nettoyer',
      skippedInvoices: 'Factures Ignorées',
      failedInvoices: 'Factures Échouées',
      searchInvoices: 'Rechercher des Factures',
      searchPlaceholder: 'Rechercher par ID de facture ou email...',
      filterByResult: 'Filtrer par Résultat',
      allResults: 'Tous les Résultats',
      successOnly: 'Succès Uniquement',
      failedOnly: 'Échecs Uniquement',
      noResults: 'Aucun résultat à afficher',
      invoiceId: 'ID de Facture',
      invoiceNumber: 'Numéro de Facture',
      customerEmail: 'Email Client',
      amount: 'Montant',
      status: 'Statut',
      originalStatus: 'Statut Original',
      createdAt: 'Créée',
      result: 'Résultat',
      actionTaken: 'Action Effectuée',
      success: 'Succès',
      failedResult: 'Échoué',
      cleanupSuccess: 'Nettoyage terminé avec succès',
      cleanupError: 'Échec de l\'exécution du nettoyage',
      invalidConfig: 'Veuillez spécifier un âge minimum (doit être supérieur à 0)',
      exportSuccess: 'Résultats exportés avec succès',
      exportError: 'Échec de l\'export des résultats'
    }
  }
})

const { showSuccess, showError } = useNotification()

// Configuration
const _today = new Date().toISOString().split('T')[0]

const config = ref({
  action: 'void',
  olderThanDays: 90,
  statusFilter: 'all',
  dryRun: true
})

const isProcessing = ref(false)
const results = ref<any>(null)

// Selection state for selective cleanup
const selectedInvoiceIds = ref<string[]>([])

// Results filtering and sorting
const resultsSearch = ref('')
const resultsFilter = ref('all')
const sortField = ref('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Validation
const isConfigValid = computed(() => {
  return config.value.olderThanDays >= 0 &&
         (config.value.action === 'void' || config.value.action === 'uncollectible')
})

// Selection computed properties
const selectedTotalAmount = computed(() => {
  if (!results.value?.cleaned_details) return 0
  return results.value.cleaned_details
    .filter((item: any) => selectedInvoiceIds.value.includes(item.invoice_id))
    .reduce((sum: number, item: any) => sum + item.amount, 0)
})

const isAllSelected = computed(() => {
  if (!results.value?.cleaned_details?.length) return false
  return filteredCleanedResults.value.length > 0 &&
         filteredCleanedResults.value.every((item: any) =>
           selectedInvoiceIds.value.includes(item.invoice_id)
         )
})

const isSomeSelected = computed(() => {
  const selectedCount = filteredCleanedResults.value.filter((item: any) =>
    selectedInvoiceIds.value.includes(item.invoice_id)
  ).length
  return selectedCount > 0 && selectedCount < filteredCleanedResults.value.length
})

// Results processing
const filteredCleanedResults = computed(() => {
  if (!results.value?.cleaned_details) return []

  let filtered = results.value.cleaned_details

  // Apply search filter
  if (resultsSearch.value) {
    const query = resultsSearch.value.toLowerCase()
    filtered = filtered.filter((item: any) =>
      item.invoice_id.toLowerCase().includes(query) ||
      item.invoice_number?.toLowerCase().includes(query) ||
      item.customer_id?.toLowerCase().includes(query)
    )
  }

  // Apply sorting
  filtered = [...filtered].sort((a: any, b: any) => {
    let aVal = a[sortField.value]
    let bVal = b[sortField.value]

    if (sortField.value === 'created_at') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }

    if (sortDirection.value === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  return filtered
})

// Methods
const runCleanup = async () => {
  if (!isConfigValid.value) {
    showError(t('invoiceCleanup.invalidConfig'))
    return
  }

  isProcessing.value = true

  try {
    const requestBody: any = {
      action: config.value.action,              // "void" or "uncollectible"
      older_than_days: Number(config.value.olderThanDays), // Ensure it's a number
      dry_run: config.value.dryRun             // boolean
    }

    // Add optional status field only if not "all"
    if (config.value.statusFilter !== 'all') {
      requestBody.status = config.value.statusFilter
    }

    console.log('Sending cleanup request:', requestBody) // Debug log
    const response = await axios.post('/invoices/admin/cleanup', requestBody)

    results.value = response.data
    showSuccess(t('invoiceCleanup.cleanupSuccess'))
  } catch (err: any) {
    console.error('Error running cleanup:', err)
    console.error('Request body was:', requestBody) // Debug log
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('invoiceCleanup.cleanupError')
    )
  } finally {
    isProcessing.value = false
  }
}

const runPreview = async () => {
  // Run cleanup in dry-run mode
  config.value.dryRun = true
  await runCleanup()

  // After successful preview, pre-select all cleaned invoices
  if (results.value?.cleaned_details) {
    selectedInvoiceIds.value = results.value.cleaned_details.map((item: any) => item.invoice_id)
  }
}

const toggleInvoiceSelection = (invoiceId: string) => {
  const index = selectedInvoiceIds.value.indexOf(invoiceId)
  if (index === -1) {
    selectedInvoiceIds.value.push(invoiceId)
  } else {
    selectedInvoiceIds.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    deselectAllInvoices()
  } else {
    selectAllInvoices()
  }
}

const selectAllInvoices = () => {
  if (results.value?.cleaned_details) {
    selectedInvoiceIds.value = filteredCleanedResults.value.map((item: any) => item.invoice_id)
  }
}

const deselectAllInvoices = () => {
  selectedInvoiceIds.value = []
}

const confirmExecuteSelected = () => {
  if (selectedInvoiceIds.value.length === 0) {
    showError(t('invoiceCleanup.noInvoicesSelected'))
    return
  }

  const count = selectedInvoiceIds.value.length
  const amount = formatCurrency(selectedTotalAmount.value / 100, results.value.currency)

  const confirmMessage = t('invoiceCleanup.confirmExecution', {
    count,
    amount,
    action: config.value.action
  })

  if (confirm(confirmMessage)) {
    executeSelected()
  }
}

const executeSelected = async () => {
  if (selectedInvoiceIds.value.length === 0) {
    showError(t('invoiceCleanup.noInvoicesSelected'))
    return
  }

  isProcessing.value = true

  try {
    const requestBody: any = {
      action: config.value.action,
      invoice_ids: selectedInvoiceIds.value,
      dry_run: false
    }

    console.log('Sending selective cleanup request:', requestBody)
    const response = await axios.post('/invoices/admin/cleanup', requestBody)

    results.value = response.data
    selectedInvoiceIds.value = [] // Clear selection after execution
    showSuccess(t('invoiceCleanup.cleanupSuccess'))
  } catch (err: any) {
    console.error('Error executing selective cleanup:', err)
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('invoiceCleanup.cleanupError')
    )
  } finally {
    isProcessing.value = false
  }
}

const resetConfig = () => {
  config.value = {
    action: 'void',
    olderThanDays: 90,
    statusFilter: 'all',
    dryRun: true
  }
  results.value = null
  selectedInvoiceIds.value = []
  resultsSearch.value = ''
  resultsFilter.value = 'all'
}

const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

const exportResults = () => {
  if (!results.value) return

  try {
    // Create CSV content
    const headers = ['Invoice ID', 'Invoice Number', 'Customer ID', 'Amount', 'Currency', 'Original Status', 'Action Taken', 'Created']
    const rows = filteredCleanedResults.value.map((item: any) => [
      item.invoice_id,
      item.invoice_number || '',
      item.customer_id,
      (item.amount / 100).toFixed(2),
      item.currency,
      item.original_status,
      item.action_taken,
      item.created_at
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `invoice-cleanup-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showSuccess(t('invoiceCleanup.exportSuccess'))
  } catch (err) {
    console.error('Error exporting results:', err)
    showError(t('invoiceCleanup.exportError'))
  }
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  return formatDateTime(dateString).split(' ')[0]
}

const _capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': t('invoiceCleanup.statusDraft').replace(' Only', '').replace(' Uniquement', ''),
    'open': t('invoiceCleanup.statusOpen').replace(' Only', '').replace(' Uniquement', ''),
    'uncollectible': t('invoiceCleanup.statusUncollectible').replace(' Only', '').replace(' Uniquement', ''),
    'void': 'Void'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.invoice-cleanup-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.page-header h2 {
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

/* Configuration Section */
.config-section {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.config-section h3 {
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-group label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.required-mark {
  color: var(--color-danger);
  margin-left: var(--spacing-xs);
}

.form-control {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-default);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.form-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.checkbox-group {
  margin-bottom: var(--spacing-lg);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
  background: var(--color-danger);
  color: var(--color-white);
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-danger-dark);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-link:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

/* Results Section */
.results-section {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border-light);
}

.results-header h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.results-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.summary-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 2px solid transparent;
}

.summary-card:nth-child(1) {
  border-color: var(--color-primary-light);
}

.summary-card:nth-child(2) {
  border-color: var(--color-success-light);
}

.summary-card:nth-child(3) {
  border-color: var(--color-warning-light);
}

.summary-card:nth-child(4) {
  border-color: var(--color-danger-light);
}

.summary-card.amount {
  border-color: var(--color-info-light);
}

.summary-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xl);
}

.summary-icon.total {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.summary-icon.processed {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.summary-icon.skipped {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.summary-icon.failed {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.summary-icon.amount {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.summary-content {
  flex: 1;
}

.summary-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
}

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

/* Selection Summary */
.selection-summary {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-primary-bg);
  border: 2px solid var(--color-primary-light);
  border-radius: var(--border-radius-md);
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}

.selection-header h4 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.selection-actions {
  display: flex;
  gap: var(--spacing-md);
}

.selection-stats {
  display: flex;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-base);
}

.stat-label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.stat-value {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--border-radius-sm);
  color: var(--color-warning-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.warning-banner i {
  flex-shrink: 0;
  font-size: var(--font-size-base);
}

/* Results Table */
.results-table-section {
  margin-top: var(--spacing-xl);
}

.table-filters {
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

.table-responsive {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.results-table thead th {
  padding: var(--spacing-md);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border-bottom: 2px solid var(--color-border-default);
  cursor: pointer;
  user-select: none;
}

.results-table thead th:hover {
  background: var(--color-bg-tertiary);
}

.results-table thead th i {
  margin-left: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.results-table tbody tr {
  border-bottom: 1px solid var(--color-border-light);
  transition: background var(--transition-fast);
}

.results-table tbody tr:hover {
  background: var(--color-bg-secondary);
}

.results-table tbody tr.row-selected {
  background: var(--color-primary-bg);
  border-left: 3px solid var(--color-primary);
}

.results-table tbody tr.row-selected:hover {
  background: var(--color-primary-light);
}

.results-table tbody td {
  padding: var(--spacing-md);
}

.checkbox-column {
  width: 40px;
  text-align: center;
  padding: var(--spacing-sm) !important;
}

.checkbox-column .checkbox-input {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.invoice-id {
  font-family: monospace;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.status-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.status-badge.status-draft {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.status-badge.status-open {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-badge.status-void {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.status-badge.status-uncollectible {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.result-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.result-badge.success {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.result-badge.failed {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.error-detail {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-danger);
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

.action-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

/* Skipped Section */
.skipped-section {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--border-radius-md);
}

.skipped-section h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-warning-text);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.skipped-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.skipped-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.skipped-item i {
  color: var(--color-warning);
  margin-top: 2px;
  flex-shrink: 0;
}

/* Failed Section */
.failed-section {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--border-radius-md);
}

.failed-section h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-danger-text);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.failed-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.failed-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.failed-item i {
  color: var(--color-danger);
  margin-top: 2px;
  flex-shrink: 0;
}

.results-table-section h4 {
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .invoice-cleanup-page {
    padding: var(--spacing-lg);
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .results-summary {
    grid-template-columns: 1fr;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .table-filters {
    grid-template-columns: 1fr;
  }
}
</style>
