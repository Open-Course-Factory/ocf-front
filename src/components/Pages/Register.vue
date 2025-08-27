<template>
  <div class="register-page">
    <div class="register-form">
      <h2>Créer un compte</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">Prénom *</label>
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
            <label for="lastName">Nom *</label>
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
          <label for="userName">Nom d'utilisateur *</label>
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
          <label for="displayName">Nom d'affichage *</label>
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
          <label for="email">Adresse email *</label>
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
          <label for="password">Mot de passe *</label>
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
          <div v-if="errors.password" class="invalid-feedback">
            {{ errors.password }}
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmer le mot de passe *</label>
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

        <div class="form-group">
          <label for="defaultRole">Rôle</label>
          <select
            id="defaultRole"
            v-model="formData.defaultRole"
            class="form-control"
          >
            <option value="student">Utilisateur</option>
          </select>
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
            <i class="fas fa-spinner fa-spin"></i> Création en cours...
          </span>
          <span v-else>Créer le compte</span>
        </button>

        <div class="login-link">
          <p>Déjà un compte ? <router-link to="/login">Se connecter</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const formData = reactive({
  firstName: '',
  lastName: '',
  userName: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  defaultRole: 'user'
});

const errors = reactive({
  firstName: '',
  lastName: '',
  userName: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: ''
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
  return Object.values(errors).every(error => error === '') &&
         Object.values(formData).every(value => value !== '') &&
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
    errors.email = 'Adresse email invalide';
  } else {
    errors.email = '';
  }
};

const validateUserName = () => {
  if (formData.userName.length < 3) {
    errors.userName = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
  } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.userName)) {
    errors.userName = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores';
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
    errors.password = 'Le mot de passe ne respecte pas les critères requis';
  } else {
    errors.password = '';
  }
  
  if (formData.confirmPassword) {
    validateConfirmPassword();
  }
};

const validateConfirmPassword = () => {
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas';
  } else {
    errors.confirmPassword = '';
  }
};

const handleSubmit = async () => {
  // Valider tous les champs
  validateEmail();
  validateUserName();
  validatePassword();
  validateConfirmPassword();

  if (!isFormValid.value) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const registrationData = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      userName: formData.userName,
      displayName: formData.displayName,
      defaultRole: formData.defaultRole
    };

    // Utilisation de la requête simplifiée
    await axios.post('/users', registrationData);
    
    successMessage.value = 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.';
    
    // Rediriger vers la page de connexion après 2 secondes
    setTimeout(() => {
      router.push({ name: 'Login' });
    }, 2000);

  } catch (error: any) {
    if (error.response?.data?.error_message) {
      errorMessage.value = error.response.data.error_message;
    } else if (error.response?.status === 409) {
      errorMessage.value = 'Un utilisateur avec cette adresse email existe déjà';
    } else {
      errorMessage.value = 'Erreur lors de la création du compte. Veuillez réessayer.';
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
  background-color: #f8f9fa;
  padding: 20px;
}

.register-form {
  background-color: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
}

.register-form h2 {
  margin-bottom: 24px;
  font-size: 2rem;
  text-align: center;
  color: #333;
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
  color: #007bff;
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
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.alert-success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}
</style>