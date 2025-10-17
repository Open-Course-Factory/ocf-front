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

<template>
  <BaseModal
    :visible="visible"
    :title="entity ? t('entityModal.modify') : t('entityModal.add')"
    :title-icon="entity ? 'fas fa-edit' : 'fas fa-plus'"
    size="large"
    :show-default-footer="true"
    :confirm-text="entity ? t('entityModal.buttonModify') : t('entityModal.buttonAdd')"
    confirm-icon="fas fa-save"
    :cancel-text="t('entityModal.buttonCancel')"
    cancel-icon="fas fa-ban"
    @close="closeModal"
    @confirm="handleEvent(entity ? 'modify' : 'submit')"
  >
    <div class="checkout-form">
      <div v-for="[name, field] of entityStore.fieldList" class="form-group">
        <span v-if="field.type != 'subentity' && ((!entity && field.toBeSet) || (entity && field.toBeEdited))">
          <!-- Label (not shown for checkbox - handled inside wrapper) -->
          <label v-if="field.type !== 'checkbox'" :for="name">{{ field.label }}</label>

          <!-- Textarea -->
          <textarea
            v-if="field.type == 'textarea' || field.type == 'advanced-textarea'"
            :id="name"
            v-model="data[name]"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          />

          <!-- Select -->
          <select
            v-else-if="field.type == 'select'"
            :id="name"
            v-model="data[name]"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          >
            <option value="">{{ t('entityModal.selectOption') }}</option>
            <option
              v-for="option in field.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.text }}
            </option>
          </select>

          <!-- Number -->
          <input
            v-else-if="field.type == 'number'"
            type="number"
            :id="name"
            v-model.number="data[name]"
            :min="field.min"
            :max="field.max"
            :step="field.step || 1"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          />

          <!-- Date -->
          <input
            v-else-if="field.type == 'date'"
            type="date"
            :id="name"
            v-model="data[name]"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          />

          <!-- Checkbox -->
          <div v-else-if="field.type == 'checkbox'" class="checkbox-wrapper">
            <input
              type="checkbox"
              :id="name"
              v-model="data[name]"
              :class="['form-checkbox', { 'is-invalid': errors[name] }]"
            />
            <label :for="name" class="checkbox-label">{{ field.label }}</label>
          </div>

          <!-- Text Input (default) -->
          <input
            v-else-if="field.type == 'input'"
            :id="name"
            v-model="data[name]"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          />

          <div v-if="errors[name]" class="invalid-feedback">
            {{ errors[name] }}
          </div>
        </span>
      </div>
      <div v-if="entityStore.subEntitiesStores.size > 0" v-for="[name, store] of entityStore.subEntitiesStores" class="form-group">
        <span v-if="entityStore.fieldList.get(name).toBeSet">
          <label :for="name">{{ name }}</label>
          <v-autocomplete
            label="Autocomplete"
            v-model="data[name]"
            :items="store.selectDatas"
            item-text="text"
            item-value="value"
            item-title="text"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          />
        </span>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { Store } from 'pinia';
import { useTranslations } from '../../composables/useTranslations';
import BaseModal from './BaseModal.vue';

const { t } = useTranslations({
  en: {
    entityModal: {
      modify: 'Modify',
      add: 'Add',
      selectOption: 'Select an option',
      buttonModify: 'Modify',
      buttonAdd: 'Add',
      buttonCancel: 'Cancel',
      fieldRequired: '{field} is required.',
      nameAlreadyUsed: 'This name is already used.',
      invalidNumber: 'Please enter a valid number.',
      numberTooSmall: 'Value must be at least {min}.',
      numberTooLarge: 'Value must be at most {max}.'
    }
  },
  fr: {
    entityModal: {
      modify: 'Modifier',
      add: 'Ajouter',
      selectOption: 'Sélectionner une option',
      buttonModify: 'Modifier',
      buttonAdd: 'Ajouter',
      buttonCancel: 'Annuler',
      fieldRequired: '{field} est requis.',
      nameAlreadyUsed: 'Ce nom est déjà utilisé.',
      invalidNumber: 'Veuillez entrer un nombre valide.',
      numberTooSmall: 'La valeur doit être au moins {min}.',
      numberTooLarge: 'La valeur doit être au plus {max}.'
    }
  }
});

const data = reactive({});
const errors = reactive({});

