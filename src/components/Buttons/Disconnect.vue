<script setup lang="ts">
import router from "../../router/index.ts"
import { useCurrentUserStore } from '../../store/currentUser.ts';
import { useLoginStore } from '../../store/login.ts';


const storeUser = useCurrentUserStore()
const storeLogin = useLoginStore()

function disconnect() {
    storeUser.$reset()
    storeLogin.$reset()
    localStorage.removeItem(`pinia_state_${storeUser.$id}`)
    localStorage.removeItem(`pinia_state_${storeLogin.$id}`)
    router.push({name: "Login"})
}

</script>

<template>
    <button type="button" class="btn btn-outline-danger" @click="disconnect">Se déconnecter</button>
</template>