import { ref, computed, onUnmounted } from 'vue'
import { authService } from '../services/auth'
import type { VerifyEmailResponse } from '../types/auth'

export function useEmailVerification() {
  const isVerifying = ref(false)
  const isResending = ref(false)
  const error = ref<string | null>(null)
  const resendCooldown = ref(0)
  const lastResendTime = ref<number | null>(null)

  let cooldownTimer: NodeJS.Timeout | null = null

  const canResend = computed(() => resendCooldown.value === 0 && !isResending.value)

  /**
   * Verify email with token
   */
  const verifyEmail = async (token: string): Promise<VerifyEmailResponse> => {
    isVerifying.value = true
    error.value = null

    try {
      const response = await authService.verifyEmail(token)
      return response
    } catch (err: any) {
      const status = err.response?.status
      // Map errors to user-friendly messages
      if (status === 410) {
        error.value = 'verificationExpired'
      } else if (status === 409) {
        error.value = 'alreadyVerified'
      } else if (status === 404 || status === 400) {
        error.value = 'invalidToken'
      } else {
        error.value = 'verificationFailed'
      }

      throw err
    } finally {
      isVerifying.value = false
    }
  }

  /**
   * Resend verification email
   */
  const resendVerification = async (email: string): Promise<boolean> => {
    if (!canResend.value) {
      return false
    }

    isResending.value = true
    error.value = null

    try {
      await authService.resendVerification(email)

      // Start 2-minute cooldown
      lastResendTime.value = Date.now()
      resendCooldown.value = 120 // 2 minutes in seconds
      startCooldownTimer()

      return true
    } catch (err: any) {
      const errorCode = err.response?.data?.error

      if (errorCode === 'TOO_MANY_ATTEMPTS') {
        error.value = 'tooManyAttempts'
      } else {
        error.value = 'resendFailed'
      }

      return false
    } finally {
      isResending.value = false
    }
  }

  /**
   * Start cooldown timer
   */
  const startCooldownTimer = () => {
    if (cooldownTimer) {
      clearInterval(cooldownTimer)
    }

    cooldownTimer = setInterval(() => {
      if (resendCooldown.value > 0) {
        resendCooldown.value--
      } else {
        if (cooldownTimer) {
          clearInterval(cooldownTimer)
          cooldownTimer = null
        }
      }
    }, 1000)
  }

  /**
   * Format cooldown time as M:SS
   */
  const formatCooldown = computed(() => {
    const minutes = Math.floor(resendCooldown.value / 60)
    const seconds = resendCooldown.value % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  })

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Cleanup timer on unmount
   */
  onUnmounted(() => {
    if (cooldownTimer) {
      clearInterval(cooldownTimer)
    }
  })

  return {
    isVerifying,
    isResending,
    error,
    canResend,
    resendCooldown,
    formatCooldown,
    verifyEmail,
    resendVerification,
    clearError
  }
}
