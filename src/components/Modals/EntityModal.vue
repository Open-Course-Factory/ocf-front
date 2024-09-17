<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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

<script setup lang="ts">
import { reactive, watch } from 'vue';

import { Store } from 'pinia';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({}) 

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

prepareNeededField()

function validateFields() {
  let res = true;

  props.entityStore.fieldList.forEach((value, key) => {
    if ((!props.entity && value.toBeSet) || (props.entity && value.toBeEdited)) {
      // Validate required fields
      if (data[key]?.toString().trim() === '' || data[key] === undefined) {
        errors[key] = `${key} est requis.`;
        res = false;
      } else if (
        props.entityStore.entities.some(
          (storeEntity) => storeEntity.name === data[key]?.toString().trim()
        )
      ) {
        errors[key] = 'Ce nom est déjà utilisé.';
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
      data[key] = data[key].split('\n')
    }
  });
}

function handleEvent(event) {
  if (validateFields()) {
    formatFields()
    // Set data["id"] with current id in case of edition
    if (props.entity) { 
      data["id"] = props.entity["id"] 
    } else {
      delete data['id']; // Ensure 'id' is not present when adding a new entity
    }
    emit(event, { ...data });

    resetForm()  
  } 
  
}

function resetForm() {
  Object.keys(data).forEach((key) => {
    delete data[key]; // Remove keys from data
  });
  Object.keys(errors).forEach((key) => {
    delete errors[key]; // Remove keys from errors
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

<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-body">
      <button class="close-button" @click="closeModal">&times;</button>
      <div class="modal-content">
        <h2 v-if="entity">{{ t(`${props.entityName}.modify`) }}</h2>
        <h2 v-else>{{ t(`${props.entityName}.add`) }}</h2>
        <div class="checkout-form">
          <div v-for="[name, field] of entityStore.fieldList" class="form-group">
            <span v-if="field.type != 'subentity' && ((!entity && field.toBeSet) || (entity && field.toBeEdited))">
              <label :for=name>{{ field.label }}</label>
              <textarea
                v-if="(field.type == 'textarea' || field.type == 'advanced-textarea')"
                :id=name
                v-model=data[name]
                :class="['form-control', { 'is-invalid': errors[name] }]"
              />
              <input
                v-else-if="field.type == 'input'"
                :id=name
                v-model=data[name]
                :class="['form-control', { 'is-invalid': errors[name] }]"
              />
              <div v-if="errors[name]" class="invalid-feedback">
                {{ errors[name] }}
              </div>
            </span>
          </div>
          <div v-if="entityStore.subEntitiesStores.size > 0" v-for="[name, store] of entityStore.subEntitiesStores" class="form-group">
            <span v-if="entityStore.fieldList.get(name).toBeSet">
              <label :for=name>{{ name }}</label>
              <v-autocomplete
                    label="Autocomplete"
                    v-model=data[name] 
                    :items="store.selectDatas"
                    item-text="text"
                    item-value="value"
                    item-title="text"
                    :class="['form-control', { 'is-invalid': errors[name] }]"
              >
              </v-autocomplete>
          </span>


          </div>
          <div>
            <button v-if="entity" class="btn btn-primary" @click="handleEvent('modify')">Modifier</button>
            <button v-else class="btn btn-primary" @click="handleEvent('submit')">Ajouter</button>
            <button class="btn btn-danger" @click="closeModal">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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
}

.modal-body {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  width: 90%;
  max-width: 800px;
  height: auto;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  padding-left: 10px;
  padding-right: 10px;
  z-index: 2;
}

.modal-content {
  display: flex;
  flex-direction: column;
}

.modal-content button {
  width: 120px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
  height: auto;
}

textarea {
  height: 250px;
}

</style>