<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 *
 * Stands in for a scenario step while it loads, in the shape of the kind of
 * step that is coming, so the panel does not change shape when it arrives.
 */
-->

<template>
  <div class="ocf-step-skeleton" :class="`ocf-step-skeleton--${kind}`" data-testid="scenario-step-skeleton" :data-step-type="kind" aria-busy="true">
    <span class="ocf-sr-only" role="status">{{ label }}</span>
    <LoadingSkeleton width="55%" height="18px" />
    <LoadingSkeleton v-for="w in TEXT_LINES" :key="w" :width="w" height="12px" />

    <template v-if="kind === 'questions'">
      <div v-for="q in QUESTIONS" :key="q" class="ocf-step-skeleton__question">
        <LoadingSkeleton :width="q" height="14px" />
        <LoadingSkeleton v-for="o in OPTIONS" :key="o" :width="o" height="28px" variant="button" />
      </div>
      <LoadingSkeleton class="ocf-step-skeleton__action" width="140px" height="36px" variant="button" />
    </template>

    <template v-else-if="kind === 'info'">
      <LoadingSkeleton v-for="w in MORE_LINES" :key="w" :width="w" height="12px" />
      <LoadingSkeleton class="ocf-step-skeleton__action" width="160px" height="36px" variant="button" />
    </template>

    <template v-else-if="kind === 'terminal'">
      <LoadingSkeleton width="100%" height="64px" variant="card" />
      <LoadingSkeleton v-for="w in MORE_LINES" :key="w" :width="w" height="12px" />
      <div class="ocf-step-skeleton__footer">
        <LoadingSkeleton width="100%" height="36px" variant="button" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoadingSkeleton from '../Subscription/Dashboard/LoadingSkeleton.vue'
import { useTranslations } from '../../composables/useTranslations'

// The step's type as the backend sends it; empty or unknown is a terminal step,
// and no type at all (the very first load) is plain text.
const props = defineProps<{ stepType?: string | null }>()

const kind = computed(() => {
  if (props.stepType == null) return 'text'
  if (props.stepType === 'quiz' || props.stepType === 'survey') return 'questions'
  if (props.stepType === 'info') return 'info'
  return 'terminal'
})

// Widths are unique: they key the loops.
const TEXT_LINES = ['92%', '84%', '64%']
const MORE_LINES = ['88%', '72%']
const QUESTIONS = ['70%', '62%']
const OPTIONS = ['100%', '99%', '98%']

const { t } = useTranslations({
  en: { stepSkeleton: { loading: 'Loading the step...' } },
  fr: { stepSkeleton: { loading: 'Chargement de l\'étape...' } }
})
const label = computed(() => t('stepSkeleton.loading'))
</script>

<style scoped>
.ocf-step-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  flex: 1;
  min-height: 0;
}

.ocf-step-skeleton__question {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
}

.ocf-step-skeleton__action {
  margin-top: var(--spacing-md);
}

/* Where the terminal step's verify bar sits: the bottom of the panel. */
.ocf-step-skeleton__footer {
  margin-top: auto;
  padding-top: var(--spacing-md);
}
</style>
