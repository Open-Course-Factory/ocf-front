<template>
  <div class="register-page">
    <div class="register-form">
      <div class="back-button">
        <router-link to="/" class="btn-back">
          <i class="fas fa-arrow-left"></i>
          {{ t('register.backToHome') }}
        </router-link>
      </div>
      <h2>{{ t('register.title') }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">{{ t('register.firstNameLabel') }}</label>
            <input
              type="text"
              id="firstName"
              v-model="formData.firstName"
              :class="['form-control', { 'is-invalid': errors.firstName }]"
              required
            />
            <div v-if="errors.firstName" class="invalid-feedback">
              {{ errors.firstName }}
            </div>
          </div>
          <div class="form-group">
            <label for="lastName">{{ t('register.lastNameLabel') }}</label>
            <input
              type="text"
              id="lastName"
              v-model="formData.lastName"
              :class="['form-control', { 'is-invalid': errors.lastName }]"
              required
            />
            <div v-if="errors.lastName" class="invalid-feedback">
              {{ errors.lastName }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="userName">{{ t('register.userNameLabel') }}</label>
          <input
            type="text"
            id="userName"
            v-model="formData.userName"
            :class="['form-control', { 'is-invalid': errors.userName }]"
            @blur="validateUserName"
            required
          />
          <div v-if="errors.userName" class="invalid-feedback">
            {{ errors.userName }}
          </div>
        </div>

        <div class="form-group">
          <label for="displayName">{{ t('register.displayNameLabel') }}</label>
          <input
            type="text"
            id="displayName"
            v-model="formData.displayName"
            :class="['form-control', { 'is-invalid': errors.displayName }]"
            required
          />
          <div v-if="errors.displayName" class="invalid-feedback">
            {{ errors.displayName }}
          </div>
        </div>

        <div class="form-group">
          <label for="email">{{ t('register.emailLabel') }}</label>
          <input
            type="email"
            id="email"
            v-model="formData.email"
            :class="['form-control', { 'is-invalid': errors.email }]"
            @blur="validateEmail"
            required
          />
          <div v-if="errors.email" class="invalid-feedback">
            {{ errors.email }}
          </div>
        </div>

        <div class="form-group">
          <label for="password">{{ t('register.passwordLabel') }}</label>
          <input
            type="password"
            id="password"
            v-model="formData.password"
            :class="['form-control', { 'is-invalid': errors.password }]"
            @input="validatePassword"
            required
          />
          <div class="password-requirements">
            <small :class="{ 'text-success': passwordValidations.length, 'text-muted': !passwordValidations.length }">
              <i :class="passwordValidations.length ? 'fas fa-check' : 'fas fa-times'"></i>
              {{ t('register.passwordReq8Chars') }}
            </small>
            <small :class="{ 'text-success': passwordValidations.uppercase, 'text-muted': !passwordValidations.uppercase }">
              <i :class="passwordValidations.uppercase ? 'fas fa-check' : 'fas fa-times'"></i>
              {{ t('register.passwordReqUppercase') }}
            </small>
            <small :class="{ 'text-success': passwordValidations.number, 'text-muted': !passwordValidations.number }">
              <i :class="passwordValidations.number ? 'fas fa-check' : 'fas fa-times'"></i>
              {{ t('register.passwordReqNumber') }}
            </small>
          </div>
          <div v-if="errors.password" class="invalid-feedback">
            {{ errors.password }}
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">{{ t('register.confirmPasswordLabel') }}</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="formData.confirmPassword"
            :class="['form-control', { 'is-invalid': errors.confirmPassword }]"
            @blur="validateConfirmPassword"
            required
          />
          <div v-if="errors.confirmPassword" class="invalid-feedback">
            {{ errors.confirmPassword }}
          </div>
        </div>

        <div class="form-group tos-acceptance">
          <div class="tos-checkbox">
            <input
              type="checkbox"
              id="tosAccepted"
              v-model="formData.tosAccepted"
              :class="{ 'is-invalid': errors.tosAccepted }"
              required
            />
            <label for="tosAccepted">
              {{ t('register.tosAcceptance') }}
              <button
                type="button"
                class="tos-link"
                @click="showTosModal = true"
              >
                {{ t('register.tosLink') }}
              </button>
              *
            </label>
          </div>
          <div v-if="errors.tosAccepted" class="invalid-feedback d-block">
            {{ errors.tosAccepted }}
          </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="alert alert-success" role="alert">
          {{ successMessage }}
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading">
            <i class="fas fa-spinner fa-spin"></i> {{ t('register.creatingAccount') }}
          </span>
          <span v-else>{{ t('register.submitButton') }}</span>
        </button>

        <div class="login-link">
          <p>{{ t('register.haveAccount') }} <router-link to="/login">{{ t('register.loginLink') }}</router-link></p>
        </div>
      </form>
    </div>

    <TermsOfServiceModal
      :is-open="showTosModal"
      @close="showTosModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import TermsOfServiceModal from '../../components/Modals/TermsOfServiceModal.vue';
import { useTranslations } from '../../composables/useTranslations';
import { extractErrorMessage } from '../../utils/formatters';

const router = useRouter();
const showTosModal = ref(false);

const { t } = useTranslations({
  en: {
    register: {
      backToHome: 'Back to home',
      title: 'Create an account',
      firstNameLabel: 'First name *',
      lastNameLabel: 'Last name *',
      userNameLabel: 'Username *',
      displayNameLabel: 'Display name *',
      emailLabel: 'Email address *',
      passwordLabel: 'Password *',
      passwordReq8Chars: 'At least 8 characters',
      passwordReqUppercase: 'One uppercase letter',
      passwordReqNumber: 'One number',
      confirmPasswordLabel: 'Confirm password *',
      tosAcceptance: 'I have read and accept the',
      tosLink: 'Terms of Service',
      tosMustAccept: 'You must accept the Terms of Service to create an account',
      creatingAccount: 'Creating account...',
      submitButton: 'Create account',
      haveAccount: 'Already have an account?',
      loginLink: 'Sign in',
      invalidEmail: 'Invalid email address',
      userNameTooShort: 'Username must be at least 3 characters',
      userNameInvalidChars: 'Username can only contain letters, numbers, hyphens and underscores',
      passwordInvalid: 'Password does not meet requirements',
      passwordMismatch: 'Passwords do not match',
      successMessage: 'Account created successfully! You will be redirected to login page.',
      errorEmailExists: 'A user with this email address already exists',
      errorGeneric: 'Error creating account. Please try again.'
    }
  },
  fr: {
    register: {
      backToHome: 'Retour à l\'accueil',
      title: 'Créer un compte',
      firstNameLabel: 'Prénom *',
      lastNameLabel: 'Nom *',
      userNameLabel: 'Nom d\'utilisateur *',
      displayNameLabel: 'Nom d\'affichage *',
      emailLabel: 'Adresse email *',
      passwordLabel: 'Mot de passe *',
      passwordReq8Chars: 'Au moins 8 caractères',
      passwordReqUppercase: 'Une majuscule',
      passwordReqNumber: 'Un chiffre',
      confirmPasswordLabel: 'Confirmer le mot de passe *',
      tosAcceptance: 'J\'ai lu et j\'accepte les',
      tosLink: 'Conditions Générales d\'Utilisation',
      tosMustAccept: 'Vous devez accepter les Conditions Générales d\'Utilisation pour créer un compte',
      creatingAccount: 'Création en cours...',
      submitButton: 'Créer le compte',
      haveAccount: 'Déjà un compte ?',
      loginLink: 'Se connecter',
      invalidEmail: 'Adresse email invalide',
      userNameTooShort: 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
      userNameInvalidChars: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores',
      passwordInvalid: 'Le mot de passe ne respecte pas les critères requis',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      successMessage: 'Compte créé avec succès ! Vous allez être redirigé vers la page de connexion.',
      errorEmailExists: 'Un utilisateur avec cette adresse email existe déjà',
      errorGeneric: 'Erreur lors de la création du compte. Veuillez réessayer.'
    }
  }
});

const formData = reactive({
  firstName: '',
  lastName: '',
  userName: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  tosAccepted: false
});

const errors = reactive({
  firstName: '',
  lastName: '',
  userName: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  tosAccepted: ''
});

const passwordValidations = reactive({
  length: false,
  uppercase: false,
  number: false
});

const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);

const isFormValid = computed(() => {
  const allFieldsFilled = formData.firstName !== '' &&
                          formData.lastName !== '' &&
                          formData.userName !== '' &&
                          formData.displayName !== '' &&
                          formData.email !== '' &&
                          formData.password !== '' &&
                          formData.confirmPassword !== '';

  return Object.values(errors).every(error => error === '') &&
         allFieldsFilled &&
         formData.tosAccepted &&
         passwordValidations.length &&
         passwordValidations.uppercase &&
         passwordValidations.number;
});

// Auto-génération du displayName
watch([() => formData.firstName, () => formData.lastName], () => {
  if (formData.firstName && formData.lastName) {
    formData.displayName = `${formData.firstName} ${formData.lastName}`;
  }
});

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    errors.email = t('register.invalidEmail');
  } else {
    errors.email = '';
  }
};

