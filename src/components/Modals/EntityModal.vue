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
  <div v-if="visible" class="modal-overlay">
    <div class="modal-body">
      <button class="close-button" @click="closeModal">
        <i class="fas fa-times"></i>
      </button>
      <div class="modal-content">
        <h2 v-if="entity">
          <i class="fas fa-edit"></i> {{ t('entityModal.modify') }}
        </h2>
        <h2 v-else>
          <i class="fas fa-plus"></i> {{ t('entityModal.add') }}
        </h2>
        <div class="checkout-form">
          <div v-for="[name, field] of entityStore.fieldList" class="form-group">
            <span v-if="field.type != 'subentity' && ((!entity && field.toBeSet) || (entity && field.toBeEdited))">
              <label :for="name">{{ field.label }}</label>
              <textarea
                v-if="field.type == 'textarea' || field.type == 'advanced-textarea'"
                :id="name"
                v-model="data[name]"
                :class="['form-control', { 'is-invalid': errors[name] }]"
              />
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
          <div class="modal-actions">
            <button v-if="entity" class="btn btn-primary" @click="handleEvent('modify')">
              <i class="fas fa-save"></i> {{ t('entityModal.buttonModify') }}
            </button>
            <button v-else class="btn btn-primary" @click="handleEvent('submit')">
              <i class="fas fa-save"></i> {{ t('entityModal.buttonAdd') }}
            </button>
            <button class="btn btn-danger" @click="closeModal">
              <i class="fas fa-ban"></i> {{ t('entityModal.buttonCancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { Store } from 'pinia';
import { useTranslations } from '../../composables/useTranslations';

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
      nameAlreadyUsed: 'This name is already used.'
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
      nameAlreadyUsed: 'Ce nom est déjà utilisé.'
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
      if (isFieldRequired(value) && (data[key]?.toString().trim() === '' || data[key] === undefined)) {
        errors[key] = t('entityModal.fieldRequired', { field: key });
        res = false;
      } else if (
        props.entityStore.entities.some(
          (storeEntity) => storeEntity.name === data[key]?.toString().trim() &&
          (!props.entity || storeEntity.id !== props.entity.id)
        )
      ) {
        errors[key] = t('entityModal.nameAlreadyUsed');
        res = false;
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
      } else {
        data[key] = props.entity[key] || '';
      }
    }
  });
}

function prepareNeededField() {
  props.entityStore.fieldList.forEach((value, key) => {
    if ((!props.entity && value.toBeSet) || (props.entity && value.toBeEdited)) {
      data[key] = '';
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn var(--transition-slow) ease-in-out;
  z-index: var(--z-index-modal);
}

.modal-body {
  background-color: var(--color-bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  position: relative;
  width: 90%;
  max-width: 800px;
  height: auto;
  animation: slideIn var(--transition-slow) ease-in-out;
  overflow-y: auto;
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
}

.close-button {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  transition: color var(--transition-slow);
  color: var(--color-text-primary);
}

.close-button:hover {
  color: var(--color-danger);
}

.modal-content {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow-y: auto;
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

.modal-actions button {
  width: auto;
  padding: var(--btn-padding-md);
}

h2 {
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

textarea {
  height: 250px;
}

/* Hide scrollbars for WebKit browsers */
.modal-body::-webkit-scrollbar,
.modal-content::-webkit-scrollbar {
  display: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
  }
  to {
    transform: translateY(0);
  }
}
</style>
