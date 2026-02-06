<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="verify-email-page">
    <div class="verify-email-card">

      <!-- Verifying: spinner while calling API -->
      <div v-if="step === 'verifying'" class="step-verifying">
        <div class="spinner-icon">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h2>{{ t('verifyEmail.verifyingTitle') }}</h2>
        <p class="text-muted">{{ t('verifyEmail.verifyingDescription') }}</p>
      </div>

      <!-- Success: email verified -->
      <div v-if="step === 'success'" class="step-success">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>{{ t('verifyEmail.successTitle') }}</h2>
        <p class="text-muted">{{ t('verifyEmail.successDescription') }}</p>
        <button
          v-if="currentUserStore.isAuthenticated"
          class="btn btn-primary"
          @click="redirectAfterVerification"
        >
          <i class="fas fa-arrow-right"></i> {{ t('verifyEmail.continueToApp') }}
        </button>
        <router-link
          v-else
          to="/login"
          class="btn btn-primary"
        >
          <i class="fas fa-sign-in-alt"></i> {{ t('verifyEmail.signIn') }}
        </router-link>
      </div>

      <!-- Error: token invalid/expired -->
      <div v-if="step === 'error'" class="step-error">
        <div class="error-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <h2>{{ t('verifyEmail.errorTitle') }}</h2>
        <p class="text-muted">{{ errorMessage }}</p>

        <div class="resend-section">
          <p>{{ t('verifyEmail.resendPrompt') }}</p>
          <form @submit.prevent="handleResend" class="resend-form">
            <div class="form-group">
              <input
                type="email"
                v-model="resendEmail"
                class="form-control"
                :placeholder="t('verifyEmail.emailPlaceholder')"
                required
              />
            </div>
            <button
              type="submit"
              class="btn btn-primary btn-block"
              :disabled="resendCooldown > 0 || isResending"
            >
              <span v-if="isResending">
                <i class="fas fa-spinner fa-spin"></i> {{ t('verifyEmail.sending') }}
              </span>
              <span v-else-if="resendCooldown > 0">
                {{ t('verifyEmail.resendIn', { seconds: resendCooldown }) }}
              </span>
              <span v-else>
                <i class="fas fa-paper-plane"></i> {{ t('verifyEmail.resendButton') }}
              </span>
            </button>
          </form>
          <div v-if="resendSuccess" class="alert alert-success">
            {{ t('verifyEmail.resendSuccess') }}
          </div>
        </div>

        <div class="back-to-login">
          <router-link to="/login">
            <i class="fas fa-arrow-left"></i> {{ t('verifyEmail.backToLogin') }}
          </router-link>
        </div>
      </div>

      <!-- No token: enter code form -->
      <div v-if="step === 'no-token'" class="step-enter-code">
        <div class="info-icon">
          <i class="fas fa-envelope-open-text"></i>
        </div>
        <h2>{{ t('verifyEmail.enterCodeTitle') }}</h2>
        <p class="text-muted">{{ t('verifyEmail.enterCodeDescription') }}</p>

        <form @submit.prevent="handleCodeSubmit" class="code-form">
          <div class="form-group">
            <label for="verificationCode">{{ t('verifyEmail.codeLabel') }}</label>
            <input
              type="text"
              id="verificationCode"
              v-model="manualCode"
              class="form-control code-input"
              :placeholder="t('verifyEmail.codePlaceholder')"
              autocomplete="one-time-code"
              required
            />
          </div>

          <div v-if="codeError" class="alert alert-danger">
            {{ codeError }}
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            :disabled="isVerifyingCode || !manualCode.trim()"
          >
            <span v-if="isVerifyingCode">
              <i class="fas fa-spinner fa-spin"></i> {{ t('verifyEmail.verifyingButton') }}
            </span>
            <span v-else>
              <i class="fas fa-check"></i> {{ t('verifyEmail.verifyButton') }}
            </span>
          </button>
        </form>

        <div class="resend-section">
          <p>{{ t('verifyEmail.resendPrompt') }}</p>
          <button
            @click="handleResendForCurrentUser"
            class="btn btn-outline-primary btn-block"
            :disabled="resendCooldown > 0 || isResending"
          >
            <span v-if="isResending">
              <i class="fas fa-spinner fa-spin"></i> {{ t('verifyEmail.sending') }}
            </span>
            <span v-else-if="resendCooldown > 0">
              {{ t('verifyEmail.resendIn', { seconds: resendCooldown }) }}
            </span>
            <span v-else>
              <i class="fas fa-paper-plane"></i> {{ t('verifyEmail.resendButton') }}
            </span>
          </button>
          <div v-if="resendSuccess" class="alert alert-success">
            {{ t('verifyEmail.resendSuccess') }}
          </div>
        </div>

        <div class="back-link">
          <a href="#" @click.prevent="goBack">
            <i class="fas fa-arrow-left"></i> {{ t('verifyEmail.goBack') }}
          </a>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'

