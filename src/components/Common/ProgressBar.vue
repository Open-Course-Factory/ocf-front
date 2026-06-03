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
import { computed } from 'vue'

interface Props {
  value: number
  max?: number
  variant?: 'primary' | 'success' | 'danger' | 'warning'
  indeterminate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  variant: 'primary',
  indeterminate: false
})

// Clamp to [0, 100]. The `max > 0` guard avoids NaN/Infinity on zero/empty input.
const pct = computed(() =>
  props.max > 0 ? Math.min(100, Math.max(0, (props.value / props.max) * 100)) : 0
)
</script>

<template>
  <div
    class="progress"
    role="progressbar"
    :aria-busy="indeterminate ? 'true' : undefined"
    :aria-valuenow="indeterminate ? undefined : value"
    aria-valuemin="0"
    :aria-valuemax="max"
  >
    <div
      class="progress-bar"
      :class="[
        'progress-bar--' + variant,
        { 'progress-bar--indeterminate': indeterminate }
      ]"
      :style="indeterminate ? undefined : { width: pct + '%' }"
    ></div>
  </div>
</template>

<style scoped>
.progress {
  width: 100%;
  height: 8px;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: var(--border-radius-full);
  transition: width var(--transition-base);
}

.progress-bar--primary {
  background: var(--color-primary);
}

.progress-bar--success {
  background: var(--color-success);
}

.progress-bar--danger {
  background: var(--color-danger);
}

.progress-bar--warning {
  background: var(--color-warning);
}

/* Indeterminate: a partial fill slides across the track on a loop. */
.progress-bar--indeterminate {
  width: 40%;
  border-radius: var(--border-radius-full);
  animation: progress-bar-indeterminate 1.4s ease-in-out infinite;
}

@keyframes progress-bar-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
</style>
