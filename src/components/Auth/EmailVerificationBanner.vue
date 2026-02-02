<template>
  <div v-if="userStore.needsEmailVerification && !isDismissed" class="verification-banner">
    <div class="banner-content">
      <div class="banner-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>

      <div class="banner-message">
        <strong>{{ t('emailVerification.banner.title') }}</strong>
        <p class="banner-email">{{ userStore.userEmail }}</p>
      </div>

      <div class="banner-actions">
        <button
          class="btn-resend"
          :disabled="!canResend || isResending"
          @click="handleResend"
        >
          <i v-if="isResending" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-envelope"></i>
          <span v-if="canResend">{{ t('emailVerification.banner.resend') }}</span>
          <span v-else>{{ formatCooldown }}</span>
        </button>

        <button
          class="btn-refresh"
          :disabled="isRefreshing"
          @click="handleRefresh"
        >
          <i :class="['fas fa-sync-alt', { 'fa-spin': isRefreshing }]"></i>
          {{ t('emailVerification.banner.refresh') }}
        </button>

        <button class="btn-dismiss" @click="dismiss">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <div v-if="showResendSuccess" class="banner-success">
      <i class="fas fa-check-circle"></i>
      {{ t('emailVerification.banner.emailSent') }}
    </div>

    <div v-if="error" class="banner-error">
      <i class="fas fa-exclamation-circle"></i>
      {{ t(`emailVerification.errors.${error}`) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useEmailVerification } from '../../composables/useEmailVerification'
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    emailVerification: {
      banner: {
        title: 'Please verify your email address',
        resend: 'Resend Email',
        refresh: 'Refresh Status',
        emailSent: 'Verification email sent! Check your inbox.'
      },
      errors: {
        tooManyAttempts: 'Too many attempts. Please try again later.',
        resendFailed: 'Failed to send email. Please try again.'
      }
    }
  },
  fr: {
    emailVerification: {
      banner: {
        title: 'Veuillez vérifier votre adresse email',
        resend: 'Renvoyer l\'Email',
        refresh: 'Actualiser le Statut',
        emailSent: 'Email envoyé ! Vérifiez votre boîte de réception.'
      },
      errors: {
        tooManyAttempts: 'Trop de tentatives. Veuillez réessayer plus tard.',
        resendFailed: 'Échec de l\'envoi. Veuillez réessayer.'
      }
    }
  }
})

const userStore = useCurrentUserStore()
const {
  isResending,
  error,
  canResend,
  formatCooldown,
  resendVerification,
  clearError
} = useEmailVerification()

const isDismissed = ref(false)
const isRefreshing = ref(false)
const showResendSuccess = ref(false)

const handleResend = async () => {
  if (!canResend.value) return

  clearError()
  showResendSuccess.value = false

  const success = await resendVerification(userStore.userEmail)

  if (success) {
    showResendSuccess.value = true
    setTimeout(() => {
      showResendSuccess.value = false
    }, 5000)
  }
}

const handleRefresh = async () => {
  isRefreshing.value = true
  try {
    await userStore.refreshVerificationStatus()
  } catch (err) {
    console.error('Failed to refresh verification status:', err)
  } finally {
    isRefreshing.value = false
  }
}

const dismiss = () => {
  isDismissed.value = true
}
</script>

<style scoped>
.verification-banner {
  background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
  border: 1px solid #ffc107;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.banner-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 193, 7, 0.2);
  border-radius: var(--border-radius-full);
  color: #856404;
  font-size: var(--font-size-xl);
}

.banner-message {
  flex: 1;
  min-width: 0;
}

.banner-message strong {
  display: block;
  color: #856404;
  font-size: var(--font-size-base);
  margin-bottom: var(--spacing-xs);
}

.banner-email {
  margin: 0;
  color: #856404;
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.btn-resend,
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: #856404;
  color: #fff;
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.btn-resend:hover:not(:disabled),
.btn-refresh:hover:not(:disabled) {
  background: #6c4e03;
}

.btn-resend:disabled,
.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-dismiss {
  padding: var(--spacing-xs);
  background: transparent;
  color: #856404;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-lg);
  transition: opacity var(--transition-fast);
}

.btn-dismiss:hover {
  opacity: 0.7;
}

.banner-success,
.banner-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.banner-success {
  background: rgba(40, 167, 69, 0.1);
  color: #155724;
}

.banner-error {
  background: rgba(220, 53, 69, 0.1);
  color: #721c24;
}

@media (max-width: var(--breakpoint-md)) {
  .banner-content {
    flex-direction: column;
    align-items: stretch;
  }

  .banner-actions {
    justify-content: space-between;
  }

  .btn-resend,
  .btn-refresh {
    flex: 1;
  }
}
</style>