const route = useRoute()
const router = useRouter()
const currentUserStore = useCurrentUserStore()

const { t } = useTranslations({
  en: {
    verifyEmail: {
      verifyingTitle: 'Verifying your email...',
      verifyingDescription: 'Please wait while we verify your email address.',
      successTitle: 'Email verified!',
      successDescription: 'Your email address has been successfully verified.',
      continueToApp: 'Continue to the app',
      signIn: 'Sign in',
      errorTitle: 'Verification failed',
      errorInvalid: 'This verification link is invalid.',
      errorNotFound: 'This verification link was not found.',
      errorAlreadyUsed: 'This email has already been verified.',
      errorExpired: 'This verification link has expired. Please request a new one.',
      errorGeneric: 'An error occurred during verification. Please try again.',
      enterCodeTitle: 'Verify your email',
      enterCodeDescription: 'A verification code has been sent to your email address. Enter it below to continue.',
      codeLabel: 'Verification code',
      codePlaceholder: 'Paste your verification code',
      verifyButton: 'Verify',
      verifyingButton: 'Verifying...',
      resendPrompt: 'Didn\'t receive the email?',
      emailPlaceholder: 'your@email.com',
      sending: 'Sending...',
      resendIn: 'Resend in {seconds}s',
      resendButton: 'Resend verification email',
      resendSuccess: 'Verification email sent! Please check your inbox.',
      backToLogin: 'Back to login',
      goBack: 'Go back'
    }
  },
  fr: {
    verifyEmail: {
      verifyingTitle: 'Vérification de votre email...',
      verifyingDescription: 'Veuillez patienter pendant la vérification de votre adresse email.',
      successTitle: 'Email vérifié !',
      successDescription: 'Votre adresse email a été vérifiée avec succès.',
      continueToApp: 'Continuer vers l\'application',
      signIn: 'Se connecter',
      errorTitle: 'Échec de la vérification',
      errorInvalid: 'Ce lien de vérification est invalide.',
      errorNotFound: 'Ce lien de vérification n\'a pas été trouvé.',
      errorAlreadyUsed: 'Cet email a déjà été vérifié.',
      errorExpired: 'Ce lien de vérification a expiré. Veuillez en demander un nouveau.',
      errorGeneric: 'Une erreur est survenue lors de la vérification. Veuillez réessayer.',
      enterCodeTitle: 'Vérifiez votre email',
      enterCodeDescription: 'Un code de vérification a été envoyé à votre adresse email. Saisissez-le ci-dessous pour continuer.',
      codeLabel: 'Code de vérification',
      codePlaceholder: 'Collez votre code de vérification',
      verifyButton: 'Vérifier',
      verifyingButton: 'Vérification...',
      resendPrompt: 'Vous n\'avez pas reçu l\'email ?',
      emailPlaceholder: 'votre@email.com',
      sending: 'Envoi en cours...',
      resendIn: 'Renvoyer dans {seconds}s',
      resendButton: 'Renvoyer l\'email de vérification',
      resendSuccess: 'Email de vérification envoyé ! Veuillez vérifier votre boîte de réception.',
      backToLogin: 'Retour à la connexion',
      goBack: 'Retour'
    }
  }
})

const step = ref<'verifying' | 'success' | 'error' | 'no-token'>('no-token')
const errorMessage = ref('')
const resendEmail = ref('')
const isResending = ref(false)
const resendCooldown = ref(0)
const resendSuccess = ref(false)
const manualCode = ref('')
const codeError = ref('')
const isVerifyingCode = ref(false)

onMounted(async () => {
  const token = route.query.token as string
  if (token) {
    step.value = 'verifying'
    await verifyToken(token)
  } else {
    step.value = 'no-token'
    // Pre-fill email if user is authenticated
    if (currentUserStore.isAuthenticated && currentUserStore.userEmail) {
      resendEmail.value = currentUserStore.userEmail
    }
  }
})

function getErrorMessage(status: number | undefined): string {
  if (status === 400) return t('verifyEmail.errorInvalid')
  if (status === 404) return t('verifyEmail.errorNotFound')
  if (status === 409) return t('verifyEmail.errorAlreadyUsed')
  if (status === 410) return t('verifyEmail.errorExpired')
  return t('verifyEmail.errorGeneric')
}

