<template>
  <div class="wrapper">
    <div class="verify-email-page">
      <!-- Loading State -->
      <div v-if="state === 'loading'" class="state-container loading-state">
        <div class="state-icon">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h2 class="state-title">{{ t('verifyEmail.verifying') }}</h2>
        <p class="state-message">{{ t('verifyEmail.pleaseWait') }}</p>
      </div>

      <!-- Success State -->
      <div v-else-if="state === 'success'" class="state-container success-state">
        <div class="state-icon success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2 class="state-title">{{ t('verifyEmail.success.title') }}</h2>
        <p class="state-message">{{ t('verifyEmail.success.message') }}</p>
        <div class="redirect-info">
          <i class="fas fa-info-circle"></i>
          {{ t('verifyEmail.success.redirecting', { seconds: redirectCountdown }) }}
        </div>
        <router-link to="/terminal-sessions" class="btn-primary">
          {{ t('verifyEmail.success.goToDashboard') }}
        </router-link>
      </div>

      <!-- Error States -->
      <div v-else-if="state === 'expired'" class="state-container error-state">
        <div class="state-icon error-icon">
          <i class="fas fa-clock"></i>
        </div>
        <h2 class="state-title">{{ t('verifyEmail.expired.title') }}</h2>
        <p class="state-message">{{ t('verifyEmail.expired.message') }}</p>

        <div class="resend-section">
          <p class="resend-intro">{{ t('verifyEmail.expired.resendIntro') }}</p>
          <ResendVerificationEmail :initial-email="userEmail" @success="handleResendSuccess" />
        </div>
      </div>

      <div v-else-if="state === 'alreadyVerified'" class="state-container info-state">
        <div class="state-icon info-icon">
          <i class="fas fa-check-double"></i>
        </div>
        <h2 class="state-title">{{ t('verifyEmail.alreadyVerified.title') }}</h2>
        <p class="state-message">{{ t('verifyEmail.alreadyVerified.message') }}</p>
        <router-link to="/login" class="btn-primary">
          {{ t('verifyEmail.alreadyVerified.goToLogin') }}
        </router-link>
      </div>

      <div v-else-if="state === 'invalid'" class="state-container error-state">
        <div class="state-icon error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h2 class="state-title">{{ t('verifyEmail.invalid.title') }}</h2>
        <p class="state-message">{{ t('verifyEmail.invalid.message') }}</p>

        <div class="resend-section">
          <p class="resend-intro">{{ t('verifyEmail.invalid.resendIntro') }}</p>
          <ResendVerificationEmail @success="handleResendSuccess" />
        </div>
      </div>

      <!-- Manual Token Entry -->
      <div v-else-if="state === 'noToken'" class="state-container manual-entry-state">
        <div class="state-icon">
          <i class="fas fa-key"></i>
        </div>
        <h2 class="state-title">{{ t('verifyEmail.manualEntry.title') }}</h2>
        <p class="state-message">{{ t('verifyEmail.manualEntry.message') }}</p>

        <div class="manual-entry-form">
          <label for="token-input" class="form-label">
            {{ t('verifyEmail.manualEntry.tokenLabel') }}
          </label>
          <input
            id="token-input"
            v-model="manualToken"
            type="text"
            class="form-input"
            :placeholder="t('verifyEmail.manualEntry.tokenPlaceholder')"
            maxlength="64"
            @keyup.enter="verifyManualToken"
          />
          <button
            class="btn-primary"
            :disabled="!manualToken || manualToken.length !== 64"
            @click="verifyManualToken"
          >
            <i class="fas fa-check"></i>
            {{ t('verifyEmail.manualEntry.verify') }}
          </button>
        </div>
      </div>

      <!-- Resend Success Message -->
      <div v-if="showResendSuccess" class="resend-success-banner">
        <i class="fas fa-check-circle"></i>
        {{ t('verifyEmail.resendSuccess') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmailVerification } from '../../composables/useEmailVerification'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'
import ResendVerificationEmail from '../Auth/ResendVerificationEmail.vue'

const { t } = useTranslations({
  en: {
    verifyEmail: {
      verifying: 'Verifying your email...',
      pleaseWait: 'Please wait while we verify your email address',
      success: {
        title: 'Email Verified Successfully!',
        message: 'Your email has been verified. You can now access all features.',
        redirecting: 'Redirecting to dashboard in {seconds} seconds...',
        goToDashboard: 'Go to Dashboard Now'
      },
      expired: {
        title: 'Verification Link Expired',
        message: 'This verification link has expired. Links are valid for 48 hours.',
        resendIntro: 'Request a new verification email:'
      },
      alreadyVerified: {
        title: 'Already Verified',
        message: 'This email address has already been verified. You can log in now.',
        goToLogin: 'Go to Login'
      },
      invalid: {
        title: 'Invalid Verification Link',
        message: 'This verification link is invalid or has already been used.',
        resendIntro: 'Request a new verification email:'
      },
      manualEntry: {
        title: 'Enter Verification Token',
        message: 'Paste your verification token from the email',
        tokenLabel: 'Verification Token',
        tokenPlaceholder: 'Enter 64-character token',
        verify: 'Verify Email'
      },
      resendSuccess: 'Verification email sent! Please check your inbox.'
    }
  },
  fr: {
    verifyEmail: {
      verifying: 'Vérification de votre email...',
      pleaseWait: 'Veuillez patienter pendant que nous vérifions votre adresse email',
      success: {
        title: 'Email Vérifié avec Succès !',
        message: 'Votre email a été vérifié. Vous pouvez maintenant accéder à toutes les fonctionnalités.',
        redirecting: 'Redirection vers le tableau de bord dans {seconds} secondes...',
        goToDashboard: 'Aller au Tableau de Bord'
      },
      expired: {
        title: 'Lien de Vérification Expiré',
        message: 'Ce lien de vérification a expiré. Les liens sont valides pendant 48 heures.',
        resendIntro: 'Demander un nouvel email de vérification :'
      },
      alreadyVerified: {
        title: 'Déjà Vérifié',
        message: 'Cette adresse email a déjà été vérifiée. Vous pouvez vous connecter maintenant.',
        goToLogin: 'Aller à la Connexion'
      },
      invalid: {
        title: 'Lien de Vérification Invalide',
        message: 'Ce lien de vérification est invalide ou a déjà été utilisé.',
        resendIntro: 'Demander un nouvel email de vérification :'
      },
      manualEntry: {
        title: 'Entrer le Token de Vérification',
        message: 'Collez votre token de vérification depuis l\'email',
        tokenLabel: 'Token de Vérification',
        tokenPlaceholder: 'Entrez le token de 64 caractères',
        verify: 'Vérifier l\'Email'
      },
      resendSuccess: 'Email de vérification envoyé ! Vérifiez votre boîte de réception.'
    }
  }
})

const route = useRoute()
const router = useRouter()
const userStore = useCurrentUserStore()
const { verifyEmail } = useEmailVerification()

const state = ref<'loading' | 'success' | 'expired' | 'alreadyVerified' | 'invalid' | 'noToken'>('loading')
const userEmail = ref('')
const manualToken = ref('')
const redirectCountdown = ref(5)
const showResendSuccess = ref(false)

let redirectTimer: NodeJS.Timeout | null = null

onMounted(async () => {
  const token = route.query.token as string

  if (!token) {
    state.value = 'noToken'
    return
  }

  // Validate token format (should be 64 hex characters)
  if (token.length !== 64 || !/^[a-f0-9]{64}$/.test(token)) {
    state.value = 'invalid'
    return
  }

  await performVerification(token)
})

const performVerification = async (token: string) => {
  state.value = 'loading'

  try {
    const response = await verifyEmail(token)

    if (response.verified) {
      state.value = 'success'

      // Update user store verification status
      // Do this whether authenticated or not (user might verify before logging in)
      if (userStore.isAuthenticated) {
        try {
          // First update the store directly for immediate UI update
          userStore.emailVerified = true
          userStore.emailVerifiedAt = new Date().toISOString()
          console.log('✅ User store updated immediately after verification')

          // Then refresh from backend to ensure consistency
          await userStore.refreshVerificationStatus()
          console.log('✅ User verification status refreshed from backend')
        } catch (refreshError) {
          console.warn('⚠️ Could not refresh verification status from backend:', refreshError)
          // The immediate update above should still work
        }
      } else {
        console.log('ℹ️ User not authenticated, verification status will be loaded on next login')
      }

      // Start redirect countdown
      startRedirectCountdown()
    }
  } catch (err: any) {
    const status = err.response?.status

    if (status === 410) {
      state.value = 'expired'
      // Try to get email from error response or user store
      userEmail.value = err.response?.data?.email || userStore.userEmail || ''
    } else if (status === 409) {
      state.value = 'alreadyVerified'
    } else {
      state.value = 'invalid'
    }
  }
}

const verifyManualToken = async () => {
  if (!manualToken.value || manualToken.value.length !== 64) return
  await performVerification(manualToken.value)
}

const startRedirectCountdown = () => {
  redirectCountdown.value = 5

  redirectTimer = setInterval(() => {
    redirectCountdown.value--

    if (redirectCountdown.value <= 0) {
      if (redirectTimer) {
        clearInterval(redirectTimer)
      }
      // Redirect to terminal sessions (main landing page)
      router.push('/terminal-sessions')
    }
  }, 1000)
}

const handleResendSuccess = () => {
  showResendSuccess.value = true
  setTimeout(() => {
    showResendSuccess.value = false
  }, 5000)
}
</script>

<style scoped>
.wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
}

.verify-email-page {
  width: 100%;
  max-width: 600px;
}

.state-container {
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-3xl);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.state-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-lg);
}

.loading-state .state-icon {
  color: var(--color-primary);
}

.success-icon {
  color: var(--color-success);
}

.error-icon {
  color: var(--color-danger);
}

.info-icon {
  color: var(--color-info);
}

.state-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.state-message {
  margin: 0 0 var(--spacing-xl) 0;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.redirect-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  background: var(--color-info-bg);
  color: var(--color-info-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.resend-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--color-border-light);
  text-align: left;
}

.resend-intro {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.manual-entry-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  text-align: left;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.form-input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-default);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-family: 'Courier New', monospace;
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.resend-success-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

@media (max-width: var(--breakpoint-md)) {
  .state-container {
    padding: var(--spacing-xl);
  }

  .state-icon {
    font-size: 48px;
  }

  .state-title {
    font-size: var(--font-size-xl);
  }
}
</style>
