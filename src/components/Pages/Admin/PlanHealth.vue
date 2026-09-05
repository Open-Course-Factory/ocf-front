<script setup lang="ts">
/**
 * What a subscription plan promises, measured against what it can deliver.
 *
 * Every fault listed here is silent by nature: nothing errors, nothing logs,
 * and the plan looks correct in the admin form. A budget of zero reads as an
 * ordinary row right up until a class cannot start.
 *
 * The advisory is a different kind of entry. It reports nothing broken — a
 * plan whose two budgets afford different numbers of sessions may be priced
 * that way on purpose — but it is the number that makes "this plan affords six
 * terminals" visible before a class of eleven meets it.
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
  detail?: string
}

interface PlanHealth {
  plan_id: string
  name: string
  is_active: boolean
  is_catalog: boolean
  is_deleted: boolean
  max_cpu: number
  max_memory_mb: number
  findings: Finding[]
}

const report = ref<PlanHealth[]>([])
const loading = ref(true)
const error = ref('')

const { t } = useTranslations({
  en: {
    planHealth: {
      title: 'Plan health',
      subtitle: 'What a plan promises and cannot deliver. None of this reports itself: every entry stays silent until someone cannot start a session.',
      refresh: 'Check again',
      allWell: 'Every plan delivers what it offers.',
      allWellHint: 'No plan without a usable budget, no deleted plan still entitling anyone, nothing on the shelf that cannot be charged for.',
      loadError: 'Could not read the plan health report',
      deleted: 'Deleted',
      inactive: 'Inactive',
      catalogue: 'In catalogue',
      budget: 'Budget',
      blocking: 'Blocking',
      warning: 'Warning',
      advisory: 'Worth knowing',
      codes: {
        zero_budget: 'This plan has {detail}, so nobody holding it can start a terminal — administrators included, since they are not exempt from the budget.',
        affords_no_size: 'The budget is positive but too small for the smallest machine ({detail}). The plan looks configured and launches nothing.',
        dangling_plan_reference: 'This plan is deleted, and {detail}. Those subscriptions resolve to an empty plan and entitle nothing.',
        catalog_without_price: 'This plan is {detail}, so checkout cannot charge for it — a customer choosing it reaches a dead end.',
        axis_imbalance: 'The two budgets do not agree: {detail}. The smaller one decides how many terminals this plan really delivers.'
      }
    }
  },
  fr: {
    planHealth: {
      title: 'Santé des forfaits',
      subtitle: "Ce qu'un forfait promet et ne peut pas tenir. Rien de tout cela ne se signale : chaque entrée reste invisible jusqu'à ce que quelqu'un ne puisse pas démarrer de session.",
      refresh: 'Vérifier à nouveau',
      allWell: 'Chaque forfait tient ce qu\'il propose.',
      allWellHint: "Aucun forfait sans budget utilisable, aucun forfait supprimé donnant encore des droits, rien en vitrine qui ne puisse être facturé.",
      loadError: 'Impossible de lire le rapport de santé des forfaits',
      deleted: 'Supprimé',
      inactive: 'Inactif',
      catalogue: 'En catalogue',
      budget: 'Budget',
      blocking: 'Bloquant',
      warning: 'Avertissement',
      advisory: 'Bon à savoir',
      codes: {
        zero_budget: "Ce forfait n'a {detail} : personne qui le détient ne peut démarrer de terminal — administrateurs compris, car ils ne sont pas exemptés du budget.",
        affords_no_size: "Le budget est positif mais trop petit pour la plus petite machine ({detail}). Le forfait semble configuré et ne lance rien.",
        dangling_plan_reference: "Ce forfait est supprimé, et {detail}. Ces abonnements se résolvent en un forfait vide et n'ouvrent aucun droit.",
        catalog_without_price: "Ce forfait est {detail} : le paiement ne peut rien facturer — un client qui le choisit arrive dans une impasse.",
        axis_imbalance: "Les deux budgets ne concordent pas : {detail}. Le plus petit décide du nombre réel de terminaux que ce forfait délivre."
      }
    }
  }
})

// Advisories are deliberately excluded: they are not faults, and counting them
// beside the blocking ones would overstate how much is wrong.
const blockingCount = computed(() =>
  report.value.reduce(
    (total, plan) => total + plan.findings.filter((f) => f.severity === 'blocking').length,
    0
  )
)

const warningCount = computed(() =>
  report.value.reduce(
    (total, plan) => total + plan.findings.filter((f) => f.severity === 'warning').length,
    0
  )
)

const severityLabels: Record<string, string> = {
  blocking: 'planHealth.blocking',
  warning: 'planHealth.warning',
  advisory: 'planHealth.advisory'
}

function severityLabel(severity: string): string {
  return t(severityLabels[severity] ?? 'planHealth.warning')
}

/**
 * The sentence for a finding, with the numbers the server filled in.
 *
 * Written here rather than sent by the server so it reads in the operator's
 * language; the server sends a stable code and the parts it alone can know.
 *
 * The detail goes through vue-i18n's own interpolation rather than a string
 * replace on the result: `{detail}` is a named placeholder, so vue-i18n has
 * already substituted it — with nothing — by the time any replace could run.
 */
function sentence(finding: Finding): string {
  return t(`planHealth.codes.${finding.code}`, { detail: finding.detail || '' })
}

