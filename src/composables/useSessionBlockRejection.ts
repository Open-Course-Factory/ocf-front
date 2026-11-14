/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

/**
 * The learner's side of a session block (#384).
 *
 * Starting, resuming or launching while blocked is refused by ocf-core with
 *
 *   403 { error_message: 'session_start_blocked', scope: 'group'|'org'|'global', reason }
 *
 * The learner reads who blocked them — their class, their organisation or the
 * platform — and the reason given, in their language; never the raw code.
 */

import { useTranslations } from './useTranslations'

/** HTTP 403 `session_start_blocked`. Pure — safe to call anywhere. */
export function isSessionBlockRejection(err: any): boolean {
  return err?.response?.status === 403 && err?.response?.data?.error_message === 'session_start_blocked'
}

export function useSessionBlockRejection() {
  const { t } = useTranslations({
    en: {
      sessionBlock: {
        group: 'Your trainer has blocked new sessions for you in this class.',
        org: 'Your organisation has blocked new sessions for you.',
        global: 'The platform has blocked new sessions for your account.',
        reason: 'Reason: {reason}'
      }
    },
    fr: {
      sessionBlock: {
        group: 'Votre formateur a bloqué le lancement de sessions pour vous dans cette classe.',
        org: 'Votre organisation a bloqué le lancement de sessions pour vous.',
        global: 'La plateforme a bloqué le lancement de sessions pour votre compte.',
        reason: 'Motif : {reason}'
      }
    }
  })

  /** The refusal in the learner's words: the scope, then the reason if any. */
  function getSessionBlockMessage(err: any): string {
    const data = err?.response?.data || {}
    const scope = data.scope === 'org' || data.scope === 'global' ? data.scope : 'group'
    const message = t(`sessionBlock.${scope}`)
    const reason = typeof data.reason === 'string' ? data.reason.trim() : ''
    return reason ? `${message} ${t('sessionBlock.reason', { reason })}` : message
  }

  return { getSessionBlockMessage }
}
