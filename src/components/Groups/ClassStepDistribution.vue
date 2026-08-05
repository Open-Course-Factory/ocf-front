<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<script setup lang="ts">
/**
 * Where the class stands, in one glance: one column per step of the watched
 * scenario, plus the learners who finished and (when there are any) those who
 * have not opened it. The columns therefore always add up to the class size.
 *
 * One hue for the whole step series — the columns compare quantities of the
 * same thing. Green is reserved for "finished", which is a status rather than
 * another step, and it carries a ✓ so the meaning does not rest on colour.
 */
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import type { ClassStepBucket } from '../../composables/useClassProgression'

const props = defineProps<{
  buckets: ClassStepBucket[]
}>()

const { t } = useTranslations({
  en: {
    classDistribution: {
      label: 'Learners per step',
      stepShort: 'S{step}',
      notStartedShort: 'Not started',
      doneShort: '✓ Done',
      caption: 'Spread across the steps',
      captionPeak: 'Spread across the steps — the class is mostly on {step}',
      tooltipStep: 'Step {step} — {count}',
      tooltipStepTitled: 'Step {step} · {title} — {count}',
      tooltipNotStarted: 'Not started — {count}',
      tooltipDone: 'Finished — {count}',
      learnerCountOne: '{count} learner',
      learnerCountMany: '{count} learners'
    }
  },
  fr: {
    classDistribution: {
      label: 'Apprenants par étape',
      stepShort: 'É{step}',
      notStartedShort: 'Non commencé',
      doneShort: '✓ Fini',
      caption: 'Répartition par étape',
      captionPeak: 'Répartition par étape — la classe est surtout sur l’{step}',
      tooltipStep: 'Étape {step} — {count}',
      tooltipStepTitled: 'Étape {step} · {title} — {count}',
      tooltipNotStarted: 'Non commencé — {count}',
      tooltipDone: 'Terminé — {count}',
      learnerCountOne: '{count} apprenant',
      learnerCountMany: '{count} apprenants'
    }
  }
})

const MAX_BAR_HEIGHT_PX = 72
/** An empty column still draws a hairline, so the axis reads as continuous. */
const EMPTY_BAR_HEIGHT_PX = 2

const maxCount = computed(() => Math.max(...props.buckets.map(b => b.count), 0))

function barHeight(bucket: ClassStepBucket): string {
  if (bucket.count === 0 || maxCount.value === 0) return `${EMPTY_BAR_HEIGHT_PX}px`
  return `${Math.max(6, Math.round((bucket.count / maxCount.value) * MAX_BAR_HEIGHT_PX))}px`
}

function shortLabel(bucket: ClassStepBucket): string {
  if (bucket.kind === 'not_started') return t('classDistribution.notStartedShort')
  if (bucket.kind === 'done') return t('classDistribution.doneShort')
  return t('classDistribution.stepShort', { step: bucket.step })
}

function tooltip(bucket: ClassStepBucket): string {
  // Plural forms are picked by key rather than by vue-i18n's pipe syntax, as
  // elsewhere in the console (see ClassConsoleRow's live count).
  const countKey = bucket.count === 1 ? 'learnerCountOne' : 'learnerCountMany'
  const count = t(`classDistribution.${countKey}`, { count: bucket.count })
  if (bucket.kind === 'not_started') return t('classDistribution.tooltipNotStarted', { count })
  if (bucket.kind === 'done') return t('classDistribution.tooltipDone', { count })
  return bucket.title
    ? t('classDistribution.tooltipStepTitled', { step: bucket.step, title: bucket.title, count })
    : t('classDistribution.tooltipStep', { step: bucket.step, count })
}

/**
 * The step everybody is on, when there is an unambiguous one — the sentence
 * that makes the strip worth a glance. Ties and an empty class say nothing
 * rather than picking a winner arbitrarily.
 */
const peakStep = computed<ClassStepBucket | null>(() => {
  const steps = props.buckets.filter(b => b.kind === 'step')
  const best = steps.reduce<ClassStepBucket | null>(
    (top, bucket) => (top === null || bucket.count > top.count ? bucket : top),
    null
  )
  if (!best || best.count === 0) return null
  const tied = steps.filter(b => b.count === best.count).length > 1
  return tied ? null : best
})

const caption = computed(() => {
  if (!peakStep.value) return t('classDistribution.caption')
  const step = peakStep.value.title
    ? `${shortLabel(peakStep.value)} · ${peakStep.value.title}`
    : shortLabel(peakStep.value)
  return t('classDistribution.captionPeak', { step })
})
</script>

<template>
  <figure class="ocf-dist">
    <ul class="ocf-dist-cols" :aria-label="t('classDistribution.label')">
      <li
        v-for="bucket in buckets"
        :key="bucket.key"
        class="ocf-dist-col"
        :class="`ocf-dist-col-${bucket.kind.replace('_', '-')}`"
        :title="tooltip(bucket)"
      >
        <span class="ocf-dist-count">{{ bucket.count > 0 ? bucket.count : '' }}</span>
        <span class="ocf-dist-bar" :style="{ height: barHeight(bucket) }"></span>
        <span class="ocf-dist-x">{{ shortLabel(bucket) }}</span>
      </li>
    </ul>
    <figcaption class="ocf-dist-caption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.ocf-dist {
  margin: 0;
  padding: var(--spacing-sm) 0 0;
}

.ocf-dist-cols {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
  height: 96px;
  margin: 0;
  padding: 0 var(--spacing-xs);
  list-style: none;
}

.ocf-dist-col {
  flex: 1;
  max-width: 90px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-xs);
}

.ocf-dist-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  /* Reserved whether or not the column has a count, so bars keep one baseline. */
  min-height: 1em;
}

.ocf-dist-bar {
  width: 100%;
  max-width: 56px;
  border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
  background: var(--color-primary);
  opacity: 0.85;
}

.ocf-dist-col-done .ocf-dist-bar {
  background: var(--color-success);
  opacity: 1;
}

/* Learners who never opened the scenario are not on the step axis, so they are
   not drawn in the step hue either. */
.ocf-dist-col-not-started .ocf-dist-bar {
  background: var(--color-border-medium);
  opacity: 1;
}

.ocf-dist-x {
  width: 100%;
  padding-top: var(--spacing-xs);
  border-top: var(--border-width-thin) solid var(--color-border-light);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocf-dist-caption {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: center;
}
</style>
