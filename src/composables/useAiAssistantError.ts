/**
 * Composable: useAiAssistantError
 *
 * Translates the organization AI assistant's rejections (ocf-core
 * organizationAiConfigController.go) into FR/EN copy. The backend's message
 * is an English code, never something to show as is, so any failure without
 * a known code gets the caller's own generic message.
 */

import { useApiErrorCode } from './useApiErrorCode'

export function useAiAssistantError() {
  const translateCode = useApiErrorCode('aiAssistantError', {
    en: {
      ai_endpoint_invalid: 'The endpoint must be a public https:// address.',
      ai_key_required: 'The endpoint changed: enter the API key again so the stored key is never sent to a new address.',
      ai_not_configured: 'This organization has no AI assistant switched on. Copy the prompt below and do it manually.',
      ai_request_too_large: 'This scenario is too large to send to the AI assistant. Copy the prompt below and do it manually.',
      ai_provider_error: 'The AI assistant failed or did not answer in time. Check its endpoint, model and key, or copy the prompt below and do it manually.'
    },
    fr: {
      ai_endpoint_invalid: 'L\'endpoint doit être une adresse https:// publique.',
      ai_key_required: 'L\'endpoint a changé : saisissez à nouveau la clé API, pour que la clé enregistrée ne soit jamais envoyée à une nouvelle adresse.',
      ai_not_configured: 'Aucun assistant IA n\'est activé pour cette organisation. Copiez le prompt ci-dessous et faites-le manuellement.',
      ai_request_too_large: 'Ce scénario est trop volumineux pour être envoyé à l\'assistant IA. Copiez le prompt ci-dessous et faites-le manuellement.',
      ai_provider_error: 'L\'assistant IA a échoué ou n\'a pas répondu à temps. Vérifiez son endpoint, son modèle et sa clé, ou copiez le prompt ci-dessous et faites-le manuellement.'
    }
  })

  function aiAssistantErrorMessage(err: any, fallback: string): string {
    return translateCode(err) || fallback
  }

  return { aiAssistantErrorMessage }
}
