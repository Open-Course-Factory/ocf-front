<script setup lang="ts">
import axios from 'axios'
// import { ref } from 'vue'
import router from "../router/index.ts"
import { useLoginStore } from '../store/login.ts';
import { useCurrentUserStore } from '../store/currentUser.ts';

const loginStore = useLoginStore();
const currentUserStore = useCurrentUserStore();

async function handleSubmit () {
  try {
    const response = await axios.post('http://localhost:8080/api/v1/auth/login', {email: loginStore.email, password: loginStore.password}, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Authorization': ''
      }
    })
    currentUserStore.secretToken = response.data.access_token;
    currentUserStore.userId = response.data.user_name;
    redirect();
  } catch (error) {
    console.error('Error during login:', error)
  }
}

function redirect() {
  if (currentUserStore.secretToken) {
    router.push({name: "Details", params: {secretToken: currentUserStore.secretToken, userId: currentUserStore.userId}});
  }
}

// const postData = ref({
//   email: '',
//   password: ''
// })

// const secretToken = ref('')
// const userId = ref('')

// async function checkConnection() {
//   try {
//     const response = await axios.post('http://localhost:8080/api/v1/auth/login', postData.value, {
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         'Content-Type': 'application/json',
//         'Authorization': ''
//       }
//     })
//     secretToken.value = response.data.access_token;
//     userId.value = response.data.user_name;
//     console.log(secretToken.value);
//     console.log(response);
//     redirect();
//   } catch (error) {
//     console.error('Error during login:', error)
//   }
// }

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