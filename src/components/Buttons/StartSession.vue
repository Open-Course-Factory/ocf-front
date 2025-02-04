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

import { useRouter } from 'vue-router'
import axios from 'axios';
import { onBeforeMount } from 'vue'
import { useCurrentUserStore } from '../../store/currentUser';
import { useConnectionsStore } from '../../store/connections';

const connectionsStore = useConnectionsStore()
const currentUser = useCurrentUserStore()
const router = useRouter()
const apiUrl = import.meta.env.VITE_API_URL;

onBeforeMount(() => getConnections())

async function getConnections() {
    try {
        const responseConnections = await axios.get('http://'+apiUrl+'/api/v1/connections', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
                'Authorization': currentUser.secretToken
            }
        })
        console.log(responseConnections);
        connectionsStore.entities = responseConnections.data
    } catch (error) {
        console.error('Error while getting Connections:', error)
    }
}

function startNewSession() {
    try {
        router.push({
            path: "/tps/dial",
            query: {ipaddress: connectionsStore.entities[0].Machine.IP, username: connectionsStore.entities[0].Username.Username, password: "", port: connectionsStore.entities[0].Machine.Port}
        })
    } catch (error) {
        console.error('Error while getting creating new session:', error)
    }
}

</script>

<template>
    <v-btn @click="startNewSession">Lancer une session</v-btn>
</template>