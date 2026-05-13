/**
 * Composable: useLimitReachedMessage
 *
 * Single source of truth for converting a backend `source` field into a
 * localized "limit reached" message.
 *
 * The backend's CheckLimit middleware returns 403 with payload:
 *
 *   { error_code: 403, error_message: "Usage limit exceeded for ...", source: "personal" | "organization" }
 *
 * `error_message` is English-only (server-generated). `source` tells the
 * frontend WHICH localized branch to render — personal vs organization —
 * matching the i18n keys defined in `terminalStarter` translations.
 *
 * Originally lived inline in `TerminalStarter.vue`. Extracted here so:
 *   1. The resume flow in `TerminalSessionView.vue` can reuse the same
 *      localization rules (the raw English `error_message` was bleeding
 *      into the toast before).
 *   2. Future surface area (bulk-create, scenario-launcher, anywhere
 *      that hits a quota gate) gets the same UX for free.
 *
 * Note on `isAssignedSubscription`: when the user's current subscription
 * is "assigned" (a license issued by a teacher/org for a learner), the
 * message wording shifts from "upgrade your plan" to "close an existing
 * terminal" — the learner can't upgrade. The flag is a CALLER concern
 * (each consumer derives it from its own subscription view), so the
 * composable takes it as an argument.
 */

import { useTranslations } from './useTranslations'

export interface LimitReachedOptions {
  /**
   * The `source` field from the backend 403 payload. When present and
   * equal to "organization", the org-localized branch fires. Anything
   * else (including undefined) falls through to the personal/assigned
   * branches.
   */
  source?: string
  /**
   * Whether the user's current subscription is an "assigned" license.
   * Controls the wording for non-org consumers — assigned learners get
   * a message that does NOT suggest upgrading.
   */
  isAssignedSubscription?: boolean
}

/**
 * Build a localized "limit reached" toast message from a backend source
 * hint. Registers the `terminalStarter` translation namespace on first
 * use so callers do not need to.
 */
export function useLimitReachedMessage() {
  const { t } = useTranslations({
    en: {
      terminalStarter: {
        errorLimitReached: 'You have reached your limit of concurrent terminals. Please stop an existing terminal or upgrade your plan.',
        errorLimitReachedOrg: 'You have reached the concurrent terminal limit provided by your organization\'s plan. You can upgrade to a personal plan for more, or contact your organization administrator.',
        errorLimitReachedAssigned: 'You have used all your available terminals. Please close an existing terminal to start a new one.'
      }
    },
    fr: {
      terminalStarter: {
        errorLimitReached: 'Vous avez atteint votre limite de terminaux simultanés. Veuillez arrêter un terminal existant ou mettre à niveau votre plan.',
        errorLimitReachedOrg: 'Vous avez atteint la limite de terminaux simultanés fournie par le plan de votre organisation. Vous pouvez souscrire un plan personnel pour en avoir plus, ou contacter l\'administrateur de votre organisation.',
        errorLimitReachedAssigned: 'Vous avez utilisé tous vos terminaux disponibles. Veuillez fermer un terminal existant pour en démarrer un nouveau.'
      }
    }
  })

  /**
   * Returns the localized message string for the given source.
   *
   *  - source === 'organization' → org-plan message
   *  - isAssignedSubscription    → assigned-learner message
   *  - otherwise                 → personal-plan message
   */
  function getLimitReachedMessage(opts: LimitReachedOptions = {}): string {
    if (opts.source === 'organization') {
      return t('terminalStarter.errorLimitReachedOrg')
    }
    if (opts.isAssignedSubscription) {
      return t('terminalStarter.errorLimitReachedAssigned')
    }
    return t('terminalStarter.errorLimitReached')
  }

  return { getLimitReachedMessage }
}
