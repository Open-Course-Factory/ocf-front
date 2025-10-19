<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <BaseModal
    :visible="visible"
    :title="t('addLicenses.title')"
    :show-default-footer="true"
    :confirm-text="t('addLicenses.confirm')"
    :cancel-text="t('addLicenses.cancel')"
    :is-loading="isAdding"
    :confirm-disabled="!isValid"
    @confirm="handleAdd"
    @close="handleClose"
  >
    <div class="add-licenses-content">
      <!-- Batch Info -->
      <div class="batch-info">
        <div class="info-row">
          <span class="info-label">{{ t('addLicenses.currentPlan') }}</span>
          <span class="info-value">{{ batch?.subscription_plan?.name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('addLicenses.currentQuantity') }}</span>
          <span class="info-value">{{ batch?.total_quantity }}</span>
        </div>
      </div>

      <!-- New Quantity Input -->
      <div class="form-group">
        <label for="new-quantity">
          {{ t('addLicenses.newQuantity') }}
          <span class="required-mark">*</span>
        </label>
        <input
          id="new-quantity"
          v-model.number="newQuantity"
          type="number"
          :min="minQuantity"
          :max="200"
          class="form-control"
          :placeholder="t('addLicenses.enterQuantity')"
        />
        <div class="form-hint">
          {{ t('addLicenses.minimumHint', { min: minQuantity }) }}
        </div>
      </div>

      <!-- Additional Licenses Preview -->
      <div v-if="additionalLicenses > 0" class="preview-section">
        <div class="preview-row">
          <span class="preview-label">{{ t('addLicenses.additionalLicenses') }}</span>
          <span class="preview-value success">+{{ additionalLicenses }}</span>
        </div>
        <div class="preview-row total">
          <span class="preview-label">{{ t('addLicenses.newTotal') }}</span>
          <span class="preview-value">{{ newQuantity }}</span>
        </div>
      </div>

      <!-- Warning -->
      <div v-if="newQuantity > 0" class="warning-message">
        <i class="fas fa-info-circle"></i>
        <span>{{ t('addLicenses.prorationWarning') }}</span>
      </div>

      <!-- Error message -->
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import BaseModal from './BaseModal.vue'
import type { SubscriptionBatch } from '../../types/entities'

const props = defineProps<{
  visible: boolean
  batch: SubscriptionBatch | null
}>()

const emit = defineEmits<{
  close: []
  added: [newQuantity: number]
}>()

const { t } = useTranslations({
  en: {
    addLicenses: {
      title: 'Add More Licenses',
      currentPlan: 'Plan',
      currentQuantity: 'Current Quantity',
      newQuantity: 'New Total Quantity',
      enterQuantity: 'Enter new total quantity',
      minimumHint: 'Minimum: {min} (current quantity + 1)',
      additionalLicenses: 'Additional Licenses',
      newTotal: 'New Total',
      confirm: 'Add Licenses',
      cancel: 'Cancel',
      prorationWarning: 'You will be charged a prorated amount for the additional licenses',
      addSuccess: 'Licenses added successfully',
      addError: 'Failed to add licenses',
      invalidQuantity: 'New quantity must be greater than current quantity'
    }
  },
  fr: {
    addLicenses: {
      title: 'Ajouter des Licences',
      currentPlan: 'Plan',
      currentQuantity: 'Quantité Actuelle',
      newQuantity: 'Nouvelle Quantité Totale',
      enterQuantity: 'Entrer la nouvelle quantité totale',
      minimumHint: 'Minimum : {min} (quantité actuelle + 1)',
      additionalLicenses: 'Licences Supplémentaires',
      newTotal: 'Nouveau Total',
      confirm: 'Ajouter des Licences',
      cancel: 'Annuler',
      prorationWarning: 'Vous serez facturé au prorata pour les licences supplémentaires',
      addSuccess: 'Licences ajoutées avec succès',
      addError: 'Échec de l\'ajout des licences',
      invalidQuantity: 'La nouvelle quantité doit être supérieure à la quantité actuelle'
    }
  }
})

const newQuantity = ref(0)
const isAdding = ref(false)
const error = ref('')

const minQuantity = computed(() => {
  return (props.batch?.total_quantity || 0) + 1
})

const additionalLicenses = computed(() => {
  const current = props.batch?.total_quantity || 0
  return Math.max(0, newQuantity.value - current)
})

const isValid = computed(() => {
  if (!props.batch) return false
  if (newQuantity.value <= 0) return false
  return newQuantity.value > props.batch.total_quantity
})

const handleAdd = () => {
  if (!isValid.value) {
    error.value = t('addLicenses.invalidQuantity')
    return
  }

  isAdding.value = true
  error.value = ''
  emit('added', newQuantity.value)
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const resetForm = () => {
  newQuantity.value = 0
  error.value = ''
  isAdding.value = false
}

// Set initial value when modal opens
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.batch) {
    newQuantity.value = props.batch.total_quantity + 10 // Suggest adding 10 more
  } else if (!newVisible) {
    resetForm()
  }
})
</script>

<style scoped>
.add-licenses-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.batch-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-base);
}

.info-label {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.info-value {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
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

.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-success-bg);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-success-border);
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-base);
}

.preview-row.total {
  padding-top: var(--spacing-sm);
  border-top: 2px solid var(--color-success-border);
  font-weight: var(--font-weight-bold);
}

.preview-label {
  color: var(--color-text-secondary);
}

.preview-value {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
}

.preview-value.success {
  color: var(--color-success);
}

.warning-message {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-warning-border);
}

.warning-message i {
  flex-shrink: 0;
  margin-top: 2px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-danger-border);
}
</style>