const validateUserName = () => {
  if (formData.userName.length < 3) {
    errors.userName = t('register.userNameTooShort');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.userName)) {
    errors.userName = t('register.userNameInvalidChars');
  } else {
    errors.userName = '';
  }
};

const validatePassword = () => {
  const password = formData.password;

  passwordValidations.length = password.length >= 8;
  passwordValidations.uppercase = /[A-Z]/.test(password);
  passwordValidations.number = /\d/.test(password);

  if (!passwordValidations.length || !passwordValidations.uppercase || !passwordValidations.number) {
    errors.password = t('register.passwordInvalid');
  } else {
    errors.password = '';
  }

  if (formData.confirmPassword) {
    validateConfirmPassword();
  }
};

const validateConfirmPassword = () => {
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = t('register.passwordMismatch');
  } else {
    errors.confirmPassword = '';
  }
};

const validateTosAcceptance = () => {
  if (!formData.tosAccepted) {
    errors.tosAccepted = t('register.tosMustAccept');
  } else {
    errors.tosAccepted = '';
  }
};

const handleSubmit = async () => {
  // Valider tous les champs
  validateEmail();
  validateUserName();
  validatePassword();
  validateConfirmPassword();
  validateTosAcceptance();

  if (!isFormValid.value) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    // GDPR-compliant: Record the exact timestamp when user accepted ToS
    const tosAcceptedAt = new Date().toISOString();

    const registrationData = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      userName: formData.userName,
      displayName: formData.displayName,
      tosAcceptedAt: tosAcceptedAt,
      tosVersion: '2025-10-11' // Version identifier for the ToS
    };

    // Utilisation de la requête simplifiée
    await axios.post('/users', registrationData);

    successMessage.value = t('register.successMessage');

    // Rediriger vers la page de connexion après 2 secondes
    setTimeout(() => {
      router.push({ name: 'Login' });
    }, 2000);

  } catch (error: any) {
    // Handle specific 409 error for email already exists
    if (error.response?.status === 409) {
      errorMessage.value = t('register.errorEmailExists');
    } else {
      errorMessage.value = extractErrorMessage(error, t('register.errorGeneric'));
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-bg-secondary);
  padding: 20px;
}

