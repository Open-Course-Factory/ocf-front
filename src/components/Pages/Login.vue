<template>
  <div class="connection-page">
    <div class="connection-form">
      <div class="auth-brand">
        <router-link to="/">
          <i class="fas fa-book"></i>
          <span>OCF</span>
        </router-link>
      </div>
      <h2>{{ t('login.title') }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">{{ t('login.emailLabel') }}</label>
          <input
            type="email"
            id="email"
            name="email"
            class="form-control"
            v-model="loginStore.email"
            autocomplete="email"
            required
          />
        </div>
        <div class="form-group">
          <label for="password">{{ t('login.passwordLabel') }}</label>
          <div class="password-input-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              name="password"
              class="form-control"
              v-model="loginStore.password"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? t('login.hidePassword') : t('login.showPassword')"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>
        <div class="form-options">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="rememberMe" v-model="loginStore.rememberMe" />
            <label class="form-check-label" for="rememberMe">{{ t('login.rememberMe') }}</label>
          </div>
          <router-link to="/forgot-password" class="forgot-password">{{ t('login.forgotPassword') }}</router-link>
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
          <span v-if="isLoading">
            <i class="fas fa-spinner fa-spin"></i> {{ t('login.signingIn') }}
          </span>
          <span v-else>{{ t('login.submitButton') }}</span>
        </button>
        <div class="register-link">
          <p>{{ t('login.noAccount') }} <router-link to="/register">{{ t('login.registerLink') }}</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useLoginStore } from '../../stores/login.ts';
import { useCurrentUserStore } from '../../stores/currentUser.ts';
import { useUserSettingsStore } from '../../stores/userSettings.ts';
import { useLocale } from '../../composables/useLocale';
import { useTheme } from '../../composables/useTheme';
import { useFeatureFlags } from '../../composables/useFeatureFlags';
import { useTranslations } from '../../composables/useTranslations';

const { t } = useTranslations({
  en: {
    login: {
      title: 'Login',
      emailLabel: 'Email address',
      passwordLabel: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      submitButton: 'Sign in',
      signingIn: 'Signing in...',
      noAccount: 'No account yet?',
      registerLink: 'Sign up',
      invalidCredentials: 'Invalid email or password, please try again',
      showPassword: 'Show password',
      hidePassword: 'Hide password'
    }
  },
  fr: {
    login: {
      title: 'Connexion',
      emailLabel: 'Adresse mail',
      passwordLabel: 'Mot de passe',
      rememberMe: 'Se souvenir de moi',
      forgotPassword: 'Mot de passe oublié ?',
      submitButton: 'Se connecter',
      signingIn: 'Connexion en cours...',
      noAccount: 'Pas encore de compte ?',
      registerLink: 'S\'inscrire',
      invalidCredentials: 'Email ou mot de passe invalide, merci de réessayer',
      showPassword: 'Afficher le mot de passe',
      hidePassword: 'Masquer le mot de passe'
    }
  }
});

const loginStore = useLoginStore();
const currentUserStore = useCurrentUserStore();
const settingsStore = useUserSettingsStore();
const { setLocale } = useLocale();
const { setTheme } = useTheme();
const { isEnabled, refreshAfterLogin, waitForInitialization } = useFeatureFlags();
const errorMessage = ref('');
const showPassword = ref(false);
const isLoading = ref(false);

async function handleSubmit() {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    const responseLogin = await axios.post('/auth/login', {
      email: loginStore.email,
      password: loginStore.password
    });

    currentUserStore.setSecretToken(responseLogin.data.access_token, loginStore.rememberMe);
    currentUserStore.userName = responseLogin.data.user_name;
    currentUserStore.userDisplayName = responseLogin.data.display_name || responseLogin.data.user_name;
    currentUserStore.userId = responseLogin.data.user_id;
    currentUserStore.userRoles = responseLogin.data.user_roles;
    currentUserStore.userEmail = responseLogin.data.email || loginStore.email;
    currentUserStore.emailVerified = responseLogin.data.email_verified || false;
    currentUserStore.emailVerifiedAt = responseLogin.data.email_verified_at || null;
  } catch (error) {
    console.error('Error during login:', error);
    errorMessage.value = t('login.invalidCredentials');
    isLoading.value = false;
    return;
  }

  // Redirect separately so redirect errors don't show "invalid credentials"
  // Don't reset isLoading: the component unmounts on successful navigation
  await redirect();
}

async function redirect() {
  if (currentUserStore.secretToken) {
    try {
      await currentUserStore.loadUserData()
      await refreshAfterLogin()
      await waitForInitialization()
      await currentUserStore.loadPermissions()

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
        // Priority order: terminal sessions > subscription dashboard
        landingPage = '/terminal-sessions';
      }

      // Full page reload to cleanly transition from public to authenticated app shell
      window.location.href = landingPage;
    } catch (error) {
      console.error('Error during redirect:', error);
      window.location.href = '/terminal-sessions';
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
  background-color: var(--color-bg-secondary);
}

.connection-form {
  background-color: var(--color-bg-primary);
  padding: 40px;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 400px;
}

.auth-brand {
  text-align: center;
  margin-bottom: 24px;
}

.auth-brand a {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--color-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  transition: opacity var(--transition-fast);
}

.auth-brand a:hover {
  opacity: 0.8;
}

.auth-brand i {
  font-size: 1.3rem;
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

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 40px;
}

.password-toggle {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
}

.password-toggle:hover {
  color: var(--color-text-primary);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.forgot-password {
  color: var(--color-primary);
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
  color: var(--color-primary);
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
