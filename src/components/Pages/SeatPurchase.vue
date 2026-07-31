<template>
  <div class="ocf-seat-purchase">
    <h1 class="ocf-sp-title">{{ t('seatPurchase.title') }}</h1>
    <p class="ocf-sp-intro">{{ t('seatPurchase.intro') }}</p>

    <p v-if="loading" class="ocf-sp-state" data-test="seat-purchase-loading">
      {{ t('seatPurchase.loading') }}
    </p>

    <!-- Not allowed to buy: explain, do not show a form that would fail. -->
    <div
      v-else-if="!canPurchase"
      class="ocf-sp-notice"
      role="status"
      data-test="seat-purchase-ineligible"
    >
      <p>{{ t('seatPurchase.ineligible') }}</p>
      <p v-if="ineligibleReason" class="ocf-sp-reason">{{ ineligibleReason }}</p>
    </div>

    <div v-else-if="plans.length === 0" class="ocf-sp-notice" role="status">
      {{ t('seatPurchase.noProducts') }}
    </div>

    <template v-else>
      <form class="ocf-sp-form" @submit.prevent>
        <div class="ocf-sp-field">
          <label for="sp-learners">{{ t('seatPurchase.learnersLabel') }}</label>
          <input
            id="sp-learners"
            v-model.number="learners"
            data-test="seat-purchase-learners"
            type="number"
            min="1"
            class="form-control"
          />
        </div>

        <div class="ocf-sp-field">
          <label for="sp-duration">{{ t('seatPurchase.durationLabel') }}</label>
          <select
            id="sp-duration"
            v-model="duration"
            data-test="seat-purchase-duration"
            class="form-control"
          >
            <option v-for="d in DAY_CHOICES" :key="d" :value="String(d)">
              {{ t('seatPurchase.days', { n: d }) }}
            </option>
            <option value="month">{{ t('seatPurchase.oneMonth') }}</option>
          </select>
        </div>
      </form>

      <!-- Reserved region: quotes swap between loading and result as the trainer
           edits, and must never move the purchase button under the cursor. -->
      <div class="ocf-sp-quotes" data-test="seat-purchase-quotes">
        <p v-if="quoting" class="ocf-sp-state">{{ t('seatPurchase.quoting') }}</p>
        <p v-else-if="quoteFailed" class="ocf-sp-state ocf-sp-error">
          {{ t('seatPurchase.quoteError') }}
        </p>
        <template v-else>
          <div
            v-for="(q, index) in quotes"
            :key="q.plan.id"
            class="ocf-sp-quote"
            :class="{ 'ocf-sp-recommended': index === 0 }"
            data-test="seat-purchase-quote"
          >
            <div class="ocf-sp-quote-head">
              <span class="ocf-sp-quote-name">{{ q.plan.name }}</span>
              <span v-if="index === 0 && quotes.length > 1" class="ocf-sp-badge">
                {{ t('seatPurchase.cheaper') }}
              </span>
            </div>
            <div class="ocf-sp-quote-total">{{ (q.total / 100).toFixed(2) }} {{ currencyLabel }}</div>
            <div class="ocf-sp-quote-detail">
              {{ t('seatPurchase.quantityDetail', { qty: q.quantity, unit: unitLabel(q.plan.seat_unit) }) }}
              · {{ t('seatPurchase.perLearner', { amount: (q.total / Math.max(learners, 1) / 100).toFixed(2) }) }}
            </div>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="purchasing"
              :data-test="`seat-purchase-buy-${index}`"
              @click="buy(q)"
            >
              {{ purchasing ? t('seatPurchase.redirecting') : t('seatPurchase.buy') }}
            </button>
          </div>
          <p v-if="quotes.length === 0" class="ocf-sp-state">{{ t('seatPurchase.noQuote') }}</p>
        </template>
      </div>

      <p class="ocf-sp-hint">{{ t('seatPurchase.unitsHint') }}</p>
      <p v-if="purchaseError" class="ocf-sp-error" role="alert">{{ purchaseError }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import {
  bulkLicenseService,
  type PurchasableSeatPlan,
  type SeatUnit
} from '../../services/domain/subscription/bulkLicenseService'

const { t } = useTranslations({
  en: {
    seatPurchase: {
      title: 'Buy seats for your learners',
      intro: 'Tell us how many learners and for how long — we work out which option costs less.',
      loading: 'Loading…',
      ineligible: 'Your plan does not allow buying seats for learners.',
      noProducts: 'No seat product is available at the moment.',
      learnersLabel: 'How many learners?',
      durationLabel: 'For how long?',
      days: '{n} day(s)',
      oneMonth: 'One month',
      quoting: 'Calculating…',
      quoteError: 'Could not calculate the price.',
      noQuote: 'No option applies to this combination.',
      cheaper: 'Cheaper',
      buy: 'Buy',
      redirecting: 'Redirecting…',
      quantityDetail: '{qty} {unit}',
      perLearner: '{amount} per learner',
      seatMonths: 'seat-month(s)',
      learnerDays: 'learner-day(s)',
      unitsHint:
        'Day packs are billed per learner-day (learners x days). Monthly seats are billed per seat, per month. Prices come from the server, so this is exactly what you will be charged.'
    }
  },
  fr: {
    seatPurchase: {
      title: 'Acheter des sièges pour vos apprenants',
      intro: "Indiquez le nombre d'apprenants et la durée — nous calculons l'option la moins chère.",
      loading: 'Chargement…',
      ineligible: "Votre plan ne permet pas d'acheter des sièges pour des apprenants.",
      noProducts: 'Aucun produit de siège n\'est disponible pour le moment.',
      learnersLabel: "Combien d'apprenants ?",
      durationLabel: 'Pour combien de temps ?',
      days: '{n} jour(s)',
      oneMonth: 'Un mois',
      quoting: 'Calcul en cours…',
      quoteError: 'Impossible de calculer le prix.',
      noQuote: 'Aucune option ne correspond à cette combinaison.',
      cheaper: 'Moins cher',
      buy: 'Acheter',
      redirecting: 'Redirection…',
      quantityDetail: '{qty} {unit}',
      perLearner: '{amount} par apprenant',
      seatMonths: 'siège(s)-mois',
      learnerDays: 'journée(s)-apprenant',
      unitsHint:
        "Les packs sont facturés à la journée-apprenant (apprenants x jours). Les sièges mensuels sont facturés par siège et par mois. Les prix viennent du serveur : c'est exactement ce qui sera facturé."
    }
  }
})

const DAY_CHOICES = [1, 2, 3, 4, 5, 6, 7, 10]

type Quote = { plan: PurchasableSeatPlan; quantity: number; total: number }

const loading = ref(true)
const canPurchase = ref(false)
const ineligibleReason = ref('')
const plans = ref<PurchasableSeatPlan[]>([])

const learners = ref(10)
const duration = ref<string>('3')

const quotes = ref<Quote[]>([])
const quoting = ref(false)
const quoteFailed = ref(false)
const purchasing = ref(false)
const purchaseError = ref('')

const currencyLabel = computed(() => (plans.value[0]?.currency || 'eur').toUpperCase())

function unitLabel(unit: SeatUnit): string {
  return unit === 'learner_day' ? t('seatPurchase.learnerDays') : t('seatPurchase.seatMonths')
}

// How many units of a given product this order represents. The whole reason
// SeatUnit exists: without it "12 learners for 3 days" cannot become a quantity.
function quantityFor(plan: PurchasableSeatPlan): number | null {
  const n = Math.max(1, Math.floor(learners.value || 0))
  if (plan.seat_unit === 'learner_day') {
    if (duration.value === 'month') return null // a day pack does not express "a month"
    return n * Number(duration.value)
  }
  return n
}

let quoteToken = 0

// Every price is fetched, never computed here: graduated pricing lives in one
// place server-side, and a local implementation would quote a number the invoice
// then contradicts.
async function refreshQuotes() {
  const token = ++quoteToken
  quoting.value = true
  quoteFailed.value = false
  try {
    const results: Quote[] = []
    for (const plan of plans.value) {
      const quantity = quantityFor(plan)
      if (!quantity || quantity < 1) continue
      const preview = await bulkLicenseService.getPricingPreview({
        subscriptionPlanId: plan.id,
        quantity
      })
      const total = Number((preview as any)?.total_monthly_cost ?? 0)
      results.push({ plan, quantity, total })
    }
    if (token !== quoteToken) return
    // Cheapest first: the recommendation is a sort, not a hard-coded rule, so it
    // stays correct when the ladders change.
    results.sort((a, b) => a.total - b.total)
    quotes.value = results
  } catch {
    if (token !== quoteToken) return
    quotes.value = []
    quoteFailed.value = true
  } finally {
    if (token === quoteToken) quoting.value = false
  }
}

async function buy(quote: Quote) {
  purchasing.value = true
  purchaseError.value = ''
  try {
    const origin = window.location.origin
    const session = await bulkLicenseService.createBulkCheckoutSession({
      subscription_plan_id: quote.plan.id,
      quantity: quote.quantity,
      success_url: `${origin}/subscription-dashboard?success=true`,
      cancel_url: `${origin}/buy-seats?canceled=true`
    })
    window.location.href = session.url
  } catch (err: any) {
    purchaseError.value =
      err?.response?.data?.error_message || err?.response?.data?.message || t('seatPurchase.quoteError')
    purchasing.value = false
  }
}

let debounce: ReturnType<typeof setTimeout> | undefined
watch([learners, duration], () => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(refreshQuotes, 300)
})

