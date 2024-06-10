<script setup lang="ts">
import axios from 'axios';
import { onBeforeMount } from 'vue';
import { useCurrentUserStore } from '../../store/currentUser';
import { useSshKeysStore } from '../../store/sshKeys';

const currentUserStore = useCurrentUserStore()
const sshKeysStore = useSshKeysStore()

onBeforeMount(() => getSshKeys())

async function getSshKeys() {
    try {
        const response = await axios.get('http://localhost:8080/api/v1/sshkeys', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
                'Authorization': currentUserStore.secretToken
            }
        })
        sshKeysStore.setSshKeys(response.data);
        console.log("Réponse API :", response.data);
    } catch (error) {
        console.error('Error while getting SSH keys:', error)
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
        })
        sshKeysStore.sshKeys = sshKeysStore.sshKeys.filter((key: any) => key.id !== keyId)
    } catch (error) {
        console.error('Error while deleting SSH key:', error)
    }
}

// async function updateSshKey(keyId: string, newKey: string) {
//     try {
//         await axios.put(`http://localhost:8080/api/v1/sshkeys/${keyId}`, { key: newKey }, {
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//                 'Content-Type': 'application/json',
//                 'Authorization': currentUserStore.secretToken
//             }
//         })
//         getSshKeys() // Refresh the SSH keys list
//     } catch (error) {
//         console.error('Error while updating SSH key:', error)
//     }
// }

// function editKey(sshKey) {
//     const newKey = prompt("Entrez la nouvelle clé SSH :", sshKey.key);
//     if (newKey && newKey !== sshKey.key) {
//         updateSshKey(sshKey.id, newKey);
//     }
// }
</script>

<template>
    <div>
        <h2>Mes Clés SSH</h2>
        <div v-if="sshKeysStore.sshKeys.length">
            <ul>
                <li v-for="sshKey in sshKeysStore.sshKeys" :key="sshKey.id">
                    <p>{{ sshKey.name }}</p>
                    <button v-if="sshKeysStore.sshKeys.length > 1" @click="deleteSshKey(sshKey.id)">Supprimer</button>
                    <!--<button @click="editKey(sshKey)">Modifier</button>-->
                </li>
            </ul>
        </div>
        <div v-else>
            <p>Aucune clé SSH disponible.</p>
        </div>
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
</style>
