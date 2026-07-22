/**
 * Shared formatting for subscription-plan display (billing interval + the
 * typed-field pricing bullets). Single source of truth so the plans page, the
 * checkout wizard, and any future plan surface render these identically.
 */

import { useI18n } from 'vue-i18n'
import { formatBudgetAsSizes, CANONICAL_SIZE_CATALOG } from '../utils/quotaFormatters'

// Bilingual labels for the typed-field pricing bullets. `{n}` is interpolated
// with the relevant numeric value. Kept as a local dict (not vue-i18n keys) so
// callers get the copy without registering global i18n messages — mirrors the
// featureLabels pattern above.
const bulletLabels = {
  unlimitedCapacity: { en: 'Unlimited capacity', fr: 'Capacité illimitée' },
  sessionDuration: { en: 'Max session duration: {n} min', fr: 'Durée max de session : {n} min' },
  networkAccess: { en: 'Internet access', fr: 'Accès à Internet' },
  persistentStorage: { en: 'Persistent storage: {n} GB', fr: 'Stockage persistant : {n} Go' },
  commandHistory: { en: 'Command history: {n} days', fr: 'Historique des commandes : {n} jours' },
  sessionSupervision: { en: 'Session supervision (trainer)', fr: 'Supervision des sessions (formateur)' },
}

/** Typed plan fields read by {@link derivePlanBullets}. */
interface PlanBulletFields {
  max_cpu?: number
  max_memory_mb?: number
  max_session_duration_minutes?: number
  network_access_enabled?: boolean
  data_persistence_enabled?: boolean
  data_persistence_gb?: number
  command_history_retention_days?: number
  session_supervision_enabled?: boolean
}

export function usePlanFormatters() {
  const { locale } = useI18n()

  function label(entry: { en: string; fr: string }, n?: number): string {
    const text = locale.value === 'fr' ? entry.fr : entry.en
    return n === undefined ? text : text.replace('{n}', String(n))
  }

  /**
   * Build the ordered customer-facing pricing bullets for a plan from its
   * TYPED columns only (never `features[]`). Order:
   *   1. capacity/budget (always) — size summary, or "Unlimited capacity" for 0/0
   *   2. session duration    (iff max_session_duration_minutes > 0)
   *   3. internet access     (iff network_access_enabled)
   *   4. persistent storage  (iff data_persistence_enabled) — embeds the GB value
   *   5. command history      (iff command_history_retention_days > 0) — embeds days
   *   6. session supervision (iff session_supervision_enabled)
   */
  function derivePlanBullets(plan: PlanBulletFields): string[] {
    const bullets: string[] = []

    const joiner = locale.value === 'fr' ? 'OU' : 'OR'
    const sizes = formatBudgetAsSizes(plan, CANONICAL_SIZE_CATALOG, joiner)
    bullets.push(sizes || label(bulletLabels.unlimitedCapacity))

    if ((plan.max_session_duration_minutes ?? 0) > 0) {
      bullets.push(label(bulletLabels.sessionDuration, plan.max_session_duration_minutes))
    }
    if (plan.network_access_enabled === true) {
      bullets.push(label(bulletLabels.networkAccess))
    }
    if (plan.data_persistence_enabled === true) {
      bullets.push(label(bulletLabels.persistentStorage, plan.data_persistence_gb ?? 0))
    }
    if ((plan.command_history_retention_days ?? 0) > 0) {
      bullets.push(label(bulletLabels.commandHistory, plan.command_history_retention_days))
    }
    if (plan.session_supervision_enabled === true) {
      bullets.push(label(bulletLabels.sessionSupervision))
    }

    return bullets
  }

  function formatBillingInterval(interval: string | undefined): string {
    if (locale.value === 'fr') {
      return interval === 'year' ? 'an' : 'mois'
    }
    return interval === 'year' ? 'year' : 'month'
  }

  return { formatBillingInterval, derivePlanBullets }
}
