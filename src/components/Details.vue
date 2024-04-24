<script>
import { ref, onMounted, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
import { useCurrentUserStore } from '../store/currentUser.ts';
import axios from 'axios'
import { useAxios } from '../composables/useAxios.ts';
import Disconnect from './Disconnect.vue'


export default {
  components: {
    Disconnect
  },
  setup() {
    const route = useRoute();
    const userId = route.params.userId;
    const currentUserStore = useCurrentUserStore();
    const { data, error, loading } = useAxios(
      'http://localhost:8080/api/v1/sshkeys',
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': currentUserStore.secretToken,
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
    return {
      data,
      error,
      loading,
      userId,
      currentUserStore
    };
  }
};
</script>

<template>
  <h1>Bienvenue {{ currentUserStore.userId }}</h1>
  <Disconnect />
  <div v-if="error">
    <h2>Error: {{ error }}</h2>
  </div>
  <div v-if="loading">
    <h2>Loading data...</h2>
  </div>
  <ul v-for="item in data" :key="item.id">
    <li><b>Votre clé SSH : </b> {{ item.private_key }} </li>
  </ul>
</template>