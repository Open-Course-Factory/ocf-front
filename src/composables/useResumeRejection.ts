/**
 * Composable: useResumeRejection
 *
 * The one answer to a refused resume (POST /terminals/:id/start), shared by
 * the session view and "My sessions" so the two cannot drift again (#390).
 *
 * Order matters: dunning (402) first, then quota full, session block, any
 * other quota-class rejection carrying a `source`, and finally the backend
 * message or the caller's fallback.
 */

import { useRouter } from 'vue-router'
import { useNotification } from './useNotification'
import { useDunningRejection } from './useDunningRejection'
import { isQuotaFullRejection, useBudgetRejection } from './useBudgetRejection'
import { isSessionBlockRejection, useSessionBlockRejection } from './useSessionBlockRejection'
import { useLimitReachedMessage } from './useLimitReachedMessage'

export interface ResumeRejectionOptions {
  /** Organization of the refused session, to name the machines using its quota. */
  organizationId?: string
  /** Shown when the backend gives no message. */
  fallbackMessage: string
  /** Title of the error notification, if the page uses one. */
  title?: string
}

export function useResumeRejection() {
  const router = useRouter()
  const { showConfirm, showError } = useNotification()
  const { isDunningRejection, getDunningCopy } = useDunningRejection()
  const { getResumeQuotaFullMessage } = useBudgetRejection()
  const { getSessionBlockMessage } = useSessionBlockRejection()
  const { getLimitReachedMessage } = useLimitReachedMessage()

  async function handleResumeRejection(err: any, options: ResumeRejectionOptions): Promise<void> {
    // Dunning before the source→limit mapping, which would show the wrong
    // "concurrent terminal limit" copy. Offer the subscription dashboard.
    if (isDunningRejection(err)) {
      const copy = getDunningCopy()
      const confirmed = await showConfirm(copy.message, copy.title, {
        confirmButtonText: copy.action,
        cancelButtonText: copy.dismiss
      })
      if (confirmed) {
        Promise.resolve(router.push('/subscription-dashboard')).catch(() => {})
      }
      return
    }
    let message: string
    if (isQuotaFullRejection(err)) {
      // Only running machines use the quota, so name the ones to stop.
      message = await getResumeQuotaFullMessage(options.organizationId)
    } else if (isSessionBlockRejection(err)) {
      // Blocked by a trainer, the organisation or the platform (#384).
      message = getSessionBlockMessage(err)
    } else if (err?.response?.data?.source) {
      // Quota-class 403s: localize from `source`, never the English error_message.
      message = getLimitReachedMessage({ source: err.response.data.source })
    } else {
      message = err?.response?.data?.error_message || err?.message || options.fallbackMessage
    }
    showError(message, options.title)
  }

  return { handleResumeRejection }
}
