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
  capability is on) and holds two invisible SupervisionChip sizer instances, one per
  message variant, that reserve the WIDEST variant's width — identical metrics to the
  visible chip by construction, since they ARE chips. The visible chip is grid-stacked
  over them and only exists in an active state; when idle there is no chip, hence no
  live region, so assistive tech announces nothing.
-->
<template>
  <div
    class="supervision-slot"
    :class="chip ? 'supervision-slot-active' : 'supervision-slot-idle'"
  >
    <SupervisionChip sizer :controlled="false" :text="watchedText" />
    <SupervisionChip sizer :controlled="true" :text="controlledText" />
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
  // Both message variants, used verbatim by the width-reserving sizer chips.
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
</style>
