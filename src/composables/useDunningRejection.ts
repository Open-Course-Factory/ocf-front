/**
 * Composable: useDunningRejection
 *
 * Single source of truth for the backend's dunning (past-due) rejection.
 *
 * When a `past_due` subscription runs out of its grace period, ocf-core rejects
 * terminal/scenario starts with HTTP 402 and a payload shaped like the other
 * quota rejections but carrying a STRING error_code:
 *
 *   { error_code: 'subscription_past_due', error_message, source: 'dunning' }
 *
 * `error_message` is English-only (server-generated), so the frontend must not
 * surface it. This helper centralizes the detection (status 402 + dunning
 * source) and the localized copy so the composed-start, resume, and
 * scenario-launch flows all render the same "settle your overdue invoice"
 * treatment. Each caller keeps its own confirm + navigation (they use different
 * notification plumbing), routing to /subscription-dashboard on confirm.
 */

import { useTranslations } from './useTranslations'

/**
 * Detect a dunning rejection: HTTP 402 with `source: 'dunning'` (or the
 * `subscription_past_due` error_code). Pure — safe to call anywhere.
 */
export function isDunningRejection(err: any): boolean {
  const data = err?.response?.status === 402 ? err?.response?.data : undefined
  if (!data) return false
  return data.source === 'dunning' || data.error_code === 'subscription_past_due'
}

export interface DunningCopy {
  title: string
  message: string
  action: string
  dismiss: string
}

/**
 * Registers the `dunning` translation namespace on first use and exposes the
 * detection helper plus the localized confirm-dialog copy.
 */
export function useDunningRejection() {
  const { t } = useTranslations({
    en: {
      dunning: {
        title: 'Payment issue with your subscription',
        message: 'Your subscription payment is past due, so new terminals are paused. Please update your payment method to restore access.',
        action: 'Update payment method',
        dismiss: 'Not now'
      }
    },
    fr: {
      dunning: {
        title: 'Problème de paiement de votre abonnement',
        message: 'Le paiement de votre abonnement est en retard : la création de terminaux est suspendue. Veuillez mettre à jour votre moyen de paiement pour rétablir l\'accès.',
        action: 'Mettre à jour le paiement',
        dismiss: 'Plus tard'
      }
    }
  })

  function getDunningCopy(): DunningCopy {
    return {
      title: t('dunning.title'),
      message: t('dunning.message'),
      action: t('dunning.action'),
      dismiss: t('dunning.dismiss')
    }
  }

  return { isDunningRejection, getDunningCopy }
}
