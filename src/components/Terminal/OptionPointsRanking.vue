<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
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

<!--
  A decision question's options, best first, each with its medal and points,
  and the one the learner picked marked. Shared by the learner's correction and
  the trainer's review so both read the same way.
-->
<template>
  <ol class="ocf-option-ranking" data-testid="option-points-ranking">
    <li
      v-for="option in ranked"
      :key="option.index"
      class="ocf-option-ranking__row"
      :class="{ 'ocf-option-ranking__row--chosen': String(option.index) === chosen }"
    >
      <span class="ocf-option-ranking__medal" aria-hidden="true">{{ option.medal }}</span>
      <span class="ocf-option-ranking__text">{{ option.text }}</span>
      <span v-if="String(option.index) === chosen" class="ocf-option-ranking__chosen">{{ chosenLabel }}</span>
      <span class="ocf-option-ranking__points">{{ t('optionRanking.points', { points: option.points }) }}</span>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { rankOptionsByPoints } from '../../utils/scenarioDisplay'

const props = defineProps<{
  options: string[]
  optionPoints: string
  // The learner's raw answer: the picked option's index, as submitted.
  chosen: string
  chosenLabel: string
}>()

const ranked = computed(() => rankOptionsByPoints(props.options, props.optionPoints))

const { t } = useTranslations({
  en: { optionRanking: { points: '{points} pts' } },
  fr: { optionRanking: { points: '{points} pts' } }
})
</script>

<style scoped>
.ocf-option-ranking {
  list-style: none;
  margin: var(--spacing-xs) 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.ocf-option-ranking__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.ocf-option-ranking__row--chosen {
  border-color: var(--color-primary);
  border-width: var(--border-width-medium);
  background: var(--color-bg-secondary);
  font-weight: var(--font-weight-semibold);
}

.ocf-option-ranking__medal {
  flex: 0 0 1.5em;
  font-size: 1.25em;
  text-align: center;
}

.ocf-option-ranking__text {
  flex: 1;
  min-width: 0;
}

.ocf-option-ranking__chosen {
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  white-space: nowrap;
}

.ocf-option-ranking__points {
  flex-shrink: 0;
  min-width: 4em;
  text-align: right;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  white-space: nowrap;
}
</style>
