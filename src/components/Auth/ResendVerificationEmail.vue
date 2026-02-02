<template>
  <div class="resend-verification">
    <div v-if="!showSuccess" class="resend-form">
      <div class="form-group">
        <label for="email-input" class="form-label">
          {{ t('emailVerification.emailAddress') }}
        </label>
        <input
          id="email-input"
          v-model="email"
          type="email"
          class="form-input"
          :placeholder="t('emailVerification.emailPlaceholder')"
          :disabled="!canResend || isResending"
          @keyup.enter="handleResend"
        />
      </div>

      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ t(`emailVerification.errors.${error}`) }}
      </div>

      <button
        class="btn-resend"
        :disabled="!canResend || !email || isResending"
        @click="handleResend"
      >
        <i v-if="isResending" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-envelope"></i>
        <span v-if="canResend">{{ t('emailVerification.resendEmail') }}</span>
        <span v-else>{{ t('emailVerification.resendIn', { time: formatCooldown }) }}</span>
      </button>
    </div>

    <div v-else class="success-message">
      <i class="fas fa-check-circle"></i>
      <p>{{ t('emailVerification.emailSent') }}</p>
      <p class="success-detail">{{ t('emailVerification.checkInbox') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEmailVerification } from '../../composables/useEmailVerification'
import { useTranslations } from '../../composables/useTranslations'

const props = defineProps<{
  initialEmail?: string
}>()

const emit = defineEmits<{
  success: []
}>()

const { t } = useTranslations({
  en: {
    emailVerification: {
      emailAddress: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      resendEmail: 'Resend Verification Email',
      resendIn: 'Resend in {time}',
      emailSent: 'Verification email sent!',
      checkInbox: 'Please check your inbox and spam folder',
      errors: {
        tooManyAttempts: 'Too many attempts. Please try again later.',
        resendFailed: 'Failed to send email. Please try again.',
        verificationExpired: 'Verification link expired',
        alreadyVerified: 'Email already verified',
        invalidToken: 'Invalid verification link'
      }
    }
  },
  fr: {
    emailVerification: {
      emailAddress: 'Adresse Email',
      emailPlaceholder: 'Entrez votre adresse email',
      resendEmail: 'Renvoyer l\'Email de Vérification',
      resendIn: 'Renvoyer dans {time}',
      emailSent: 'Email de vérification envoyé !',
      checkInbox: 'Veuillez vérifier votre boîte de réception et vos spams',
      errors: {
        tooManyAttempts: 'Trop de tentatives. Veuillez réessayer plus tard.',
        resendFailed: 'Échec de l\'envoi de l\'email. Veuillez réessayer.',
        verificationExpired: 'Lien de vérification expiré',
        alreadyVerified: 'Email déjà vérifié',
        invalidToken: 'Lien de vérification invalide'
      }
    }
  }
})

const {
  isResending,
  error,
  canResend,
  formatCooldown,
  resendVerification,
  clearError
} = useEmailVerification()

const email = ref(props.initialEmail || '')
const showSuccess = ref(false)

watch(() => props.initialEmail, (newEmail) => {
  if (newEmail) {
    email.value = newEmail
  }
})

const handleResend = async () => {
  if (!canResend.value || !email.value) return

  clearError()
  showSuccess.value = false

  const success = await resendVerification(email.value)

  if (success) {
    showSuccess.value = true
    emit('success')

    // Hide success message after 10 seconds
    setTimeout(() => {
      showSuccess.value = false
    }, 10000)
  }
}
</script>

<style scoped>
.resend-verification {
  width: 100%;
}

.resend-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
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
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-resend {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-resend:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-resend:active:not(:disabled) {
  transform: translateY(0);
}

.btn-resend:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border-radius: var(--border-radius-md);
  text-align: center;
}

.success-message i {
  font-size: var(--font-size-3xl);
  color: var(--color-success);
}

.success-message p {
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.success-detail {
  font-size: var(--font-size-sm);
  opacity: 0.9;
}
</style>
