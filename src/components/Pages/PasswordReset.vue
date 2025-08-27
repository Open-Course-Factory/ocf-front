<template>
  <div class="password-reset-page">
    <div class="password-reset-form">
      <!-- Étape 1: Demande de reset -->
      <div v-if="step === 'request'" class="reset-request">
        <h2>Réinitialiser le mot de passe</h2>
        <p class="text-muted">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        <form @submit.prevent="handleRequestReset">
          <div class="form-group">
            <label for="email">Adresse email</label>
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
              <i class="fas fa-spinner fa-spin"></i> Envoi en cours...
            </span>
            <span v-else>
              <i class="fas fa-paper-plane"></i> Envoyer le lien
            </span>
          </button>
        </form>

        <div class="back-to-login">
          <router-link to="/login">
            <i class="fas fa-arrow-left"></i> Retour à la connexion
          </router-link>
        </div>
      </div>

      <!-- Étape 2: Confirmation d'envoi -->
      <div v-if="step === 'sent'" class="reset-sent">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>Email envoyé !</h2>
        <p class="text-muted">
          Un lien de réinitialisation a été envoyé à <strong>{{ email }}</strong>.
          Vérifiez votre boîte mail et suivez les instructions.
        </p>

        <div class="resend-section">
          <p>Vous n'avez pas reçu l'email ?</p>
          <button
            @click="handleRequestReset"
            class="btn btn-outline-primary"
            :disabled="resendCooldown > 0"
          >
            <span v-if="resendCooldown > 0">
              Renvoyer dans {{ resendCooldown }}s
            </span>
            <span v-else>
              <i class="fas fa-redo"></i> Renvoyer l'email
            </span>
          </button>
        </div>

        <div class="back-to-login">
          <router-link to="/login">
            <i class="fas fa-arrow-left"></i> Retour à la connexion
          </router-link>
        </div>
      </div>

      <!-- Étape 3: Nouveau mot de passe (si token dans l'URL) -->
      <div v-if="step === 'reset'" class="password-reset">
        <h2>Nouveau mot de passe</h2>
        <p class="text-muted">
          Choisissez un nouveau mot de passe sécurisé pour votre compte.
        </p>

        <form @submit.prevent="handlePasswordReset">
          <div class="form-group">
            <label for="newPassword">Nouveau mot de passe</label>
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
                Au moins 8 caractères
              </small>
              <small :class="{ 'text-success': passwordValidations.uppercase, 'text-muted': !passwordValidations.uppercase }">
                <i :class="passwordValidations.uppercase ? 'fas fa-check' : 'fas fa-times'"></i>
                Une majuscule
              </small>
              <small :class="{ 'text-success': passwordValidations.number, 'text-muted': !passwordValidations.number }">
                <i :class="passwordValidations.number ? 'fas fa-check' : 'fas fa-times'"></i>
                Un chiffre
              </small>
            </div>

            <div v-if="passwordError" class="invalid-feedback">
              {{ passwordError }}
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe</label>
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
              <i class="fas fa-spinner fa-spin"></i> Mise à jour...
            </span>
            <span v-else>
              <i class="fas fa-key"></i> Mettre à jour le mot de passe
            </span>
          </button>
        </form>
      </div>

      <!-- Étape 4: Succès -->
      <div v-if="step === 'success'" class="reset-success">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>Mot de passe mis à jour !</h2>
        <p class="text-muted">
          Votre mot de passe a été mis à jour avec succès. 
          Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
        </p>

        <router-link to="/login" class="btn btn-primary">
          <i class="fas fa-sign-in-alt"></i> Se connecter
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

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

onMounted(() => {
  // Vérifier si on a un token de reset dans l'URL
  resetToken.value = route.query.token as string || '';
  if (resetToken.value) {
    step.value = 'reset';
  }
});

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Adresse email invalide';
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
    passwordError.value = 'Le mot de passe ne respecte pas les critères requis';
    return false;
  } else {
    passwordError.value = '';
    return true;
  }
};

const validateConfirmPassword = () => {
  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Les mots de passe ne correspondent pas';
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
      errorMessage.value = 'Aucun compte associé à cette adresse email';
    } else {
      errorMessage.value = 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.';
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
      errorMessage.value = 'Lien de réinitialisation expiré ou invalide';
    } else {
      errorMessage.value = 'Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.';
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
  background-color: #f8f9fa;
  padding: 20px;
}

.password-reset-form {
  background-color: #fff;
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
  color: #333;
}

.text-muted {
  color: #6c757d;
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
  color: #007bff;
  text-decoration: none;
  font-size: 0.9rem;
}

.back-to-login a:hover {
  text-decoration: underline;
}

.success-icon {
  font-size: 4rem;
  color: #28a745;
  margin-bottom: 16px;
}

.resend-section {
  margin: 24px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.resend-section p {
  margin-bottom: 12px;
  color: #6c757d;
}

.alert {
  margin: 16px 0;
  padding: 12px;
  border-radius: 4px;
  text-align: left;
}

.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.btn i {
  margin-right: 8px;
}
</style>