.register-form {
  background-color: var(--color-bg-primary);
  padding: 40px;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 500px;
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

.register-form h2 {
  margin-bottom: 24px;
  font-size: 2rem;
  text-align: center;
  color: var(--color-text-primary);
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 4px;
  display: block;
}

.password-requirements {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.password-requirements small {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-block {
  width: 100%;
  padding: 12px;
  margin-top: 16px;
}

.login-link {
  text-align: center;
  margin-top: 24px;
}

.login-link a {
  color: var(--color-primary);
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.alert {
  margin-top: 16px;
  padding: 12px;
  border-radius: 4px;
}

.alert-danger {
  background-color: var(--color-danger-bg);
  border-color: var(--color-danger);
  color: var(--color-danger-text);
}

.alert-success {
  background-color: var(--color-success-bg);
  border-color: var(--color-success);
  color: var(--color-success-text);
}

.tos-acceptance {
  margin-top: 24px;
  padding: 16px;
  background-color: var(--color-bg-secondary);
  border-radius: 4px;
}

.tos-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tos-checkbox input[type="checkbox"] {
  margin-top: 4px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.tos-checkbox input[type="checkbox"].is-invalid {
  border-color: var(--color-danger);
  outline: 2px solid var(--color-danger);
}

.tos-checkbox label {
  font-weight: 400;
  margin-bottom: 0;
  cursor: pointer;
  line-height: 1.5;
}

.tos-link {
  background: none;
  border: none;
  color: var(--color-primary);
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin: 0 4px;
  font-size: inherit;
  font-family: inherit;
}

.tos-link:hover {
  color: var(--color-primary-hover);
}

.d-block {
  display: block;
  margin-top: 8px;
}
</style>