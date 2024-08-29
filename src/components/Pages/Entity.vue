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
import axios from 'axios';
import { ref, onBeforeMount } from 'vue';
import { useCurrentUserStore } from '../../store/currentUser';
import SshKeyModal from '../Modals/EntityModal.vue';

import { useI18n } from 'vue-i18n'
import { Store } from 'pinia';

const { t } = useI18n({
    messages: {
      en: { entity: { 
        title: 'SSH keys',
        add: 'Add a key',
    } },
      fr: { entity: { 
        title: 'Clés SSH',
        add: 'Ajouter une clé',
    } }
    }
  
}) 

const props = defineProps<{
  entityName: string;
  entityStore: Store;
  fieldList: Map<string, any>;
}>();

const currentUserStore = useCurrentUserStore();
const showModal = ref(false);
const editEntity = ref(false);

onBeforeMount(() => getEntities());

async function getEntities() {
  try {
    const response = await axios.get(`http://localhost:8080/api/v1/${props.entityName}`, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken
      }
    });

    if (response.data == null) {
      response.data = []
    }

    props.entityStore.setEntity(response.data);

    console.log("Réponse API :", response.data);
  } catch (error) {
    props.entityStore.setEntity([]);
    console.error('Error while getting SSH keys:', error);
  }
}

async function addEntity(data: Map<string, string>) {
  try {
    const response = await axios.post(`http://localhost:8080/api/v1/${props.entityName}`, data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken
      }
    });
    props.entityStore.entities.push(response.data);
    showModal.value = false;
  } catch (error) {
    console.error('Error while adding SSH key:', error);
  }
}

async function deleteEntity(keyId: string) {
  try {
    await axios.delete(`http://localhost:8080/api/v1/${props.entityName}/${keyId}`, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken
      }
    });
    props.entityStore.entities = props.entityStore.entities.filter((key: any) => key.id !== keyId);
  } catch (error) {
    console.error('Error while deleting SSH key:', error);
  }
}

async function updateEntity(data: Map<string, string>) {
  try {
    await axios.put(`http://localhost:8080/api/v1/${props.entityName}/${data["id"]}`, { data }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken
      }
    });
    getEntities();
  } catch (error) {
    console.error('Error while updating SSH key:', error);
  }
}

// async function editKey(data: Map<string, string>) {
//   const newKey = prompt("Entrez la nouvelle clé SSH :", sshKey.key);
//   if (newKey && newKey !== sshKey.key) {
//     updateEntity(data);
//   }
// }
</script>

<template>
  <div class="content">
    <div class="header">
      <h2>{{ t('sshkey.title') }}</h2>
      <button class="btn btn-primary" @click="showModal = true">{{ t('sshkey.add') }}</button>
    </div>
    <div v-if="props.entityStore.entities.length">
      <ul>
        <li v-for="entity in props.entityStore.entities" :key="entity.id">
          <ul>
            
            <span v-for="(entityProperty, index) in entity"  >
              <li v-if="props.fieldList.get(index).display">
                {{ entityProperty }}
              </li>
            </span>
          </ul>
          
          <div>
            <button class="btn btn-danger" v-if="props.entityStore.entities.length > 1" @click="deleteEntity(entity.id)">{{ t('delete') }}</button>
            <button class="btn btn-danger" v-else disabled>{{ t('delete') }}</button>
            <button class="btn btn-primary" @click="showModal = true, editEntity = true">{{ t('edit') }}</button>
          </div>  
        </li>
      </ul>
    </div>
    <div v-else>
      <p>{{ t('empty') }}</p>
    </div>
    <SshKeyModal :visible="showModal" :edit="editEntity" v-bind:fieldList=fieldList @submit="addEntity" @close="showModal = false" />
  </div>
</template>



<style scoped>
ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  margin-left: 10px;
}

input {
  margin-right: 10px;
}

.header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    height: auto;
}

.content {
    width: 95%;
    margin: 30px 42px;
}
</style>
