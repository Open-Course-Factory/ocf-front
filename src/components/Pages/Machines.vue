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
import MainNavMenu from '../Menus/MainNavMenu.vue';
import TopMenu from '../Menus/TopMenu.vue';
import axios from 'axios';
import { onBeforeMount } from 'vue';
import { useCurrentUserStore } from '../../store/currentUser';
import { useMachinesStore } from '../../store/machines';

const currentUser = useCurrentUserStore()
const machinesStore = useMachinesStore()

onBeforeMount(() => getMachines())

async function getMachines() {
    try {
        const responseMachines = await axios.get('http://localhost:8080/api/v1/machines', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
                'Authorization': currentUser.secretToken
            }
        })
        console.log(responseMachines);
        machinesStore.setMachines(responseMachines.data)
    } catch (error) {
        console.error('Error while getting machines:', error)
    }
}

</script>

<template>
    <div class="wrapper">
        <MainNavMenu />
        <div class="inner-wrapper">
            <TopMenu />
            <section class="cards-list">
                <h2>Machines</h2>
                <div class="cards-body">
                    <router-link
                        v-if="machinesStore.machines.length > 0"
                        v-for="machine in machinesStore.machines"
                        :key="machine.ID" 
                        :to="`/machines/${machine.ID}`"
                        class="card"
                    >
                        <p class="card-content">{{ machine.Name }}</p>
                    </router-link>
                    <div v-else>
                        <p>Aucun cours à afficher</p>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<style>

.card {
    width: 150px;
    height: 100px;
    background-color: #494949;
    margin-right: 10px;

}

.cards-body {
    display: flex;
}

.cards-list {
    background-color: #e4e4e4;
    margin-top: 30px;
    margin-left: 30px;
    padding: 16px;
    border-radius: var(--bs-border-radius);
    width: 1000px;
}

.card-content {
    color: #e4e4e4;
    font-size: 1.2rem;
    display: flex;
    justify-content: center;
}

</style>