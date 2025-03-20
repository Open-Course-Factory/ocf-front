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

<template>
  <div class="content">
    <div class="header">
      <h2>{{ t(`${props.entityName}.pageTitle`) }}</h2>
      <button class="btn btn-primary" @click="openModal(null)">
        <i class="fas fa-plus"></i> {{ t('add') }}
      </button>
    </div>
    <div v-if="props.entityStore.entities.length > 0">
      <ul>
        <li v-for="entity in props.entityStore.entities" :key="entity.id" class="entity-item">
          <EntityCard :entity="entity" :entityStore="props.entityStore" />
          <div class="actions">
            <button
              class="btn btn-danger"
              :disabled="props.entityStore.entities.length <= 1"
              @click="deleteEntity(entity.id)"
            >
              <i class="fas fa-trash"></i> {{ t('delete') }}
            </button>
            <button
              class="btn btn-primary"
              v-if="isEditable(props.entityStore)"
              @click="openModal(entity)"
            >
              <i class="fas fa-edit"></i> {{ t('edit') }}
            </button>
          </div>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>{{ t('empty') }}</p>
    </div>
    <EntityModal
      :visible="showModal"
      :entity="entityToEdit"
      :entity-store="props.entityStore"
      :entity-name="props.entityName"
      :fieldList="props.entityStore.fieldList"
      @submit="addEntity"
      @modify="updateEntity"
      @close="showModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onBeforeMount } from 'vue';
import { useCurrentUserStore } from '../../store/currentUser';
import EntityModal from '../Modals/EntityModal.vue';
import EntityCard from '../Cards/EntityCard.vue';
import { useI18n } from 'vue-i18n';
import { Store } from 'pinia';

const { t } = useI18n();

const props = defineProps<{
  entityName: string;
  entityStore: Store;
}>();

const currentUserStore = useCurrentUserStore();
const showModal = ref(false);
const entityToEdit = ref();
const apiUrl = import.meta.env.VITE_API_URL;
const protocol = import.meta.env.VITE_PROTOCOL;

onBeforeMount(() => {
  getEntities(props.entityName, props.entityStore);
  props.entityStore.subEntitiesStores.forEach((key) => {
    getEntities(key.$id, key);
  });
});

async function getEntities(entityName: string, store: Store) {
  try {
    const response = await axios.get(`${protocol}://${apiUrl}/api/v1/${entityName}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken,
      },
    });

    store.entities = response.data || [];
    store.selectDatas = store.getSelectDatas(store.entities);
  } catch (error) {
    store.entities = [];
    store.selectDatas = [];
    console.error('Error while getting ' + entityName, error);
  }
}

async function addEntity(data: Record<string, string>) {
  try {
    const response = await axios.post(`${protocol}://${apiUrl}/api/v1/${props.entityName}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken,
      },
    });
    props.entityStore.entities.push(response.data);
    props.entityStore.selectDatas = props.entityStore.getSelectDatas(props.entityStore.entities);
    showModal.value = false;
  } catch (error) {
    console.error('Error while adding ' + props.entityName, error);
  }
}

async function deleteEntity(keyId: string) {
  try {
    await axios.delete(`${protocol}://${apiUrl}/api/v1/${props.entityName}/${keyId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken,
      },
    });
    props.entityStore.entities = props.entityStore.entities.filter((key: any) => key.id !== keyId);
    props.entityStore.selectDatas = props.entityStore.getSelectDatas(props.entityStore.entities);
  } catch (error) {
    console.error('Error while deleting ' + props.entityName, error);
  }
}

async function updateEntity(data: Record<string, string>) {
  try {
    await axios.patch(`${protocol}://${apiUrl}/api/v1/${props.entityName}/${data['id']}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken,
      },
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

function openModal(entity: any) {
  showModal.value = true;
  entityToEdit.value = entity;
}
</script>

<style scoped>
.content {
  width: 95%;
  margin: 30px 42px;
  animation: fadeIn 0.5s ease-in-out;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

ul {
  list-style-type: none;
  padding: 0;
}

.entity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  transition: transform 0.3s, background-color 0.3s;
}

.entity-item:hover {
  background-color: #f8f9fa;
  transform: scale(1.02);
}

.actions button {
  margin-left: 10px;
}

.actions .btn i {
  margin-right: 5px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Styles */
.modal-content {
  max-height: 80vh; /* Adjust as needed */
  overflow-y: auto;
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
}
</style>

