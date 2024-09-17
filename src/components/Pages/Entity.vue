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
import EntityModal from '../Modals/EntityModal.vue';
import EntityCard from '../Cards/EntityCard.vue';

import { useI18n } from 'vue-i18n'
import { Store } from 'pinia';

const { t } = useI18n({}) 

const props = defineProps<{
  entityName: string;
  entityStore: Store;
}>();

const currentUserStore = useCurrentUserStore();
const showModal = ref(false);
const entityToEdit = ref();

onBeforeMount(() => {
  getEntities(props.entityName, props.entityStore)
  props.entityStore.subEntitiesStores.forEach((key) => {
    getEntities(key.$id, key)
  })
});

async function getEntities(entityName: string, store: Store) {
  try {
    const response = await axios.get(`http://localhost:8080/api/v1/${entityName}`, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken
      }
    });

    if (response.data == null) {
      response.data = []
    }

    store.entities = response.data
    store.selectDatas = store.getSelectDatas(store.entities)

  } catch (error) {
    store.entities = []
    store.selectDatas = []
    console.error('Error while getting '+props.entityName, error);
  }
}

async function addEntity(data: Record<string, string>) {
  try {
    const response = await axios.post(`http://localhost:8080/api/v1/${props.entityName}`, data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken
      }
    });
    props.entityStore.entities.push(response.data)
    props.entityStore.selectDatas = props.entityStore.getSelectDatas(props.entityStore.entities)
    showModal.value = false
  } catch (error) {
    console.error('Error while adding ' + props.entityName, error);
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
    props.entityStore.entities = props.entityStore.entities.filter((key: any) => key.id !== keyId)
    props.entityStore.selectDatas = props.entityStore.getSelectDatas(props.entityStore.entities)
  } catch (error) {
    console.error('Error while deleting ' + props.entityName, error);
  }
}

async function updateEntity(data: Record<string, string>) {
  try {
    await axios.patch(`http://localhost:8080/api/v1/${props.entityName}/${data["id"]}`, data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken
      }
    });
    getEntities(props.entityName, props.entityStore);
    showModal.value = false;
  } catch (error) {
    console.error('Error while updating ' + props.entityName, error);
  }
}

function isEditable(entityStore: Store) {
        let res = false
        entityStore.fieldList.forEach(element => {
            if (element.toBeEdited == true) {
                res = true
                return res
            }
        });
        return res
    }

</script>

<template>
  <div class="content">
    <div class="header">
      <h2>{{ t(`${props.entityName}.pageTitle`) }}</h2>
      <button class="btn btn-primary" @click="showModal = true, entityToEdit = null">{{ t('add') }}</button>
    </div>
    <div v-if="props.entityStore.entities.length > 0">
      <ul>
        <li v-for="entity in props.entityStore.entities" :key="entity.id">
          <EntityCard :entity="entity" :entityStore="props.entityStore"/>
          
          <div>
            <button class="btn btn-danger" v-if="props.entityStore.entities.length > 1" @click="deleteEntity(entity.id)">{{ t('delete') }}</button>
            <button class="btn btn-danger" v-else disabled>{{ t('delete') }}</button>
            <button class="btn btn-primary" v-if="isEditable(props.entityStore)" @click="showModal = true, entityToEdit = entity">{{ t('edit') }}</button>
          </div>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>{{ t('empty') }}</p>
    </div>
    <EntityModal :visible="showModal" :entity="entityToEdit" :entity-store="entityStore" :entity-name="entityName" v-bind:fieldList=entityStore.fieldList @submit="addEntity" @modify="updateEntity" @close="showModal = false" />
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
