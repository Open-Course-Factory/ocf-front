<template>
  <div class="connection-page">
    <div class="connection-form">
      <div class="back-button">
        <router-link to="/" class="btn-back">
          <i class="fas fa-arrow-left"></i>
          {{ t('login.backToHome') }}
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
          <input
            type="password"
            id="password"
            name="password"
            class="form-control"
            v-model="loginStore.password"
            autocomplete="current-password"
            required
          />
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
        <button type="submit" class="btn btn-primary btn-block">{{ t('login.submitButton') }}</button>
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
import router from "../../router/index.ts";
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
      backToHome: 'Back to home',
      title: 'Login',
      emailLabel: 'Email address',
      passwordLabel: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      submitButton: 'Sign in',
      noAccount: 'No account yet?',
      registerLink: 'Sign up',
      invalidCredentials: 'Invalid email or password, please try again'
    }
  },
  fr: {
    login: {
      backToHome: 'Retour à l\'accueil',
      title: 'Connexion',
      emailLabel: 'Adresse mail',
      passwordLabel: 'Mot de passe',
      rememberMe: 'Se souvenir de moi',
      forgotPassword: 'Mot de passe oublié ?',
      submitButton: 'Se connecter',
      noAccount: 'Pas encore de compte ?',
      registerLink: 'S\'inscrire',
      invalidCredentials: 'Email ou mot de passe invalide, merci de réessayer'
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

async function handleSubmit() {
  errorMessage.value = '';
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

    // Check if email is verified
    if (!currentUserStore.emailVerified) {
      console.log('🔐 User email not verified, redirecting to verification page');
      const currentPath = router.currentRoute.value.path;
      console.log('🔐 Current route:', currentPath);
      console.log('🔐 Is authenticated:', currentUserStore.isAuthenticated);

      // Only navigate if not already on verify-email page
      if (currentPath !== '/verify-email') {
        console.log('🔐 Attempting navigation to /verify-email...');
        try {
          const navigationResult = await router.push({ name: 'VerifyEmail' });
          console.log('🔐 Navigation completed. Result:', navigationResult);
          console.log('🔐 New path:', router.currentRoute.value.path);
        } catch (navError: any) {
          console.error('🔐 Navigation error occurred:', navError);
          console.error('🔐 Error message:', navError.message);
          console.error('🔐 Error type:', navError.type);

          // Try alternative navigation method
          console.log('🔐 Trying window.location.href as fallback...');
          setTimeout(() => {
            window.location.href = '/verify-email';
          }, 100);
        }
      } else {
        console.log('🔐 Already on verify-email page, staying here');
      }
      return;
    }

    await redirect();
  } catch (error) {
    console.error('Error during login:', error);
    errorMessage.value = t('login.invalidCredentials');
  }
}

async function redirect() {
  if (currentUserStore.secretToken) {
    try {
      // Force refresh feature flags from backend after login
      console.log('🏴 Refreshing feature flags after login...')
      await refreshAfterLogin()
      console.log('🏴 Feature flags refreshed successfully after login')

      // Wait for feature flags to be fully initialized before proceeding
      await waitForInitialization()
      console.log('🏴 Feature flags fully initialized, proceeding with redirect')

      // Load user permissions
      console.log('🔐 Loading user permissions after login...')
      await currentUserStore.loadPermissions()
      console.log('🔐 User permissions loaded successfully after login')

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

      console.log('🔐 Redirecting to:', landingPage)
      await router.push(landingPage);
      console.log('🔐 Navigation completed successfully')
    } catch (error) {
      console.error('Error during redirect:', error);
      // Fallback to terminal sessions (always available)
      await router.push('/terminal-sessions');
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

.back-button {
  margin-bottom: 16px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.btn-back:hover {
  color: var(--color-primary);
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
