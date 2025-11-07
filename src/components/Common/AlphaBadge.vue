<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <span class="alpha-badge" :class="sizeClass">Alpha</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const sizeClass = computed(() => `alpha-badge-${props.size}`)
</script>

<style scoped>
.alpha-badge {
  display: inline-block;
  background: var(--color-warning-bg);
  color: var(--color-warning);
  font-weight: var(--font-weight-bold);
  border-radius: 10px;
  border: var(--border-width-thin) solid var(--color-warning-border);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.alpha-badge-small {
  padding: 2px 6px;
  font-size: 9px;
  border-radius: 8px;
}

.alpha-badge-medium {
  padding: 3px 8px;
  font-size: var(--font-size-xs);
}

.alpha-badge-large {
  padding: 2px 10px;
  font-size: 0.75rem;
  border-radius: 12px;
  font-weight: var(--font-weight-semibold);
}
</style>
