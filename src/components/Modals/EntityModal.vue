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
</style>
