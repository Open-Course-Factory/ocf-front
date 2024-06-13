<script setup lang="ts">
import axios from 'axios'
import router from "../../router/index.ts"
import { useLoginStore } from '../../store/login.ts';
import { useCurrentUserStore } from '../../store/currentUser.ts';

const loginStore = useLoginStore();
const currentUserStore = useCurrentUserStore();

async function handleSubmit () {
  try {
    const responseLogin = await axios.post('http://localhost:8080/api/v1/auth/login', {email: loginStore.email, password: loginStore.password}, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': ''
      }
    })
    console.log(responseLogin);
    currentUserStore.secretToken = responseLogin.data.access_token;
    currentUserStore.userName = responseLogin.data.user_name;
    currentUserStore.userId = responseLogin.data.user_id;
    currentUserStore.userRoles = responseLogin.data.user_roles;
    redirect();
  } catch (error) {
    console.error('Error during login:', error)
  }
}

function redirect() {
  if (currentUserStore.secretToken) {
    router.push({name: "Dashboard"});
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