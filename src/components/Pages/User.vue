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

import TopMenu from '../Menus/TopMenu.vue';
import MainNavMenu from '../Menus/MainNavMenu.vue';
import SshKeys from './SshKeys.vue';
// import axios from 'axios';
// import { onBeforeMount } from 'vue';
// import { useCurrentUserStore } from '../../store/currentUser';
// import { useUserDetailsStore } from '../../store/userDetails';

// const currentUser = useCurrentUserStore()
// const userDetails = useUserDetailsStore()

// onBeforeMount(() => getUserDetails())

// async function getUserDetails() {
//     try {
//         const responseUserDetails = await axios.get('', {
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//                 'Content-Type': 'application/json',
//                 'Authorization': currentUser.secretToken
//             }
//         })
//         console.log(responseUserDetails);
//         console.log(userDetails);
//         // Put user infos in userDetails store
//     } catch (error) {
//         console.error('Error while getting user infos:', error)
//     }
// }

</script>

<template>
    <div class="wrapper">
        <MainNavMenu />
        <div class="inner-wrapper">
            <TopMenu />
            <SshKeys />
        </div>
    </div>
</template>