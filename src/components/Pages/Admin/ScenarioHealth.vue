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
import axios from 'axios'
import { useTranslations } from '../../../composables/useTranslations'
import HealthReport from '../../Admin/HealthReport.vue'
import { useScenarioHealthSentence, type ScenarioHealthFinding as Finding } from '../../../composables/useScenarioHealthSentence'

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
      why: 'Pourquoi',
      affected: 'Étapes'
    }
  }
})

const { sentence } = useScenarioHealthSentence()

async function load(): Promise<ScenarioHealth[]> {
  const response = await axios.get('/scenarios/health')
  return response.data || []
}
</script>

<template>
  <HealthReport i18n-prefix="health" :load="load" :item-key="(scenario: ScenarioHealth) => scenario.scenario_id">
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

