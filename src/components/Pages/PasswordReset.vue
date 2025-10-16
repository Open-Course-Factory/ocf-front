<template>
  <div class="password-reset-page">
    <div class="password-reset-form">
      <!-- Étape 1: Demande de reset -->
      <div v-if="step === 'request'" class="reset-request">
        <h2>{{ t('passwordReset.requestTitle') }}</h2>
        <p class="text-muted">
          {{ t('passwordReset.requestDescription') }}
        </p>

        <form @submit.prevent="handleRequestReset">
          <div class="form-group">
            <label for="email">{{ t('passwordReset.emailLabel') }}</label>
            <input
              type="email"
              id="email"
              v-model="email"
              :class="['form-control', { 'is-invalid': emailError }]"
              placeholder="votre@email.com"
              required
            />
            <div v-if="emailError" class="invalid-feedback">
              {{ emailError }}
            </div>
          </div>

          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            :disabled="isLoading"
          >
            <span v-if="isLoading">
              <i class="fas fa-spinner fa-spin"></i> {{ t('passwordReset.sending') }}
            </span>
            <span v-else>
              <i class="fas fa-paper-plane"></i> {{ t('passwordReset.sendLink') }}
            </span>
          </button>
        </form>

        <div class="back-to-login">
          <router-link to="/login">
            <i class="fas fa-arrow-left"></i> {{ t('passwordReset.backToLogin') }}
          </router-link>
        </div>
      </div>

      <!-- Étape 2: Confirmation d'envoi -->
      <div v-if="step === 'sent'" class="reset-sent">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>{{ t('passwordReset.emailSent') }}</h2>
        <p class="text-muted">
          {{ t('passwordReset.emailSentDescription', { email }) }}
        </p>

        <div class="resend-section">
          <p>{{ t('passwordReset.didntReceive') }}</p>
          <button
            @click="handleRequestReset"
            class="btn btn-outline-primary"
            :disabled="resendCooldown > 0"
          >
            <span v-if="resendCooldown > 0">
              {{ t('passwordReset.resendIn', { seconds: resendCooldown }) }}
            </span>
            <span v-else>
              <i class="fas fa-redo"></i> {{ t('passwordReset.resendEmail') }}
            </span>
          </button>
        </div>

        <div class="back-to-login">
          <router-link to="/login">
            <i class="fas fa-arrow-left"></i> {{ t('passwordReset.backToLogin') }}
          </router-link>
        </div>
      </div>

      <!-- Étape 3: Nouveau mot de passe (si token dans l'URL) -->
      <div v-if="step === 'reset'" class="password-reset">
        <h2>{{ t('passwordReset.resetTitle') }}</h2>
        <p class="text-muted">
          {{ t('passwordReset.resetDescription') }}
        </p>

        <form @submit.prevent="handlePasswordReset">
          <div class="form-group">
            <label for="newPassword">{{ t('passwordReset.newPasswordLabel') }}</label>
            <input
              type="password"
              id="newPassword"
              v-model="newPassword"
              :class="['form-control', { 'is-invalid': passwordError }]"
              @input="validatePassword"
              required
            />

            <div class="password-requirements">
              <small :class="{ 'text-success': passwordValidations.length, 'text-muted': !passwordValidations.length }">
                <i :class="passwordValidations.length ? 'fas fa-check' : 'fas fa-times'"></i>
                {{ t('passwordReset.passwordReq8Chars') }}
              </small>
              <small :class="{ 'text-success': passwordValidations.uppercase, 'text-muted': !passwordValidations.uppercase }">
                <i :class="passwordValidations.uppercase ? 'fas fa-check' : 'fas fa-times'"></i>
                {{ t('passwordReset.passwordReqUppercase') }}
              </small>
              <small :class="{ 'text-success': passwordValidations.number, 'text-muted': !passwordValidations.number }">
                <i :class="passwordValidations.number ? 'fas fa-check' : 'fas fa-times'"></i>
                {{ t('passwordReset.passwordReqNumber') }}
              </small>
            </div>

            <div v-if="passwordError" class="invalid-feedback">
              {{ passwordError }}
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">{{ t('passwordReset.confirmPasswordLabel') }}</label>
            <input
              type="password"
              id="confirmPassword"
              v-model="confirmPassword"
              :class="['form-control', { 'is-invalid': confirmPasswordError }]"
              @blur="validateConfirmPassword"
              required
            />
            <div v-if="confirmPasswordError" class="invalid-feedback">
              {{ confirmPasswordError }}
            </div>
          </div>

          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            :disabled="isLoading || !isPasswordValid"
          >
            <span v-if="isLoading">
              <i class="fas fa-spinner fa-spin"></i> {{ t('passwordReset.updating') }}
            </span>
            <span v-else>
              <i class="fas fa-key"></i> {{ t('passwordReset.updatePassword') }}
            </span>
          </button>
        </form>
      </div>

      <!-- Étape 4: Succès -->
      <div v-if="step === 'success'" class="reset-success">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>{{ t('passwordReset.successTitle') }}</h2>
        <p class="text-muted">
          {{ t('passwordReset.successDescription') }}
        </p>

        <router-link to="/login" class="btn btn-primary">
          <i class="fas fa-sign-in-alt"></i> {{ t('passwordReset.signIn') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useTranslations } from '../../composables/useTranslations';

const route = useRoute();

const { t } = useTranslations({
  en: {
    passwordReset: {
      requestTitle: 'Reset password',
      requestDescription: 'Enter your email address and we will send you a link to reset your password.',
      emailLabel: 'Email address',
      sending: 'Sending...',
      sendLink: 'Send link',
      backToLogin: 'Back to login',
      emailSent: 'Email sent!',
      emailSentDescription: 'A reset link has been sent to {email}. Check your mailbox and follow the instructions.',
      didntReceive: 'Didn\'t receive the email?',
      resendIn: 'Resend in {seconds}s',
      resendEmail: 'Resend email',
      resetTitle: 'New password',
      resetDescription: 'Choose a new secure password for your account.',
      newPasswordLabel: 'New password',
      passwordReq8Chars: 'At least 8 characters',
      passwordReqUppercase: 'One uppercase letter',
      passwordReqNumber: 'One number',
      confirmPasswordLabel: 'Confirm password',
      updating: 'Updating...',
      updatePassword: 'Update password',
      successTitle: 'Password updated!',
      successDescription: 'Your password has been successfully updated. You can now log in with your new password.',
      signIn: 'Sign in',
      invalidEmail: 'Invalid email address',
      passwordInvalid: 'Password does not meet requirements',
      passwordMismatch: 'Passwords do not match',
      errorNoAccount: 'No account associated with this email address',
      errorSendingEmail: 'Error sending email. Please try again.',
      errorInvalidToken: 'Reset link expired or invalid',
      errorUpdatingPassword: 'Error updating password. Please try again.'
    }
  },
  fr: {
    passwordReset: {
      requestTitle: 'Réinitialiser le mot de passe',
      requestDescription: 'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.',
      emailLabel: 'Adresse email',
      sending: 'Envoi en cours...',
      sendLink: 'Envoyer le lien',
      backToLogin: 'Retour à la connexion',
      emailSent: 'Email envoyé !',
      emailSentDescription: 'Un lien de réinitialisation a été envoyé à {email}. Vérifiez votre boîte mail et suivez les instructions.',
      didntReceive: 'Vous n\'avez pas reçu l\'email ?',
      resendIn: 'Renvoyer dans {seconds}s',
      resendEmail: 'Renvoyer l\'email',
      resetTitle: 'Nouveau mot de passe',
      resetDescription: 'Choisissez un nouveau mot de passe sécurisé pour votre compte.',
      newPasswordLabel: 'Nouveau mot de passe',
      passwordReq8Chars: 'Au moins 8 caractères',
      passwordReqUppercase: 'Une majuscule',
      passwordReqNumber: 'Un chiffre',
      confirmPasswordLabel: 'Confirmer le mot de passe',
      updating: 'Mise à jour...',
      updatePassword: 'Mettre à jour le mot de passe',
      successTitle: 'Mot de passe mis à jour !',
      successDescription: 'Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      signIn: 'Se connecter',
      invalidEmail: 'Adresse email invalide',
      passwordInvalid: 'Le mot de passe ne respecte pas les critères requis',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      errorNoAccount: 'Aucun compte associé à cette adresse email',
      errorSendingEmail: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.',
      errorInvalidToken: 'Lien de réinitialisation expiré ou invalide',
      errorUpdatingPassword: 'Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.'
    }
  }
});

const step = ref<'request' | 'sent' | 'reset' | 'success'>('request');
const email = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const resetToken = ref('');

const emailError = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const resendCooldown = ref(0);

const passwordValidations = reactive({
  length: false,
  uppercase: false,
  number: false
});

const isPasswordValid = computed(() => {
  return passwordValidations.length &&
         passwordValidations.uppercase &&
         passwordValidations.number &&
         newPassword.value === confirmPassword.value;
});

// Vérifier si on a un token de reset dans l'URL
onMounted(() => {
  resetToken.value = route.query.token as string || '';
  if (resetToken.value) {
    step.value = 'reset';
  }
});

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = t('passwordReset.invalidEmail');
    return false;
  } else {
    emailError.value = '';
    return true;
  }
};

