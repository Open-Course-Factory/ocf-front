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
import { reactive, ref, watch } from 'vue';
import { useSshKeysStore } from '../../store/sshKeys';

import { nextTick } from 'vue';
const renderComponent = ref(true);

const forceRender = async () => {
  // Here, we'll remove MyComponent
  renderComponent.value = false;

   // Then, wait for the change to get flushed to the DOM
  await nextTick();

  // Add MyComponent back in
  renderComponent.value = true;
};

const data = reactive(new Map<string,string>)
const errors = reactive(new Map<string,string>)

const props = defineProps<{
  visible: boolean;
  edit: boolean;
  fieldList: { name: string; label: string; type: string }[];
}>();
const emit = defineEmits<{
  (e: 'submit', data: Map<string, string>): void;
  (e: 'close'): void;
}>();



for(let key of props.fieldList) {
  data[key.name] = ''
  errors[key.name] = ''
}

const sshKeysStore = useSshKeysStore();

function validateFields() {
  Object.keys(data).forEach((key) => {
    errors[key] = data[key].trim() === '' ? key + ' est requis.' : null
  });

  Object.keys(data).forEach((key) => {
    if (!errors[key] && sshKeysStore.entities.some(storeKey => storeKey.name === data[key].trim())) {
      errors[key] = 'Ce nom de clé SSH est déjà utilisé.';
    }
  });
  
  let res = true
  Object.keys(errors).forEach((key) => {
    res = res && !errors[key]
  });

  return res
}

function handleSubmit() {
  if (validateFields()) {
    emit('submit', data);
    Object.keys(data).forEach((key) => {
      data[key] = ''
    });
    Object.keys(errors).forEach((key) => {
      console.log("vidé 1")
      errors[key] = ''
    });
  } 
  forceRender()
}

function closeModal() {
  emit('close');
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    Object.keys(data).forEach((key) => {
      data[key] = ''
    });
    Object.keys(errors).forEach((key) => {
      errors[key] = ''
    });

  }
});

</script>

<template>
  <div v-if="renderComponent && visible" class="modal-overlay">
    <div class="modal-body">
      <button class="close-button" @click="closeModal">&times;</button>
      <div class="modal-content">
        <h2 v-if="edit">Modifier nouvelle clé SSH</h2>
        <h2 v-else>Ajouter nouvelle clé SSH</h2>
        <div class="checkout-form">
          <div v-for="(field) in fieldList" class="form-group">
          <label :for=field.name>{{ field.label }}</label>
          <textarea
            v-if="field.type == 'textarea'"
            :id=field.name
            v-model=data[field.name]
            :class="['form-control', { 'is-invalid': errors[field.name] }]"
          />
          <input
            v-else-if="field.type == 'input'"
            :id=field.name
            v-model=data[field.name]
            :class="['form-control', { 'is-invalid': errors[field.name] }]"
          />
          <div v-if="errors[field.name]" class="invalid-feedback">
            {{ errors[field.name] }}
          </div>
        </div>
        
        <div>
          <button class="btn btn-primary" @click="handleSubmit">Ajouter</button>
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