/** mCPU is the storage unit; vCPU is what an operator thinks in. */
function budgetLabel(plan: PlanHealth): string {
  const vcpu = plan.max_cpu / 1000
  return `${vcpu} vCPU · ${plan.max_memory_mb} MB`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await axios.get('/subscription-plans/health')
    report.value = response.data || []
  } catch (e: any) {
    error.value = e?.response?.data?.error_message || t('planHealth.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="ocf-planhealth">
    <header class="ocf-planhealth-header">
      <div>
        <h1>{{ t('planHealth.title') }}</h1>
        <p class="ocf-planhealth-subtitle">{{ t('planHealth.subtitle') }}</p>
      </div>
      <button class="btn btn-outline-secondary" :disabled="loading" @click="load">
        <i class="fas fa-rotate" /> {{ t('planHealth.refresh') }}
      </button>
    </header>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="loading" class="ocf-planhealth-loading">
      <i class="fas fa-circle-notch fa-spin" />
    </div>

    <div v-else-if="report.length === 0" class="ocf-planhealth-clear">
      <i class="fas fa-circle-check" />
      <p class="ocf-planhealth-clear-title">{{ t('planHealth.allWell') }}</p>
      <p class="ocf-planhealth-clear-hint">{{ t('planHealth.allWellHint') }}</p>
    </div>

    <template v-else>
      <p class="ocf-planhealth-count">
        <span class="ocf-planhealth-badge ocf-planhealth-badge-blocking">{{ blockingCount }}</span>
        {{ t('planHealth.blocking') }}
        <template v-if="warningCount > 0">
          &nbsp;·&nbsp;
          <span class="ocf-planhealth-badge ocf-planhealth-badge-warning">{{ warningCount }}</span>
          {{ t('planHealth.warning') }}
        </template>
      </p>

      <article v-for="plan in report" :key="plan.plan_id" class="ocf-planhealth-card">
        <header class="ocf-planhealth-card-header">
          <h2>{{ plan.name }}</h2>
          <span v-if="plan.is_deleted" class="ocf-planhealth-tag ocf-planhealth-tag-deleted">
            {{ t('planHealth.deleted') }}
          </span>
          <span v-else-if="!plan.is_active" class="ocf-planhealth-tag">{{ t('planHealth.inactive') }}</span>
          <span v-if="plan.is_catalog" class="ocf-planhealth-tag">{{ t('planHealth.catalogue') }}</span>
        </header>

        <p class="ocf-planhealth-budget">
          {{ t('planHealth.budget') }}: {{ budgetLabel(plan) }}
        </p>

        <ul class="ocf-planhealth-findings">
          <li v-for="(finding, index) in plan.findings" :key="index" class="ocf-planhealth-finding">
            <span
              class="ocf-planhealth-severity"
              :class="`ocf-planhealth-severity-${finding.severity}`"
            >{{ severityLabel(finding.severity) }}</span>
            <span class="ocf-planhealth-sentence">{{ sentence(finding) }}</span>
          </li>
        </ul>
      </article>
    </template>
  </div>
</template>

<style scoped>
/* `ocf-` on every class: Bootstrap is loaded globally here and a bare .card or
   .badge would take its styling from it. */
.ocf-planhealth {
  padding: 1.5rem;
  max-width: 60rem;
}

.ocf-planhealth-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.ocf-planhealth-header h1 {
  font-size: 1.5rem;
  margin: 0 0 0.35rem;
  color: var(--color-text);
}

.ocf-planhealth-subtitle {
  margin: 0;
  max-width: 46rem;
  color: var(--color-text-secondary);
}

.ocf-planhealth-loading {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.ocf-planhealth-clear {
  padding: 3rem 1.5rem;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-background-soft);
}

.ocf-planhealth-clear i {
  font-size: 2rem;
  color: var(--color-success);
}

.ocf-planhealth-clear-title {
  margin: 0.75rem 0 0.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.ocf-planhealth-clear-hint {
  margin: 0;
  color: var(--color-text-secondary);
}

.ocf-planhealth-count {
  margin-bottom: 1rem;
  color: var(--color-text-secondary);
}

.ocf-planhealth-badge {
  display: inline-block;
  min-width: 1.6rem;
  padding: 0.1rem 0.45rem;
  border-radius: 1rem;
  text-align: center;
  font-weight: 600;
  color: var(--color-background);
}

.ocf-planhealth-badge-blocking {
  background: var(--color-danger);
}

.ocf-planhealth-badge-warning {
  background: var(--color-warning);
}

.ocf-planhealth-card {
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  background: var(--color-background-soft);
}

.ocf-planhealth-card-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.ocf-planhealth-card-header h2 {
  font-size: 1.05rem;
  margin: 0;
  color: var(--color-text);
}

.ocf-planhealth-tag {
  font-size: 0.75rem;
  padding: 0.1rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.ocf-planhealth-tag-deleted {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.ocf-planhealth-budget {
  margin: 0.4rem 0 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.ocf-planhealth-findings {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ocf-planhealth-finding {
  display: flex;
  gap: 0.65rem;
  align-items: baseline;
  padding: 0.4rem 0;
  border-top: 1px solid var(--color-border);
}

.ocf-planhealth-severity {
  flex: 0 0 auto;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  white-space: nowrap;
}

.ocf-planhealth-severity-blocking {
  background: var(--color-danger);
  color: var(--color-background);
}

.ocf-planhealth-severity-warning {
  background: var(--color-warning);
  color: var(--color-background);
}

/* An advisory is not a fault. It reads as information, not as an alarm. */
.ocf-planhealth-severity-advisory {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.ocf-planhealth-sentence {
  color: var(--color-text);
}
</style>
