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