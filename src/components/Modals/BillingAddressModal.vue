<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="modal-body" @click.stop>
      <button class="close-button" @click="closeModal">
        <i class="fas fa-times"></i>
      </button>
      <div class="modal-content">
        <h2>
          <i class="fas fa-map-marker-alt"></i>
          {{ address ? t('billingAddresses.modify') : t('billingAddresses.add') }}
        </h2>
        <form @submit.prevent="handleSubmit" class="address-form">
          <div class="form-row">
            <div class="form-group">
              <label for="line1">{{ t('billingAddresses.line1') }} *</label>
              <input
                id="line1"
                v-model="formData.line1"
                type="text"
                :class="['form-control', { 'is-invalid': errors.line1 }]"
                required
              />
              <div v-if="errors.line1" class="invalid-feedback">
                {{ errors.line1 }}
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="line2">{{ t('billingAddresses.line2') }}</label>
              <input
                id="line2"
                v-model="formData.line2"
                type="text"
                :class="['form-control', { 'is-invalid': errors.line2 }]"
              />
              <div v-if="errors.line2" class="invalid-feedback">
                {{ errors.line2 }}
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="city">{{ t('billingAddresses.city') }} *</label>
              <input
                id="city"
                v-model="formData.city"
                type="text"
                :class="['form-control', { 'is-invalid': errors.city }]"
                required
              />
              <div v-if="errors.city" class="invalid-feedback">
                {{ errors.city }}
              </div>
            </div>
            <div class="form-group col-md-6">
              <label for="postal_code">{{ t('billingAddresses.postal_code') }} *</label>
              <input
                id="postal_code"
                v-model="formData.postal_code"
                type="text"
                :class="['form-control', { 'is-invalid': errors.postal_code }]"
                required
              />
              <div v-if="errors.postal_code" class="invalid-feedback">
                {{ errors.postal_code }}
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="state">{{ t('billingAddresses.state') }}</label>
              <input
                id="state"
                v-model="formData.state"
                type="text"
                :class="['form-control', { 'is-invalid': errors.state }]"
              />
              <div v-if="errors.state" class="invalid-feedback">
                {{ errors.state }}
              </div>
            </div>
            <div class="form-group col-md-6">
              <label for="country">{{ t('billingAddresses.country') }} *</label>
              <select
                id="country"
                v-model="formData.country"
                :class="['form-control', { 'is-invalid': errors.country }]"
                required
              >
                <option value="">{{ t('selectCountry', 'Select a country') }}</option>
                <option
                  v-for="country in countryOptions"
                  :key="country.value"
                  :value="country.value"
                >
                  {{ country.text }}
                </option>
              </select>
              <div v-if="errors.country" class="invalid-feedback">
                {{ errors.country }}
              </div>
            </div>
          </div>

          <div v-if="!address" class="form-row">
            <div class="form-group">
              <label class="form-check-label">
                <input
                  type="checkbox"
                  v-model="formData.set_default"
                  class="form-check-input"
                />
                {{ t('billingAddresses.set_default') }}
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              <i :class="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
              {{ address ? t('edit', 'Update') : t('add', 'Add') }}
            </button>
            <button type="button" class="btn btn-secondary" @click="closeModal">
              <i class="fas fa-times"></i>
              {{ t('cancel', 'Cancel') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCountryOptions } from '../../services/countries'

const { t } = useI18n()

interface Props {
  visible: boolean
  address?: any | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  address: null,
  isLoading: false
})

const emit = defineEmits<{
  close: []
  submit: [data: any]
  modify: [data: any]
}>()

// Form data
const formData = reactive({
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'FR', // Default to France
  set_default: false
})

// Errors
const errors = reactive({
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: ''
})

// Country options
const countryOptions = computed(() => getCountryOptions('fr'))

// Watch for address changes to populate form
watch(() => props.address, (newAddress) => {
  if (newAddress) {
    // Populate form with existing address data
    Object.assign(formData, {
      line1: newAddress.line1 || '',
      line2: newAddress.line2 || '',
      city: newAddress.city || '',
      state: newAddress.state || '',
      postal_code: newAddress.postal_code || '',
      country: newAddress.country || 'FR',
      set_default: false // Don't show this for existing addresses
    })
  } else {
    // Reset form for new address
    Object.assign(formData, {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'FR',
      set_default: false
    })
  }

  // Clear errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}, { immediate: true })

// Watch for modal visibility to reset form
watch(() => props.visible, (isVisible) => {
  if (!isVisible) {
    // Clear errors when modal closes
    Object.keys(errors).forEach(key => {
      errors[key] = ''
    })
  }
})

function closeModal() {
  emit('close')
}

function handleSubmit() {
  // Clear previous errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  // Basic validation
  let hasErrors = false

  if (!formData.line1.trim()) {
    errors.line1 = t('validation.required', 'This field is required')
    hasErrors = true
  }

  if (!formData.city.trim()) {
    errors.city = t('validation.required', 'This field is required')
    hasErrors = true
  }

  if (!formData.postal_code.trim()) {
    errors.postal_code = t('validation.required', 'This field is required')
    hasErrors = true
  }

  if (!formData.country) {
    errors.country = t('validation.required', 'This field is required')
    hasErrors = true
  }

  if (hasErrors) {
    return
  }

  // Create clean data object (without set_default for updates)
  const submitData: any = {
    line1: formData.line1.trim(),
    line2: formData.line2.trim(),
    city: formData.city.trim(),
    state: formData.state.trim(),
    postal_code: formData.postal_code.trim(),
    country: formData.country
  }

  // Add set_default only for new addresses
  if (!props.address) {
    submitData.set_default = formData.set_default
  }

  // Emit appropriate event
  if (props.address) {
    emit('modify', { ...submitData, id: props.address.id })
  } else {
    emit('submit', submitData)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-body {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  color: #333;
  background-color: #f5f5f5;
}

.modal-content {
  padding: 25px;
}

.modal-content h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 25px 0;
  color: #333;
  font-size: 1.5rem;
}

.address-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group.col-md-6 {
  flex: 0 0 calc(50% - 7.5px);
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

.form-check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.form-check-input {
  width: auto;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 2px solid transparent;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  border-color: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
  border-color: #545b62;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-body {
    width: 95%;
    margin: 10px;
  }

  .modal-content {
    padding: 20px;
  }

  .form-row {
    flex-direction: column;
    gap: 10px;
  }

  .form-group.col-md-6 {
    flex: 1;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-content h2 {
    font-size: 1.25rem;
  }
}
</style>