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
import { useSshKeysStore } from '../../store/sshKeys';
import SshKeyModal from '../Modals/SshKeyModal.vue';


const currentUserStore = useCurrentUserStore();
const sshKeysStore = useSshKeysStore();
const showModal = ref(false);

onBeforeMount(() => getSshKeys());

async function getSshKeys() {
  try {
    const response = await axios.get('http://localhost:8080/api/v1/sshkeys', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken
      }
    });

    if (response.data == null) {
      response.data = []
    }

    sshKeysStore.setSshKeys(response.data);

    console.log("Réponse API :", response.data);
  } catch (error) {
    console.error('Error while getting SSH keys:', error);
  }
}

async function addSshKey(keyName: string, sshKey: string) {
  try {
    const response = await axios.post('http://localhost:8080/api/v1/sshkeys', { keyName: keyName, privateKey: sshKey }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken
      }
    });
    sshKeysStore.sshKeys.push(response.data);
    showModal.value = false;
  } catch (error) {
    console.error('Error while adding SSH key:', error);
  }
}

async function deleteSshKey(keyId: string) {
  try {
    await axios.delete(`http://localhost:8080/api/v1/sshkeys/${keyId}`, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken
      }
    });
    sshKeysStore.sshKeys = sshKeysStore.sshKeys.filter((key: any) => key.id !== keyId);
  } catch (error) {
    console.error('Error while deleting SSH key:', error);
  }
}

// async function updateSshKey(keyId: string, newKey: string) {
//   try {
//     await axios.put(`http://localhost:8080/api/v1/sshkeys/${keyId}`, { key: newKey }, {
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         'Content-Type': 'application/json',
//         'Authorization': currentUserStore.secretToken
//       }
//     });
//     getSshKeys(); // Refresh the SSH keys list
//   } catch (error) {
//     console.error('Error while updating SSH key:', error);
//   }
// }

// function editKey(sshKey) {
//   const newKey = prompt("Entrez la nouvelle clé SSH :", sshKey.key);
//   if (newKey && newKey !== sshKey.key) {
//     updateSshKey(sshKey.id, newKey);
//   }
// }
</script>

<template>
  <div class="content">
    <div class="header">
      <h2>Mes Clés SSH</h2>
      <button class="btn btn-primary" @click="showModal = true">Ajouter une nouvelle clé SSH</button>
    </div>
    <div v-if="sshKeysStore.sshKeys.length">
      <ul>
        <li v-for="sshKey in sshKeysStore.sshKeys" :key="sshKey.id">
          <p>{{ sshKey.name }}</p>
          <button class="btn btn-danger" v-if="sshKeysStore.sshKeys.length > 1" @click="deleteSshKey(sshKey.id)">Supprimer</button>
          <!--<button @click="editKey(sshKey)">Modifier</button>-->
          <button class="btn btn-danger" v-else disabled>Supprimer</button>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>Aucune clé SSH disponible.</p>
    </div>
    <SshKeyModal :visible="showModal" @add-key="addSshKey" @close="showModal = false" />
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