const validatePassword = () => {
  const password = newPassword.value;

  passwordValidations.length = password.length >= 8;
  passwordValidations.uppercase = /[A-Z]/.test(password);
  passwordValidations.number = /\d/.test(password);

  if (!passwordValidations.length || !passwordValidations.uppercase || !passwordValidations.number) {
    passwordError.value = t('passwordReset.passwordInvalid');
    return false;
  } else {
    passwordError.value = '';
    return true;
  }
};

const validateConfirmPassword = () => {
  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = t('passwordReset.passwordMismatch');
    return false;
  } else {
    confirmPasswordError.value = '';
    return true;
  }
};

const handleRequestReset = async () => {
  if (!validateEmail()) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Requête simplifiée - NOTE: Cet endpoint n'existe pas encore dans votre API
    await axios.post('/auth/password-reset-request', { email: email.value });

    step.value = 'sent';
    startResendCooldown();
  } catch (error: any) {
    if (error.response?.status === 404) {
      errorMessage.value = t('passwordReset.errorNoAccount');
    } else {
      errorMessage.value = t('passwordReset.errorSendingEmail');
    }
    console.error('Erreur reset password request:', error);
  } finally {
    isLoading.value = false;
  }
};

const handlePasswordReset = async () => {
  if (!validatePassword() || !validateConfirmPassword()) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Requête simplifiée - NOTE: Cet endpoint n'existe pas encore dans votre API
    await axios.post('/auth/password-reset', {
      token: resetToken.value,
      new_password: newPassword.value
    });

    step.value = 'success';
  } catch (error: any) {
    if (error.response?.status === 400) {
      errorMessage.value = t('passwordReset.errorInvalidToken');
    } else {
      errorMessage.value = t('passwordReset.errorUpdatingPassword');
    }
    console.error('Erreur password reset:', error);
  } finally {
    isLoading.value = false;
  }
};

