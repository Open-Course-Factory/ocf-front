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
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../../composables/useTranslations'

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

const report = ref<ScenarioHealth[]>([])
const loading = ref(true)
const error = ref('')

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

const blockingCount = computed(() =>
  report.value.reduce(
    (total, scenario) => total + scenario.findings.filter((f) => f.severity === 'blocking').length,
    0
  )
)

/**
 * The sentence for a finding, with the numbers the server filled in.
 *
 * Written here rather than sent by the server so it reads in the operator's
 * language; the server sends a stable code and the parts it alone can know.
 */
function sentence(finding: Finding): string {
  const template = t(`health.codes.${finding.code}`)
  return template
    .replace('{locale}', finding.locale || '')
    .replace('{detail}', finding.detail || '')
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await axios.get('/scenarios/health')
    report.value = response.data || []
  } catch (e: any) {
    error.value = e?.response?.data?.error_message || t('health.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="ocf-health">
    <header class="ocf-health-header">
      <div>
        <h1>{{ t('health.title') }}</h1>
        <p class="ocf-health-subtitle">{{ t('health.subtitle') }}</p>
      </div>
      <button class="btn btn-outline-secondary" :disabled="loading" @click="load">
        <i class="fas fa-rotate" /> {{ t('health.refresh') }}
      </button>
    </header>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="loading" class="ocf-health-loading">
      <i class="fas fa-circle-notch fa-spin" />
    </div>

    <div v-else-if="report.length === 0" class="ocf-health-clear">
      <i class="fas fa-circle-check" />
      <p class="ocf-health-clear-title">{{ t('health.allWell') }}</p>
      <p class="ocf-health-clear-hint">{{ t('health.allWellHint') }}</p>
    </div>

    <template v-else>
      <p class="ocf-health-count">
        <span class="ocf-health-badge ocf-health-badge-blocking">{{ blockingCount }}</span>
        {{ t('health.blocking') }}
      </p>

      <article v-for="scenario in report" :key="scenario.scenario_id" class="ocf-health-card">
        <header class="ocf-health-card-header">
          <h2>{{ scenario.title || scenario.name }}</h2>
          <span v-if="scenario.is_public" class="ocf-health-tag">{{ t('health.public') }}</span>
        </header>

        <p v-if="scenario.declared_locales?.length" class="ocf-health-locales">
          {{ t('health.declared') }}: {{ scenario.declared_locales.join(', ') }}
          <template v-if="scenario.offered_locales?.length">
            &nbsp;·&nbsp; {{ t('health.offered') }}: {{ scenario.offered_locales.join(', ') }}
          </template>
        </p>

        <ul class="ocf-health-findings">
          <li v-for="(finding, index) in scenario.findings" :key="index" class="ocf-health-finding">
            <span
              class="ocf-health-severity"
              :class="`ocf-health-severity-${finding.severity}`"
            >{{ finding.severity === 'blocking' ? t('health.blocking') : t('health.warning') }}</span>
            <span class="ocf-health-sentence">{{ sentence(finding) }}</span>
          </li>
        </ul>
      </article>
    </template>
  </div>
</template>

<style scoped>
/* `ocf-` on every class: Bootstrap is loaded globally here and a bare .card or
   .badge would take its styling from it. */
.ocf-health {
  padding: 1.5rem;
  max-width: 60rem;
}

.ocf-health-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.ocf-health-header h1 {
  font-size: 1.5rem;
  margin: 0 0 0.35rem;
  color: var(--color-text);
}

.ocf-health-subtitle {
  margin: 0;
  max-width: 46rem;
  color: var(--color-text-secondary);
}

.ocf-health-loading {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.ocf-health-clear {
  padding: 3rem 1.5rem;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-background-soft);
}

.ocf-health-clear i {
  font-size: 2rem;
  color: var(--color-success);
}

.ocf-health-clear-title {
  margin: 0.75rem 0 0.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.ocf-health-clear-hint {
  margin: 0;
  color: var(--color-text-secondary);
}

.ocf-health-count {
  margin-bottom: 1rem;
  color: var(--color-text-secondary);
}

.ocf-health-badge {
  display: inline-block;
  min-width: 1.6rem;
  padding: 0.1rem 0.45rem;
  border-radius: 1rem;
  text-align: center;
  font-weight: 600;
  color: var(--color-background);
}

.ocf-health-badge-blocking {
  background: var(--color-danger);
}

.ocf-health-card {
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  background: var(--color-background-soft);
}

.ocf-health-card-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.ocf-health-card-header h2 {
  font-size: 1.05rem;
  margin: 0;
  color: var(--color-text);
}

.ocf-health-tag {
  font-size: 0.75rem;
  padding: 0.1rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.ocf-health-locales {
  margin: 0.4rem 0 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.ocf-health-findings {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ocf-health-finding {
  display: flex;
  gap: 0.65rem;
  align-items: baseline;
  padding: 0.4rem 0;
  border-top: 1px solid var(--color-border);
}

.ocf-health-severity {
  flex: 0 0 auto;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
}

.ocf-health-severity-blocking {
  background: var(--color-danger);
  color: var(--color-background);
}

.ocf-health-severity-warning {
  background: var(--color-warning);
  color: var(--color-background);
}

.ocf-health-sentence {
  color: var(--color-text);
}
</style>