onMounted(async () => {
  try {
    const res = await bulkLicenseService.getPurchasableSeatPlans()
    canPurchase.value = !!res?.can_purchase
    ineligibleReason.value = res?.reason || ''
    plans.value = res?.plans || []
    if (canPurchase.value && plans.value.length > 0) await refreshQuotes()
  } catch {
    canPurchase.value = false
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ocf-seat-purchase {
  max-width: 46rem;
  margin: 0 auto;
  padding: 1.5rem;
  color: var(--color-text-primary);
}

.ocf-sp-title {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.ocf-sp-intro,
.ocf-sp-hint {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.ocf-sp-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0 1rem;
}

.ocf-sp-field label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

/* Reserved height: the quotes swap between calculating, error and results as the
   trainer edits, and the purchase button must not move under the cursor. */
.ocf-sp-quotes {
  min-height: 14rem;
  display: grid;
  gap: 0.75rem;
}

.ocf-sp-quote {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 6px);
  padding: 1rem;
  background: var(--color-surface, transparent);
}

.ocf-sp-recommended {
  border-color: var(--color-primary);
}

.ocf-sp-quote-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.ocf-sp-quote-name {
  font-weight: 600;
}

.ocf-sp-badge {
  font-size: 0.75rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-text-on-primary, #fff);
}

.ocf-sp-quote-total {
  font-size: 1.6rem;
  font-weight: 700;
}

.ocf-sp-quote-detail {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.ocf-sp-state {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.ocf-sp-error {
  color: var(--color-danger, var(--color-text-primary));
}

.ocf-sp-notice {
  border-left: 3px solid var(--color-warning, var(--color-primary));
  padding: 0.75rem 1rem;
  background: var(--color-surface, transparent);
}

.ocf-sp-reason {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  margin: 0.25rem 0 0;
}

@media (max-width: 768px) {
  .ocf-sp-form {
    grid-template-columns: 1fr;
  }
}
</style>
