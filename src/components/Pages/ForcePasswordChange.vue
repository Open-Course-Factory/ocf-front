<template>
  <div class="force-password-change-page">
    <div class="force-password-change-card">
      <div class="card-header">
        <h1>{{ t('forcePassword.title') }}</h1>
        <p class="subtitle">{{ t('forcePassword.subtitle') }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="password-form">
        <div class="form-group">
          <label for="newPassword">{{ t('forcePassword.newPassword') }}</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            :placeholder="t('forcePassword.newPasswordPlaceholder')"
            required
            minlength="8"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">{{ t('forcePassword.confirmPassword') }}</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            :placeholder="t('forcePassword.confirmPasswordPlaceholder')"
            required
            minlength="8"
            autocomplete="new-password"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn-submit" :disabled="isSubmitting">
          {{ isSubmitting ? t('forcePassword.submitting') : t('forcePassword.submit') }}
        </button>
      </form>

      <div class="card-footer">
        <button class="btn-logout" @click="handleLogout">
          {{ t('forcePassword.logout') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    forcePassword: {
      title: 'Change Your Password',
      subtitle: 'Your administrator has required you to set a new password before continuing.',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Enter new password (min. 8 characters)',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Re-enter new password',
      submit: 'Change Password',
      submitting: 'Changing...',
      logout: 'Log out instead',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 8 characters',
      success: 'Password changed successfully',
      genericError: 'An error occurred while changing your password. Please try again.'
    }
  },
  fr: {
    forcePassword: {
      title: 'Changez votre mot de passe',
      subtitle: 'Votre administrateur exige que vous d\u00e9finissiez un nouveau mot de passe avant de continuer.',
      newPassword: 'Nouveau mot de passe',
      newPasswordPlaceholder: 'Entrez le nouveau mot de passe (min. 8 caract\u00e8res)',
      confirmPassword: 'Confirmer le mot de passe',
      confirmPasswordPlaceholder: 'Saisissez \u00e0 nouveau le mot de passe',
      submit: 'Changer le mot de passe',
      submitting: 'Changement en cours...',
      logout: 'Se d\u00e9connecter',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      passwordTooShort: 'Le mot de passe doit comporter au moins 8 caract\u00e8res',
      success: 'Mot de passe chang\u00e9 avec succ\u00e8s',
      genericError: 'Une erreur est survenue lors du changement de mot de passe. Veuillez r\u00e9essayer.'
    }
  }
})

const router = useRouter()
const userStore = useCurrentUserStore()

const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  error.value = ''

  if (newPassword.value.length < 8) {
    error.value = t('forcePassword.passwordTooShort')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = t('forcePassword.passwordMismatch')
    return
  }

  isSubmitting.value = true

  try {
    await axios.post('/users/me/force-change-password', {
      new_password: newPassword.value,
      confirm_password: confirmPassword.value
    })

    userStore.clearForcePasswordChange()
    router.push({ path: '/terminal-sessions' })
  } catch (err: any) {
    error.value = err.response?.data?.error ||
                  err.response?.data?.error_message ||
                  err.response?.data?.message ||
                  t('forcePassword.genericError')
  } finally {
    isSubmitting.value = false
  }
}

async function handleLogout() {
  await userStore.logout()
}
</script>

<style scoped>
.force-password-change-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-bg-secondary);
}

.force-password-change-card {
  background-color: var(--color-bg-primary);
  padding: 40px;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 440px;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.card-header h1 {
  font-size: 1.75rem;
  margin-bottom: 12px;
  color: var(--color-text-primary);
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(59, 130, 246, 0.15));
}

.error-message {
  color: var(--color-danger);
  background-color: var(--color-danger-bg, rgba(220, 38, 38, 0.1));
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary, #fff);
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.btn-logout {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  transition: color var(--transition-fast);
}

.btn-logout:hover {
  color: var(--color-danger);
}
</style>