const startResendCooldown = () => {
  resendCooldown.value = 60;
  const interval = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) {
      clearInterval(interval);
    }
  }, 1000);
};
</script>

<style scoped>
.password-reset-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-gray-50);
  padding: 20px;
}

.password-reset-form {
  background-color: var(--color-white);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.password-reset-form h2 {
  margin-bottom: 16px;
  font-size: 1.8rem;
  color: var(--color-text-primary);
}

.text-muted {
  color: var(--color-gray-600);
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

.password-requirements {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.password-requirements small {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
}

.btn-block {
  width: 100%;
  padding: 12px;
  margin-top: 16px;
}

.back-to-login {
  margin-top: 24px;
}

.back-to-login a {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.9rem;
}

.back-to-login a:hover {
  text-decoration: underline;
}

.success-icon {
  font-size: 4rem;
  color: var(--color-success);
  margin-bottom: 16px;
}

.resend-section {
  margin: 24px 0;
  padding: 20px;
  background-color: var(--color-gray-50);
  border-radius: 8px;
}

.resend-section p {
  margin-bottom: 12px;
  color: var(--color-gray-600);
}

.alert {
  margin: 16px 0;
  padding: 12px;
  border-radius: 4px;
  text-align: left;
}

.alert-danger {
  background-color: var(--color-danger-bg);
  border-color: var(--color-danger-border);
  color: var(--color-danger-text);
}

.btn i {
  margin-right: 8px;
}
</style>
