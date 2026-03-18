/**
 * Composable to simplify translation registration in components and stores
 *
 * This composable provides a cleaner way to register translations without
 * manually calling mergeLocaleMessage for each locale in onMounted.
 *
 * @example
 * // In a component or store
 * import { useTranslations } from '../composables/useTranslations'
 *
 * const { t } = useTranslations({
 *   en: {
 *     myComponent: {
 *       title: 'My Component',
 *       description: 'This is my component'
 *     }
 *   },
 *   fr: {
 *     myComponent: {
 *       title: 'Mon Composant',
 *       description: 'Ceci est mon composant'
 *     }
 *   }
 * })
 */

// onMounted no longer needed — translations are registered immediately in setup()
import { useI18n } from 'vue-i18n'
import i18nInstance from '../i18n'

/**
 * Translation messages organized by locale
 */
export interface TranslationMessages {
  en: Record<string, any>
  fr: Record<string, any>
  [locale: string]: Record<string, any>
}

/**
 * Wraps a vue-i18n `t` function with error handling so that message
 * compilation errors (e.g. unescaped `@` in vue-i18n v11) log a warning
 * instead of crashing the entire component.
 */
function wrapT<T extends (...args: any[]) => any>(t: T): T {
  return ((...args: any[]) => {
    try {
      return t(...args)
    } catch (err) {
      console.warn(
        `[vue-i18n] Message compilation error for key "${String(args[0])}":`,
        err instanceof Error ? err.message : err
      )
      return String(args[0])
    }
  }) as T
}

/**
 * Register translations and return the translation function
 *
 * Must be called inside a Vue component's setup() function.
 *
 * @param messages - Translation messages organized by locale
 * @returns The translation function and i18n instance
 */
export function useTranslations(messages: TranslationMessages) {
  const i18n = useI18n()
  const { te, locale } = i18n

  // Register translations immediately during setup() so they are
  // available on first render. Previously deferred to onMounted, but
  // vue-i18n v11 no longer triggers reactivity from mergeLocaleMessage.
  Object.entries(messages).forEach(([localeKey, translations]) => {
    i18n.mergeLocaleMessage(localeKey, translations)
  })

  return {
    t: wrapT(i18n.t),
    te,
    locale,
    i18n
  }
}

/**
 * Simplified version for store usage - uses the global i18n instance directly
 * so it can be called outside of a Vue component's setup() context.
 *
 * @example
 * import { useStoreTranslations } from '../composables/useTranslations'
 *
 * const { t } = useStoreTranslations({
 *   en: { users: { title: 'Users' } },
 *   fr: { users: { title: 'Utilisateurs' } }
 * })
 */
export function useStoreTranslations(messages: TranslationMessages) {
  const global = i18nInstance.global

  // Register translations immediately using the global i18n instance
  Object.entries(messages).forEach(([localeKey, translations]) => {
    global.mergeLocaleMessage(localeKey, translations)
  })

  return {
    t: wrapT(global.t),
    te: global.te,
    locale: global.locale,
    i18n: global
  }
}
