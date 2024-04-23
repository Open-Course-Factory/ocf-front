<script setup>
import { ref, onMounted, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
import { useCurrentUserStore } from '../store/currentUser.ts';
import axios from 'axios'

const route = useRoute();

const currentUserStore = useCurrentUserStore();
console.log(currentUserStore);

const secretToken = route.params.secretToken;
const userId = route.params.userId;
let requestResult = ''
let sshKey = ''
let dataReady = false

onBeforeMount(async function getKey () {
    try {
      const response = await axios.get('http://localhost:8080/api/v1/sshkeys', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': currentUserStore.secretToken,
          "Access-Control-Allow-Origin": "*"
        }
      })
      requestResult = response;
      console.log(requestResult);
      sshKey = requestResult.data[0].private_key
      console.log(sshKey);
      dataReady = true;
    } catch (error) {
      console.error('Error during login:', error)
    }
  }
)

</script>

<template>
    <div>
        <h1>Bienvenue {{ userId }}</h1>
        <h2 v-if="dataReady">Voici votre clé SSH : {{ sshKey }}</h2>
    </div>
</template>