<template>
  <div class="connection-page">
    <div class="connection-form">
      <h2>Connexion</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Adresse mail</label>
          <input
            type="email"
            id="email"
            class="form-control"
            v-model="loginStore.email"
            required
          />
        </div>
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            class="form-control"
            v-model="loginStore.password"
            required
          />
        </div>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>
        <div class="form-options">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="rememberMe" />
            <label class="form-check-label" for="rememberMe">Se souvenir de moi</label>
          </div>
          <a href="#!" class="forgot-password">Mot de passe oublié ?</a>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Se connecter</button>
        <div class="register-link">
          <p>Pas encore membre ? <router-link to="/register">S'enregistrer</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import router from "../../router/index.ts";
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
    const responseLogin = await axios.post(`${protocol}://${apiUrl}/api/v1/auth/login`, {
      email: loginStore.email,
      password: loginStore.password
    });

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

<style scoped>
.connection-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8f9fa;
}

.connection-form {
  background-color: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.connection-form h2 {
  margin-bottom: 24px;
  font-size: 2rem;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  font-weight: bold;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.forgot-password {
  color: #007bff;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.btn-block {
  width: 100%;
}

.register-link {
  text-align: center;
  margin-top: 24px;
}

.register-link a {
  color: #007bff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
