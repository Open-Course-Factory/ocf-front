import { useTranslations, type TranslationMessages } from './useTranslations'

/**
 * The stable code of an ocf-core failure. errors.Abort answers
 * `{ error_code: <HTTP status>, error_message: "<stable_code>" }`; a few
 * payloads (the dunning rejection) carry the code as a string error_code.
 */
export function apiErrorCode(err: any): string | undefined {
  const data = err?.response?.data
  return typeof data?.error_code === 'string' ? data.error_code : data?.error_message
}

/**
 * Reads ocf-core's coded failures in the reader's language. Registers `messages` under
 * `namespace` and returns a reader giving the translation of a known code, or
 * null for anything else — each caller decides what an unknown failure shows.
 * Call it in setup.
 */
export function useApiErrorCode(namespace: string, messages: TranslationMessages) {
  const { t, te } = useTranslations({
    en: { [namespace]: messages.en },
    fr: { [namespace]: messages.fr }
  })

  return (err: any): string | null => {
    const code = apiErrorCode(err)
    return code && te(`${namespace}.${code}`) ? t(`${namespace}.${code}`) : null
  }
}
