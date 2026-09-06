<script setup lang="ts">
/**
 * What the catalogue claims, measured against what it can deliver.
 *
 * Every fault listed here was found by a person playing a scenario, never by
 * anyone reading the catalogue: a language declared and quietly not offered, a
 * world whose vocabulary cannot build it, a step with no way past it. They are
 * invisible by nature — nothing errors, nothing logs, and the content looks
 * right in the editor — so the only way to find them was to walk into one.
 *
 * The page shows nothing when there is nothing wrong. A report that lists its
 * own good news is one people stop reading, and then stop believing.
 */
import { computed } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../../composables/useTranslations'
import HealthReport, { type HealthReportLabels } from '../../Admin/HealthReport.vue'

interface Finding {
  code: string
  severity: string
  locale?: string
  detail?: string
}

interface ScenarioHealth {
  scenario_id: string
  name: string
  title: string
  is_public: boolean
  declared_locales?: string[]
  offered_locales?: string[]
  findings: Finding[]
}

const { t } = useTranslations({
  en: {
    health: {
      title: 'Scenario health',
      subtitle: 'What a scenario promises and cannot deliver. Nothing here reports itself: every one of these is silent until a learner walks into it.',
      refresh: 'Check again',
      allWell: 'Every scenario delivers what it claims.',
      allWellHint: 'No language declared without being offered, no step without a way past it.',
      loadError: 'Could not read the health report',
      public: 'Public',
      declared: 'Declared',
      offered: 'Offered',
      blocking: 'Blocking',
      warning: 'Warning',
      codes: {
        locale_not_offered: 'Declared in {locale}, and the launcher does not offer it — the card shows no language choice and the scenario plays in its own language.',
        lexicon_incomplete: 'The {locale} vocabulary is incomplete, so the setup script cannot build the world: the learner gets an empty container.',
        no_steps: 'The scenario has no steps. Launching it provisions a container with nothing to do in it.',
        step_without_verification: 'Steps with no check and no flag, which a learner cannot get past: {detail}.'
      },
      why: 'Why',
      affected: 'Steps'
    }
  },
  fr: {
    health: {
      title: 'Santé des scénarios',
      subtitle: "Ce qu'un scénario promet et ne peut pas tenir. Rien de tout cela ne se signale : chacun reste invisible jusqu'à ce qu'un apprenant tombe dessus.",
      refresh: 'Vérifier à nouveau',
      allWell: 'Chaque scénario tient ce qu\'il annonce.',
      allWellHint: "Aucune langue déclarée sans être proposée, aucune étape sans moyen de la franchir.",
      loadError: 'Impossible de lire le rapport de santé',
      public: 'Public',
      declared: 'Déclarées',
      offered: 'Proposées',
      blocking: 'Bloquant',
      warning: 'Avertissement',
      codes: {
        locale_not_offered: 'Déclaré en {locale}, et le lanceur ne le propose pas — la carte n\'affiche aucun choix de langue et le scénario se joue dans la sienne.',
        lexicon_incomplete: 'Le vocabulaire {locale} est incomplet : le script d\'installation ne peut pas construire le monde et l\'apprenant reçoit un conteneur vide.',
        no_steps: "Le scénario n'a aucune étape. Le lancer provisionne un conteneur où il n'y a rien à faire.",
        step_without_verification: "Étapes sans vérification ni drapeau, qu'un apprenant ne peut pas franchir : {detail}."
      },
      why: 'Pourquoi',
      affected: 'Étapes'
    }
  }
})

const labels = computed<HealthReportLabels>(() => ({
  title: t('health.title'),
  subtitle: t('health.subtitle'),
  refresh: t('health.refresh'),
  allWell: t('health.allWell'),
  allWellHint: t('health.allWellHint'),
  loadError: t('health.loadError'),
  severity: { blocking: t('health.blocking'), warning: t('health.warning') }
}))

/**
 * The sentence for a finding, with the numbers the server filled in.
 *
 * Written here rather than sent by the server so it reads in the operator's
 * language; the server sends a stable code and the parts it alone can know.
 */
function sentence(finding: Finding): string {
  return t(`health.codes.${finding.code}`, {
    locale: finding.locale || '',
    detail: finding.detail || '',
  })
}

async function load(): Promise<ScenarioHealth[]> {
  const response = await axios.get('/scenarios/health')
  return response.data || []
}
</script>

<template>
  <HealthReport :labels="labels" :load="load" :item-key="(scenario: ScenarioHealth) => scenario.scenario_id">
    <template #card-header="{ item: scenario }">
      <h2>{{ scenario.title || scenario.name }}</h2>
      <span v-if="scenario.is_public" class="ocf-health-tag">{{ t('health.public') }}</span>
    </template>

    <template #card-meta="{ item: scenario }">
      <p v-if="scenario.declared_locales?.length" class="ocf-health-meta">
        {{ t('health.declared') }}: {{ scenario.declared_locales.join(', ') }}
        <template v-if="scenario.offered_locales?.length">
          &nbsp;·&nbsp; {{ t('health.offered') }}: {{ scenario.offered_locales.join(', ') }}
        </template>
      </p>
    </template>

    <template #finding="{ finding }">{{ sentence(finding) }}</template>
  </HealthReport>
</template>

