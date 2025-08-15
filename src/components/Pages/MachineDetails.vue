<!-- 
/*
 * Open Machine Factory - Front
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
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useMachinesStore } from '../../stores/machines.ts'

const route = useRoute()
const machineStore = useMachinesStore()

const machine = computed(() => {
    return machineStore.entities.find(m => m.ID === route.params.id)
})
</script>

<template>
    <div class="wrapper">
        <div class="page-content" v-if="machine">
            <div class="page-header">
                <h2>{{ machine.Name }}</h2>
            </div>
            <div>
                <ul>
                    <li>IP : {{ machine.IP }}</li>
                    <li>Port : {{ machine.Port }}</li>
                </ul>
            </div>
        </div>
        <div v-else>
            <p>Machine inconnue.</p>
        </div>
    </div>
</template>

<style>

.page-content {
    width: 100%;
    margin: 30px 80px;
}

.page-header {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

</style>
