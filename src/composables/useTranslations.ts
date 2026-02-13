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

import { onMounted } from 'vue'
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
 * Register translations and return the translation function
 *
 * Must be called inside a Vue component's setup() function.
 *
 * @param messages - Translation messages organized by locale
 * @param immediate - If true, register translations immediately instead of in onMounted (default: false)
 * @returns The translation function and i18n instance
 */
export function useTranslations(messages: TranslationMessages, immediate: boolean = false) {
  const i18n = useI18n()
  const { t, te, locale } = i18n

  const registerTranslations = () => {
    Object.entries(messages).forEach(([localeKey, translations]) => {
      i18n.mergeLocaleMessage(localeKey, translations)
    })
  }

  if (immediate) {
    // Register immediately (useful for stores)
    registerTranslations()
  } else {
    // Register in onMounted (standard for components)
    onMounted(() => {
      registerTranslations()
    })
  }

  return {
    t,
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
    t: global.t,
    te: global.te,
    locale: global.locale,
    i18n: global
  }
}
