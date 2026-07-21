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

<!--
  Reserved slot for the learner supervision chip in the terminal title bar.

  The chip appears/changes on the teacher's click, which the learner can't
  anticipate — so the header row's geometry must NOT depend on supervision state,
  or the sibling controls would jump. This slot is ALWAYS rendered (while the
  capability is on) and holds two invisible sizers, one per message variant, that
  reserve the WIDEST variant's width by construction. The visible chip is grid-
  stacked over them and only exists in an active state; when idle there is no chip,
  hence no live region, so assistive tech announces nothing.

  Sizers are `visibility: hidden` (not `display: none`, which would reserve no box)
  and `aria-hidden` (never announced). Their box metrics mirror `.supervision-chip`
  in SupervisionChip.vue — keep the two in sync if the chip's padding/font changes.
-->
<template>
  <div
    class="supervision-slot"
    :class="chip ? 'supervision-slot-active' : 'supervision-slot-idle'"
  >
    <span class="supervision-slot-sizer supervision-slot-sizer-watched" aria-hidden="true">{{ watchedText }}</span>
    <span class="supervision-slot-sizer supervision-slot-sizer-controlled" aria-hidden="true">{{ controlledText }}</span>
    <SupervisionChip
      v-if="chip"
      :icon="chip.icon"
      :text="chip.text"
      :controlled="chip.controlled"
    />
  </div>
</template>

<script setup lang="ts">
import SupervisionChip from './SupervisionChip.vue'

interface ChipState {
  icon: string
  text: string
  controlled: boolean
}

interface Props {
  // The active chip to show, or null when idle (only the sizers render).
  chip: ChipState | null
  // Both message variants, used verbatim by the width-reserving sizers.
  watchedText: string
  controlledText: string
}

defineProps<Props>()
</script>

<style scoped>
/* All children share one grid cell, so the cell sizes to the widest child (a
   sizer) and the visible chip stacks centered over the reserved box. */
.supervision-slot {
  display: inline-grid;
  align-items: center;
  justify-items: center;
}

.supervision-slot > * {
  grid-area: 1 / 1;
}

/* Reserves the chip's box without painting it. Box metrics MUST match
   .supervision-chip (SupervisionChip.vue) so the reserved width equals the real
   chip width and siblings never shift when it appears. The icon is a ::before so it
   reserves the chip's icon+gap width without landing in the element's text content
   (the sizer's text must stay exactly the message string). */
.supervision-slot-sizer {
  visibility: hidden;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  border: var(--border-width-thin) solid transparent;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  white-space: nowrap;
}

.supervision-slot-sizer::before {
  font-size: 1em;
  line-height: 1;
}

.supervision-slot-sizer-watched::before {
  content: '👁';
}

.supervision-slot-sizer-controlled::before {
  content: '✋';
}
</style>
