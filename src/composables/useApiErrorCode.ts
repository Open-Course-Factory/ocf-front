import { useTranslations, type TranslationMessages } from './useTranslations'

/**
 * Reads ocf-core's coded failures in the reader's language. errors.Abort
 * answers `{ error_code: <HTTP status>, error_message: "<stable_code>" }`, so
 * the code to translate is error_message. Registers `messages` under
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
    const code = err?.response?.data?.error_message
    return code && te(`${namespace}.${code}`) ? t(`${namespace}.${code}`) : null
  }
}
