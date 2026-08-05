<!--
  Pairs organization creation with the plan that makes it useful (#298).

  Nothing connected "I want to run classrooms" to "I need Formateur", so the two
  were discovered in the wrong order: a trainer could create an org and only then
  find out classroom features were unavailable — or, as actually happened, buy the
  plan and watch the org ignore it.

  This surfaces the requirement at the point of intent instead of after payment.

  The entitlement itself is the BACKEND's verdict, read through
  useClassroomEntitlement and shared with UpgradeToTeamBanner on the subscription
  dashboard. It is not derived from a plan field here: the answer depends on the
  plan, the organization and the caller's role in it, and every screen that tried
  to work it out locally got a different one (ocf-core#453, #460).
-->
<template>
  <!-- Fixed min-height: the two states have different text lengths, and this sits
       directly above the organization list. A reserved slot keeps the content
       below from jumping when the entitlement resolves after the plan loads. -->
  <div class="ocf-classroom-cta" :class="{ 'ocf-classroom-cta--locked': planBlocksTeaching }">
    <div class="ocf-classroom-cta__body">
      <i :class="planBlocksTeaching ? 'fas fa-lock' : 'fas fa-chalkboard-teacher'"></i>
      <div>
        <h3>{{ planBlocksTeaching ? t('classroomCta.lockedTitle') : t('classroomCta.readyTitle') }}</h3>
        <p>{{ planBlocksTeaching ? t('classroomCta.lockedBody') : t('classroomCta.readyBody') }}</p>
      </div>
    </div>

    <!-- The gate sells rather than hides: without the entitlement the action
         becomes the upgrade, never nothing. -->
    <button
      v-if="!planBlocksTeaching"
      class="btn btn-primary"
      data-test="classroom-cta-create"
      @click="$emit('create')"
    >
      <i class="fas fa-plus"></i>
      {{ t('classroomCta.createAction') }}
    </button>
    <router-link
      v-else
      to="/subscription-plans"
      class="btn btn-primary"
      data-test="classroom-cta-upgrade"
    >
      <i class="fas fa-arrow-up"></i>
      {{ t('classroomCta.upgradeAction') }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useClassroomEntitlement } from '../../composables/useClassroomEntitlement'

defineEmits<{ (e: 'create'): void }>()

// The org-less, plan-only verdict — the one the create endpoint applies (core
// #476). The org-scoped verdict answers a different question and says no inside
// a personal organization by design (core #475), which is where a trainer with
// no team organization yet always is: reading it here showed "you need
// Formateur" to trainers who had just bought it.
const { planAllowsClassrooms } = useClassroomEntitlement()

// Only an actual refusal locks the panel. Unresolved keeps the create action —
// see planAllowsClassrooms for why absence must not be sold as a refusal, and
// Organizations.vue for what happens when the backend then says no anyway.
const planBlocksTeaching = computed(() => planAllowsClassrooms.value === false)

const { t } = useTranslations({
  en: {
    classroomCta: {
      readyTitle: 'Run a classroom',
      readyBody: 'Create an organization to group your learners, assign scenarios and follow their sessions. It uses your plan, so there is nothing extra to buy.',
      createAction: 'Create an organization',
      lockedTitle: 'Classrooms need the Formateur plan',
      lockedBody: 'Your current plan covers your own machines. Formateur adds groups, learner seats and session supervision — your organizations then use it automatically.',
      upgradeAction: 'See the Formateur plan',
    },
  },
  fr: {
    classroomCta: {
      readyTitle: 'Animer une classe',
      readyBody: "Créez une organisation pour regrouper vos apprenants, leur attribuer des scénarios et suivre leurs sessions. Elle utilise votre plan : rien de plus à acheter.",
      createAction: 'Créer une organisation',
      lockedTitle: 'Les classes nécessitent le plan Formateur',
      lockedBody: "Votre plan actuel couvre vos propres machines. Le plan Formateur ajoute les groupes, les sièges apprenants et la supervision des sessions — vos organisations en bénéficient ensuite automatiquement.",
      upgradeAction: 'Voir le plan Formateur',
    },
  },
})
</script>

<style scoped>
/* ocf- prefixed: Bootstrap is loaded globally in this app. */
.ocf-classroom-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  min-height: 6.5rem;
  margin-bottom: 1.5rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: 8px;
  background: var(--color-background-secondary);
}

.ocf-classroom-cta--locked {
  border-left-color: var(--color-text-secondary);
}

.ocf-classroom-cta__body {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.ocf-classroom-cta__body > i {
  margin-top: 0.2rem;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.ocf-classroom-cta--locked .ocf-classroom-cta__body > i {
  color: var(--color-text-secondary);
}

.ocf-classroom-cta h3 {
  margin: 0 0 0.35rem 0;
  font-size: 1.05rem;
  color: var(--color-text-primary);
}

.ocf-classroom-cta p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.ocf-classroom-cta .btn {
  flex-shrink: 0;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .ocf-classroom-cta {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
