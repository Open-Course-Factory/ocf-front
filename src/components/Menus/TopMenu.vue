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

import { useI18n } from 'vue-i18n';
import { useCurrentUserStore } from '../../store/currentUser.ts';
import Disconnect from '../Buttons/Disconnect.vue';


const currentUser = useCurrentUserStore();

const model = useI18n().locale

</script>

<template>
    <div class="top-menu">

        <div class="locale-changer">
            <select v-model="model">
            <option v-for="locale in useI18n().availableLocales" :key="`locale-${locale}`" :value="locale">{{ locale }}</option>
            </select>
        </div>
        <router-link to="/user">
            <div class="profile-picture"></div>
            <p>{{ currentUser.userName }}</p>
        </router-link>
        <disconnect />
            
    </div>
</template>

<style scoped>

.top-menu {
    display: flex;
    justify-content: end;
    align-items: center;
    width: 100%;
    height: 60px;
    border-bottom: 1px solid #D9DEE4;
    background-color: #fff;
}

p {
    margin-top: 14px;
}

.top-menu a {
    width: 130px;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0px 14px;
    cursor: pointer;
    color: #212529;
    text-decoration: none;
}

.top-menu button {
    margin-right: 44px;
}

.profile-picture {
    width: 40px;
    height: 40px;
    background-color: #969696;
    border-radius: 50%;
}

</style>