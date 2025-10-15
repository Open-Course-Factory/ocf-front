<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <BaseModal
    :visible="visible"
    :title="address ? t('billingAddresses.modify') : t('billingAddresses.add')"
    title-icon="fas fa-map-marker-alt"
    size="large"
    :is-loading="isLoading"
    :close-on-overlay-click="false"
    @close="closeModal"
  >
    <template #default>
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

        </form>
    </template>

    <template #footer>
      <button type="button" class="btn btn-primary" @click="handleSubmit" :disabled="isLoading">
        <i :class="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
        {{ address ? t('edit', 'Update') : t('add', 'Add') }}
      </button>
      <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="isLoading">
        <i class="fas fa-times"></i>
        {{ t('cancel', 'Cancel') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCountryOptions } from '../../services/data'
import BaseModal from './BaseModal.vue'

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
  color: var(--color-text-secondary);
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--color-border-medium);
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  box-sizing: border-box;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.form-control.is-invalid {
  border-color: var(--color-danger);
}

.invalid-feedback {
  color: var(--color-danger-text);
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
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-white);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-hover);
  border-color: var(--color-secondary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 10px;
  }

  .form-group.col-md-6 {
    flex: 1;
  }
}
</style>