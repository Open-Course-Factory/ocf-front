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
import { computed } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../../composables/useTranslations'
import { formatMcpuAsVcpu } from '../../../utils/formatters'
import { formatMemoryMb } from '../../../utils/quotaFormatters'
import HealthReport, { type HealthReportLabels } from '../../Admin/HealthReport.vue'

// Mirrors the severity values in ocf-core src/payment/services/planHealth.go.
type Severity = 'blocking' | 'warning' | 'advisory'

interface Finding {
  code: string
  severity: Severity
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

const labels = computed<HealthReportLabels>(() => ({
  title: t('planHealth.title'),
  subtitle: t('planHealth.subtitle'),
  refresh: t('planHealth.refresh'),
  allWell: t('planHealth.allWell'),
  allWellHint: t('planHealth.allWellHint'),
  loadError: t('planHealth.loadError'),
  severity: {
    blocking: t('planHealth.blocking'),
    warning: t('planHealth.warning'),
    advisory: t('planHealth.advisory')
  }
}))

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
  return `${formatMcpuAsVcpu(plan.max_cpu)} vCPU · ${formatMemoryMb(plan.max_memory_mb)}`
}

async function load(): Promise<PlanHealth[]> {
  const response = await axios.get('/subscription-plans/health')
  return response.data || []
}
</script>

<template>
  <HealthReport
    :labels="labels"
    :load="load"
    :item-key="(plan: PlanHealth) => plan.plan_id"
    count-warnings
  >
    <template #card-header="{ item: plan }">
      <h2>{{ plan.name }}</h2>
      <span v-if="plan.is_deleted" class="ocf-health-tag ocf-planhealth-tag-deleted">
        {{ t('planHealth.deleted') }}
      </span>
      <span v-else-if="!plan.is_active" class="ocf-health-tag">{{ t('planHealth.inactive') }}</span>
      <span v-if="plan.is_catalog" class="ocf-health-tag">{{ t('planHealth.catalogue') }}</span>
    </template>

    <template #card-meta="{ item: plan }">
      <p class="ocf-health-meta">
        {{ t('planHealth.budget') }}: {{ budgetLabel(plan) }}
      </p>
    </template>

    <template #finding="{ finding }">{{ sentence(finding) }}</template>
  </HealthReport>
</template>

<style scoped>
.ocf-planhealth-tag-deleted {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
</style>
