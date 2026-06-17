/**
 * Shared formatting for subscription-plan display fields (billing interval,
 * feature capability labels). Single source of truth so the plans page, the
 * checkout wizard, and any future plan surface render these identically.
 */

import { useI18n } from 'vue-i18n'

// Capability labels for the plan `features` array (snake_case keys → human text)
const featureLabels: Record<string, { en: string; fr: string }> = {
  unlimited_courses: { en: 'Unlimited courses', fr: 'Formations illimitées' },
  advanced_labs: { en: 'Advanced labs', fr: 'TP avancés' },
  export: { en: 'Course export', fr: 'Export de cours' },
  custom_themes: { en: 'Custom themes', fr: 'Thèmes personnalisés' },
  bulk_purchase: { en: 'Volume licensing', fr: 'Licences en volume' },
  group_management: { en: 'Group management', fr: 'Gestion des groupes' },
  api_access: { en: 'API access', fr: 'Accès API' },
  analytics: { en: 'Analytics dashboard', fr: 'Tableau de bord de suivi' },
  priority_support: { en: 'Priority support', fr: 'Support prioritaire' },
}

export function usePlanFormatters() {
  const { locale } = useI18n()

  function formatFeatureName(feature: string): string {
    const label = featureLabels[feature]
    if (label) {
      return locale.value === 'fr' ? label.fr : label.en
    }
    // Fallback: title-case the snake_case key
    return feature
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function formatBillingInterval(interval: string | undefined): string {
    if (locale.value === 'fr') {
      return interval === 'year' ? 'an' : 'mois'
    }
    return interval === 'year' ? 'year' : 'month'
  }

  return { formatFeatureName, formatBillingInterval }
}
