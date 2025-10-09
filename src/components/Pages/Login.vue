<template>
  <div class="connection-page">
    <div class="connection-form">
      <div class="back-button">
        <router-link to="/" class="btn-back">
          <i class="fas fa-arrow-left"></i>
          Retour à l'accueil
        </router-link>
      </div>
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
            <input class="form-check-input" type="checkbox" id="rememberMe" v-model="loginStore.rememberMe" />
            <label class="form-check-label" for="rememberMe">Se souvenir de moi</label>
          </div>
          <router-link to="/password-reset" class="forgot-password">Mot de passe oublié ?</router-link>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Se connecter</button>
        <div class="register-link">
          <p>Pas encore de compte ? <router-link to="/register">S'inscrire</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import router from "../../router/index.ts";
import { useLoginStore } from '../../stores/login.ts';
import { useCurrentUserStore } from '../../stores/currentUser.ts';
import { useUserSettingsStore } from '../../stores/userSettings.ts';
import { useLocale } from '../../composables/useLocale';
import { useTheme } from '../../composables/useTheme';
import { useFeatureFlags } from '../../composables/useFeatureFlags';

const loginStore = useLoginStore();
const currentUserStore = useCurrentUserStore();
const settingsStore = useUserSettingsStore();
const { setLocale } = useLocale();
const { setTheme } = useTheme();
const { isEnabled, refreshAfterLogin } = useFeatureFlags();
const errorMessage = ref('');

async function handleSubmit() {
  errorMessage.value = '';
  try {
    const responseLogin = await axios.post('/auth/login', {
      email: loginStore.email,
      password: loginStore.password
    });

    currentUserStore.setSecretToken(responseLogin.data.access_token, loginStore.rememberMe);
    currentUserStore.userName = responseLogin.data.user_name;
    currentUserStore.userId = responseLogin.data.user_id;
    currentUserStore.userRoles = responseLogin.data.user_roles;

    await redirect();
  } catch (error) {
    console.error('Error during login:', error);
    errorMessage.value = 'Email ou mot de passe invalide, merci de réessayer';
  }
}

async function redirect() {
  if (currentUserStore.secretToken) {
    try {
      // Force refresh feature flags from backend after login
      console.log('🏴 Refreshing feature flags after login...')
      await refreshAfterLogin()
      console.log('🏴 Feature flags refreshed successfully after login')

      // Load user settings
      const settings = await settingsStore.loadSettings();

      // Apply settings
      if (settings.preferred_language) {
        setLocale(settings.preferred_language);
      }
      if (settings.theme) {
        setTheme(settings.theme as 'light' | 'dark' | 'auto');
      }

      // Determine redirect based on user preference and feature flags
      let landingPage = settings.default_landing_page;

      // If user has a landing page preference, validate it's enabled
      if (landingPage) {
        // Check if the landing page requires a feature that's disabled
        if (landingPage === '/courses' && !isEnabled('course_conception')) {
          landingPage = null; // Reset to find alternative
        }
        if (landingPage?.startsWith('/terminal') && !isEnabled('terminal_management')) {
          landingPage = null; // Reset to find alternative
        }
      }

      // If no valid landing page, find first available enabled route
      if (!landingPage) {
        // Priority order: dashboard > terminals > courses
        if (isEnabled('terminal_management')) {
          landingPage = '/subscription-dashboard';
        } else if (isEnabled('course_conception')) {
          landingPage = '/courses';
        } else {
          // Fallback to subscription dashboard (always available)
          landingPage = '/subscription-dashboard';
        }
      }

      router.push(landingPage);
    } catch (error) {
      console.error('Error loading settings, using fallback route:', error);
      // Fallback to subscription dashboard (always available)
      router.push({ name: "SubscriptionDashboard" });
    }
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

.back-button {
  margin-bottom: 16px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.btn-back:hover {
  color: #007bff;
}

.btn-back i {
  font-size: 0.8rem;
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
