<script setup lang="ts">

import axios from 'axios';
import { onBeforeMount } from 'vue';
import { useCurrentUserStore } from '../../store/currentUser';

const currentUser = useCurrentUserStore()

onBeforeMount(() => getSshKeys())

async function getSshKeys() {
    try {
        const responseKeys = await axios.get('http://localhost:8080/api/v1/sshkeys', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
                'Authorization': currentUser.secretToken
            }
        })
        console.log(responseKeys);
    } catch (error) {
        console.error('Error while getting SSH keys:', error)
    }
}
</script>

<template>

</template>