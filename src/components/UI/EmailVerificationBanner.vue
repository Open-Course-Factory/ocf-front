<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div v-if="showBanner" class="email-verification-banner">
    <div class="banner-content">
      <i class="fas fa-exclamation-triangle banner-icon"></i>
      <span class="banner-text">{{ t('emailBanner.message') }}</span>
      <button
        class="resend-btn"
        @click="handleResend"
        :disabled="resendCooldown > 0 || isResending"
      >
        <span v-if="isResending">
          <i class="fas fa-spinner fa-spin"></i>
        </span>
        <span v-else-if="resendCooldown > 0">
          {{ t('emailBanner.resendIn', { seconds: resendCooldown }) }}
        </span>
        <span v-else>
          <i class="fas fa-paper-plane"></i> {{ t('emailBanner.resend') }}
        </span>
      </button>
      <button class="close-btn" @click="dismiss" :title="t('emailBanner.dismiss')">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'

const STORAGE_KEY = 'ocf_email_banner_dismissed'
const RESEND_COOLDOWN_SECONDS = 120

const { t } = useTranslations({
  en: {
    emailBanner: {
      message: 'Please verify your email address. Check your inbox for a verification link.',
      resend: 'Resend verification email',
      resendIn: 'Resend in {seconds}s',
      resendSuccess: 'Verification email sent!',
      resendError: 'Failed to send verification email. Please try again.',
      rateLimited: 'Too many requests. Please wait before trying again.',
      dismiss: 'Dismiss'
    }
  },
  fr: {
    emailBanner: {
      message: 'Veuillez vérifier votre adresse email. Consultez votre boîte de réception pour le lien de vérification.',
      resend: 'Renvoyer l\'email de vérification',
      resendIn: 'Renvoyer dans {seconds}s',
      resendSuccess: 'Email de vérification envoyé !',
      resendError: 'Échec de l\'envoi de l\'email de vérification. Veuillez réessayer.',
      rateLimited: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
      dismiss: 'Fermer'
    }
  }
})

const emit = defineEmits<{
  (e: 'visible', value: boolean): void
}>()

const currentUserStore = useCurrentUserStore()
const dismissed = ref(false)
const isResending = ref(false)
const resendCooldown = ref(0)

const showBanner = computed(() => {
  return currentUserStore.isAuthenticated && !currentUserStore.emailVerified && !dismissed.value
})

// Notify parent of visibility changes
watch(showBanner, (visible) => {
  emit('visible', visible)
}, { immediate: true })

// Auto-hide when verification completes
watch(() => currentUserStore.emailVerified, (verified) => {
  if (verified) {
    dismissed.value = true
  }
})

onMounted(() => {
  dismissed.value = sessionStorage.getItem(STORAGE_KEY) === 'true'
})

function dismiss() {
  dismissed.value = true
  sessionStorage.setItem(STORAGE_KEY, 'true')
}

async function handleResend() {
  if (resendCooldown.value > 0 || isResending.value) return

  isResending.value = true
  try {
    await axios.post('/auth/resend-verification', {
      email: currentUserStore.userEmail
    })
    startCooldown()
  } catch (error: any) {
    if (error.response?.status === 429) {
      // Rate limited - start a cooldown anyway
      startCooldown()
    }
    console.error('Failed to resend verification email:', error)
  } finally {
    isResending.value = false
  }
}

function startCooldown() {
  resendCooldown.value = RESEND_COOLDOWN_SECONDS
  const interval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(interval)
    }
  }, 1000)
}
</script>

<style scoped>
.email-verification-banner {
  background-color: var(--color-warning-bg);
  border-bottom: 2px solid var(--color-warning);
  padding: var(--spacing-sm) var(--spacing-lg);
  margin-top: 60px; /* Below the fixed TopMenu */
  margin-bottom: 0;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.banner-icon {
  color: var(--color-warning);
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

.banner-text {
  color: var(--color-warning-text);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  flex: 1;
}

.resend-btn {
  background-color: var(--color-warning);
  color: var(--color-white);
  border: none;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--transition-base);
  flex-shrink: 0;
}

.resend-btn:hover:not(:disabled) {
  background-color: var(--color-warning-hover);
}

.resend-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-warning-text);
  font-size: var(--font-size-base);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-base);
  flex-shrink: 0;
}

.close-btn:hover {
  background-color: var(--color-warning-border);
}

/* Responsive */
@media (max-width: 768px) {
  .banner-content {
    flex-wrap: wrap;
  }

  .banner-text {
    font-size: var(--font-size-xs);
  }

  .resend-btn {
    font-size: var(--font-size-xs);
  }
}
</style>
