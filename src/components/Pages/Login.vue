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
import { ref } from 'vue';
import axios from 'axios'
import router from "../../router/index.ts"
import { useLoginStore } from '../../store/login.ts';
import { useCurrentUserStore } from '../../store/currentUser.ts';

const loginStore = useLoginStore();
const currentUserStore = useCurrentUserStore();
const errorMessage = ref('');
const apiUrl = import.meta.env.VITE_API_URL;
const protocol = import.meta.env.VITE_PROTOCOL;

async function handleSubmit() {
  errorMessage.value = '';
  try {
    const responseLogin = await axios.post(protocol+'://'+apiUrl+'/api/v1/auth/login', {
      email: loginStore.email,
      password: loginStore.password
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': ''
      }
    });
    console.log(responseLogin);
    currentUserStore.secretToken = responseLogin.data.access_token;
    currentUserStore.userName = responseLogin.data.user_name;
    currentUserStore.userId = responseLogin.data.user_id;
    currentUserStore.userRoles = responseLogin.data.user_roles;
    redirect();
  } catch (error) {
    console.error('Error during login:', error);
    errorMessage.value = 'Email ou mot de passe invalide, merci de réessayer';
  }
}

function redirect() {
  if (currentUserStore.secretToken) {
    router.push({ name: "Dashboard" });
  }
}

</script>

<template>
  <h2 class="mb-4">Connexion</h2>
  <form @submit.prevent="handleSubmit">
    <div class="form-outline mb-4">
      <input type="email" id="form2Example1" class="form-control" v-model="loginStore.email" />
      <label class="form-label" for="form2Example1">Adresse mail</label>
    </div>

    <div class="form-outline mb-4">
      <input type="password" id="form2Example2" class="form-control" v-model="loginStore.password" />
      <label class="form-label" for="form2Example2">Mot de passe</label>
    </div>

    <div v-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>

    <div class="row mb-4">
      <div class="col d-flex justify-content-center">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="" id="form2Example31" checked />
          <label class="form-check-label" for="form2Example31"> Se souvenir de moi </label>
        </div>
      </div>

      <div class="col">
        <a href="#!">Mot de passe oublié ?</a>
      </div>
    </div>

    <button type="submit" class="btn btn-primary btn-block mb-4">Se connecter</button>

    <div class="text-center">
      <p>Pas encore membre ? <a href="#!">S'enregistrer</a></p>
    </div>
  </form>
</template>
