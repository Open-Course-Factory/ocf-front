<template>
  <div class="ocf-offers">
    <header class="ocf-offers-head">
      <h1>{{ t('publicOffers.title') }}</h1>
      <p>{{ t('publicOffers.subtitle') }}</p>
    </header>

    <p v-if="loading" class="ocf-offers-state" data-test="offers-loading">
      {{ t('publicOffers.loading') }}
    </p>
    <p v-else-if="failed" class="ocf-offers-state" data-test="offers-error">
      {{ t('publicOffers.error') }}
    </p>

    <div v-else class="ocf-offers-grid">
      <article
        v-for="plan in plans"
        :key="plan.id"
        class="ocf-offer"
        data-test="offer-card"
      >
        <h2 class="ocf-offer-name">{{ plan.name }}</h2>

        <p class="ocf-offer-price">
          <template v-if="plan.price_amount > 0">
            <span class="ocf-offer-amount">{{ (plan.price_amount / 100).toFixed(2) }}</span>
            <span class="ocf-offer-currency">{{ (plan.currency || 'eur').toUpperCase() }}</span>
            <span class="ocf-offer-period">{{ intervalLabel(plan.billing_interval) }}</span>
          </template>
          <span v-else class="ocf-offer-amount">{{ t('publicOffers.free') }}</span>
        </p>

        <p v-if="plan.description" class="ocf-offer-desc">{{ plan.description }}</p>

        <ul class="ocf-offer-bullets">
          <li v-for="(bullet, i) in derivePlanBullets(plan)" :key="i">{{ bullet }}</li>
        </ul>

        <!-- Identified by the typed entitlement, not by name: this is the plan
             that may buy learner seats. Seat prices are deliberately absent —
             those plans are hidden, and quoting a "from" figure here would be a
             second copy of a number that drifts from the real ladder. -->
        <p v-if="plan.group_management_enabled" class="ocf-offer-seats" data-test="offer-seats-note">
          {{ t('publicOffers.seatsNote') }}
        </p>

        <router-link class="ocf-offer-cta" :to="{ name: 'Register' }">
          {{ t('publicOffers.start') }}
        </router-link>
      </article>

      <!-- Structures never enter self-service checkout: their plans are hidden and
           assigned administratively, so this card offers a conversation, not a
           price. -->
      <article class="ocf-offer ocf-offer-contact" data-test="offer-contact-card">
        <h2 class="ocf-offer-name">{{ t('publicOffers.orgTitle') }}</h2>
        <p class="ocf-offer-price">
          <span class="ocf-offer-amount">{{ t('publicOffers.orgPrice') }}</span>
        </p>
        <p class="ocf-offer-desc">{{ t('publicOffers.orgDesc') }}</p>
        <ul class="ocf-offer-bullets">
          <li>{{ t('publicOffers.orgBullet1') }}</li>
          <li>{{ t('publicOffers.orgBullet2') }}</li>
          <li>{{ t('publicOffers.orgBullet3') }}</li>
        </ul>
        <a class="ocf-offer-cta" :href="`mailto:${SUPPORT_EMAIL}`" data-test="offer-contact-cta">
          {{ t('publicOffers.orgCta') }}
        </a>
      </article>
    </div>

    <p class="ocf-offers-foot">{{ t('publicOffers.footnote') }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'
import { usePlanFormatters } from '../../composables/usePlanFormatters'
import { SUPPORT_EMAIL } from '../../config/contact'

const { t } = useTranslations({
  en: {
    publicOffers: {
      title: 'Pricing',
      subtitle: 'Real Linux terminals for learning, from a free tier to full classes.',
      loading: 'Loading…',
      error: 'Could not load the offers.',
      free: 'Free',
      perMonth: '/month',
      perYear: '/year',
      start: 'Get started',
      seatsNote: 'Learner seats are bought separately, by the day or by the month.',
      orgTitle: 'Schools & training organisations',
      orgPrice: 'Let’s talk',
      orgDesc: 'Tailored to your programmes, your cohorts and your compliance requirements.',
      orgBullet1: 'Negotiated capacity and pricing',
      orgBullet2: 'Administratively assigned licences',
      orgBullet3: 'Invoicing on quotation',
      orgCta: 'Contact us',
      footnote: 'Prices exclude VAT. Terminals run on our infrastructure — nothing to install.'
    }
  },
  fr: {
    publicOffers: {
      title: 'Tarifs',
      subtitle: "De vrais terminaux Linux pour apprendre, de l'offre gratuite à la classe entière.",
      loading: 'Chargement…',
      error: 'Impossible de charger les offres.',
      free: 'Gratuit',
      perMonth: '/mois',
      perYear: '/an',
      start: 'Commencer',
      seatsNote: "Les sièges apprenants s'achètent séparément, à la journée ou au mois.",
      orgTitle: 'Écoles & organismes de formation',
      orgPrice: 'Parlons-en',
      orgDesc: 'Adapté à vos programmes, vos promotions et vos exigences de conformité.',
      orgBullet1: 'Capacité et tarifs négociés',
      orgBullet2: 'Licences attribuées administrativement',
      orgBullet3: 'Facturation sur devis',
      orgCta: 'Nous contacter',
      footnote: "Prix hors taxes. Les terminaux tournent sur notre infrastructure — rien à installer."
    }
  }
})

const { derivePlanBullets } = usePlanFormatters()

// The typed capability fields are carried through so derivePlanBullets can read
// them — the bullets are generated from what is actually enforced, never from
// hand-written marketing copy, so a bullet cannot advertise an absent feature.
type PublicPlan = {
  id: string
  name: string
  description: string
  currency: string
  billing_interval: string
  price_amount: number
  priority: number
  is_active?: boolean
  group_management_enabled?: boolean
  max_cpu?: number
  max_memory_mb?: number
  max_session_duration_minutes?: number
  network_access_enabled?: boolean
  data_persistence_enabled?: boolean
  data_persistence_gb?: number
  command_history_retention_days?: number
  session_supervision_enabled?: boolean
}

const plans = ref<PublicPlan[]>([])
const loading = ref(true)
const failed = ref(false)

function intervalLabel(interval: string): string {
  return interval === 'year' ? t('publicOffers.perYear') : t('publicOffers.perMonth')
}

onMounted(async () => {
  try {
    // The catalogue endpoint is public and already scoped: it returns only
    // is_catalog plans to an anonymous caller, so hidden seat and bespoke plans
    // cannot appear here even by accident.
    const response = await axios.get('/subscription-plans')
    const raw = response.data?.data ?? response.data ?? []
    plans.value = (Array.isArray(raw) ? raw : [])
      .filter((p: PublicPlan) => p.is_active !== false)
      .sort((a: PublicPlan, b: PublicPlan) => (a.priority ?? 0) - (b.priority ?? 0))
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ocf-offers {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
  color: var(--color-text-primary);
}

.ocf-offers-head {
  text-align: center;
  margin-bottom: 2rem;
}

.ocf-offers-head h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.ocf-offers-head p,
.ocf-offers-foot,
.ocf-offers-state {
  color: var(--color-text-secondary);
}

.ocf-offers-foot {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.85rem;
}

.ocf-offers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 1.25rem;
  align-items: stretch;
}

.ocf-offer {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg, 10px);
  padding: 1.5rem;
  background: var(--color-surface, transparent);
}

/* The structures card is deliberately a different object: no price, a
   conversation. Styled apart so it does not read as a fourth tier. */
.ocf-offer-contact {
  border-style: dashed;
}

.ocf-offer-name {
  font-size: 1.1rem;
  margin: 0 0 0.75rem;
}

.ocf-offer-price {
  margin: 0 0 0.75rem;
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.ocf-offer-amount {
  font-size: 2rem;
  font-weight: 700;
}

.ocf-offer-currency,
.ocf-offer-period {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.ocf-offer-desc {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.ocf-offer-bullets {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  flex: 1;
}

.ocf-offer-bullets li {
  padding: 0.25rem 0 0.25rem 1.25rem;
  position: relative;
  font-size: 0.9rem;
}

.ocf-offer-bullets li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-primary);
}

.ocf-offer-seats {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  border-top: 1px solid var(--color-border);
  padding-top: 0.75rem;
  margin-bottom: 1rem;
}

.ocf-offer-cta {
  display: block;
  text-align: center;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-md, 6px);
  background: var(--color-primary);
  color: var(--color-text-on-primary, #fff);
  text-decoration: none;
  font-weight: 600;
}

.ocf-offer-contact .ocf-offer-cta {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}
</style>
