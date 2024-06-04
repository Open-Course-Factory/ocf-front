<script setup lang="ts">
import { ref, onMounted, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
import { useCurrentUserStore } from '../../store/currentUser.ts';
import axios from 'axios'
import { useAxios } from '../../composables/useAxios.ts';
import Disconnect from '../Buttons/Disconnect.vue';
import MainNavMenu from '../Menus/MainNavMenu.vue';
import TopMenu from '../Menus/TopMenu.vue';

</script>

<template>
  <div class="wrapper">
      <MainNavMenu />
      <div class="inner-wrapper">
          <TopMenu />

      </div>
  </div>
</template>