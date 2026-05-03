/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Composable that returns a translator for scenario difficulty levels
 * (beginner / intermediate / advanced). Falls back to the raw value when
 * the key has no translation, so unknown difficulties still render.
 */

import { useTranslations } from './useTranslations'

export function useDifficultyLabel() {
  const { t } = useTranslations({
    en: {
      difficulty: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced'
      }
    },
    fr: {
      difficulty: {
        beginner: 'Débutant',
        intermediate: 'Intermédiaire',
        advanced: 'Avancé'
      }
    }
  })

  return (raw: string | undefined | null): string => {
    if (!raw) return ''
    const key = raw.toLowerCase()
    const translated = t(`difficulty.${key}`)
    // vue-i18n returns the key path when no translation exists
    return translated.startsWith('difficulty.') ? raw : translated
  }
}