const props = defineProps<{
  visible: boolean;
  entity?: any;
  entityStore: Store;
  entityName: string;
}>();
const emit = defineEmits<{
  (e: 'submit', data: Record<string, string>): void;
  (e: 'modify', data: Record<string, string>): void;
  (e: 'close'): void;
}>();

prepareNeededField();

function isFieldRequired(field: any): boolean {
  return field.required === true;
}

function validateFields() {
  let res = true;

  props.entityStore.fieldList.forEach((value, key) => {
    if ((!props.entity && value.toBeSet) || (props.entity && value.toBeEdited)) {
      // Check if field is required and empty
      const isEmpty = value.type === 'checkbox'
        ? false // Checkboxes are never empty (they're boolean)
        : value.type === 'number'
        ? (data[key] === undefined || data[key] === null || data[key] === '')
        : (data[key]?.toString().trim() === '' || data[key] === undefined);

      if (isFieldRequired(value) && isEmpty) {
        errors[key] = t('entityModal.fieldRequired', { field: key });
        res = false;
      } else if (
        key === 'name' && // Only check uniqueness for 'name' field
        props.entityStore.entities.some(
          (storeEntity) => storeEntity.name === data[key]?.toString().trim() &&
          (!props.entity || storeEntity.id !== props.entity.id)
        )
      ) {
        errors[key] = t('entityModal.nameAlreadyUsed');
        res = false;
      } else if (value.type === 'number' && data[key] !== undefined && data[key] !== null && data[key] !== '') {
        // Validate number constraints
        const num = Number(data[key]);
        if (isNaN(num)) {
          errors[key] = t('entityModal.invalidNumber');
          res = false;
        } else if (value.min !== undefined && num < value.min) {
          errors[key] = t('entityModal.numberTooSmall', { min: value.min });
          res = false;
        } else if (value.max !== undefined && num > value.max) {
          errors[key] = t('entityModal.numberTooLarge', { max: value.max });
          res = false;
        } else {
          errors[key] = null;
        }
      } else {
        errors[key] = null;
      }
    }
  });

  return res;
}

function formatFields() {
  Object.keys(data).forEach((key) => {
    if (props.entityStore.fieldList.get(key).type == 'advanced-textarea') {
      data[key] = data[key].split('\n');
    }
  });
}

function handleEvent(event) {
  if (validateFields()) {
    formatFields();
    if (props.entity) {
      data['id'] = props.entity['id'];
    } else {
      delete data['id'];
    }
    emit(event, { ...data });
    resetForm();
  }
}

function resetForm() {
  Object.keys(data).forEach((key) => {
    delete data[key];
  });
  Object.keys(errors).forEach((key) => {
    delete errors[key];
  });
}

function closeModal() {
  emit('close');
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    prepareNeededField();
    if (props.entity) {
      populateDataFromEntity();
    } else {
      resetForm();
    }
  }
});

function populateDataFromEntity() {
  props.entityStore.fieldList.forEach((value, key) => {
    if (value.toBeEdited) {
      if (value.type === 'advanced-textarea') {
        data[key] = props.entity[key]?.join('\n') || '';
      } else if (value.type === 'checkbox') {
        data[key] = props.entity[key] === true || props.entity[key] === 'true';
      } else if (value.type === 'number') {
        data[key] = props.entity[key] !== undefined ? Number(props.entity[key]) : '';
      } else {
        data[key] = props.entity[key] || '';
      }
    }
  });
}

function prepareNeededField() {
  props.entityStore.fieldList.forEach((value, key) => {
    if ((!props.entity && value.toBeSet) || (props.entity && value.toBeEdited)) {
      // Initialize with appropriate default value based on type
      if (value.type === 'checkbox') {
        data[key] = false;
      } else if (value.type === 'number') {
        data[key] = value.min !== undefined ? value.min : '';
      } else {
        data[key] = '';
      }
      errors[key] = null;
    }
  });

  if (props.entityStore.subEntitiesStores.size > 0) {
    props.entityStore.subEntitiesStores.forEach((_store, subKey) => {
      data[subKey] = '';
      errors[subKey] = null;
    });
  }
}
</script>

<style scoped>
.checkout-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

textarea {
  height: 250px;
}

/* Checkbox styles */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
  user-select: none;
}

/* Number input styles */
input[type="number"] {
  max-width: 200px;
}

/* Date input styles */
input[type="date"] {
  max-width: 250px;
}
</style>
