/**
 * Composable: useComposeErrorMessage
 *
 * Translates the English error wrapper that ocf-core emits when
 * StartComposedSession fails downstream (tt-backend rejection, Incus
 * error, storage volume missing, distribution unavailable, etc.).
 *
 * The backend wraps the failure via `terminalTrainerEnumService.FormatError`:
 *
 *   "Failed to start composed session: <description> (status=<N>, name=<name>)"
 *
 * This string is propagated by the controller as the `error_message` field
 * of the JSON response and was previously displayed verbatim in a toast,
 * leaking English text into the French UI.
 *
 * Detection is a regex on the structured `(status=N, name=X)` marker. The
 * `name` token maps to a localized message; if the name is unknown the
 * caller's fallback applies (so future enum additions don't silently break
 * the UX — they just keep the existing generic message).
 *
 * Enum names mirror ocf-core's `session_status` enum in
 *   `src/terminalTrainer/services/terminalTrainerEnumService.go`
 * (which itself mirrors tt-backend's `InstanceCreationStatus`). Duplicating
 * the names here is intentional SSOT smell: TS/Go can't share types without
 * codegen, and the enum is small and stable.
 */

import { useTranslations } from './useTranslations'

/**
 * Regex matching the structured marker appended by ocf-core's FormatError.
 * Exported for tests; consumers should prefer `useComposeErrorMessage`.
 */
export const COMPOSE_ERROR_MARKER = /\(status=(\d+), name=([a-z_]+)\)/

export function useComposeErrorMessage() {
  const { t, te } = useTranslations({
    en: {
      composeError: {
        invalid_terms: 'The terms of service were not accepted or are invalid for this session.',
        server_full: 'The server has reached its capacity. Please try again later or pick a smaller distribution.',
        quota_reached: 'You have reached your concurrent session quota. Please close an existing terminal before starting a new one.',
        user_banned: 'Your account is currently restricted from creating new sessions. Please contact support.',
        unknown_error: 'An unexpected error occurred while creating your session. Please try again or contact support.',
        expired: 'The session has expired or no longer exists. Please start a new one.',
      }
    },
    fr: {
      composeError: {
        invalid_terms: "Les conditions d'utilisation n'ont pas été acceptées ou sont invalides pour cette session.",
        server_full: 'Le serveur a atteint sa capacité maximale. Réessayez plus tard ou choisissez une distribution plus légère.',
        quota_reached: 'Vous avez atteint votre quota de sessions simultanées. Fermez un terminal existant avant d\'en démarrer un nouveau.',
        user_banned: 'Votre compte est actuellement empêché de créer de nouvelles sessions. Veuillez contacter le support.',
        unknown_error: 'Une erreur inattendue est survenue lors de la création de votre session. Réessayez ou contactez le support.',
        expired: 'La session a expiré ou n\'existe plus. Veuillez en démarrer une nouvelle.',
      }
    }
  })

  /**
   * Extract the localized message from a server-side compose error string.
   *
   * Returns `null` when:
   *   - the input doesn't carry the `(status=N, name=X)` marker
   *   - the parsed `name` has no translation entry (caller's fallback wins)
   *
   * Callers should pattern: `getComposeErrorMessage(raw) ?? fallbackText`.
   */
  function getComposeErrorMessage(raw: string | null | undefined): string | null {
    if (!raw) return null
    const match = COMPOSE_ERROR_MARKER.exec(raw)
    if (!match) return null
    const name = match[2]
    const key = `composeError.${name}`
    // `te` is vue-i18n's "translation exists" check — safer than comparing
    // the returned value to the key (which would mis-trigger if a translation
    // accidentally equals the key string).
    if (!te(key)) return null
    return t(key)
  }

  return { getComposeErrorMessage }
}