async function verifyToken(token: string, fromManualInput = false) {
  try {
    await axios.post('/auth/verify-email', { token })
    step.value = 'success'

    // Refresh store if authenticated
    if (currentUserStore.isAuthenticated) {
      await currentUserStore.loadUserData()
    }
  } catch (error: any) {
    const msg = getErrorMessage(error.response?.status)

    if (fromManualInput) {
      // Stay on code entry form, show inline error
      codeError.value = msg
    } else {
      // URL token flow — show full error step
      step.value = 'error'
      errorMessage.value = msg
    }
  }
}

async function handleCodeSubmit() {
  if (isVerifyingCode.value || !manualCode.value.trim()) return

  isVerifyingCode.value = true
  codeError.value = ''

  await verifyToken(manualCode.value.trim(), true)
  isVerifyingCode.value = false
}

async function handleResendForCurrentUser() {
  if (resendCooldown.value > 0 || isResending.value) return

  isResending.value = true
  resendSuccess.value = false

  try {
    await axios.post('/auth/resend-verification', {
      email: currentUserStore.userEmail || resendEmail.value
    })
    resendSuccess.value = true
    startCooldown()
  } catch (error: any) {
    if (error.response?.status === 429) {
      startCooldown()
    }
    console.error('Failed to resend verification email:', error)
  } finally {
    isResending.value = false
  }
}

function goBack() {
  const redirect = route.query.redirect as string
  if (redirect) {
    // Go back to where they came from (they'll be blocked again but that's their choice)
    router.push(redirect)
  } else if (currentUserStore.isAuthenticated) {
    router.push('/terminal-sessions')
  } else {
    router.push('/login')
  }
}

function redirectAfterVerification() {
  const redirect = route.query.redirect as string
  if (redirect) {
    router.push(redirect)
  } else {
    router.push('/terminal-sessions')
  }
}

async function handleResend() {
  if (resendCooldown.value > 0 || isResending.value) return

  isResending.value = true
  resendSuccess.value = false

  try {
    await axios.post('/auth/resend-verification', {
      email: resendEmail.value
    })
    resendSuccess.value = true
    startCooldown()
  } catch (error: any) {
    if (error.response?.status === 429) {
      startCooldown()
    }
    console.error('Failed to resend verification email:', error)
  } finally {
    isResending.value = false
  }
}

function startCooldown() {
  resendCooldown.value = 60
  const interval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(interval)
    }
  }, 1000)
}
</script>

<style scoped>
.verify-email-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-bg-secondary);
  padding: var(--spacing-lg);
}

.verify-email-card {
  background-color: var(--color-bg-primary);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.verify-email-card h2 {
  margin-bottom: var(--spacing-md);
  font-size: 1.8rem;
  color: var(--color-text-primary);
}

.text-muted {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
}

.spinner-icon {
  font-size: 4rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.success-icon {
  font-size: 4rem;
  color: var(--color-success);
  margin-bottom: var(--spacing-md);
}

.error-icon {
  font-size: 4rem;
  color: var(--color-danger);
  margin-bottom: var(--spacing-md);
}

.info-icon {
  font-size: 4rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.code-form {
  text-align: left;
  margin-bottom: var(--spacing-lg);
}

.code-form .form-group {
  margin-bottom: var(--spacing-md);
}

.code-form .form-group label {
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  display: block;
}

.code-input {
  font-family: monospace;
  font-size: var(--font-size-base);
  letter-spacing: 1px;
}

.alert-danger {
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger);
  color: var(--color-danger-text);
}

.btn-outline-primary {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-outline-primary:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-outline-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.back-link {
  margin-top: var(--spacing-lg);
}

.back-link a {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link a:hover {
  text-decoration: underline;
}

.resend-section {
  margin: var(--spacing-lg) 0;
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
}

.resend-section p {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-muted);
}

.resend-form .form-group {
  margin-bottom: var(--spacing-md);
  text-align: left;
}

.btn-block {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
}

.btn i {
  margin-right: var(--spacing-sm);
}

.alert {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  text-align: left;
}

.alert-success {
  background-color: var(--color-success-bg);
  border: 1px solid var(--color-success);
  color: var(--color-success-text);
}

.back-to-login {
  margin-top: var(--spacing-lg);
}

.back-to-login a {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.9rem;
}

.back-to-login a:hover {
  text-decoration: underline;
}
</style>
